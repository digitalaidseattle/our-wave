/**
 *  GoogleDriveFileSearchDialog.ts
 *
 *  @copyright 2026 Digital Aid Seattle
 *
 */
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, List, ListItem, ListItemButton, ListItemText, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import Dropzone from "react-dropzone";
import { storageService } from "../App";
import { StorageFile } from "../services/OurWaveStorageService";
const DEFAULT_FOLDER = import.meta.env.VITE_FIREBASE_STORAGE_FOLDER;



interface FileUploadDialogProps {
    title?: string;
    open: boolean
    folderPath?: string;
    onChange: (files: (File | StorageFile)[] | null) => void
};

const FileUploadDialog = ({ title = "Select or upload files", open, folderPath = DEFAULT_FOLDER, onChange }: FileUploadDialogProps) => {

    const [files, setFiles] = useState<(File | StorageFile)[]>([]);
    const [folderFiles, setFolderFiles] = useState<StorageFile[]>([]);

    function handleConfirm(): void {
        onChange(files);
    }

    function handleDeleteFile(idx: number): void {
        const newFiles = [...files];
        newFiles.splice(idx, 1);
        setFiles(newFiles);
    }

    useEffect(() => {
        if (!open || !folderPath) {
            return;
        }

        storageService.list(folderPath)
            .then(found => setFolderFiles(found as StorageFile[]))
            .catch(err => {
                console.error(err);
                setFolderFiles([]);
            });
    }, [open, folderPath]);

    function handleFileList(file: StorageFile): void {
        setFiles(prev => [...prev, file]);
    }

    return <Dialog
        fullWidth={true}
        open={open}
        onClose={() => onChange(null)}
        sx={{ minHeight: '600px' }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 600 }}>{title}</DialogTitle>
        <DialogContent>
            {folderPath && <Box
                sx={{
                    flex: 1,
                    overflowY: "auto",
                    mb: 2
                }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Select files in server folder: {folderPath}
                </Typography>
                <List
                    sx={{
                        width: '100%',
                        bgcolor: 'background.paper',
                        maxHeight: 200,
                        overflow: 'auto',
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                        p: 0
                    }}>
                    {folderFiles.length === 0 && <ListItem><ListItemText primary="No files found." /></ListItem>}
                    {folderFiles.map(sFile =>
                        <ListItemButton
                            key={sFile.fullPath}
                            sx={{ px: 2, py: 1 }}
                            onClick={() => handleFileList(sFile)}
                        >
                            <ListItemText primary={sFile.name} />
                        </ListItemButton>)}
                </List>
            </Box>}
            {folderPath && <Divider sx={{ mb: 2 }} />}
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
