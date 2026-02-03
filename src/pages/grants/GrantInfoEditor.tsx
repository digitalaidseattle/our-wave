/**
 * GrantOutputEditor.tsx
 * 
 * @copyright 2025 Digital Aid Seattle
*/
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { useHelp } from '@digitalaidseattle/core';
import {
  Card,
  CardContent,
  CardHeader,
  Chip,
  FormLabel,
  Grid,
  IconButton,
  Rating,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useContext, useState } from "react";
import { HelpTopicContext } from '../../components/HelpTopicContext';
import type { GrantRecipe } from "../../types";

const TagButton = ({ onChange }: { onChange: (newValue: string | null) => void }) => {
  const [edit, setEdit] = useState<boolean>(false);
  const [tag, setTag] = useState<string>('New Tag');

  function cancel() {
    setEdit(false);
    setTag("New Tag");
  }
  function doSave() {
    onChange(tag);
    setEdit(false);
    setTag("New Tag");
  }

  return (
    <>
      {!edit && <IconButton onClick={() => setEdit(true)}><PlusCircleOutlined /></IconButton>}
      {edit &&
        <>
          <TextField
            id="problem"
            name="problem"
            type="text"
            value={tag}
            variant="standard"
            onChange={(ev => setTag(ev.target.value))}
          />
          <IconButton size="small" color="error" onClick={cancel}>
            <CloseCircleOutlined />
          </IconButton>
          <IconButton size="small" color="success" onClick={doSave}>
            <CheckCircleOutlined />
          </IconButton>
        </>
      }
    </>
  )
}

export const GrantInfoEditor = ({ recipe, onChange }: { recipe: GrantRecipe, onChange: (updated: GrantRecipe) => void }) => {

  const { setHelpTopic } = useContext(HelpTopicContext);
  const { setShowHelp } = useHelp();

  function handleDescriptionChange(newValue: string) {
    onChange({ ...recipe, description: newValue });
  };

  function handleRatingChange(newValue: number) {
    onChange({ ...recipe, rating: newValue });
  };

  function handleDeleteTag(tag: string): void {
    const tags = recipe.tags ?? [];
    const index = tags.indexOf(tag);
    if (index > -1) {
      tags.splice(index, 1);
      onChange({ ...recipe, tags: tags });
    }
  }

  function handleAddTag(newValue: string | null): void {
    if (newValue) {
      onChange({ ...recipe, tags: [...recipe.tags ?? [], newValue] });
    }
  }

  return (
    <Card>
      <CardHeader title={'Info'}
        slotProps={{ title: { fontWeight: 600, fontSize: 16 } }}
        avatar={<IconButton
          onClick={() => { setHelpTopic('Info'); setShowHelp(true) }}
          color="primary"><InfoCircleOutlined /></IconButton>} />
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid size={2}><Typography>Description</Typography></Grid>
          <Grid size={10}><FormLabel>
            <TextField
              fullWidth={true}
              value={recipe.description ?? ""}
              placeholder="Name your recipe"
              autoFocus
              onChange={(evt) => handleDescriptionChange(evt.target.value)} />
          </FormLabel>
          </Grid>
          <Grid size={2}><Typography>Rating</Typography></Grid>
          <Grid size={10}>
            <Rating
              name="simple-controlled"
              value={recipe.rating ?? 0}
              onChange={(_event, newValue) => {
                handleRatingChange(newValue ?? 0);
              }}
            />
          </Grid>
          <Grid size={2}><Typography>Tags</Typography></Grid>
          <Grid size={10}>
            <Stack direction={'row'} spacing={1} sx={{alignItems:'center'}}>
              {(recipe.tags ?? []).map((tag, idx) => <Chip key={idx} label={tag} onDelete={() => handleDeleteTag(tag)} />)}
              <TagButton onChange={handleAddTag} />
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

}
