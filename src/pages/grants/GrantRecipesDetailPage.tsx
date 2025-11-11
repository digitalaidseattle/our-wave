import { LoadingContext, useNotifications } from "@digitalaidseattle/core";
import { Button, Card, CardActions, CardContent, CardHeader, Stack, TextField } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { grantProposalService } from "../../services/grantProposalService";
import { grantRecipeService } from "../../services/grantRecipeService";
import type { GrantInput, GrantOutput } from "../../types";
import { GrantRecipe } from "../../types";
import { GrantInputEditor } from "./GrantInputEditor";
import { GrantOutputEditor } from "./GrantOutputEditor";

const TEST_RECIPE =
  {
    id: 'test',
    description: 'test',
    prompt: 'Create a grant proposal ',
    inputParameters: [
      { key: 'From', value: 'Our Wave' },
      { key: 'Mission statement', value: '' },
    ],
    outputsWithWordCount: [
      { name: "description", maxWords: 500, unit: 'word' },
      { name: "usage", maxWords: 500, unit: 'word' }
    ]
  } as GrantRecipe

export const TextEditor = ({ title, value, onChange }: { title: string, value: string, onChange: (updated: string) => void }) => {
  return (
    <Card>
      <CardHeader title={title} />
      <CardContent>
        <TextField fullWidth={true} value={value} onChange={(evt) => onChange(evt.target.value)} />
      </CardContent>
    </Card>
  )
}

const GrantRecipesDetailPage: React.FC = () => {
  const { id } = useParams<string>();

  const notifications = useNotifications();
  const navigate = useNavigate();
  const { loading, setLoading } = useContext(LoadingContext);
  const [recipe, setRecipe] = useState<GrantRecipe>({ id: 'test', description: 'test' } as GrantRecipe);

  useEffect(() => {
    if (id) {
      // grantRecipeService.getById(id)
      //   .then(found => setRecipe(found));
      setRecipe(TEST_RECIPE)
    }
  }, [id])

  useEffect(() => {
    if (authService) {
      authService.getUser()
        .then(u => setUser(u!));
    }
  }, [authService])

  useEffect(() => {
    if (recipe) {
      setOutputFields(recipe.outputsWithWordCount);
      setDirty(false);
    }
  }, [recipe])

  useEffect(() => {
    if (recipe && dirty) {
      recipe.outputsWithWordCount = outputFields;
      saveRecipe(recipe);
    }
  }, [dirty]);

  function saveRecipe(recipe: GrantRecipe) {
    // FIXME remove
    if (import.meta.env.MODE === 'development') {
      setDirty(false);
    } else {
      if (recipe && user) {
        setLoading(true);
        grantRecipeService.update(recipe.id!, recipe, undefined, undefined, user)
          .then(saved => setRecipe(saved))
          .catch(err => {
            console.error(err)
            notifications.error(`Could not save this recipe. ${err.message}`)
          })
          .finally(() => setLoading(false))
      }
    }
  }

  useEffect(() => {
    if (dirty) {
      // debounce a bit
      const id = setInterval(doSave, 2000);
      return () => clearInterval(id);
    }
  }, [dirty]);

  const handleOutputFieldChange = (_index: number, _field: 'name' | 'maxWords', _value: string | number) => {
    setDirty(true);
  };

  function doSave() {
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

  function handleGrantOutputChange(updated: GrantOutput[]): void {
    setRecipe({
      ...recipe,
      outputsWithWordCount: updated
    });
  }

  function handleDescriptionChange(updated: string): void {
    setRecipe({
      ...recipe,
      description: updated
    });
  }

  function handlePromptChange(updated: string): void {
    setRecipe({
      ...recipe,
      prompt: updated
    });
  }

  function handleGrantInputChange(inputs: GrantInput[]): void {
    setRecipe({
      ...recipe,
      inputParameters: inputs
    });
  }

  return (
    <Card>
      <CardHeader title="Grant Recipe Detail" />
      <CardContent>
        <Stack gap={1}>
          <TextEditor title="Description" value={recipe.description} onChange={handleDescriptionChange} />
          <TextEditor title="Prompt" value={recipe.prompt} onChange={handlePromptChange} />
          <GrantInputEditor recipeInputs={recipe.inputParameters} onChange={handleGrantInputChange} />
          <GrantOutputEditor fields={recipe.outputsWithWordCount} onChange={handleGrantOutputChange} />
        </Stack>
      </CardContent>
      <CardActions>
        <Button variant="contained" disabled={loading} onClick={() => handleClone()}>Clone</Button>
        <Button variant="contained" disabled={loading} onClick={() => handleGenerate()}>Generate</Button>
      </CardActions>
    </Card>
  );

}

export default GrantRecipesDetailPage;