/**
 *  GoogleDriveFileSearchDialog.ts
 *
 *  @copyright 2026 Digital Aid Seattle
 *
 */
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, List, Typography } from "@mui/material";
import { useState } from "react";

import Dropzone from "react-dropzone";


interface FileUploadDialogProps {
    title?: string;
    open: boolean
    onChange: (file: File[] | null) => void
};

const FileUploadDialog = ({ open, onChange }: FileUploadDialogProps) => {

    const [files, setFiles] = useState<File[]>([]);

    function handleConfirm(): void {
        onChange(files);
    }

    function handleDeleteFile(idx: number): void {
        const newFiles = [...files];
        newFiles.splice(idx, 1);
        setFiles(newFiles);
    }

    return <Dialog
        fullWidth={true}
        open={open}
        onClose={() => onChange(null)}
        sx={{ minHeight: '600px' }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 600 }}>'Upload Files'</DialogTitle>
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
                onClick={() => onChange(null)}>Cancel</Button>
            <Button
                variant='outlined'
                onClick={handleConfirm}>OK</Button>
        </DialogActions>
    </Dialog>
}

export { FileUploadDialog };
