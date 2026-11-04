/**
 *  GrantContextEditor.ts
 *
 *  @copyright 2025 Digital Aid Seattle
 *
 */
import { DeleteOutlined, FileOutlined, FontSizeOutlined, InfoCircleOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons';
import { Box, Button, Card, CardContent, CardHeader, CircularProgress, FormControl, IconButton, InputAdornment, Stack, TextField, Toolbar, Typography } from "@mui/material";
import React, { useContext, useEffect, useRef, useState } from 'react';

import { useHelp, useNotifications } from '@digitalaidseattle/core';
import { FileUploadDialog } from '../../components/FileUploadDialog';
import { GrantRecipeContext } from '../../components/GrantRecipeContext';
import { HelpTopicContext } from '../../components/HelpTopicContext';
import { RECIPE_STRINGS } from '../../constants/grantRecipe';
import { GrantFileService } from '../../services/grantFileService';
import { grantRecipeService } from '../../services/grantRecipeService';
import { validationService } from '../../services/validation/ValidationService';
import { GrantContext, GrantRecipe } from '../../types';
import { getContextTokenLabel } from './contextTokenUtils';


const LABEL_UPLOAD_TITLE = "Select files";
const LABEL_UPLOAD_SUBTITLE = "Supported types are: .txt, .pdf, .html, .json, .md";

interface ContextFieldProps {
    context: GrantContext;
    errorMsg?: string;
    onChange?: (value: string) => void;
    onBlur?: () => void;
}

const UrlContextField = ({ context, errorMsg, onChange, onBlur }: ContextFieldProps) => {
    const value = context.value;

    function handleTextChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
        onChange?.(e.target.value);
    }
    return (
        <TextField
            fullWidth={true}
            defaultValue={value ?? ""}
            placeholder='Enter URL link here'
            onChange={handleTextChange}
            onBlur={onBlur}
            minRows={1}
            maxRows={3}
            error={!!errorMsg}
            helperText={errorMsg}
            slotProps={{
                input: {
                    startAdornment: (
                        <InputAdornment position="start">
                            <LinkOutlined aria-label="URL" title="URL" />
                        </InputAdornment>
                    )
                }
            }}
        />
    );
};

const TextContextField = ({ context, errorMsg, onChange, onBlur }: ContextFieldProps) => {
    const value = context.value;

    function handleTextChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
        onChange?.(e.target.value);
    }

    return (<TextField
        fullWidth={true}
        defaultValue={value ?? ""}
        placeholder='Enter context information here'
        onChange={handleTextChange}
        onBlur={onBlur}
        multiline
        minRows={1}
        maxRows={3}
        error={!!errorMsg}
        helperText={errorMsg}
        slotProps={{
            input: {
                startAdornment: (
                    <InputAdornment position="start">
                        <FontSizeOutlined aria-label="Text" title="Text" />
                    </InputAdornment>
                )
            }
        }}
    />)
};

const FileContextField = ({ context, errorMsg }: ContextFieldProps) => (
    <>
        <FormControl fullWidth={true} error={!!errorMsg}
            sx={{
                border: '1px solid',
                borderColor: errorMsg ? 'error.main' : 'grey',
                padding: 2,
                borderRadius: 1,
                pr: 1,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 1
            }}>
            <FileOutlined aria-label="File" title="File" />
            <Typography>File: {context.name}</Typography>
            {/* {isDone && (
                <Tooltip title="Upload complete">
                    <Box component={CheckCircleOutlined} sx={{ color: 'success.main', ml: 1, fontSize: 18 }} />
                </Tooltip>
            )} */}
        </FormControl>
        {/* <FormHelperText error sx={{ ml: 0 }}>
            {isDuplicate ? DUPLICATE_PROJECT_CONTEXT_ERROR : " "}
        </FormHelperText> */}
    </>
);

interface ContextRowProps {
    index: number;
    context: GrantContext;
    onChange: (index: number, param: GrantContext) => void
    onDelete: (index: number) => void
    onBlur: (context: GrantContext) => void;
    isDuplicate?: boolean;
}

