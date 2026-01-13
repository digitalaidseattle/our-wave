/**
 *  CreateRecipe.test.ts
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */

import { describe, expect, it, vi } from "vitest";
import { User } from "@digitalaidseattle/core";
import { authService } from "../App";
import { grantRecipeService } from "../services/grantRecipeService";
import { GrantRecipe } from "../types";
import { cloneRecipe } from "./CloneRecipe";

describe("cloneRecipe", () => {

    vi.mock('../api/geminiService', () => ({
        geminiService: ({
            calcTokenCount: () => { }
        }),
    }));

    it("cloneRecipe", () => {
        const user = { email: 'email@me.com' } as User;
        const recipe = { description: 'desc' } as GrantRecipe;
        const inserted = {} as GrantRecipe;

        const userSpy = vi.spyOn(authService, "getUser").mockResolvedValue(user);
        const insertSpy = vi.spyOn(grantRecipeService, "insert").mockResolvedValue(inserted);

        cloneRecipe(recipe).then(actual => {
            expect(userSpy).toHaveBeenCalledOnce();
            expect(insertSpy).toHaveBeenCalledOnce();
            expect(insertSpy).toHaveBeenCalledWith(expect.
                objectContaining({ description: 'Clone of desc', createdBy: 'email@me.com', updatedBy: 'email@me.com' }));
            expect(actual).toBe(inserted);
        });
    });

});