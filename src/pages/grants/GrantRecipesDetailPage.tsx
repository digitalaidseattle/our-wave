/**
 * GrantRecipesDetailPage.tsx
 * 
 * @copyright 2025 Digital Aid Seattle
*/
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Box, Button, Card, CardActions, CardContent, CardHeader, Divider, IconButton, Stack, TextField, Toolbar } from "@mui/material";
import dayjs from "dayjs";
import { LoadingContext, useHelp, useNotifications, UserContext } from "@digitalaidseattle/core";
import { HelpDrawer } from "../../components/HelpDrawer";
import { grantProposalService } from "../../services/grantProposalService";
import { grantRecipeService } from "../../services/grantRecipeService";
import { GrantRecipe } from "../../types";
import { GrantInputEditor } from "./GrantInputEditor";
import { GrantOutputEditor } from "./GrantOutputEditor";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { HelpTopicContext } from "../../components/HelpTopicContext";
import type { GrantInput, GrantOutput } from "../../types";

const HELP_DRAWER_WIDTH = 300;
const HELP_TITLE = "Our Wave";
const HELP_DICTIONARY = {
  "Description": "Change this field for easier tracking in the application.",
  "Prompt": "This prompt template is filled with text using the input and output parameters.",
  "Inputs": "Facts to be used in the prompt.",
  "Outputs": "Guidance for output constraints.",
}

const AUTO_SAVE_DELAY = 1000 * 2;

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
        <TextField fullWidth={true} value={value}
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

  // useEffect(() => {
  //   if (dirty) {
  //     const id = setInterval(() => saveRecipe(), AUTO_SAVE_DELAY);
  //     return () => clearInterval(id);
  //   }
  // }, [dirty]);

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
      grantRecipeService.clone(recipe)
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

  function handleGenerate() {
    if (recipe) {
      setLoading(true);
      grantProposalService.generate(recipe)
        .then(_generated => {
          // Add generated to list of proposals?
          notifications.success(`A proposal for ${recipe.description} has been successfully generated.`)
        })
        .catch(err => {
          console.error(err)
          notifications.error(`Could not generate a proposal for his recipe. ${err.message}`)
        })
        .finally(() => setLoading(false))
    }
  }

  function updatePrompt(changed: GrantRecipe): Promise<GrantRecipe> {
    return grantRecipeService.updatePrompt(changed);
  }

  function handleGrantOutputChange(updated: GrantOutput[]): void {
    updatePrompt({ ...recipe, outputsWithWordCount: updated })
      .then(revised => {
        setRecipe(revised);
        setDirty(true);
      })
  }

  function handleDescriptionChange(updated: string): void {
    setRecipe({
      ...recipe,
      description: updated
    });
    setDirty(true);
  }

  function handlePromptChange(updated: string): void {
    updatePrompt({ ...recipe, prompt: updated })
      .then(revised => {
        setRecipe(revised);
        setDirty(true);
      })
  }

  function handleGrantInputChange(inputs: GrantInput[]): void {
    updatePrompt({ ...recipe, inputParameters: inputs })
      .then(revised => {
        setRecipe(revised);
        setDirty(true);
      })
  }

  return (
    <>
      <LoadingOverlay />
      <HelpTopicContext.Provider value={{ helpTopic, setHelpTopic }} >
        <Box gap={4}>
          <Stack sx={{ gap: 2, marginRight: `${showHelp ? HELP_DRAWER_WIDTH : 0}px` }}>
            <Card>
              <CardHeader title="Grant Recipe Detail"
                action={`Token count = ${recipe.tokenCount}`}
                subheader={`Last updated: ${lastUpdated}`} />
              <CardContent>
                <Stack gap={1}>
                  <TextEditor title="Description" value={recipe.description} onChange={handleDescriptionChange} />
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