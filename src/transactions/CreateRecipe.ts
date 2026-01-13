/**
 *  CreateRecipe.ts
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */

import dayjs from "dayjs";
import { grantRecipeService } from "../services/grantRecipeService";
import { GrantRecipe } from "../types";
import { authService } from "../App";

export function createRecipe(): Promise<GrantRecipe> {
    return authService.getUser()
        .then((user => {
            const newRecipe = grantRecipeService.empty();
            newRecipe.description = `Recipe created ${dayjs().format('MM/DD/YYYY hh:mm a')}`;
            return grantRecipeService.insert(newRecipe, undefined, undefined, user);
        }))
}