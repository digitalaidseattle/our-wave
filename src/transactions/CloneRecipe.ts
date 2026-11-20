/**
 *  CreateRecipe.ts
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */

import { getCoreServices } from "@digitalaidseattle/core";
import { grantRecipeService } from "../services/grantRecipeService";
import { GrantRecipe } from "../types";
import { requireRecipeName } from "../utils/recipeValidation";

export async function cloneRecipe(recipe: GrantRecipe): Promise<GrantRecipe> {
    const authService = getCoreServices().authService!;

    requireRecipeName(recipe, "clone");

    return authService.getUser()
        .then(user => {
            const now = new Date();
            const name = user?.email;
            const clone = {
                ...recipe,
                id: null,
                createdAt: now,
                createdBy: name,
                updatedAt: now,
                updatedBy: name,
                description: `Clone of ${recipe.description}`,
            } as GrantRecipe;
            return grantRecipeService.insert(clone);
        });
}
