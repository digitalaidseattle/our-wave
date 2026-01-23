/**
 *  GrantContextEditor.ts
 *
 *  @copyright 2025 Digital Aid Seattle
 *
 */
import { DeleteOutlined, FileSearchOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, CardContent, CardHeader, IconButton, InputAdornment, OutlinedInput, Stack, Toolbar, Typography } from "@mui/material";
import React, { useContext, useEffect } from 'react';

import { useHelp } from '@digitalaidseattle/core';
import { geminiService } from '../../api/geminiService';
import { GoogleDriveFileSearchDialog } from '../../components/GoogleDriveFileSearchDialog';
import { GrantRecipeContext } from '../../components/GrantRecipeContext';
import { HelpTopicContext } from '../../components/HelpTopicContext';
import { GoogleDriveService, GoogleFile } from '../../services/googleDriveService';
import { GrantContext, GrantRecipe } from '../../types';

interface ContextRowProps {
    index: number;
    context: GrantContext;
    onChange: (index: number, param: GrantContext) => void
    onDelete: (index: number) => void
};
const ContextRow = ({ index, context, onChange, onDelete }: ContextRowProps) => {

    const googleDriveService = GoogleDriveService.getInstance();
    const { recipe } = useContext(GrantRecipeContext);
    const [fileSearchModalOpen, setFileSearchModalOpen] = React.useState(false);

    function handleFileSearch(): void {
        setFileSearchModalOpen(true)
    }

    async function handleFileSelection(gf: GoogleFile | null): Promise<void> {
        if (gf) {
            const content = await googleDriveService.downloadMarkdown(gf.id)
            const tokenCount = await geminiService.calcTokenCount(recipe.modelType, content);
            onChange(index, {
                ...context,
                tokenCount: tokenCount,
                name: gf.name,
                filePath: gf.id,
                value: content ?? ''
            });
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
                        value={context.name ?? ''}
                        startAdornment={
                            <InputAdornment position="start" sx={{ mr: -0.5 }}>
                                <IconButton onClick={() => handleFileSearch()}>
                                    <FileSearchOutlined />
                                </IconButton>
                            </InputAdornment>
                        }
                        onChange={(e) => onChange(index, { ...context, value: e.target.value })}
                    />
                </>
            }
            <Typography variant="body2" sx={{ alignSelf: 'center', minWidth: 80 }}>
                Tokens: {context.tokenCount}
            </Typography>
            <GoogleDriveFileSearchDialog open={fileSearchModalOpen} onChange={handleFileSelection} />
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
        const revised = [...(contexts ?? []), newContext]
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
                            onClick={() => addContext({ type: "file", value: "", name: "", tokenCount: 0 })}
                            startIcon={<PlusOutlined />}
                            sx={{ alignSelf: 'flex-start' }}>
                            File
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => addContext({ type: "text", value: "", name: "", tokenCount: 0 })}
                            startIcon={<PlusOutlined />}
                            sx={{ alignSelf: 'flex-start' }}>
                            Text
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