const ContextRow = ({ index, context, onChange, onDelete, onBlur }: ContextRowProps) => {
    const grantFileService = new GrantFileService();

    const { recipe } = useContext(GrantRecipeContext);
    const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);

    function handleValueChange(value: string): void {
        const revised = { ...context, value };
        delete revised.tokenCount;
        // Show error message in the field, but still allow the value to be updated.
        const result = validationService.validateContextValue(revised, recipe.contexts);
        setErrorMsg(result.valid ? undefined : result.errors.value);
        onChange(index, revised);
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
            <Box sx={{ flex: 1 }}>
                {context.type === 'text' && (
                    <TextContextField context={context} errorMsg={errorMsg} onChange={handleValueChange} onBlur={() => onBlur(context)} />
                )}
                {context.type === 'url' && (
                    <UrlContextField context={context} errorMsg={errorMsg} onChange={handleValueChange} onBlur={() => onBlur(context)} />
                )}
                {(grantFileService.isFileContext(context)) && (
                    <FileContextField context={context} errorMsg={errorMsg} />
                )}
            </Box>
            <Typography variant="body2" sx={{ alignSelf: 'center', minWidth: 80 }}>
                {getContextTokenLabel(context)}
            </Typography>
        </Stack >
    )
}

type GrantContextEditorProps = {
    onChange: (recipe: GrantRecipe) => void;
    onUploadingChange?: (isUploading: boolean) => void;
    duplicateContextIndexes?: Set<number>;
};

export const GrantContextEditor: React.FC<GrantContextEditorProps> = ({ onChange, onUploadingChange, duplicateContextIndexes = new Set<number>() }) => {
    const grantFileService = new GrantFileService();
    const notifications = useNotifications();

    const { setHelpTopic } = useContext(HelpTopicContext);
    const { setShowHelp } = useHelp();
    const { recipe } = useContext(GrantRecipeContext);
    const contexts = recipe.contexts ?? [];
    const latestRecipe = useRef(recipe);
    latestRecipe.current = recipe;
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);
    const [rowVersion, setRowVersion] = useState(0);
    const [uploadingFileNames, setUploadingFileNames] = useState<Set<string>>(new Set());

    const [showUploadDialog, setShowUploadDialog] = useState<boolean>(false);

    async function addContexts(newContexts: GrantContext[]) {
        const revised = [...(contexts ?? []), ...newContexts]
        onChange({ ...recipe, contexts: revised });
    }

    function updateContext(index: number, revised: GrantContext) {
        const revisedContexts = contexts.slice();
        revisedContexts[index] = revised;
        onChange({ ...recipe, contexts: revisedContexts });
    }

    // Count on blur rather than issuing an AI request for every keystroke.
    async function countContextTokens(context: GrantContext) {
        const result = await grantRecipeService.countContextTokens(recipe, context);
        const modelType = recipe.modelType;
        const tokenCount = result.tokenCount;
        const countError = result.countError;

        const current = latestRecipe.current;
        const index = current.contexts.indexOf(context);
        // Ignore results for contexts that were edited, removed, or loaded from another recipe.
        if (!mounted.current || index < 0 || current.modelType !== modelType) return;
        const revisedContexts = current.contexts.slice();
        const revised = { ...context };
        // Firestore rejects literal `undefined` field values, so omit unavailable counts.
        delete revised.tokenCount;
        if (tokenCount !== null) revised.tokenCount = tokenCount;
        revisedContexts[index] = revised;
        onChange({ ...current, contexts: revisedContexts });
        if (countError) {
            notifications.error(`Could not calculate context token count: ${countError instanceof Error ? countError.message : String(countError)}`);
        }

    }

    function removeContext(index: number) {
        // Index keys must be reset when deletion shifts the remaining uncontrolled fields.
        setRowVersion(version => version + 1);
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
            if (!fileType || !grantFileService.isSupportFileType(fileType)) {
                notifications.error(`Unsupported file type: ${file.name}. Supported types are: ${GrantFileService.SUPPORTED_FILE_TYPES.join(", ")}`);
                return false;
            }
            return true;
        });

        const fileErrors = validationService.validateFiles(supportedFiles, contexts).errors;

        if (Object.keys(fileErrors).length > 0) {
            Object.entries(fileErrors).forEach(([fileName, error]) => {
                notifications.error(`Error with file ${fileName}: ${error}`);
            });
            return;
        }

        if (supportedFiles.length === 0) return;

        // Show spinner rows immediately via local state — no parent state change needed yet
        const uploadingNames = new Set(supportedFiles.map(f => f.name));
        setUploadingFileNames(uploadingNames);
        onUploadingChange?.(true);

        const newContexts = await grantFileService.createContext(recipe, supportedFiles);

        // Add completed contexts, clear spinners, show done checkmarks for 2s
        onChange({ ...recipe, contexts: [...(contexts ?? []), ...newContexts] });
        setUploadingFileNames(new Set());
        onUploadingChange?.(false);
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
                            key={`${rowVersion}-${idx}`}
                            index={idx}
                            context={context}
                            onChange={updateContext}
                            onBlur={countContextTokens}
                            onDelete={removeContext}
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
