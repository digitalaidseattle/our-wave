/**
 * GoogleDriveService.tsx
 * 
 * @copyright 2025 Digital Aid Seattle
*/


export type GoogleFile = {
    id: string;
    name: string;
    type: string;
}

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

class GoogleDriveService {
    static instance: GoogleDriveService;

    static getInstance() {
        if (!GoogleDriveService.instance) {
            GoogleDriveService.instance = new GoogleDriveService();
        }
        return GoogleDriveService.instance;
    }

    isReady = false;

    constructor() {
        this.init();
    }

    init() {
        if (window.google?.accounts?.oauth2) {
            gapi.load('client', async () => {
                await gapi.client.init({
                    discoveryDocs: [DISCOVERY_DOC],
                });
            });
            this.isReady = true;
        } else {
            setTimeout(this.init, 100);
        }
    }

    signIn(callback: (res: any) => void) {
        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (res: any) => callback(res.access_token)
        });
        client.requestAccessToken({ prompt: '' });
    }

    downloadBlob(blob: Blob, filename: string) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    async downloadMarkdown(fileId: string): Promise<string> {
        const res = await gapi.client.drive.files.export(
            {
                fileId,
                alt: 'media',
                mimeType: "text/markdown",
            },
            { responseType: "arraybuffer" } // 👈 important
        );
        return res.body;
    }

    async downloadFile(fileId: string) {
        const meta = await gapi.client.drive.files.get({
            fileId,
            fields: 'name, mimeType, size',
            supportsAllDrives: true,
        });
        console.log(meta)

        const res = await gapi.client.drive.files.export(
            {
                fileId,
                alt: 'media',
                mimeType: "application/pdf",
            },
            { responseType: "arraybuffer" } // 👈 important
        );

        // Convert to a real Blob
        const blob = new Blob(
            [res.body],
            { type: "application/pdf" }
        );
        const url = URL.createObjectURL(blob);
        window.open(url);
    }

    listFolder(folderId: string): Promise<GoogleFile[]> {
        const params = {
            q: `'${folderId}' in parents and trashed = false`,
            'pageSize': 20,
            'fields': 'files(id, name, mimeType)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        };
        return gapi.client.drive.files.list(params)
            .then((resp: any) => resp.result.files.map((f: any) => ({ id: f.id, name: f.name, type: f.mimeType })));
    }
}

export { GoogleDriveService };
