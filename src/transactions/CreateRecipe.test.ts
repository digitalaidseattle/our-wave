/**
 *  CreateRecipe.test.ts
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */

import { describe, expect, it, vi } from "vitest";
import { grantRecipeService } from "../services/grantRecipeService";
import { GrantRecipe } from "../types";
import { createRecipe } from "./CreateRecipe";
import { authService } from "../App";
import { User } from "@digitalaidseattle/core";

describe("createRecipe", () => {
    vi.mock('../api/geminiService', () => ({
        geminiService: ({
            calcTokenCount: () => { }
        }),
    }));

    it("createRecipe", () => {
        const user = {} as User;
        const recipe = {} as GrantRecipe;
        const inserted = {} as GrantRecipe;

        const userSpy = vi.spyOn(authService, "getUser").mockResolvedValue(user);
        const emptySpy = vi.spyOn(grantRecipeService, "empty").mockReturnValue(recipe);
        const insertSpy = vi.spyOn(grantRecipeService, "insert").mockResolvedValue(inserted);

        createRecipe().then(actual => {
            expect(userSpy).toHaveBeenCalledOnce();
            expect(emptySpy).toHaveBeenCalledOnce();
            expect(insertSpy).toHaveBeenCalledOnce();
            expect(recipe.description.startsWith('Recipe')).toBe(true);
            expect(actual).toBe(inserted)
        });
    });

});