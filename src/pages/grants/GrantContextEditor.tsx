/**
 *  GrantContextEditor.ts
 *
 *  @copyright 2025 Digital Aid Seattle
 *
 */
import { CheckCircleOutlined, DeleteOutlined, InfoCircleOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons';
import { Box, Button, Card, CardContent, CardHeader, CircularProgress, FormControl, FormHelperText, IconButton, InputAdornment, Stack, Toolbar, Tooltip, Typography } from "@mui/material";
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
import { DUPLICATE_PROJECT_CONTEXT_ERROR } from '../../utils/recipeValidation';
import { urlContextService } from '../../services/urlContextService';
import { getContextTokenLabel } from './contextTokenUtils';

const SUPPORTED_FILE_TYPES = [
    "text/plain",
    "application/pdf",
    "text/html",
    "application/json",
    "text/markdown"
];

const LABEL_UPLOAD_TITLE = "Select files";
const LABEL_UPLOAD_SUBTITLE = "Supported types are: .txt, .pdf, .html, .json, .md";

interface ContextRowProps {
    index: number;
    context: GrantContext;
    onChange: (index: number, param: GrantContext) => void
    onDelete: (index: number) => void
    onEdit?: () => void;
    isDone?: boolean;
    isDuplicate?: boolean;
}
const ContextRow = ({ index, context, onChange, onDelete, onEdit, isDone, isDuplicate }: ContextRowProps) => {

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
            {(context.type === 'text' || context.type === 'url') && (() => {
                const isUrlContext = context.type === 'url';
                const isUrlInvalid = isUrlContext && !!context.value && !urlContextService.isValidUrl(context.value);
                return (
                    <Box sx={{ flex: 1 }}>
                        <StableCursorTextField
                            fullWidth={true}
                            value={context.value}
                            placeholder={isUrlContext ? 'Enter URL link here' : 'Enter context information here'}
                            onChange={handleTextChange}
                            onEdit={onEdit}
                            multiline={!isUrlContext}
                            minRows={1}
                            maxRows={3}
                            error={isUrlInvalid}
                            helperText={isUrlInvalid ? 'Please enter a valid http or https URL.' : ''}
                            InputProps={isUrlContext ? {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LinkOutlined aria-label="URL" title="URL" />
                                    </InputAdornment>
                                )
                            } : undefined}
                        />
                    </Box>
                );
            })()}
            {(SUPPORTED_FILE_TYPES.includes(context.type)) &&
                <Box sx={{ flex: 1 }}>
                    <FormControl fullWidth={true} error={isDuplicate} sx={{ border: '1px solid', borderColor: isDuplicate ? 'error.main' : isDone ? 'success.main' : 'grey', padding: 2, borderRadius: 1, pr: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                        <Typography>File: {context.name}</Typography>
                        {isDone && (
                            <Tooltip title="Upload complete">
                                <Box component={CheckCircleOutlined} sx={{ color: 'success.main', ml: 1, fontSize: 18 }} />
                            </Tooltip>
                        )}
                    </FormControl>
                    <FormHelperText error sx={{ ml: 0 }}>
                        {isDuplicate ? DUPLICATE_PROJECT_CONTEXT_ERROR : " "}
                    </FormHelperText>
                </Box>
            }
            <Typography variant="body2" sx={{ alignSelf: 'center', minWidth: 80 }}>
                {getContextTokenLabel(context)}
            </Typography>
        </Stack >
    )
}

type GrantContextEditorProps = {
    onChange: (recipe: GrantRecipe) => void;
    onEdit?: () => void;
    onUploadingChange?: (isUploading: boolean) => void;
    duplicateContextIndexes?: Set<number>;
};

export const GrantContextEditor: React.FC<GrantContextEditorProps> = ({ onChange, onEdit, onUploadingChange, duplicateContextIndexes = new Set<number>() }) => {
    const grantAiService = GrantAiService.getInstance();
    const notifications = useNotifications();

    const { setHelpTopic } = useContext(HelpTopicContext);
    const { setShowHelp } = useHelp();
    const { recipe } = useContext(GrantRecipeContext);
    const [contexts, setContexts] = React.useState<GrantContext[]>([]);
    const [uploadingFileNames, setUploadingFileNames] = useState<Set<string>>(new Set());
    const [doneFileNames, setDoneFileNames] = useState<Set<string>>(new Set());

    const [showUploadDialog, setShowUploadDialog] = useState<boolean>(false);
    useEffect(() => {
        setContexts(recipe ? recipe.contexts : []);
    }, [recipe]);

    async function addContexts(newContexts: GrantContext[]) {
        const revised = [...(contexts ?? []), ...newContexts]
        onChange({ ...recipe, contexts: revised });
    }

    async function udpateContext(index: number, revised: GrantContext) {
        const revisedContexts = contexts.slice();
        revisedContexts[index] = revised;
        onChange({ ...recipe, contexts: revisedContexts });

        if (revised.type === 'url') {
            if (revised.value && urlContextService.isValidUrl(revised.value)) {
                try {
                    const pageText = await urlContextService.fetchPageText(revised.value);
                    const tokenCount = await geminiService.calcTokenCount(recipe.modelType, pageText);
                    revisedContexts[index] = { ...revised, tokenCount };
                } catch (err) {
                    // Firestore rejects literal `undefined` field values, so omit tokenCount entirely
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { tokenCount: _tokenCount, ...withoutTokenCount } = revised;
                    revisedContexts[index] = withoutTokenCount;
                    notifications.error(`Could not fetch URL for token count preview: ${err instanceof Error ? err.message : String(err)}`);
                }
            } else {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { tokenCount: _tokenCount, ...withoutTokenCount } = revised;
                revisedContexts[index] = withoutTokenCount;
            }
            onChange({ ...recipe, contexts: revisedContexts });
            return;
        }

        const tokenCount = await geminiService.calcTokenCount(recipe.modelType, revised.value || '');
        revisedContexts[index] = { ...revised, tokenCount };
        onChange({ ...recipe, contexts: revisedContexts });
    }

    function removeContext(index: number) {
        const removed = contexts[index];
        const revised = contexts.filter((_, i) => i !== index);
        onChange({ ...recipe, contexts: revised });
        if (removed?.name) {
            setDoneFileNames(prev => {
                const next = new Set(prev);
                next.delete(removed.name as string);
                return next;
            });
        }
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

        if (supportedFiles.length === 0) return;

        // Show spinner rows immediately via local state — no parent state change needed yet
        const uploadingNames = new Set(supportedFiles.map(f => f.name));
        setUploadingFileNames(uploadingNames);
        onUploadingChange?.(true);

        // Calculate token counts; null means unavailable (e.g. browser CORS restriction on Gemini Files API)
        // Text-readable files are read directly and counted via calcTokenCount (works in browser).
        // Binary files (e.g. PDF) must use calcFileTokenCount which requires server-side API — returns null in browser.
        const TEXT_READABLE_TYPES = ["text/plain", "text/html", "application/json", "text/markdown"];
        const newContexts = await Promise.all(supportedFiles.map(async file => {
            let tokenCount: number | null = null;
            if (TEXT_READABLE_TYPES.includes(file.type)) {
                try {
                    const text = await file.text();
                    tokenCount = await geminiService.calcTokenCount(recipe.modelType, text);
                } catch (err) {
                    console.error("Error calculating token count for text file", err);
                    tokenCount = null;
                }
            } else {
                tokenCount = await grantAiService.calcFileTokenCount(recipe.modelType, file);
            }
            const newContext: GrantContext = {
                type: file.type,
                value: "",
                name: file.name,
                file: file
            };
            // Firestore rejects literal `undefined` field values, so only set tokenCount when known
            if (tokenCount !== null) {
                newContext.tokenCount = tokenCount;
            }
            return newContext;
        }));

        // Add completed contexts, clear spinners, show done checkmarks for 2s
        onChange({ ...recipe, contexts: [...(contexts ?? []), ...newContexts] });
        setUploadingFileNames(new Set());
        onUploadingChange?.(false);
        const completedNames = new Set(newContexts.map(c => c.name as string));
        setDoneFileNames(prev => new Set([...prev, ...completedNames]));
    }

    return (
        <Card>
            <CardHeader title={RECIPE_STRINGS.projectContextsTitle}
                subheader={RECIPE_STRINGS.projectContextsSubtext}
                action={
                    <Toolbar disableGutters={true} sx={{ gap: 1 }} >
                        <Button
                            variant="outlined"
                            onClick={() => addContexts([{ type: "url", value: "", name: null }])}
                            startIcon={<PlusOutlined />}
                            sx={{ alignSelf: 'flex-start' }}>
                            URL
                        </Button>
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
                            onDelete={removeContext}
                            onEdit={onEdit}
                            isDone={!!context.name && doneFileNames.has(context.name)}
                            isDuplicate={duplicateContextIndexes.has(idx)} />
                    ))}
                    {Array.from(uploadingFileNames).map(name => (
                        <Stack
                            direction="row"
                            key={`uploading-${name}`}
                            gap={1}
                            sx={{ position: 'relative', width: '100%' }}
                        >
                            <Button color="error" disabled><DeleteOutlined /></Button>
                            <FormControl fullWidth sx={{ border: '1px solid', borderBlockColor: 'grey', padding: 2, borderRadius: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                                <Typography>File: {name}</Typography>
                                <CircularProgress size={20} sx={{ ml: 1 }} />
                            </FormControl>
                            <Typography variant="body2" sx={{ alignSelf: 'center', minWidth: 80 }}>
                                Processing...
                            </Typography>
                        </Stack>
                    ))}
                </Stack>
                <FileUploadDialog
                    title={LABEL_UPLOAD_TITLE}
                    subtitle={LABEL_UPLOAD_SUBTITLE}
                    open={showUploadDialog}
                    onChange={(files) => { handleFileSelection(files) }}
                />
            </CardContent>
        </Card>
    );
};
