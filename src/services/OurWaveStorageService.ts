
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

export class OurWaveStorageService extends FirebaseStorageService {

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

}
