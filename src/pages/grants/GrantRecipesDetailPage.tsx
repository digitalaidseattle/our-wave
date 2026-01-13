/**
 * GrantRecipesDetailPage.tsx
 * 
 * @copyright 2025 Digital Aid Seattle
*/
import { useContext, useEffect, useState } from "react";
<<<<<<< HEAD
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { HomeOutlined, InfoCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { LoadingContext, useHelp, useNotifications, UserContext } from "@digitalaidseattle/core";
import { Box, Breadcrumbs, Button, Card, CardActions, CardContent, CardHeader, Divider, IconButton, Stack, TextField, Typography } from "@mui/material";
import { GrantRecipeContext } from "../../components/GrantRecipeContext";
=======
import { useNavigate, useParams } from "react-router-dom";
import { InfoCircleOutlined } from "@ant-design/icons";
import { LoadingContext, useHelp, useNotifications, UserContext } from "@digitalaidseattle/core";
import { Box, Button, Card, CardActions, CardContent, CardHeader, IconButton, Stack, TextField } from "@mui/material";
<<<<<<< HEAD
>>>>>>> c0d332a (project context)
=======
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GrantRecipeContext } from "../../components/GrantRecipeContext";
>>>>>>> 77917b0 (Project Context)
import { HelpDrawer } from "../../components/HelpDrawer";
import { HelpTopicContext } from "../../components/HelpTopicContext";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { grantProposalService } from "../../services/grantProposalService";
import { grantRecipeService } from "../../services/grantRecipeService";
<<<<<<< HEAD
<<<<<<< HEAD
import type { GrantOutput } from "../../types";
import { GrantRecipe } from "../../types";
import { GrantContextEditor } from "./GrantContextEditor";
import { GrantOutputEditor } from "./GrantOutputEditor";
<<<<<<< HEAD
import { cloneRecipe } from "../../transactions/CloneRecipe";
=======
import { GrantInfoEditor } from "./GrantInfoEditor";
>>>>>>> f2961b4 (tags & ratings)
=======
=======
import type { GrantOutput } from "../../types";
>>>>>>> 77917b0 (Project Context)
import { GrantRecipe } from "../../types";
import { GrantContextEditor } from "./GrantContextEditor";
import { GrantOutputEditor } from "./GrantOutputEditor";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { HelpTopicContext } from "../../components/HelpTopicContext";
import type { GrantInput, GrantOutput } from "../../types";
>>>>>>> c0d332a (project context)

