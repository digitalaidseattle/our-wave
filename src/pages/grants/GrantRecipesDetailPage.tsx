import { LoadingContext, useAuthService, useNotifications, User } from "@digitalaidseattle/core";
import { Button, Card, CardActions, CardContent, CardHeader, Stack, TextField } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const AUTO_SAVE_DELAY = 1000 * 2;

const GrantRecipesDetailPage: React.FC = () => {
  const { id } = useParams<string>();

  const notifications = useNotifications();
  const navigate = useNavigate();
  const authService = useAuthService();

  const { loading, setLoading } = useContext(LoadingContext);
  const [user, setUser] = useState<User>();
  const [recipe, setRecipe] = useState<GrantRecipe>({ id: 'test', description: 'test' } as GrantRecipe);
  const [dirty, setDirty] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      // grantRecipeService.getById(id)
      //   .then(found => setRecipe(found));
      setRecipe(TEST_RECIPE);
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
      setDirty(false);
    }
  }, [recipe])

  useEffect(() => {
    if (recipe && dirty) {
      const id = setInterval(() => saveRecipe(recipe), AUTO_SAVE_DELAY);
      return () => clearInterval(id);
    }
  }, [dirty]);

  function saveRecipe(recipe: GrantRecipe) {
    // FIXME remove
    if (import.meta.env.MODE === 'development') {
      console.log('now saving', recipe)
      setDirty(false);
    } else {
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
  }

  function handleClone() {
    if (recipe) {
      setLoading(true);
      grantRecipeService.clone(recipe)
        .then(cloned => {
          navigate(`grant-recipes/${cloned.id}`);
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

  function handleGrantOutputChange(updated: GrantOutput[]): void {
    setRecipe({
      ...recipe,
      outputsWithWordCount: updated
    });
    setDirty(true);
  }

  function handleDescriptionChange(updated: string): void {
    setRecipe({
      ...recipe,
      description: updated
    });
    setDirty(true);
  }

  function handlePromptChange(updated: string): void {
    setRecipe({
      ...recipe,
      prompt: updated
    });
    setDirty(true);
  }

  function handleGrantInputChange(inputs: GrantInput[]): void {
    setRecipe({
      ...recipe,
      inputParameters: inputs
    });
    setDirty(true);
  }

  function handleGrantOutputChange(updated: GrantOutput[]): void {
    setRecipe({
      ...recipe,
      outputsWithWordCount: updated
    });
    setDirty(true);
  }

  function handleDescriptionChange(updated: string): void {
    setRecipe({
      ...recipe,
      description: updated
    });
    setDirty(true);
  }

  function handlePromptChange(updated: string): void {
    setRecipe({
      ...recipe,
      prompt: updated
    });
    setDirty(true);
  }

  function handleGrantInputChange(inputs: GrantInput[]): void {
    setRecipe({
      ...recipe,
      inputParameters: inputs
    });
    setDirty(true);
  }

  const [outputFields, setOutputFields] = useState<GrantOutput[]>([
    { name: "description", maxWords: 500, unit: 'word' },
    { name: "usage", maxWords: 500, unit: 'word' }
  ]);

  const handleOutputFieldChange = (index: number, field: 'name' | 'maxWords', value: string | number) => {
    const newFields = [...outputFields];
    newFields[index] = { ...newFields[index], [field]: value };
    setOutputFields(newFields);
    setDirty(true);
  };

  const handleOutputUnitToggle = (index: number) => {
    const newFields = [...outputFields];
    newFields[index] = {
      ...newFields[index],
      unit: newFields[index].unit === 'word' ? 'char' : 'word'
    };
    setOutputFields(newFields);
    setDirty(true);
  };

  const handleAddOutputField = () => {
    setOutputFields([...outputFields, { name: "", maxWords: 500, unit: 'word' }]);
    setDirty(true);
  };

  const handleRemoveOutputField = (index: number) => {
    setOutputFields(outputFields.filter((_, i) => i !== index));
    setDirty(true);
  };

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