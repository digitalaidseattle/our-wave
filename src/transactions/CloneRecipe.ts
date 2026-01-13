/**
 *  CreateRecipe.ts
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */

import { grantRecipeService } from "../services/grantRecipeService";
import { GrantRecipe } from "../types";
import { authService } from "../App";

export async function cloneRecipe(recipe: GrantRecipe): Promise<GrantRecipe> {
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