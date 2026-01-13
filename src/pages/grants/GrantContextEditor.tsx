/**
 *  GrantContextEditor.ts
 *
 *  @copyright 2025 Digital Aid Seattle
 *
 */
import { DeleteOutlined, FileSearchOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useHelp } from '@digitalaidseattle/core';
import { Button, Card, CardContent, CardHeader, IconButton, InputAdornment, OutlinedInput, Stack, Toolbar, Typography } from "@mui/material";
import React, { useContext, useEffect } from "react";
import { geminiService } from '../../api/geminiService';
import { GoogleDriveFileSearchDialog } from '../../components/GoogleDriveFileSearchDialog';
import { GrantRecipeContext } from '../../components/GrantRecipeContext';
import { HelpTopicContext } from '../../components/HelpTopicContext';
import { GoogleFile } from '../../services/googleDriveService';
import { GrantContext, GrantRecipe } from '../../types';

interface ContextRowProps {
    index: number;
    disabled: boolean;
    context: GrantContext;
    onChange: (index: number, param: GrantContext) => void
    onDelete: (index: number) => void
};
const ContextRow = ({ index, disabled, context, onChange, onDelete }: ContextRowProps) => {

    const [fileSearchModalOpen, setFileSearchModalOpen] = React.useState(false);

    function handleFileSearch(): void {
        setFileSearchModalOpen(true)
    }

    function handleFileSelection(gf: GoogleFile | null): void {
        if (gf) {
            // const tokenCount = geminiService.calcTokenCount();
            onChange(index, gf ? { ...context, filePath: gf.name, value: gf.contents ?? '' } : context);
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
                disabled={disabled}
                aria-label="remove context"
                color="error"
                onClick={() => onDelete(index)}>
                <DeleteOutlined />
            </Button>
            {(context.type === 'text') &&
                <OutlinedInput
                    disabled={disabled}
                    fullWidth={true}
                    placeholder='Enter context information here'
                    value={context.value ?? ''}
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
                        disabled={disabled}
                        fullWidth={true}
                        value={context.filePath ?? ''}
                        startAdornment={
                            <InputAdornment position="start" sx={{ mr: -0.5 }}>
                                <IconButton onClick={handleFileSearch}>
                                    <FileSearchOutlined />
                                </IconButton>
                            </InputAdornment>
                        }
                        onChange={(e) => onChange(index, { ...context, value: e.target.value })}
                    />
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
    disabled: boolean;
    onChange: (recipe: GrantRecipe) => void;
};
export const GrantContextEditor: React.FC<GrantContextEditorProps> = ({ disabled, onChange }) => {
    const { setHelpTopic } = useContext(HelpTopicContext);
    const { setShowHelp } = useHelp();
    const { recipe } = useContext(GrantRecipeContext);
    const [contexts, setContexts] = React.useState<GrantContext[]>(recipe.contexts || []);

    useEffect(() => {
        setContexts(recipe.contexts || []);
    }, [recipe]);

    async function addContext(newContext: GrantContext) {
        newContext.tokenCount = await geminiService.calcTokenCount(recipe.modelType, newContext.value || '')
        const revised =[...contexts, newContext]
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
                            disabled={disabled}
                            variant="outlined"
                            onClick={() => addContext({ type: "file", value: "", tokenCount: 0 })}
                            startIcon={<PlusOutlined />}
                            sx={{ alignSelf: 'flex-start' }}>
                            File
                        </Button>
                        <Button
                            disabled={disabled}
                            variant="outlined"
                            onClick={() => addContext({ type: "text", value: "", tokenCount: 0 })}
                            startIcon={<PlusOutlined />}
                            sx={{ alignSelf: 'flex-start' }}>
                            Text
                        </Button>
                    </Toolbar>}
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
                            disabled={disabled}
                            context={context}
                            onChange={udpateContext}
                            onDelete={removeContext} />
                    ))}
                </Stack>
            </CardContent>
        </Card>
    );
};

