
/**
 *  storageService.ts
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */

import { StorageService } from "@digitalaidseattle/core";
import { firebaseClient } from "@digitalaidseattle/firebase";
import { getStorage, ref, getBytes, getDownloadURL, uploadBytes, listAll, getMetadata } from "firebase/storage";

export type StorageFile = File & {
    fullPath: string;
    updated?: string;
}

export class FirebaseStorageService implements StorageService {

    storage = getStorage(firebaseClient);
    decoder = new TextDecoder("utf-8");

    downloadFile = async (filepath: string): Promise<string> => {
        const fileRef = ref(this.storage, filepath);
        return getBytes(fileRef)
            .then(b => this.decoder.decode(b))
    }

    async getUrlAsync(filepath: string): Promise<string> {
        try {
            const storageRef = ref(this.storage, filepath);
            return await getDownloadURL(storageRef);
        } catch (error) {
            console.error("Error getting download URL:", error);
            throw error;
        }
    }

    async list(filepath?: string): Promise<any[]> {
        if (!filepath) {
            return [];
        }
        const folderRef = ref(this.storage, filepath);
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

    getUrl(_filepath: string): string {
        throw new Error("Method not implemented.");
    }

    async getDownloadURL(filepath: string): Promise<string> {
        const fileRef = ref(this.storage, filepath);
        return await getDownloadURL(fileRef);
    }

    async upload(path: string, file: File): Promise<any> {
        const storageRef = ref(this.storage, path);

        // Upload file
        const snapshot = await uploadBytes(storageRef, file, {
            contentType: file.type,
        });

        // Get public download URL
        const downloadUrl = await getDownloadURL(snapshot.ref);
        return downloadUrl;
    }

    downloadBlob(_filepath: string): Promise<Blob | null> {
        throw new Error("Method not implemented.");
    }

    removeFile(_fileName: string): Promise<any> {
        throw new Error("Method not implemented.");
    }
}
