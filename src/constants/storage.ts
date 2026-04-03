export const STORAGE_FOLDERS = {
    dev: "dev",
    qa: "qa",
    prod: "prod",
} as const;

export type StorageFolder = typeof STORAGE_FOLDERS[keyof typeof STORAGE_FOLDERS];

export function resolveStorageFolder(
    storageFolder?: string,
    mode?: string,
): StorageFolder {
    const resolvedStorageFolder = storageFolder ?? import.meta.env.VITE_FIREBASE_STORAGE_FOLDER;
    const resolvedMode = mode ?? import.meta.env.MODE;

    if (resolvedStorageFolder === STORAGE_FOLDERS.dev || resolvedStorageFolder === STORAGE_FOLDERS.qa || resolvedStorageFolder === STORAGE_FOLDERS.prod) {
        return resolvedStorageFolder;
    }

    if (resolvedMode === "production") {
        return STORAGE_FOLDERS.prod;
    }

    if (resolvedMode === "qa") {
        return STORAGE_FOLDERS.qa;
    }

    return STORAGE_FOLDERS.dev;
}

export const FIREBASE_STORAGE_FOLDER = resolveStorageFolder();
