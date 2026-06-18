/**
 * GrantRecipesDetailPage.tsx
 * 
 * @copyright 2025 Digital Aid Seattle
*/
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { NavLink, useBeforeUnload, useBlocker, useNavigate, useParams } from "react-router-dom";

import { HomeOutlined, InfoCircleOutlined } from "@ant-design/icons";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Breadcrumbs, Button, Card, CardActions, CardContent, CardHeader, Divider, IconButton, Rating, Stack, Tooltip, Typography } from "@mui/material";

import { LoadingContext, useHelp, useNotifications } from "@digitalaidseattle/core";
import { ConfirmationDialog } from "@digitalaidseattle/mui";

import { GrantRecipeContext } from "../../components/GrantRecipeContext";
import { HelpDrawer } from "../../components/HelpDrawer";
import { HelpTopicContext } from "../../components/HelpTopicContext";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { SplitButton } from "../../components/SplitButton";
import { StableCursorTextField } from "../../components/StableCursorTextfield";
import { grantRecipeService } from "../../services/grantRecipeService";
import { cloneRecipe } from "../../transactions/CloneRecipe";
import { generateProposal } from "../../transactions/GenerateProposal";
import { saveRecipe } from "../../transactions/SaveRecipe";
import { GrantOutput, GrantRecipe, Timestamp } from "../../types";
import { DateUtils } from "../../utils/dateUtils";
import { hasRecipeName } from "../../utils/recipeValidation";
import { GrantAiService } from "./grantAiService";
import { GrantContextEditor } from "./GrantContextEditor";
import { GrantInfoEditor } from "./GrantInfoEditor";
import { GrantOutputEditor } from "./GrantOutputEditor";
import { RECIPE_STRINGS } from '../../constants/grantRecipe';

const HELP_DRAWER_WIDTH = 300;
const HELP_TITLE = "Our Wave";
const HELP_DICTIONARY = {
  "Info": "Change the description for easier tracking in the application.  A rating change can aid in selecting better recipes.  Tags can help categorize recipes.",
  "Contexts": "Information about your organization and project that will be included in the project conext.",
  "Template": "This template is filled with text and combined with the output parameters.",
  "Prompt": "This prompt template is filled with text using the input and output parameters.",
  "Outputs": "Guidance for output constraints.",
}

