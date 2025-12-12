/**
 * GrantOutputEditor.tsx
 * 
 * @copyright 2025 Digital Aid Seattle
*/
import { DeleteOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  IconButton,
  Stack,
  TextField
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import type { GrantInput } from "../../types";
import { useHelp } from '@digitalaidseattle/core';
import { HelpTopicContext } from '../../components/HelpTopicContext';

export const GrantInputEditor = ({ recipeInputs, onChange }: { recipeInputs: GrantInput[], onChange: (updated: GrantInput[]) => void }) => {

  const [inputs, setInputs] = useState<GrantInput[]>([]);
  const { setHelpTopic } = useContext(HelpTopicContext);
  const { setShowHelp } = useHelp();

  useEffect(() => {
    if (recipeInputs) {
      setInputs(recipeInputs);
    }
  }, [recipeInputs])

  const handleFieldChange = (index: number, field: 'key' | 'value', value: string) => {
    const newFields = [...inputs];
    newFields[index] = { ...newFields[index], [field]: value };
    onChange(newFields);
  };

  const handleAddField = () => {
    onChange([...inputs, { key: "key", value: "value" }]);
  };

  const handleRemoveField = (index: number) => {
    onChange(inputs.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader title='Input Parameters (key/value):'
        slotProps={{ title: { fontWeight: 600, fontSize: 16 } }}
        avatar={<IconButton
          onClick={() => { setHelpTopic('Inputs'); setShowHelp(true) }}
          color="primary"><InfoCircleOutlined /></IconButton>} />
      <CardContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {inputs.map((field, index) => (
            <Stack direction="row" spacing={2} key={index} alignItems="center">
              <TextField
                label="Key"
                value={field.key}
                onChange={(e) => handleFieldChange(index, 'key', e.target.value)}
                sx={{ width: '300px' }}
              />
              <TextField
                fullWidth={true}
                label="Value"
                value={field.value}
                multiline={true}
                onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                sx={{
                  '& .MuiInputBase-inputMultiline': {
                    resize: 'both', // Allows resizing both horizontally and vertically
                    overflow: 'auto', // Ensures scrollbars appear if content exceeds bounds
                  },
                }}
              />
              <Button
                color="error"
                onClick={() => handleRemoveField(index)}
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
          onClick={handleAddField}
          startIcon={<PlusOutlined />}
          sx={{ alignSelf: 'flex-start' }}
        >
          Add Input Parameters
        </Button>
      </CardActions>
    </Card >

  );

}
