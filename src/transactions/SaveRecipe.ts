/**
 *  CreateRecipe.ts
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */

import { authService, storageService } from "../App";
import { grantRecipeService } from "../services/grantRecipeService";
import { GrantContext, GrantRecipe } from "../types";
// import { DateUtils } from "../utils/dateUtils";

const GLOUD_FOLDER = import.meta.env.VITE_FIREBASE_STORAGE_FOLDER;

async function uploadFiles(contexts: GrantContext[]): Promise<GrantContext[]> {
    return Promise.all(contexts
        .map(async (context) => {
            if (context.type !== "text" && context.file) {
                const url = await storageService.upload(`${GLOUD_FOLDER}/${context.file.name}`, context.file);
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
            const prompt = grantRecipeService.generatePromptWithInputs(recipe);
            const contexts = await uploadFiles(recipe.contexts);

            const newRecipe = {
                ...recipe,
                contexts: contexts,
                prompt: prompt
            }

            if (recipe.id) {
                return grantRecipeService.update(recipe.id, newRecipe, user);
            } else {
                return grantRecipeService.insert(newRecipe, user);
            }
        }))
}

