/**
 * FirebaseStorageService
 *
 * Implementation of StorageService interface using Firebase Storage
 *
 * @copyright 2024 Digital Aid Seattle
 */

import { StorageService } from "@digitalaidseattle/core";
import { firebaseClient } from "@digitalaidseattle/firebase";
import {
  getStorage,
  ref,
  listAll,
  getDownloadURL,
  uploadBytes,
  getBytes,
  deleteObject,
  type StorageReference,
  type ListResult
} from "firebase/storage";

export class FirebaseStorageService implements StorageService {
  private storage = getStorage(firebaseClient);
  private urlCache: Map<string, string> = new Map();

  /**
   * List all files in a directory path
   * @param filepath - Storage path (e.g., "recipes/")
   * @returns Promise resolving to array of file names
   */
  async list(filepath?: string): Promise<any[]> {
    try {
      const path = filepath || "";
      const storageRef = ref(this.storage, path);
      const listResult: ListResult = await listAll(storageRef);
      return listResult.items.map((item: StorageReference) => item.name);
    } catch (error) {
      console.error("Error listing files:", error);
      throw error;
    }
  }

  /**
   * Get download URL for a file
   * @param filepath - Storage path to the file
   * @returns Download URL string (synchronous, uses cached URL if available)
   */
  getUrl(filepath: string): string {
    // Return cached URL if available, otherwise return placeholder
    // Note: This is a limitation - Firebase Storage requires async for getDownloadURL
    // The URL should be pre-fetched using getUrlAsync() before calling this
    const cached = this.urlCache.get(filepath);
    if (cached) {
      return cached;
    }
    // Return placeholder URL - actual URL should be fetched asynchronously
    return `https://firebasestorage.googleapis.com/v0/b/${this.storage.app.options.storageBucket}/o/${encodeURIComponent(filepath)}?alt=media`;
  }

  /**
   * Get download URL for a file (async version)
   * @param filepath - Storage path to the file
   * @returns Promise resolving to download URL string
   */
  async getUrlAsync(filepath: string): Promise<string> {
    try {
      const storageRef = ref(this.storage, filepath);
      const url = await getDownloadURL(storageRef);
      this.urlCache.set(filepath, url);
      return url;
    } catch (error) {
      console.error("Error getting download URL:", error);
      throw error;
    }
  }

  /**
   * Upload a file to Firebase Storage
   * @param path - Storage path where file should be uploaded
   * @param blob - File or Blob object to upload
   * @returns Promise that resolves when upload is complete
   */
  async upload(path: string, blob: any): Promise<any> {
    try {
      const storageRef = ref(this.storage, path);
      const result = await uploadBytes(storageRef, blob);
      return result;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }

  /**
   * Download a file as a Blob
   * @param filepath - Storage path to the file
   * @returns Promise resolving to Blob or null if error
   */
  async downloadBlob(filepath: string): Promise<Blob | null> {
    try {
      const storageRef = ref(this.storage, filepath);
      const bytes = await getBytes(storageRef);
      return new Blob([bytes]);
    } catch (error) {
      console.error("Error downloading blob:", error);
      return null;
    }
  }

  /**
   * Remove/delete a file from Firebase Storage
   * @param fileName - Storage path to the file to delete
   * @returns Promise that resolves when file is deleted
   */
  async removeFile(fileName: string): Promise<any> {
    try {
      const storageRef = ref(this.storage, fileName);
      const result = await deleteObject(storageRef);
      // Clear cached URL if it exists
      this.urlCache.delete(fileName);
      return result;
    } catch (error) {
      console.error("Error removing file:", error);
      throw error;
    }
  }

  /**
   * Download a file as a string (for text files)
   * @param filePath - Storage path to the file
   * @returns Promise resolving to file content as string
   */
  async downloadFile(filePath: string): Promise<string> {
    try {
      const blob = await this.downloadBlob(filePath);
      if (!blob) {
        throw new Error("Failed to download file blob");
      }
      return await blob.text();
    } catch (error) {
      console.error("Error downloading file:", error);
      throw error;
    }
  }
}

