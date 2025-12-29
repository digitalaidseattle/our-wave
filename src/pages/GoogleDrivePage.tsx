import { FileExcelOutlined, FileMarkdownOutlined, FolderOutlined } from "@ant-design/icons";
import { LoadingContext, useNotifications } from "@digitalaidseattle/core";
import { Card, CardContent, CardHeader, Grid, List, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Stack, TextField } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import Markdown from "react-markdown";
import { GoogleDriveService, GoogleFile } from "../services/googleDriveService";

const OUR_WAVE_FOLDER = "1VQodPsyhs3KBVCfnYpuIfOZoh7WLaVvn";
export const GoogleDrivePage: React.FC = () => {
    const googleDriveService = GoogleDriveService.getInstance();
    const { setLoading } = useContext(LoadingContext);
    const notifications = useNotifications();

    const [files, setFiles] = useState<GoogleFile[]>([]);
    const [folder, setFolder] = useState<string>(OUR_WAVE_FOLDER);
    const [token, setToken] = useState<string>();
    const [selectedFile, setSelectedFile] = useState<GoogleFile>();
    const [fileContents, setFileContents] = useState<string>();

    useEffect(() => {
        googleDriveService.signIn((token) => setToken(token));
    }, []);

    useEffect(() => {
        fetchData();
    }, [token, folder]);

    function fetchData() {
        if (token) {
            googleDriveService.listFolder(folder)
                .then(files => setFiles(files))
        }
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
    return <Card>
        <CardHeader title="Google Drive"
            subheader="Just an example page" />
        <CardContent>
            <Stack gap={1}>
                <TextField label="Google Folder" fullWidth value={folder} onChange={evt => setFolder(evt.target.value)} />
                <Grid container spacing={2}>
                    <Grid size={3}>
                        <List
                            subheader={
                                <ListSubheader component="h3" id="nested-list-subheader">
                                    Project Context Files
                                </ListSubheader>
                            } >
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
                    </Grid>
                    <Grid size={9}>
                        {selectedFile && <Card>
                            <CardHeader title={selectedFile?.name} />
                            <CardContent>
                                <Markdown>{fileContents}</Markdown>
                            </CardContent>
                        </Card>}
                    </Grid>
                </Grid>
            </Stack>
        </CardContent>
    </Card>
}