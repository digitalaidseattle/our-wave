/**
 *  CreateRecipe.ts
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */

import { authService } from "../App";
import { grantRecipeService } from "../services/grantRecipeService";
import { GrantRecipe } from "../types";
// import { DateUtils } from "../utils/dateUtils";

export function createRecipe(): Promise<GrantRecipe> {
    return authService.getUser()
        .then((user => {
            const newRecipe = grantRecipeService.empty();
            newRecipe.description = "";
            // Initialize with default blank context and output fields
            newRecipe.contexts = [{ type: 'text', name: null, value: '', tokenCount: 0 }];
            newRecipe.outputsWithWordCount = [{ name: '', maxWords: 500, unit: 'words' }];
            return grantRecipeService.insert(newRecipe, undefined, undefined, user);
        }))
}