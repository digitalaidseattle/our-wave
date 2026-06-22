/**
 *  CreateRecipe.ts
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */

import { authService, storageService } from "../App";
import { DUPLICATE_RECIPE_NAME_ERROR, grantRecipeService } from "../services/grantRecipeService";
import { GrantContext, GrantRecipe } from "../types";

const GLOUD_FOLDER = import.meta.env.VITE_FIREBASE_STORAGE_FOLDER;


function isNewFile(context: GrantContext): boolean {
    if (context.type === 'text') {
        return false;
    }
    if (context.fileUrl) {  // previously uploaded
        return false;
    }
    if (context.file && context.file.webkitRelativePath) {  // new file
        return true;
    }
    return false;
}

async function uploadFiles(contexts: GrantContext[]): Promise<GrantContext[]> {
    return Promise.all(contexts
        .map(async (context) => {
            if (isNewFile(context)) {
                const url = await storageService.upload(`${GLOUD_FOLDER}/${context.file!.name}`, context.file!);
                const newContext = { ...context, fileUrl: url };
                delete newContext.file;
                return newContext;
            }
            return { ...context };
        }));
}


export async function saveRecipe(recipe: GrantRecipe): Promise<GrantRecipe> {
    return authService.getUser()
        .then((async user => {
            const description = recipe.description.trim();
            const hasDuplicateDescription = await grantRecipeService.descriptionExists(description, recipe.id);
            if (hasDuplicateDescription) {
                throw new Error(DUPLICATE_RECIPE_NAME_ERROR);
            }

            const prompt = await grantRecipeService.generatePromptWithInputs(recipe);
            const contexts = await uploadFiles(recipe.contexts);

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
