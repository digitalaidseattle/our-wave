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
  Stack,
  TextField
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { HelpTopicContext } from '../../components/HelpTopicContext';
import type { GrantOutput } from "../../types";
import { StableCursorTextField } from '../../components/StableCursorTextfield';

export const GrantOutputEditor = ({ fields, onChange }: { fields: GrantOutput[], onChange: (updated: GrantOutput[]) => void }) => {

  const [outputFields, setOutputFields] = useState<GrantOutput[]>([]);
  const { setHelpTopic } = useContext(HelpTopicContext);
  const { setShowHelp } = useHelp();

  useEffect(() => {
    if (fields) {
      setOutputFields(fields);
    }
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
      <CardHeader title="Output Fields: (field / max symbol count)"
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
                onChange={(e) => handleOutputFieldChange(index, 'name', e.target.value)}
              />
              <StableCursorTextField
                label={`Max ${field.unit === 'words' ? 'Words' : 'Characters'}`}
                type="number"
                value={field.maxWords}
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
