
/**
 *  storageService.ts
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */

import { FirebaseStorageService } from "@digitalaidseattle/firebase";
import { getDownloadURL, getMetadata, listAll, ref, uploadBytes } from "firebase/storage";

export type StorageFile = File & {
    fullPath: string;
    updated?: string;
}

export type StorageFolder = "dev" | "qa" | "prod";

export function resolveConfiguredStorageFolder(storageFolder = import.meta.env.VITE_FIREBASE_STORAGE_FOLDER): StorageFolder {
    if (storageFolder === "dev" || storageFolder === "qa" || storageFolder === "prod") {
        return storageFolder;
    }

    throw new Error("VITE_FIREBASE_STORAGE_FOLDER must be set to dev, qa, or prod.");
}

export class OurWaveStorageService extends FirebaseStorageService {
    private readonly storageFolder: StorageFolder;

    constructor() {
        super();
        this.storageFolder = resolveConfiguredStorageFolder();
    }

    private resolvePath(filepath?: string): string {
        if (!filepath) {
            return this.storageFolder;
        }

        const normalizedPath = filepath.replace(/^\/+/, "");
        if (normalizedPath.startsWith(`${this.storageFolder}/`)) {
            return normalizedPath;
        }

        return `${this.storageFolder}/${normalizedPath}`;
    }

    async list(filepath?: string): Promise<any[]> {
        const folderRef = ref(this.storage, this.resolvePath(filepath));
        const result = await listAll(folderRef);
        const files = await Promise.all(result.items.map(async (item) => {
            const metadata = await getMetadata(item);
            return {
                name: item.name,
                fullPath: item.fullPath,
                type: metadata.contentType,
                size: metadata.size,
                updated: metadata.updated
            };
        }));
        return files;
    }

    async getDownloadURL(filepath: string): Promise<string> {
        const fileRef = ref(this.storage, this.resolvePath(filepath));
        return await getDownloadURL(fileRef);
    }

    async upload(path: string, file: File): Promise<any> {
        const storageRef = ref(this.storage, this.resolvePath(path));

        // Upload file
        const snapshot = await uploadBytes(storageRef, file, {
            contentType: file.type,
        });

        // Get public download URL
        const downloadUrl = await getDownloadURL(snapshot.ref);
        return downloadUrl;
    }

}
