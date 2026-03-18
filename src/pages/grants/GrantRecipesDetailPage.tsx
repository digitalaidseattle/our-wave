/**
 * GrantRecipesDetailPage.tsx
 * 
 * @copyright 2025 Digital Aid Seattle
*/
import { HomeOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { LoadingContext, useHelp, useNotifications } from "@digitalaidseattle/core";
import { ConfirmationDialog } from "@digitalaidseattle/mui";
import { Box, Breadcrumbs, Button, Card, CardActions, CardContent, CardHeader, Divider, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { useContext, useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { GrantRecipeContext } from "../../components/GrantRecipeContext";
import { HelpDrawer } from "../../components/HelpDrawer";
import { HelpTopicContext } from "../../components/HelpTopicContext";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { SplitButton } from "../../components/SplitButton";
import { grantRecipeService } from "../../services/grantRecipeService";
import { cloneRecipe } from "../../transactions/CloneRecipe";
import { generateProposal } from "../../transactions/GenerateProposal";
import { GrantOutput, GrantRecipe, Timestamp } from "../../types";
import { DateUtils } from "../../utils/dateUtils";
import { GrantAiService } from "./grantAiService";
import { saveRecipe } from "../../transactions/SaveRecipe";
import { GrantContextEditor } from "./GrantContextEditor";
import { GrantInfoEditor } from "./GrantInfoEditor";
import { GrantOutputEditor } from "./GrantOutputEditor";

const HELP_DRAWER_WIDTH = 300;
const HELP_TITLE = "Our Wave";
const HELP_DICTIONARY = {
  "Info": "Change the description for easier tracking in the application.  A rating change can aid in selecting better recipes.  Tags can help categorize recipes.",
  "Contexts": "Information about your organization and project that will be included in the project conext.",
  "Template": "This template is filled with text and combined with the output parameters.",
  "Prompt": "This prompt template is filled with text using the input and output parameters.",
  "Outputs": "Guidance for output constraints.",
}

export const TextEditor = ({ title, value, onChange }: { title: string, value: string, onChange: (updated: string) => void }) => {
  const { setHelpTopic } = useContext(HelpTopicContext);
  const { setShowHelp } = useHelp();
  return (
    <Card>
      <CardHeader title={title}
        slotProps={{ title: { fontWeight: 600, fontSize: 16 } }}
        avatar={<IconButton
          onClick={() => { setHelpTopic(title); setShowHelp(true) }}
          color="primary"><InfoCircleOutlined /></IconButton>} />
      <CardContent>
        <TextField fullWidth={true}
          value={value ?? ""}
          onChange={(evt) => onChange(evt.target.value)}
          multiline={true}
          sx={{
            '& .MuiInputBase-input': {
              resize: 'vertical',
              overflow: 'auto',
            }
          }} />
      </CardContent>
    </Card>
  )
}

export const PlainTextCard = ({ title, value }: { title: string, value: string }) => {
  const { setHelpTopic } = useContext(HelpTopicContext);
  const { setShowHelp } = useHelp();
  return (
    <Card>
      <CardHeader title={title}
        slotProps={{ title: { fontWeight: 600, fontSize: 16 } }}
        avatar={<IconButton
          onClick={() => { setHelpTopic(title); setShowHelp(true) }}
          color="primary"><InfoCircleOutlined /></IconButton>} />
      <CardContent>
        <Typography>{value}</Typography>
      </CardContent>
    </Card>
  )
}

const GrantRecipesDetailPage: React.FC = () => {
  const { id } = useParams<string>();
  const notifications = useNotifications();
  const navigate = useNavigate();
  const { loading, setLoading } = useContext(LoadingContext);
  
  const [recipe, setRecipe] = useState<GrantRecipe>(grantRecipeService.empty());
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [dirty, setDirty] = useState<boolean>(false);
  const { showHelp } = useHelp();
  const [helpTopic, setHelpTopic] = useState<string | undefined>();
  const [isValid, setIsValid] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsValid((recipe?.description ?? "").trim().length > 0);
  }, [recipe?.description]);

  useEffect(() => {
    if (id) {
      grantRecipeService.getById(id)
        .then(found => {
          setRecipe(found);
          setDirty(false);
        });
    } else {
      // Initialize new recipe with default blank fields
      setRecipe(grantRecipeService.empty());
    }
  }, [id])

  useEffect(() => {
    if (recipe) {
      setLastUpdated(DateUtils.formatDateTime(recipe.updatedAt as Timestamp));
    }
  }, [recipe]);

  function handleSave() {
    setLoading(true);
    saveRecipe(recipe)
      .then(saved => {
        setRecipe(saved);
        setDirty(false);
        notifications.success(`${saved.description} has been successfully saved.`)
      })
      .catch(err => {
        console.error(err)
        notifications.error(`Could not save this recipe. ${err.message}`)
      })
      .finally(() => setLoading(false))
  }

  function handleClone() {
    if (!isValid) {
      notifications.error("Please name your recipe before cloning.");
      return;
    }

    setLoading(true);
    cloneRecipe(recipe)
      .then(cloned => {
        navigate(`/grant-recipes/${cloned.id}`);
        notifications.success(`${recipe.description} has been successfully cloned.`)
      })
      .catch(err => {
        console.error(err)
        notifications.error(`Could not clone this recipe. ${err.message}`)
      })
      .finally(() => setLoading(false))
  }

  async function handleGenerate(model: string) {
    if (recipe) {  // TODO display error ?
      setLoading(true);
      recipe.modelType = model;
      generateProposal(recipe)
        .then(proposal => {
          notifications.success(`Proposal generated for ${recipe.description}.`);
          navigate(`/grant-proposals/${proposal.id}`);
        })
        .catch((err: any) => {
          console.error(err);
          notifications.error(
            `Could not generate a proposal for this recipe. ${err?.message ?? "Unknown error"
            }`
          )
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }

  function handleGrantOutputChange(updated: GrantOutput[]): void {
    // For new recipes, just update the local state
    const updatedRecipe = { ...recipe, outputsWithWordCount: updated };
    setRecipe(updatedRecipe);
    setDirty(true);
    
    // Only save to database if recipe already has a real ID (not the temp 'test' ID)
    if (recipe.id !== 'test') {
      grantRecipeService.updatePrompt(updatedRecipe)
        .then(revised => {
          setRecipe(revised);
        })
        .catch(err => {
          console.error('Failed to update prompt:', err);
          notifications.error('Failed to update output fields');
        });
    }
  }

  function handleInfoChange(updated: GrantRecipe): void {
    setRecipe(updated);
    setDirty(true);
  }

  function handleGrantContextsChange(revised: GrantRecipe): void {
    console.log(revised)
    // prompt not affected by contexts change
    setRecipe(revised);
    setDirty(true);
  }

  function handleTemplateChange(updated: string): void {
    grantRecipeService.updatePrompt({ ...recipe, template: updated })
      .then(revised => {
        setRecipe(revised);
        setDirty(true);
      })
  }

  const handleDeleteClick = () => {
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recipe || !recipe.id) return;

    try {
      setIsDeleting(true);
      await grantRecipeService.delete(recipe.id);
      notifications.success("Recipe deleted successfully");
      setOpenDeleteDialog(false);
      navigate('/grant-recipes');
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      notifications.error("Failed to delete recipe. Please try again.");
      setOpenDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setOpenDeleteDialog(false);
    }
  };

  return (recipe &&
    <>
      <LoadingOverlay />
      <HelpTopicContext.Provider value={{ helpTopic, setHelpTopic }} >
        <GrantRecipeContext.Provider value={{ recipe, setRecipe }} >
          <Breadcrumbs aria-label="breadcrumbs">
            <NavLink to="/" ><IconButton size="medium"><HomeOutlined /></IconButton></NavLink>
            <NavLink to={`/grant-recipes`} >Recipes</NavLink>
            <Typography color="text.primary">Recipe Detail</Typography>
          </Breadcrumbs>
          <Box gap={4}>
            {recipe &&
              <Stack sx={{
                height: "calc(100dvh - 112px)",
                gap: 2,
                marginRight: `${showHelp ? HELP_DRAWER_WIDTH : 0}px`
              }}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardHeader title={recipe.description ?? ""}
                    action={`Token count = ${recipe.tokenCount}`}
                    subheader={`Last updated: ${lastUpdated}`} />
                  <CardContent
                    sx={{
                      flex: 1,
                      overflowY: "auto",
                    }}>
                    <Stack gap={1}>
                      <GrantInfoEditor recipe={recipe} onChange={handleInfoChange} />
                      <TextEditor title="Template" value={recipe.template} onChange={handleTemplateChange} />
                      <GrantContextEditor onChange={handleGrantContextsChange} />
                      <GrantOutputEditor fields={recipe.outputsWithWordCount} onChange={handleGrantOutputChange} />
                      <PlainTextCard title="Prompt" value={recipe.prompt} />
                    </Stack>
                  </CardContent>
                  <CardActions
                    sx={{
                      borderTop: "1px solid",
                      borderColor: "divider",
                      justifyContent: "flex-end",
                    }}>
                    <Tooltip title='Click to generate.'>
                      <SplitButton
                        options={GrantAiService.models}
                        onClick={(model: string) => handleGenerate(model)} />
                    </Tooltip>
                    <Button variant="contained" disabled={loading || !isValid} onClick={() => handleClone()}>Clone</Button>
                    <Divider orientation="vertical" />
                    <Button variant="contained" disabled={loading || !dirty || !isValid} onClick={() => handleSave()}>Save</Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleDeleteClick}
                      disabled={loading || isDeleting}
                    >
                      Delete
                    </Button>
                  </CardActions>

                  {/* Delete Confirmation Dialog */}
                  <ConfirmationDialog
                    title="Delete Recipe?"
                    message={`Are you sure you want to delete "${recipe?.description}"? This action cannot be undone. Any proposals generated from this recipe will remain, but they won't be able to regenerate.`}
                    open={openDeleteDialog}
                    handleConfirm={handleDeleteConfirm}
                    handleCancel={handleDeleteCancel}
                  />
                </Card>
              </Stack>
            }
            <HelpDrawer title={HELP_TITLE} width={HELP_DRAWER_WIDTH} dictionary={HELP_DICTIONARY} />
          </Box>
        </GrantRecipeContext.Provider >
      </HelpTopicContext.Provider >
    </>
  );

}

export default GrantRecipesDetailPage;
