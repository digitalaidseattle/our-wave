/**
 *  CreateRecipe.ts
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */

import { authService, storageService } from "../App";
import { FIREBASE_STORAGE_FOLDER } from "../constants/storage";
import { grantRecipeService } from "../services/grantRecipeService";
import { GrantContext, GrantRecipe } from "../types";


function isNewFile(context: GrantContext): boolean {
    if (context.type === 'text') {
        return false;
    }
    if (context.fileUrl) {  // previously uploaded
        return false;
    }
    if (context.file!.webkitRelativePath) {  // new file
        return true;
    }
    return false;
}

async function uploadFiles(contexts: GrantContext[]): Promise<GrantContext[]> {
    return Promise.all(contexts
        .map(async (context) => {
            if (isNewFile(context)) {
                const url = await storageService.upload(`${FIREBASE_STORAGE_FOLDER}/${context.file!.name}`, context.file!);
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
