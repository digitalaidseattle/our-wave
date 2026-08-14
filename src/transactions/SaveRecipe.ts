/**
 *  CreateRecipe.ts
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */

import { authService, storageService } from "../App";
import { DUPLICATE_RECIPE_NAME_ERROR, grantRecipeService } from "../services/grantRecipeService";
import { GrantContext, GrantRecipe } from "../types";
import { requireRecipeName } from "../utils/recipeValidation";

const GLOUD_FOLDER = import.meta.env.VITE_FIREBASE_STORAGE_FOLDER;

async function organizeContextsFiles(recipe: GrantRecipe): Promise<GrantContext[]> {
    // get existing files
    const cloudFiles = await storageService
        .list(`${GLOUD_FOLDER}/${recipe.id}`)
        .then((files: any[]) => files.map((file: any) => file.name));

    const updatedContexts: GrantContext[] = [];
    recipe.contexts.forEach(async context => {
        if (context.type === 'text') {
            updatedContexts.push(context);
        } else if (context.file! instanceof File) {
            // Existing files will be overwritten
            const url = await storageService.upload(`${GLOUD_FOLDER}/${recipe.id}/${context.file!.name}`, context.file!);
            const newContext = { ...context, fileUrl: url };
            delete newContext.file;
            updatedContexts.push(newContext);
        } else {
            const index = cloudFiles.indexOf(context.name);
            if (index > -1) {  // remove from cloudFiles list
                cloudFiles.splice(index, 1);
                updatedContexts.push(context);
            } else {
                console.error('not in the cloud & no file to upload', context);
            }
        }
    });

    // remove unwanted files
    cloudFiles.forEach(async fileName => {
        await storageService.removeFile(`${GLOUD_FOLDER}/${recipe.id}/${fileName}`)
    })
    return updatedContexts;
}

export async function saveRecipe(recipe: GrantRecipe): Promise<GrantRecipe> {
    requireRecipeName(recipe, "save");

    return authService.getUser()
        .then((async user => {
            const description = recipe.description.trim();
            const hasDuplicateDescription = await grantRecipeService.descriptionExists(description, recipe.id);
            if (hasDuplicateDescription) {
                throw new Error(DUPLICATE_RECIPE_NAME_ERROR);
            }

            const prompt = await grantRecipeService.generatePromptWithInputs(recipe);
            const contexts = await organizeContextsFiles(recipe);

            const newRecipe = {
                ...recipe,
                description,
                contexts: contexts,
                prompt: prompt
            }

            if (recipe.id) {
                return grantRecipeService.update(recipe.id, newRecipe, undefined, undefined, user);
            } else {
                return grantRecipeService.insert(newRecipe, undefined, undefined, user);
            }
        }))
}
