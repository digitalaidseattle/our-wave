/**
 * GrantOutputEditor.tsx
 * 
 * @copyright 2025 Digital Aid Seattle
*/
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button, Card, CardActions, CardContent, CardHeader, FormControlLabel,
  Stack,
  Switch,
  TextField
} from "@mui/material";
import { useEffect, useState } from "react";
import type { GrantOutput } from "../../types";

export const GrantOutputEditor = ({ fields, onChange }: { fields: GrantOutput[], onChange: (updated: GrantOutput[]) => void }) => {

  const [outputFields, setOutputFields] = useState<GrantOutput[]>([]);

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
      <CardHeader title="Output Fields: (field / max symbol count)" />
      <CardContent>
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
                label={`Max ${field.unit === 'words' ? 'Words' : 'Characters'}`}
                type="number"
                value={field.maxWords}
                onChange={(e) => handleOutputFieldChange(index, 'maxWords', parseInt(e.target.value) || 0)}
                sx={{ width: '150px' }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={field.unit === 'characters'}
                    onChange={() => handleOutputUnitToggle(index)}
                  />
                }
                label={field.unit === 'words' ? 'Words' : 'Chars'}
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
        </Stack>
      </CardContent>
      <CardActions>
        <Button
          variant="outlined"
          color="success"
          onClick={handleAddOutputField}
          startIcon={<PlusOutlined />}
          sx={{ alignSelf: 'flex-start' }}
        >
          Add Output Field
        </Button>
      </CardActions>
    </Card>
  );

}
