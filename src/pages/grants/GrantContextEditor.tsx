/**
 *  GrantContextEditor.ts
 *
 *  @copyright 2025 Digital Aid Seattle
 *
 */
import { DeleteOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, CardContent, CardHeader, FormControl, IconButton, OutlinedInput, Stack, Toolbar, Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from 'react';

import { useHelp, useNotifications } from '@digitalaidseattle/core';
import { geminiService } from '../../api/geminiService';
import { GrantRecipeContext } from '../../components/GrantRecipeContext';
import { HelpTopicContext } from '../../components/HelpTopicContext';
import { GrantContext, GrantRecipe } from '../../types';
import { GrantAiService } from './grantAiService';
import { FileUploadDialog } from '../../components/FileUploadDialog';

const SUPPORTED_FILE_TYPES = [
    "text/plain",
    "application/pdf",
    "text/html",
    "application/json",
    "text/markdown"];

interface ContextRowProps {
    index: number;
    context: GrantContext;
    onChange: (index: number, param: GrantContext) => void
    onDelete: (index: number) => void
};
const ContextRow = ({ index, context, onChange, onDelete }: ContextRowProps) => {

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
            {(SUPPORTED_FILE_TYPES.includes(context.type)) &&
                <>
                    <FormControl fullWidth={true} sx={{ border: '1px solid', borderBlockColor: 'grey', padding: 2, borderRadius: 1, pr: 1 }}>
                        <Typography >File: {context.name}</Typography>
                    </FormControl>
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
    const grantAiService = GrantAiService.getInstance();
    const notifications = useNotifications();

    const { setHelpTopic } = useContext(HelpTopicContext);
    const { setShowHelp } = useHelp();
    const { recipe } = useContext(GrantRecipeContext);
    const [contexts, setContexts] = React.useState<GrantContext[]>([]);

    const [showUploadDialog, setShowUploadDialog] = useState<boolean>(false);
    useEffect(() => {
        setContexts(recipe ? recipe.contexts : []);
    }, [recipe]);

    async function addContexts(newContexts: GrantContext[]) {
        const revised = [...(contexts ?? []), ...newContexts]
        onChange({ ...recipe, contexts: revised });
    }

    async function udpateContext(index: number, revised: GrantContext) {
        revised.tokenCount = await geminiService.calcTokenCount(recipe.modelType, revised.value || '');
        contexts[index] = revised;
        onChange({ ...recipe, contexts: contexts.slice() });
    }

    function removeContext(index: number) {
        // TODO remove file?
        const revised = contexts.filter((_, i) => i !== index);
        onChange({ ...recipe, contexts: revised });
    }

    async function handleFileUpload(files: File[] | null) {
        if (files) {
            
            const contexts = files
                .filter(file => {
                    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
                        notifications.error(`Unsupported file type: ${file.type}. Supported types are: ${SUPPORTED_FILE_TYPES.join(", ")}`);
                        return false;
                    } else {
                        return true;
                    }
                })
                .map(async file => {
                    const tokenCount = await grantAiService.calcFileTokenCount(recipe.modelType, file);
                    return ({ type: file.type, value: "", name: file.name, tokenCount: tokenCount, file: file })
                })
            addContexts(await Promise.all(contexts));

        }
        setShowUploadDialog(false);
    }

    return (
        <Card>
            <CardHeader title="Project Contexts"
                action={
                    <Toolbar disableGutters={true} sx={{ gap: 1 }} >
                        <Button
                            variant="outlined"
                            onClick={() => setShowUploadDialog(true)}
                            startIcon={<PlusOutlined />}
                            sx={{ alignSelf: 'flex-start' }}>
                            File
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => addContexts([{ type: "text", value: "", name: "", tokenCount: 0 }])}
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
                <FileUploadDialog
                    open={showUploadDialog}
                    onChange={(files) => { handleFileUpload(files) }}
                />
            </CardContent>
        </Card>
    );
};


