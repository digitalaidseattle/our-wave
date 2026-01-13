<<<<<<< HEAD
=======
/**
 *  GoogleDriveFileSearchDialog.ts
 *
 *  @copyright 2026 Digital Aid Seattle
 *
 */
import { FileExcelOutlined, FileMarkdownOutlined, FolderOutlined } from "@ant-design/icons";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { useContext, useEffect, useState } from "react";

import { LoadingContext, useNotifications } from "@digitalaidseattle/core";
import { GoogleDriveService, GoogleFile } from "../services/googleDriveService";

const OUR_WAVE_FOLDER = "1VQodPsyhs3KBVCfnYpuIfOZoh7WLaVvn";

interface GoogleDriveFileSearchDialogProps {
    title?: string;
    open: boolean
    onChange: (file: GoogleFile | null) => void
};

const GoogleDriveFileSearchDialog = ({ title = "File Search", open, onChange }: GoogleDriveFileSearchDialogProps) => {
    const googleDriveService = GoogleDriveService.getInstance();
    const { setLoading } = useContext(LoadingContext);
    const notifications = useNotifications();

    const [folders, setFolders] = useState<GoogleFile[]>([]);
    const [files, setFiles] = useState<GoogleFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<GoogleFile>();

    useEffect(() => {
        if (open) {
            googleDriveService.getMetadata(OUR_WAVE_FOLDER)
                .then(resp => setFolders([resp]))
                .catch(err => console.error(err));
        }
    }, [open]);

    useEffect(() => {
        fetchData();
    }, [folders]);

    function fetchData() {
        const folderId = folders.length === 0 ? OUR_WAVE_FOLDER : folders[folders.length - 1].id;
        googleDriveService.listFolder(folderId)
            .then(files => setFiles(files))
    }

    async function handleConfirm(): Promise<void> {
        if (selectedFile) {
            switch (selectedFile.type) {
                case 'application/vnd.google-apps.document':
                    const fileContents = await downloadMarkdown(selectedFile);
                    onChange({ ...selectedFile, contents: fileContents });
                    break;
                case 'application/vnd.google-apps.folder':
                    if (folders.find(f => f.id === selectedFile.id)) {
                        // Must be parent folder selection
                        folders.pop();
                        setFolders([...folders]);
                    } else {
                        setFolders([...folders, selectedFile]);
                    }
                    break;
                default:
                    notifications.error('File type not handled.')
            }
        }
    }

    function handleSelection(gf: GoogleFile) {
        setSelectedFile(gf);
    }

    function downloadMarkdown(file: GoogleFile): Promise<string> {
        setLoading(true)
        return googleDriveService.downloadMarkdown(file.id)
            .then(resp => resp)
            .finally(() => setLoading(false))
    }

    return <Dialog
        fullWidth={true}
        open={open}
        onClose={() => onChange(null)}
        sx={{ minHeight: '600px' }}>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 600 }}>{title} : {folders.map(folder => folder.name).join(' > ')}</DialogTitle>
        <DialogContent>
            <List
                sx={{
                    width: '100%',
                    bgcolor: 'background.paper',
                    position: 'relative',
                    overflow: 'auto',
                    maxHeight: 300,
                    '& ul': { padding: 0 },
                }}>
                {folders.length > 1
                    && <ListItemButton
                        key={folders[folders.length - 2].id}
                        selected={selectedFile?.id === folders[folders.length - 2].id}
                        onClick={() => handleSelection(folders[folders.length - 2])}
                        onDoubleClick={() => { handleSelection(folders[folders.length - 2]); handleConfirm(); }}>
                        <ListItemIcon>
                            <FolderOutlined />
                        </ListItemIcon>
                        <ListItemText primary={"..."} />
                    </ListItemButton>}
                {files.map(gf =>
                    <ListItemButton
                        key={gf.id}
                        selected={selectedFile?.id === gf.id}
                        onClick={() => handleSelection(gf)}
                        onDoubleClick={() => { handleSelection(gf); handleConfirm(); }}>
                        <ListItemIcon>
                            {gf.type === 'application/vnd.google-apps.document' && <FileMarkdownOutlined />}
                            {gf.type === 'application/vnd.google-apps.folder' && <FolderOutlined />}
                            {gf.type === 'application/vnd.google-apps.spreadsheet' && <FileExcelOutlined />}
                        </ListItemIcon>
                        <ListItemText primary={gf.name} />
                    </ListItemButton>)
                }
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

export { GoogleDriveFileSearchDialog };
>>>>>>> 77917b0 (Project Context)
