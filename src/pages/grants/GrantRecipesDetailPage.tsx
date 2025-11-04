import { LoadingContext, useNotifications } from "@digitalaidseattle/core";
import { Box, Button, Card, CardActions, CardContent, CardHeader } from "@mui/material";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { grantRecipeService } from "../../services/grantRecipeService";
import { GrantRecipe } from "../../types";
import { grantProposalService } from "../../services/grantProposalService";
import { 
  FormControlLabel,
  Stack, 
  Switch,
  TextField, 
  Typography } from "@mui/material";
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { GrantOutput } from "../../types";

const GrantRecipesDetailPage: React.FC = () => {
  const notifications = useNotifications();
  const navigate = useNavigate();
  const { loading, setLoading } = useContext(LoadingContext);
  const [recipe] = useState<GrantRecipe>({ id: 'test', description: 'test' } as GrantRecipe);

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

  const [outputFields, setOutputFields] = useState<GrantOutput[]>([
    { name: "description", maxWords: 500, unit: 'word' },
    { name: "usage", maxWords: 500, unit: 'word' }
  ]);

  const handleOutputFieldChange = (index: number, field: 'name' | 'maxWords', value: string | number) => {
    const newFields = [...outputFields];
    newFields[index] = { ...newFields[index], [field]: value };
    setOutputFields(newFields);
  };

  const handleOutputUnitToggle = (index: number) => {
    const newFields = [...outputFields];
    newFields[index] = {
      ...newFields[index],
      unit: newFields[index].unit === 'word' ? 'char' : 'word'
    };
    setOutputFields(newFields);
  };

  const handleAddOutputField = () => {
    setOutputFields([...outputFields, { name: "", maxWords: 500, unit: 'word' }]);
  };

  const handleRemoveOutputField = (index: number) => {
    setOutputFields(outputFields.filter((_, i) => i !== index));
  };
  return (
    <div>
      <Typography variant="h4">Grant Recipe Detail</Typography>
      <Card>
      <CardHeader title="Grant Recipe Detail" />
      <CardContent>
        <Box>Description goes here</Box>
        <Box>Prompt goes here</Box>
        <Box>inputs goes here</Box>
        <Box>Outputs goes here</Box>
      </CardContent>
      <CardActions>
        <Button variant="contained" disabled={loading} onClick={() => handleClone()}>Clone</Button>
        <Button variant="contained" disabled={loading} onClick={() => handleGenerate()}>Generate</Button>
      </CardActions>
    </Card>
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
    </div>
  );

  }

export default GrantRecipesDetailPage;