export const TextEditor = ({
  title,
  value,
  onChange,
  required = false,
  error = false,
  helperText,
  onBlur,
  onEdit,
  subheader,
  helpTopic,
}: {
  title: string,
  value: string,
  onChange: (updated: string) => void,
  required?: boolean,
  error?: boolean,
  helperText?: string,
  onBlur?: () => void,
  onEdit?: () => void,
  subheader?: string,
  helpTopic?: string,
}) => {
  const { setHelpTopic } = useContext(HelpTopicContext);
  const { setShowHelp } = useHelp();
  return (
    <Card>
      <CardHeader title={<>
        {title} {required && <span style={{ color: '#d32f2f' }}>*</span>}
      </>}
        subheader={subheader}
        slotProps={{ title: { fontWeight: 600, fontSize: 16 } }}
        avatar={<IconButton
          onClick={() => { setHelpTopic(helpTopic ?? title); setShowHelp(true) }}
          color="primary"><InfoCircleOutlined /></IconButton>} />
      <CardContent>
        <StableCursorTextField fullWidth={true}
          value={value ?? ""}
          onChange={(evt) => onChange(evt.target.value)}
          required={required}
          error={error}
          helperText={helperText ?? " "}
          onBlur={onBlur}
          onEdit={onEdit}
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

export const PlainTextCard = ({ title, value, helpTopic }: { title: string, value: string, helpTopic?: string }) => {
  const { setHelpTopic } = useContext(HelpTopicContext);
  const { setShowHelp } = useHelp();
  return (
    <Card>
      <CardHeader title={title}
        slotProps={{ title: { fontWeight: 600, fontSize: 16 } }}
        avatar={<IconButton
          onClick={() => { setHelpTopic(helpTopic ?? title); setShowHelp(true) }}
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
  const allowNavigationRef = useRef(false);

  const [recipe, setRecipe] = useState<GrantRecipe>(grantRecipeService.empty());
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [dirty, setDirty] = useState<boolean>(false);
  const { showHelp } = useHelp();
  const [helpTopic, setHelpTopic] = useState<string | undefined>();
  const [hasCompleteOutputFields, setHasCompleteOutputFields] = useState<boolean>(false);
  const [hasValidTemplate, setHasValidTemplate] = useState<boolean>(false);
  const [descriptionTouched, setDescriptionTouched] = useState<boolean>(false);
  const [templateTouched, setTemplateTouched] = useState<boolean>(false);
  const [outputFieldTouched, setOutputFieldTouched] = useState<Record<string, boolean>>({});
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [isFileUploading, setIsFileUploading] = useState<boolean>(false);

  const shouldBlockNavigation = useCallback(
    () => dirty && !allowNavigationRef.current,
    [dirty]
  );
  const navigationBlocker = useBlocker(shouldBlockNavigation);

  useBeforeUnload(useCallback((event: BeforeUnloadEvent) => {
    if (dirty && !allowNavigationRef.current) {
      event.preventDefault();
      event.returnValue = "";
    }
  }, [dirty]));

  const hasValidDescription = hasRecipeName(recipe);
  const isDescriptionMissing = !hasValidDescription;
  const isOutputFieldsIncomplete = !hasCompleteOutputFields;
  const isTemplateMissing = !hasValidTemplate;
  const isSaveDisabled = loading || !dirty || isDescriptionMissing;
  const isCloneDisabled = loading || isDescriptionMissing;
  const isGenerateDisabled = loading || isFileUploading || isDescriptionMissing || isOutputFieldsIncomplete || isTemplateMissing;

  const actionMessages: string[] = [];
  if (!loading && hasValidDescription && !dirty) {
    actionMessages.push("Make a change to enable Save.");
  }

  useEffect(() => {
    const outputs = recipe?.outputsWithWordCount ?? [];
    const outputFieldsComplete = outputs.length > 0 && outputs.every(output =>
      (output?.name ?? "").trim().length > 0 && Number(output?.maxWords) > 0
    );
    setHasCompleteOutputFields(outputFieldsComplete);
  }, [recipe?.outputsWithWordCount]);

  useEffect(() => {
    setHasValidTemplate((recipe?.template ?? "").trim().length > 0);
  }, [recipe?.template]);

  useEffect(() => {
    allowNavigationRef.current = false;

    if (id) {
      grantRecipeService.getById(id)
        .then(found => {
          setRecipe(found);
          setDirty(false);
          setDescriptionTouched(false);
          setTemplateTouched(false);
          setOutputFieldTouched({});
        });
    } else {
      // Initialize new recipe with default blank fields
      setRecipe(grantRecipeService.empty());
      setDescriptionTouched(false);
      setTemplateTouched(false);
      setOutputFieldTouched({});
    }
  }, [id])

  useEffect(() => {
    if (recipe) {
      setLastUpdated(DateUtils.formatDateTime(recipe.updatedAt as Timestamp));
      setRating(recipe.rating ?? 0);
    }
  }, [recipe]);

  function handleSave() {
    if (!hasValidDescription) {
      setDescriptionTouched(true);
      notifications.error("Please name your recipe before saving.");
      return;
    }
    const isNewRecipe = !recipe.id;
    setLoading(true);
    saveRecipe(recipe)
      .then(saved => {
        setRecipe(saved);
        setDirty(false);
        if (isNewRecipe) {
          allowNavigationRef.current = true;
          navigate(`/grant-recipes/${saved.id}`, { replace: true });
        }
        notifications.success(`${saved.description} has been successfully saved.`)
      })
      .catch(err => {
        console.error(err)
        notifications.error(`Could not save this recipe. ${err.message}`)
      })
      .finally(() => setLoading(false))
  }

  function handleClone() {
    if (!hasValidDescription) {
      setDescriptionTouched(true);
      notifications.error("Please name your recipe before cloning.");
      return;
    }

    setLoading(true);
    cloneRecipe(recipe)
      .then(cloned => {
        allowNavigationRef.current = true;
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
    if (!hasValidDescription) {
      setDescriptionTouched(true);
      notifications.error("Please enter a description before generating.");
      return;
    }
    if (!hasCompleteOutputFields) {
      markInvalidOutputFieldsTouched();
      notifications.error("Please complete output fields before generating.");
      return;
    }
    if (!hasValidTemplate) {
      setTemplateTouched(true);
      notifications.error("Please enter a template before generating.");
      return;
    }
    if (recipe) {  // TODO display error ?
      setLoading(true);
      recipe.modelType = model;
      generateProposal(recipe)
        .then(proposal => {
          notifications.success(`Proposal generated for ${recipe.description}.`);
          allowNavigationRef.current = true;
          navigate(`/grant-proposals/${proposal.id}`);
        })
        .catch((err: unknown) => {
          console.error(err);
          const errorMessage = err instanceof Error ? err.message : "Unknown error";
          notifications.error(
            `Could not generate a proposal for this recipe. ${errorMessage}`
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

  function handleOutputFieldBlur(index: number, field: 'name' | 'maxWords'): void {
    const touchedKey = `${field}-${index}`;
    const nextTouched = {
      ...outputFieldTouched,
      [touchedKey]: true
    };

    const currentField = recipe.outputsWithWordCount?.[index];
    const isCurrentFieldInvalid = field === 'name'
      ? (currentField?.name ?? "").trim().length === 0
      : Number(currentField?.maxWords) <= 0;

    setOutputFieldTouched(
      isCurrentFieldInvalid ? getTouchedInvalidOutputFields(nextTouched) : nextTouched
    );
  }

  function getTouchedInvalidOutputFields(baseTouched: Record<string, boolean> = {}): Record<string, boolean> {
    const nextTouched = { ...baseTouched };

    (recipe.outputsWithWordCount ?? []).forEach((output, index) => {
      if ((output?.name ?? "").trim().length === 0) {
        nextTouched[`name-${index}`] = true;
      }
      if (Number(output?.maxWords) <= 0) {
        nextTouched[`maxWords-${index}`] = true;
      }
    });

    return nextTouched;
  }

  function markInvalidOutputFieldsTouched(): void {
    setOutputFieldTouched(prev => getTouchedInvalidOutputFields(prev));
  }

  function handleInfoChange(updated: GrantRecipe): void {
    setRecipe(updated);
    setDirty(true);
  }

  function handleGrantContextsChange(revised: GrantRecipe): void {
    const totalTokenCount = (revised.contexts ?? []).reduce(
      (sum, ctx) => sum + (ctx.tokenCount ?? 0),
      0
    );
    setRecipe({ ...revised, tokenCount: totalTokenCount });
    setDirty(true);
  }

  function handleTemplateChange(updated: string): void {
    const updatedRecipe = { ...recipe, template: updated };
    setRecipe(updatedRecipe);
    setDirty(true);

    grantRecipeService.updatePrompt(updatedRecipe)
      .then(revised => {
        setRecipe(revised);
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

  function handleRatingChange(newValue: number | null): void {
    const value = newValue ?? 0;
    setRating(value);
    if (recipe.id) {
      grantRecipeService.update(recipe.id, { ...recipe, rating: value })
        .then(updated => setRecipe(updated))
        .catch(err => notifications.error(`Failed to save rating: ${err instanceof Error ? err.message : 'Unknown error'}`));
    }
  }

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
                    action={`Estimated Token Count = ${recipe.tokenCount}`}
                    subheader={`Last updated: ${lastUpdated}`} />
                  <CardContent
                    sx={{
                      flex: 1,
                      overflowY: "auto",
                    }}>
                    <Stack gap={1}>
                      <GrantInfoEditor
                        recipe={recipe}
                        onChange={handleInfoChange}
                        showDescriptionError={descriptionTouched && isDescriptionMissing}
                        onDescriptionBlur={() => setDescriptionTouched(true)}
                        onEdit={() => setDirty(true)}
                      />
                      <TextEditor
                        title={RECIPE_STRINGS.templateTitle}
                        helpTopic="Template"
                        value={recipe.template}
                        onChange={handleTemplateChange}
                        required
                        error={templateTouched && isTemplateMissing}
                        helperText={templateTouched && isTemplateMissing ? "Template is required to generate." : " "}
                        onBlur={() => setTemplateTouched(true)}
                        onEdit={() => setDirty(true)}
                      />
                      <GrantContextEditor
                        onChange={handleGrantContextsChange}
                        onEdit={() => setDirty(true)}
                        onUploadingChange={setIsFileUploading}
                      />
                      <GrantOutputEditor
                        fields={recipe.outputsWithWordCount}
                        onChange={handleGrantOutputChange}
                        touchedFields={outputFieldTouched}
                        onFieldBlur={handleOutputFieldBlur}
                        onEdit={() => setDirty(true)}
                      />
                      <PlainTextCard title={RECIPE_STRINGS.promptTitle} helpTopic="Prompt" value={recipe.prompt} />
                    </Stack>
                  </CardContent>
                  <CardActions
                    sx={{
                      borderTop: "1px solid",
                      borderColor: "divider",
                      justifyContent: "space-between",
                    }}>
                    <Box sx={{ px: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>Rate this Recipe:</Typography>
                      <Rating
                        value={rating}
                        onChange={(_event, newValue) => handleRatingChange(newValue)}
                      />
                      {actionMessages.map((message, index) => (
                        <Typography key={index} variant="body2" sx={{ color: "error.main" }}>
                          {message}
                        </Typography>
                      ))}
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Tooltip title='Click to generate.'>
                        <Box>
                          <SplitButton
                            options={GrantAiService.getInstance().getModels().map(m => ({ label: `Generate with ${m}`, value: m }))}
                            disabled={isGenerateDisabled}
                            onClick={(model: string) => handleGenerate(model)} />
                        </Box>
                      </Tooltip>
                      <Button variant="contained" disabled={isCloneDisabled} onClick={() => handleClone()}>Clone</Button>
                      <Divider orientation="vertical" flexItem />
                      <Button variant="contained" disabled={isSaveDisabled} onClick={() => handleSave()}>Save</Button>
                      <Divider orientation="vertical" flexItem />
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDeleteClick}
                        disabled={loading || isDeleting || !recipe.id}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </CardActions>

                  {/* Delete Confirmation Dialog */}
                  <ConfirmationDialog
                    title="Delete Recipe?"
                    message={`Are you sure you want to delete "${recipe?.description}"? This action cannot be undone. Any proposals generated from this recipe will remain, but they won't be able to regenerate.`}
                    open={openDeleteDialog}
                    handleConfirm={handleDeleteConfirm}
                    handleCancel={handleDeleteCancel}
                  />
                  <ConfirmationDialog
                    title={recipe.id ? "Discard unsaved changes?" : "Discard unsaved recipe?"}
                    message={recipe.id
                      ? "You have unsaved changes. Are you sure you want to leave this page?"
                      : "This recipe has not been saved. Are you sure you want to leave this page?"
                    }
                    open={navigationBlocker.state === "blocked"}
                    handleConfirm={() => navigationBlocker.state === "blocked" && navigationBlocker.proceed()}
                    handleCancel={() => navigationBlocker.state === "blocked" && navigationBlocker.reset()}
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
