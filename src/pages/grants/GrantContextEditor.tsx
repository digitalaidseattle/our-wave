/**
 *  GrantContextEditor.ts
 *
 *  @copyright 2025 Digital Aid Seattle
 *
 */
import React, { useContext, useEffect } from 'react';
import { DeleteOutlined, FileSearchOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, CardContent, CardHeader, IconButton, InputAdornment, MenuItem, OutlinedInput, Select, Stack, Toolbar, Typography } from "@mui/material";

import { GrantContext, GrantRecipe } from '../../types';
import { GoogleDriveService, GoogleFile } from '../../services/googleDriveService';
import { GoogleDriveFileSearchDialog } from '../../components/GoogleDriveFileSearchDialog';
import { HelpTopicContext } from '../../components/HelpTopicContext';
import { useHelp } from '@digitalaidseattle/core';
import { GrantRecipeContext } from '../../components/GrantRecipeContext';
import { geminiService } from '../../api/geminiService';

interface ContextRowProps {
    index: number;
    context: GrantContext;
    onChange: (index: number, param: GrantContext) => void
    onDelete: (index: number) => void
};
const ContextRow = ({ index, context, onChange, onDelete }: ContextRowProps) => {
    const googleDriveService = GoogleDriveService.getInstance();
    const [fileSearchModalOpen, setFileSearchModalOpen] = React.useState(false);

    function handleFileSearch(): void {
        setFileSearchModalOpen(true)
    }

    function handleFileSelection(gf: GoogleFile | null): void {
        if (gf) {
            googleDriveService.downloadMarkdown(gf.id)
                .then(resp => onChange(index, gf ? { ...context, filePath: gf.name, value: resp ?? '' } : context))
        }
        setFileSearchModalOpen(false)
    }

    function handleTextChange(e: React.ChangeEvent<HTMLInputElement>): void {
        onChange(index, { ...context, value: e.target.value });
    }

    return (
        <Stack
            direction={'row'}
            key={index}
            gap={1}
            sx={{
                position: 'relative',
                width: '100%'
            }}
        >
            <Button
                aria-label="remove context"
                color="error"
                onClick={() => onDelete(index)}>
                <DeleteOutlined />
            </Button>
            (context.type === 'text') &&
            <OutlinedInput
                fullWidth={true}
                placeholder='Enter context information here'
                value={context.value ?? ''}
                onChange={handleTextChange}
            />
            <Select
                value={context.type ?? 'text'}
                onChange={(e) => onChange(index, { ...context, type: (e.target.value === "text") ? "text" : "file" })}>
                <MenuItem value={'text'}>Text</MenuItem>
                <MenuItem value={'file'}>File</MenuItem>
            </Select>
            {(context.type === 'text') &&
                <OutlinedInput
                    fullWidth={true}
                    value={context.value}
                    placeholder='Enter context information here'
                    onChange={handleTextChange}
                    multiline={true}
                    rows={1}
                    sx={{
                        '& .MuiInputBase-input': {
                            resize: 'vertical',
                            overflow: 'auto',
                        }
                    }} />}
            {(context.type === 'file') &&
                <>
                    <OutlinedInput
                        fullWidth={true}
                        value={context.filePath ?? ''}
                        startAdornment={
                            <InputAdornment position="start" sx={{ mr: -0.5 }}>
                                <IconButton onClick={() => handleFileSearch()}>
                                    <FileSearchOutlined />
                                </IconButton>
                            </InputAdornment>
                        }
                        onChange={(e) => onChange(index, { ...context, value: e.target.value })}
                    />
                    <Typography variant="body2" sx={{ alignSelf: 'center', minWidth: 80 }}>
                        Tokens: {context.tokenCount}
                    </Typography>
                    <GoogleDriveFileSearchDialog open={fileSearchModalOpen} onChange={handleFileSelection} />
                </>
            }
            <Typography variant="body2" sx={{ alignSelf: 'center', minWidth: 80 }}>
                Tokens: {context.tokenCount}
            </Typography>
        </Stack >
    )
}

type GrantContextEditorProps = {
    onChange: (recipe: GrantRecipe) => void;
};

export const GrantContextEditor: React.FC<GrantContextEditorProps> = ({ onChange }) => {
    const { setHelpTopic } = useContext(HelpTopicContext);
    const { setShowHelp } = useHelp();
    const { recipe } = useContext(GrantRecipeContext);
    const [contexts, setContexts] = React.useState<GrantContext[]>([]);

    useEffect(() => {
        setContexts(recipe ? recipe.contexts : []);
    }, [recipe]);

    async function addContext(newContext: GrantContext) {
        newContext.tokenCount = await geminiService.calcTokenCount(recipe.modelType, newContext.value || '')
        const revised = [...contexts, newContext]
        onChange({ ...recipe, contexts: revised });
    }

    async function udpateContext(index: number, revised: GrantContext) {
        revised.tokenCount = await geminiService.calcTokenCount(recipe.modelType, revised.value || '');
        contexts[index] = revised;
        onChange({ ...recipe, contexts: contexts.slice() });
    }

    function removeContext(index: number) {
        const revised = contexts.filter((_, i) => i !== index);
        onChange({ ...recipe, contexts: revised });
    }

    return (
        <Card>
            <CardHeader title="Project Contexts"
                action={
                    <Toolbar disableGutters={true} sx={{ gap: 1 }} >
                        <Button
                            variant="outlined"
                            onClick={() => addContext({ type: "file", value: "", tokenCount: 0 })}
                            startIcon={<PlusOutlined />}
                            sx={{ alignSelf: 'flex-start' }}>
                            File
                        </Button>
                    </Toolbar>
                }
                slotProps={{ title: { fontWeight: 600, fontSize: 16 } }}
                avatar={<IconButton
                    onClick={() => { setHelpTopic('Contexts'); setShowHelp(true) }}
                    color="primary"><InfoCircleOutlined /></IconButton>} />
            <CardContent>
                <Stack gap={2}>
                    {(contexts ?? []).map((context, idx) => (
                        <ContextRow
                            key={idx}
                            index={idx}
                            context={context}
                            onChange={udpateContext}
                            onDelete={removeContext} />
                    ))}
                </Stack>
            </CardContent>
        </Card>
    );
};