const HELP_DRAWER_WIDTH = 300;
const HELP_TITLE = "Our Wave";
const HELP_DICTIONARY = {
<<<<<<< HEAD
  "Description": "Change this field for easier tracking in the application.",
  "Template": "This template is filled with text and combined with the output parameters.",
  "Contexts": "Information about your organization and project that will be included in the project conext.",
=======
  "Info": "Change the description for easier tracking in the application.  A rating change can aid in selecting better recipes.  Tags can help categorize recipes.",
  "Prompt": "This prompt template is filled with text using the input and output parameters.",
<<<<<<< HEAD
>>>>>>> f2961b4 (tags & ratings)
=======
  "Contexts": "Information about your organization and project that will be included in the project conext.",
>>>>>>> c0d332a (project context)
  "Inputs": "Facts to be used in the prompt.",
  "Outputs": "Guidance for output constraints.",
  "Prompt": "This prompt is what is sent to the AI model to generate the proposal.",
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
    if (recipe && recipe.updatedAt) {
      const date = ('seconds' in recipe.updatedAt) ? new Date((recipe.updatedAt as any).seconds * 1000) : recipe.updatedAt;
      setLastUpdated(dayjs(date).format("MM/DD/YYYY hh:mm a"));
    }
  }, [recipe]);

  function saveRecipe() {
    if (recipe && user) {
      setLoading(true);
      grantRecipeService.update(recipe.id!, recipe, undefined, undefined, user)
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
  }

  function handleClone() {
    if (recipe) {
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
  }

  async function handleGenerate() {
    if (!recipe) return;
    try {
      setLoading(true);
      const saved = await grantProposalService.generate(recipe);
      notifications.success(`Proposal generated for ${recipe.description}.`);
      navigate(`/grant-proposals/${saved.id}`);
    } catch (err: any) {
      console.error(err);
      notifications.error(`Could not generate a proposal for this recipe. ${err?.message ?? "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  function handleGrantOutputChange(updated: GrantOutput[]): void {
    grantRecipeService.updatePrompt({ ...recipe, outputsWithWordCount: updated })
      .then(revised => {
        setRecipe(revised);
        setDirty(true);
      })
  }

<<<<<<< HEAD
  function handleDescriptionChange(updated: string): void {
    // no prompt update here
    setRecipe({
      ...recipe,
      description: updated
    });
    setDirty(true);
  }

<<<<<<< HEAD
  function handleGrantContextsChange(revised: GrantRecipe): void {
    console.log(revised);
    // prompt not affected by contexts change
    setRecipe(revised);
    setDirty(true);
=======
=======
>>>>>>> cc06741 (lint)
  function handleInfoChange(updated: GrantRecipe): void {
    setRecipe(updated);
    setDirty(true);
  }

  function handleGrantContextsChange(revised: GrantRecipe): void {
    console.log(revised);
    // prompt not affected by contexts change
    setRecipe(revised);
    setDirty(true);
  }

  function handlePromptChange(updated: string): void {
    updatePrompt({ ...recipe, prompt: updated })
      .then(revised => {
        setRecipe(revised);
        setDirty(true);
      })
>>>>>>> f2961b4 (tags & ratings)
  }

<<<<<<< HEAD
  function handleTemplateChange(updated: string): void {
    updatePrompt({ ...recipe, template: updated })
      .then(revised => {
        setRecipe(revised);
        setDirty(true);
      })
  }

=======
>>>>>>> 77917b0 (Project Context)
  return (
    <>
      <LoadingOverlay />
      <HelpTopicContext.Provider value={{ helpTopic, setHelpTopic }} >
<<<<<<< HEAD
        <GrantRecipeContext.Provider value={{ recipe, setRecipe }} >
          <Breadcrumbs aria-label="breadcrumbs">
            <NavLink to="/" ><IconButton size="medium"><HomeOutlined /></IconButton></NavLink>
            <NavLink to={`/grant-recipes`} >Recipes</NavLink>
            <Typography color="text.primary">Recipe Detail</Typography>
          </Breadcrumbs>
          <Box gap={4}>
            <Stack sx={{ gap: 2, marginRight: `${showHelp ? HELP_DRAWER_WIDTH : 0}px` }}>
              <Card>
                <CardHeader title="Grant Recipe Detail"
                  action={`Token count = ${recipe.tokenCount}`}
                  subheader={`Last updated: ${lastUpdated}`} />
                <CardContent>
                  <Stack gap={1}>
                    <TextEditor title="Description" value={recipe.description} onChange={handleDescriptionChange} />
                    <TextEditor title="Template" value={recipe.template} onChange={handleTemplateChange} />
                    <GrantContextEditor disabled={false} onChange={handleGrantContextsChange} />
                    <GrantOutputEditor fields={recipe.outputsWithWordCount} onChange={handleGrantOutputChange} />
                    <TextEditor title="Prompt" value={recipe.prompt} onChange={() => { }} />
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
        </GrantRecipeContext.Provider>
=======
        <Breadcrumbs aria-label="breadcrumbs">
          <NavLink to="/" ><IconButton size="medium"><HomeOutlined /></IconButton></NavLink>
          <NavLink to={`/grant-recipes`} >Recipes</NavLink>
          <Typography color="text.primary">Recipe Detail</Typography>
        </Breadcrumbs>
        <Box gap={4}>
          <Stack sx={{ gap: 2, marginRight: `${showHelp ? HELP_DRAWER_WIDTH : 0}px` }}>
            <Card>
              <CardHeader title="Grant Recipe Detail"
                action={`Token count = ${recipe.tokenCount}`}
                subheader={`Last updated: ${lastUpdated}`} />
              <CardContent>
                <Stack gap={1}>
                  <GrantInfoEditor recipe={recipe} onChange={handleInfoChange} />
                  <TextEditor title="Prompt" value={recipe.prompt} onChange={handlePromptChange} />
                  <GrantContextEditor disabled={false} contexts={recipe.contexts} onChange={handleGrantContextsChange} />
                  {/* <GrantInputEditor recipeInputs={recipe.inputParameters} onChange={handleGrantInputChange} /> */}
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
>>>>>>> f2961b4 (tags & ratings)
      </HelpTopicContext.Provider>
    </>
  );

}

export default GrantRecipesDetailPage;