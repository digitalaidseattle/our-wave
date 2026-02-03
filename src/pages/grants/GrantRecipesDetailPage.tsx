/**
 * GrantRecipesDetailPage.tsx
 * 
 * @copyright 2025 Digital Aid Seattle
*/
import { HomeOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { LoadingContext, useHelp, useNotifications, UserContext } from "@digitalaidseattle/core";
import { Box, Breadcrumbs, Button, Card, CardActions, CardContent, CardHeader, Divider, IconButton, Stack, TextField, Typography } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { HelpDrawer } from "../../components/HelpDrawer";
import { HelpTopicContext } from "../../components/HelpTopicContext";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { grantRecipeService } from "../../services/grantRecipeService";
import { cloneRecipe } from "../../transactions/CloneRecipe";
import type { GrantInput, GrantOutput, Timestamp } from "../../types";
import { GrantRecipe } from "../../types";
import { GrantInputEditor } from "./GrantInputEditor";
import { GrantOutputEditor } from "./GrantOutputEditor";
import { DateUtils } from "../../utils/dateUtils";
import { generateProposal } from "../../transactions/GenerateProposal";
import { GrantInfoEditor } from "./GrantInfoEditor";

const HELP_DRAWER_WIDTH = 300;
const HELP_TITLE = "Our Wave";
const HELP_DICTIONARY = {
  "Info": 
    "**Description:** Give your recipe a clear, unique name so you can easily recognize it later.\n\n" +
    "**Rating:** Optionally rate your recipe to help with sorting and organization.\n\n" +
    "**Tags:** Add your own custom tags to group and quickly find recipes. Optional.",

  "Prompt": 
    "This is the prompt template the AI uses to generate content. You do not need to change this field to create a grant proposal.",

  "Inputs": 
    "Inputs are key–value pairs that provide facts for the AI to use.\n\n" +
    "**Example:**\n\n" +
    "**Key:** Mission Statement\n\n" +
    "**Value:** At Our Wave, we provide personalized, evidence-based healing support for survivors of trauma.",

  "Outputs": 
    "Define what you want the AI to produce.\n\n" +
    "This can include:\n\n" +
    "• Grant questions you want answered, or\n\n" +
    "• A template describing the task\n\n" +
    "**Example:**\n\n" +
    "Please provide a brief overview of your organization, including your mission. (Max 300 words)",
    
  "Template":
    "Leave as “Create a grant proposal” if you want to generate a full grant proposal.",

  "Project Contexts": 
    "Add supporting information to help the AI write better responses.\n\n" +
    "Select **“+ File”** or **“+ Text”** to provide additional context.\n\n" +
    "Files must be uploaded from Drive. Supported formats: .doc, .docx.\n" +
    "PDFs and Excel files are not supported."
};


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
        <TextField fullWidth={true} value={value ?? ""}
          onChange={(evt) => onChange(evt.target.value)} />
      </CardContent>
    </Card>
  )
}

const GrantRecipesDetailPage: React.FC = () => {
  const { id } = useParams<string>();

  const notifications = useNotifications();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const { loading, setLoading } = useContext(LoadingContext);
  const [recipe, setRecipe] = useState<GrantRecipe>({ id: 'test', description: 'test' } as GrantRecipe);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [dirty, setDirty] = useState<boolean>(false);
  const { showHelp } = useHelp();
  const [helpTopic, setHelpTopic] = useState<string | undefined>();

  useEffect(() => {
    if (id) {
      grantRecipeService.getById(id)
        .then(found => {
          setRecipe(found);
          setDirty(false);
        });
    }
  }, [id])

  useEffect(() => {
    if (recipe) {
      setLastUpdated(DateUtils.formatDateTime(recipe.updatedAt as Timestamp));
    }
  }, [recipe]);

  function saveRecipe() {
    if (user) {
      setLoading(true);
      grantRecipeService.update(recipe.id!, recipe, undefined, undefined, user)
        .then(saved => {
          setRecipe(saved);
          setDirty(false);
          notifications.success(`Recipe ${recipe.description} has been saved successfully.`);
        })
        .catch(err => {
          console.error(err)
          notifications.error(`Could not save this recipe. ${err.message}`)
        })
        .finally(() => setLoading(false))
    }
  }

  function handleClone() {
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

  async function handleGenerate() {
    if (recipe) {  // TODO display error ?
      setLoading(true);
      generateProposal(recipe)
        .then(proposal => {
          notifications.success(`Proposal generated for ${recipe.description}.`);
          //Navigate to proposal detail
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
    grantRecipeService.updatePrompt({ ...recipe, outputsWithWordCount: updated })
      .then(revised => {
        setRecipe(revised);
        setDirty(true);
      })
  }

  function handleInfoChange(updated: GrantRecipe): void {
    setRecipe(updated);
    setDirty(true);
  }

  function handlePromptChange(updated: string): void {
    grantRecipeService.updatePrompt({ ...recipe, prompt: updated })
      .then(revised => {
        setRecipe(revised);
        setDirty(true);
      })
  }

  function handleGrantInputChange(inputs: GrantInput[]): void {
    grantRecipeService.updatePrompt({ ...recipe, inputParameters: inputs })
      .then(revised => {
        setRecipe(revised);
        setDirty(true);
      })
  }

  return (recipe &&
    <>
      <LoadingOverlay />
      <HelpTopicContext.Provider value={{ helpTopic, setHelpTopic }} >
        <Breadcrumbs aria-label="breadcrumbs">
          <NavLink to="/" ><IconButton size="medium"><HomeOutlined /></IconButton></NavLink>
          <NavLink to={`/grant-recipes`} >Recipes</NavLink>
          <Typography color="text.primary">Recipe Detail</Typography>
        </Breadcrumbs>
        <Box gap={4}>
          <Stack sx={{ gap: 2, marginRight: `${showHelp ? HELP_DRAWER_WIDTH : 0}px` }}>
            <Card>
              <CardHeader title={recipe.description}
                action={`Token count = ${recipe.tokenCount}`}
                subheader={`Last updated: ${lastUpdated}`} />
              <CardContent>
                <Stack gap={1}>
                  <GrantInfoEditor recipe={recipe} onChange={handleInfoChange} />
                  <TextEditor title="Prompt" value={recipe.prompt} onChange={handlePromptChange} />
                  <GrantInputEditor recipeInputs={recipe.inputParameters} onChange={handleGrantInputChange} />
                  <GrantOutputEditor fields={recipe.outputsWithWordCount} onChange={handleGrantOutputChange} />
                </Stack>
              </CardContent>
              <CardActions>
                <Button variant="contained" disabled={loading || !dirty} onClick={() => saveRecipe()}>Save</Button>
                <Divider orientation="vertical" />
                <Button variant="contained" disabled={loading} onClick={() => handleClone()}>Clone</Button>
                <Button variant="contained" disabled={loading} onClick={() => handleGenerate()}>Generate</Button>
              </CardActions>
            </Card>
          </Stack>
          <HelpDrawer title={HELP_TITLE} width={HELP_DRAWER_WIDTH} dictionary={HELP_DICTIONARY} />
        </Box>
      </HelpTopicContext.Provider>
    </>
  );

}

export default GrantRecipesDetailPage;