/**
 *  GrantContextEditor.ts
 *
 *  @copyright 2025 Digital Aid Seattle
 *
 */
import { DeleteOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, CardContent, CardHeader, FormControl, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from 'react';

import { useHelp, useNotifications } from '@digitalaidseattle/core';
import { geminiService } from '../../api/geminiService';
import { FileUploadDialog } from '../../components/FileUploadDialog';
import { GrantRecipeContext } from '../../components/GrantRecipeContext';
import { HelpTopicContext } from '../../components/HelpTopicContext';
import { StableCursorTextField } from '../../components/StableCursorTextfield';
import { GrantContext, GrantRecipe } from '../../types';
import { GrantAiService } from './grantAiService';
import { RECIPE_STRINGS } from '../../constants/grantRecipe';

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
                <StableCursorTextField
                    fullWidth={true}
                    value={context.value}
                    placeholder='Enter context information here'
                    onChange={handleTextChange}
                    multiline={true}
                    minRows={1}
                    maxRows={3}
                />}
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
        const revised = contexts.filter((_, i) => i !== index);
        onChange({ ...recipe, contexts: revised });
    }

    async function handleFileSelection(files: File[] | null) {
        setShowUploadDialog(false);

        if (!files) {
            return;
        }

        const supportedFiles = files.filter(file => {
            const fileType = file.type;
            if (!fileType || !SUPPORTED_FILE_TYPES.includes(fileType)) {
                notifications.error(`Unsupported file type: ${file.name}. Supported types are: ${SUPPORTED_FILE_TYPES.join(", ")}`);
                return false;
            }
            return true;
        });

        const newContexts = await Promise.all(supportedFiles.map(async file => {
            let tokenCount = 0;
            try {
                tokenCount = await grantAiService.calcFileTokenCount(recipe.modelType, file);
            } catch (err) {
                console.error("Error calculating token count for file", err);
                notifications.error(`Could not calculate token count for ${file.name}. The file was added with 0 tokens.`);
            }

            return ({ type: file.type, value: "", name: file.name, tokenCount: tokenCount, file: file });
        }));

        if (newContexts.length > 0) {
            addContexts(newContexts);
        }
    }

    return (
        <Card>
            <CardHeader title={RECIPE_STRINGS.projectContextsTitle}
                subheader={RECIPE_STRINGS.projectContextsSubtext}
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
                    onChange={(files) => { handleFileSelection(files) }}
                />
            </CardContent>
        </Card>
    );
};
