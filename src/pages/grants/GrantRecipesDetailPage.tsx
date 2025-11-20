import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { LoadingContext, useAuthService, useNotifications, User } from "@digitalaidseattle/core";
import {
  Box, Button, Card, CardActions, CardContent, CardHeader, FormControlLabel,
  Stack,
  Switch,
  TextField
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { grantRecipeService } from "../../services/grantRecipeService";
import type { GrantOutput } from "../../types";
import { GrantRecipe } from "../../types";
import { grantProposalService } from '../../services/grantProposalService';

const TEXT_RECIPE = {
  id: 'test',
  description: 'test',
  outputsWithWordCount: [
    { name: "description", maxWords: 500, unit: 'word' },
    { name: "usage", maxWords: 500, unit: 'word' }
  ]
} as GrantRecipe;

const AUTO_SAVE_DELAY = 1000 * 2;

const GrantRecipesDetailPage: React.FC = () => {
  const { id } = useParams();

  const notifications = useNotifications();
  const navigate = useNavigate();

  const { loading, setLoading } = useContext(LoadingContext);
  const authService = useAuthService();
  const [user, setUser] = useState<User>();
  const [dirty, setDirty] = useState<boolean>(false);

  const [recipe, setRecipe] = useState<GrantRecipe>();
  const [outputFields, setOutputFields] = useState<GrantOutput[]>([]);

  useEffect(() => {
    // FIXME remove
    if (import.meta.env.MODE === 'development') {
      setRecipe(TEXT_RECIPE);
    } else {
      if (id) {
        grantRecipeService.getById(id)
          .then(resp => setRecipe(resp))
      }
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
          .then(saved => setRecipe(saved))
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
        <Box>Description goes here</Box>
        <Box>Prompt goes here</Box>
        <Box>inputs goes here</Box>
        <fieldset style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '16px', marginTop: '16px' }}>
          <legend style={{ padding: '0 8px' }}>Output Fields: (field / max word count)</legend>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {outputFields.map((field, index) => (
              <Stack direction="row" spacing={2} key={index} alignItems="center">
                <TextField
                  label="Field"
                  value={field.name}
                  onChange={(e) => handleOutputFieldChange(index, 'name', e.target.value)}
                  sx={{ width: '200px' }}
                />
                <TextField
                  label={`Max ${field.unit === 'word' ? 'Words' : 'Characters'}`}
                  type="number"
                  value={field.maxWords}
                  onChange={(e) => handleOutputFieldChange(index, 'maxWords', parseInt(e.target.value) || 0)}
                  sx={{ width: '150px' }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.unit === 'char'}
                      onChange={() => handleOutputUnitToggle(index)}
                    />
                  }
                  label={field.unit === 'word' ? 'Words' : 'Chars'}
                />
                <Button
                  color="error"
                  onClick={() => handleRemoveOutputField(index)}
                  startIcon={<DeleteOutlined />}
                >
                  Remove
                </Button>
              </Stack>
            ))}
            <Button
              variant="outlined"
              color="success"
              onClick={handleAddOutputField}
              startIcon={<PlusOutlined />}
              sx={{ alignSelf: 'flex-start' }}
            >
              Add Output Field
            </Button>
          </Stack>
        </fieldset>
      </CardContent>
      <CardActions>
        <Button variant="contained" disabled={loading} onClick={() => handleClone()}>Clone</Button>
        <Button variant="contained" disabled={loading} onClick={() => handleGenerate()}>Generate</Button>
      </CardActions>
    </Card>
  );

}

export default GrantRecipesDetailPage;