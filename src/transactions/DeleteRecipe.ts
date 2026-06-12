/**
 *  CreateRecipe.ts
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */

import { Identifier } from "@digitalaidseattle/core";
import { storageService } from "../App";
import { grantRecipeService } from "../services/grantRecipeService";
import { GrantRecipe } from "../types";

const GLOUD_FOLDER = import.meta.env.VITE_FIREBASE_STORAGE_FOLDER;

async function deleteContextsFiles(recipe: GrantRecipe): Promise<void> {
    // get existing files
    const cloudFiles = await storageService
        .list(`${GLOUD_FOLDER}/${recipe.id}`)
        .then((files: any[]) => files.map((file: any) => file.name));

    cloudFiles.forEach(async fileName => {
        await storageService.removeFile(`${GLOUD_FOLDER}/${recipe.id}/${fileName}`)
    })
}

export async function deleteRecipe(recipeId: Identifier): Promise<void> {
    const recipe = await grantRecipeService.getById(recipeId as string);
    if (recipe.id) {
        await deleteContextsFiles(recipe);
        return grantRecipeService.delete(recipe.id);
    } else {
        throw new Error('Cound not find recipe ' + recipeId)
    }
}

