/**
 *  CreateRecipe.ts
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */

import { authService } from "../App";
import { grantRecipeService } from "../services/grantRecipeService";
import { GrantRecipe } from "../types";
import { DateUtils } from "../utils/dateUtils";

export function createRecipe(): Promise<GrantRecipe> {
    return authService.getUser()
        .then((user => {
            const newRecipe = grantRecipeService.empty();
            newRecipe.description = "";
            return grantRecipeService.insert(newRecipe, undefined, undefined, user);
        }))
}