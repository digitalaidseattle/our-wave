/**
 *  GrantContextEditor.ts
 *
 *  @copyright 2025 Digital Aid Seattle
 *
 */
import { DeleteOutlined, FileSearchOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, CardContent, CardHeader, IconButton, InputAdornment, MenuItem, OutlinedInput, Select, Stack, TextField, Toolbar } from "@mui/material";
import React, { useContext } from "react";
import { GrantContext } from '../../types';
import { GoogleDriveFileSearchDialog } from '../../components/GoogleDriveFileSearchDialog';
import { HelpTopicContext } from '../../components/HelpTopicContext';
import { useHelp } from '@digitalaidseattle/core';

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
            <Select
                value={context.type ?? 'text'}
                onChange={(e) => onChange(index, { ...context, type: (e.target.value === "text") ? "text" : "file" })}>
                <MenuItem value={'text'}>Text</MenuItem>
                <MenuItem value={'file'}>File</MenuItem>
            </Select>
            {(context.type === 'text') &&
                <TextField
                    disabled={disabled}
                    fullWidth={true}
                    value={context.value}
                    onChange={(e) => onChange(index, { ...context, value: e.target.value })}
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
                        value={context.value}
                        startAdornment={
                            <InputAdornment position="start" sx={{ mr: -0.5 }}>
                                <IconButton onClick={() => handleFileSearch()}>
                                    <FileSearchOutlined />
                                </IconButton>
                            </InputAdornment>
                        }
                        onChange={(e) => onChange(index, { ...context, value: e.target.value })}
                    />
                    <GoogleDriveFileSearchDialog open={fileSearchModalOpen} onChange={() => setFileSearchModalOpen(false)} />
                </>
            }
        </Stack >
    )
}


// Dummy KeyValueForm component for demonstration; replace with your actual implementation or import
type GrantContextEditorProps = {
    disabled: boolean;
    contexts: GrantContext[];
    onChange: (newContexts: GrantContext[]) => void;
};
export const GrantContextEditor: React.FC<GrantContextEditorProps> = ({ disabled, contexts, onChange }) => {
    const { setHelpTopic } = useContext(HelpTopicContext);
    const { setShowHelp } = useHelp();

    return (
        <Card>
            <CardHeader title="Project Contexts"
                action={
                    <Toolbar disableGutters={true} sx={{ gap: 1 }} >
                        <Button
                            disabled={disabled}
                            variant="outlined"
                            onClick={() => {
                                const newContexts = (contexts ?? []).slice();
                                newContexts.push({ type: "text", value: "" });
                                onChange(newContexts);
                            }}
                            startIcon={<PlusOutlined />}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            File
                        </Button>
                        <Button
                            disabled={disabled}
                            variant="outlined"
                            onClick={() => {
                                const newContexts = (contexts ?? []).slice();
                                newContexts.push({ type: "text", value: "" });
                                onChange(newContexts);
                            }}
                            startIcon={<PlusOutlined />}
                            sx={{ alignSelf: 'flex-start' }}
                        >
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
                            onChange={(index: number, context: GrantContext) => {
                                contexts[index] = context;
                                onChange(contexts.slice());
                            }}
                            onDelete={(index: number) => {
                                onChange(contexts.filter((_, i) => i !== index));
                            }} />
                    ))}
                </Stack>
            </CardContent>
        </Card>
    );
};

