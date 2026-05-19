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
  Stack
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { HelpTopicContext } from '../../components/HelpTopicContext';
import { StableCursorTextField } from '../../components/StableCursorTextfield';
import type { GrantOutput } from "../../types";
import { RECIPE_STRINGS } from '../../constants/grantRecipe';

export const GrantOutputEditor = ({
  fields,
  onChange,
  touchedFields = {},
  onFieldBlur
}: {
  fields: GrantOutput[],
  onChange: (updated: GrantOutput[]) => void,
  touchedFields?: Record<string, boolean>,
  onFieldBlur?: (index: number, field: 'name' | 'maxWords') => void
}) => {

  const [outputFields, setOutputFields] = useState<GrantOutput[]>(fields || []);
  const { setHelpTopic } = useContext(HelpTopicContext);
  const { setShowHelp } = useHelp();

  useEffect(() => {
    setOutputFields(fields || []);
  }, [fields])

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
    onChange(outputFields.filter((_, i) => i !== index));
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
          {outputFields.map((field, index) => (
            <Stack direction="row" spacing={2} key={index} alignItems="center">
              <Button
                color="error"
                aria-label="remove output field"
                onClick={() => handleRemoveOutputField(index)}
              >
                <DeleteOutlined />
              </Button>
              <StableCursorTextField
                label="Field"
                fullWidth={true}
                value={field.name}
                required
                error={Boolean(touchedFields[`name-${index}`]) && field.name.trim().length === 0}
                helperText={Boolean(touchedFields[`name-${index}`]) && field.name.trim().length === 0 ? "Field name is required." : " "}
                onBlur={() => onFieldBlur?.(index, 'name')}
                onChange={(e) => handleOutputFieldChange(index, 'name', e.target.value)}
              />
              <StableCursorTextField
                label={`Max ${field.unit === 'words' ? 'Words' : 'Characters'}`}
                type="number"
                value={field.maxWords}
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
          ))}
        </Stack>
      </CardContent>
    </Card>
  );

}
