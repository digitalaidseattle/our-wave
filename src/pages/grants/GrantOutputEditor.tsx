/**
 * GrantOutputEditor.tsx
 * 
 * @copyright 2025 Digital Aid Seattle
*/
import { DeleteOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useHelp } from '@digitalaidseattle/core';
import {
  Button, ButtonGroup,
  Card, CardContent, CardHeader,
  IconButton,
  Stack, TextField
} from "@mui/material";
import { useContext, useState } from "react";
import { HelpTopicContext } from '../../components/HelpTopicContext';
import type { GrantOutput } from "../../types";
import { RECIPE_STRINGS } from '../../constants/grantRecipe';
import { DUPLICATE_OUTPUT_FIELD_ERROR } from '../../utils/recipeValidation';

export const GrantOutputEditor = ({
  fields,
  onChange,
  touchedFields = {},
  duplicateFieldIndexes = new Set<number>(),
  onFieldBlur,
}: {
  fields: GrantOutput[],
  onChange: (updated: GrantOutput[]) => void,
  touchedFields?: Record<string, boolean>,
  duplicateFieldIndexes?: Set<number>,
  onFieldBlur?: (index: number, field: 'name' | 'maxWords') => void,
}) => {

  const outputFields = fields ?? [];
  const [rowVersion, setRowVersion] = useState(0);
  const { setHelpTopic } = useContext(HelpTopicContext);
  const { setShowHelp } = useHelp();


  const handleOutputFieldChange = (index: number, field: 'name' | 'maxWords', value: string | number) => {
    const newFields = [...outputFields];
    newFields[index] = { ...newFields[index], [field]: value };
    onChange(newFields);
  };

  const handleOutputUnitToggle = (index: number) => {
    const newFields = [...outputFields];
    newFields[index] = {
      ...newFields[index],
      unit: newFields[index].unit === 'words' ? 'characters' : 'words'
    };
    onChange(newFields);
  };

  const handleAddOutputField = () => {
    onChange([...outputFields, { name: "", maxWords: 500, unit: 'words' }]);
  };

  const handleRemoveOutputField = (index: number) => {
    // Reset index-keyed DOM values after rows shift.
    setRowVersion(version => version + 1);
    onChange(outputFields.filter((_, i) => i !== index));
  };

  const getOutputNameError = (field: GrantOutput, index: number): string | undefined => {
    if (Boolean(touchedFields[`name-${index}`]) && field.name.trim().length === 0) {
      return "Field name is required.";
    }
    if (duplicateFieldIndexes.has(index)) {
      return DUPLICATE_OUTPUT_FIELD_ERROR;
    }
    return undefined;
  };

  return (
    <Card>
      <CardHeader title={<>
        {RECIPE_STRINGS.outputFieldsTitle} <span style={{ color: '#d32f2f' }}>*</span>
      </>}
        subheader={RECIPE_STRINGS.outputFieldsSubtext}
        slotProps={{ title: { fontWeight: 600, fontSize: 16 } }}
        avatar={<IconButton
          onClick={() => { setHelpTopic('Outputs'); setShowHelp(true) }}
          color="primary"><InfoCircleOutlined /></IconButton>}
        action={
          <Button
            variant="outlined"
            color="primary"
            onClick={handleAddOutputField}
            startIcon={<PlusOutlined />}
            sx={{ alignSelf: 'flex-start' }}
          >
            Add Output Field
          </Button>
        } />

      <CardContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {outputFields.map((field, index) => {
            const outputNameError = getOutputNameError(field, index);

            return (
              <Stack direction="row" spacing={2} key={`${rowVersion}-${index}`} alignItems="center">
              <Button
                color="error"
                aria-label="remove output field"
                onClick={() => handleRemoveOutputField(index)}
              >
                <DeleteOutlined />
              </Button>
              <TextField
                label="Field"
                fullWidth={true}
                defaultValue={field.name}
                required
                error={Boolean(outputNameError)}
                helperText={outputNameError ?? " "}
                onBlur={() => onFieldBlur?.(index, 'name')}
                onChange={(e) => handleOutputFieldChange(index, 'name', e.target.value)}
              />
              <TextField
                label={`Max ${field.unit === 'words' ? 'Words' : 'Characters'}`}
                type="number"
                defaultValue={field.maxWords}
                required
                error={Boolean(touchedFields[`maxWords-${index}`]) && Number(field.maxWords) <= 0}
                helperText={Boolean(touchedFields[`maxWords-${index}`]) && Number(field.maxWords) <= 0 ? "Enter a value greater than 0." : " "}
                onBlur={() => onFieldBlur?.(index, 'maxWords')}
                onChange={(e) => handleOutputFieldChange(index, 'maxWords', parseInt(e.target.value) || 0)}
              />
              <ButtonGroup variant="contained" aria-label="Basic button group">
                <Button
                  variant={field.unit === 'words' ? 'contained' : 'outlined'}
                  onClick={() => handleOutputUnitToggle(index)}
                >Words</Button>
                <Button
                  variant={field.unit === 'characters' ? 'contained' : 'outlined'}
                  onClick={() => handleOutputUnitToggle(index)}
                >Characters</Button>
              </ButtonGroup>

              </Stack>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );

}
