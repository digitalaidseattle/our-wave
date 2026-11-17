/**
 *  CreateRecipe.ts
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */

import { grantRecipeService } from "../services/grantRecipeService";
import { GrantRecipe } from "../types";

export function createRecipe(): Promise<GrantRecipe> {
    return Promise.resolve(grantRecipeService.empty());
}
