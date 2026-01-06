/**
 *  GoogleDriveFileSearchDialog.ts
 *
 *  @copyright 2026 Digital Aid Seattle
 *
 */
import { useContext, useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from "@mui/material";
import { FileExcelOutlined, FileMarkdownOutlined, FolderOutlined } from "@ant-design/icons";

import { GoogleDriveService, GoogleFile } from "../services/googleDriveService";
import { LoadingContext, useNotifications } from "@digitalaidseattle/core";

const OUR_WAVE_FOLDER = "1VQodPsyhs3KBVCfnYpuIfOZoh7WLaVvn";

interface GoogleDriveFileSearchDialogProps {
    open: boolean
    onChange: (file: any | null) => void
};

const GoogleDriveFileSearchDialog = ({ open, onChange }: GoogleDriveFileSearchDialogProps) => {
    const googleDriveService = GoogleDriveService.getInstance();
    const { setLoading } = useContext(LoadingContext);
    const notifications = useNotifications();

    const [token, setToken] = useState<string>();
    const [files, setFiles] = useState<GoogleFile[]>([]);
    const [folder, setFolder] = useState<string>(OUR_WAVE_FOLDER);
    const [selectedFile, setSelectedFile] = useState<GoogleFile>();
    const [fileContents, setFileContents] = useState<string>();

    useEffect(() => {
        googleDriveService.signIn((token) => setToken(token));
    }, []);

    useEffect(() => {
        fetchData();
    }, [token, folder]);

    function fetchData() {
        googleDriveService.listFolder(folder)
            .then(files => setFiles(files))
    }

    function handleConfirm(event: any): void {
        console.log(event)
        throw new Error("Function not implemented.");
    }


    function handleSelection(gf: GoogleFile) {
        switch (gf.type) {
            case 'application/vnd.google-apps.document':
                setSelectedFile(gf);
                downloadMarkdown(gf);
                break;
            case 'application/vnd.google-apps.folder':
                setFolder(gf.id);
                break;
            default:
                setSelectedFile(gf);
                notifications.error('File type not handled.')
        }
    }

    function downloadMarkdown(file: GoogleFile) {
        if (selectedFile) {
            setLoading(true)
            setFileContents(undefined);
            googleDriveService.downloadMarkdown(file.id)
                .then(resp => setFileContents(resp))
                .finally(() => setLoading(false))
        } else {
            setFileContents(undefined);
        }
    }

    return <Dialog
        fullWidth={true}
        open={open}
        onClose={() => onChange(null)}>
        <DialogTitle>File Selection</DialogTitle>
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
                {files.map(gf =>
                    <ListItemButton key={gf.id}
                        onClick={() => handleSelection(gf)}>
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

export { GoogleDriveFileSearchDialog }