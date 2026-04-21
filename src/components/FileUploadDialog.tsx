/**
 *  FileUploadDialog.tsx
 *
 *  @copyright 2026 Digital Aid Seattle
 *
 */
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, List, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import Dropzone from "react-dropzone";


interface FileUploadDialogProps {
    title?: string;
    open: boolean
    onChange: (files: File[] | null) => void
};

const FileUploadDialog = ({ title = "Select files", open, onChange }: FileUploadDialogProps) => {

    const [files, setFiles] = useState<File[]>([]);

    function handleConfirm(): void {
        onChange(files);
        setFiles([]);
    }

    function handleCancel(): void {
        onChange(null);
        setFiles([]);
    }

    function handleDeleteFile(idx: number): void {
        const newFiles = [...files];
        newFiles.splice(idx, 1);
        setFiles(newFiles);
    }

    useEffect(() => {
        if (!open) {
            setFiles([]);
        }
    }, [open]);

    return <Dialog
        fullWidth={true}
        open={open}
        onClose={handleCancel}
        sx={{ minHeight: '600px' }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 600 }}>{title}</DialogTitle>
        <DialogContent>
            <Dropzone onDrop={acceptedFiles => setFiles([...files, ...acceptedFiles])}>
                {({ getRootProps, getInputProps }) => (
                    <section>
                        <Box {...getRootProps()}
                            sx={{
                                border: (theme) => `2px dashed ${theme.palette.divider}`,
                                p: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}>
                            <input {...getInputProps()} />
                            <Typography>Drag 'n' drop some files here, or click to select files</Typography>
                        </Box>
                    </section>
                )}
            </Dropzone>
            <List
                sx={{
                    width: '100%',
                    bgcolor: 'background.paper',
                    position: 'relative',
                    overflow: 'auto',
                    maxHeight: 300,
                    '& ul': { padding: 0 },
                }}>
                {files.map((file, idx) =>
                    <Chip key={idx} label={file.name} onDelete={() => handleDeleteFile(idx)} />)}
            </List>
        </DialogContent>
        <DialogActions>
            <Button
                variant='outlined'
                onClick={handleCancel}>Cancel</Button>
            <Button
                variant='outlined'
                onClick={handleConfirm}>OK</Button>
        </DialogActions>
    </Dialog>
}

export { FileUploadDialog };
