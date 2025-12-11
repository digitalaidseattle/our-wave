import { describe, expect, it, vi } from "vitest";
import { GrantRecipe } from "../types";
import { grantRecipeService } from "./grantRecipeService";
import { geminiService } from "../api/geminiService";

describe("grantRecipeService", () => {

  vi.mock('../api/geminiService', () => ({
    geminiService: ({
      calcTokenCount: () => { }
    }),
  }));

  it("generatePromptWithInputs", () => {

    const recipe = {
      modelType: 'GEMINI',
      prompt: "Create a grant proposal including the following information:",
      inputParameters: []
    } as unknown as GrantRecipe;

    const tokenSpy = vi.spyOn(geminiService, "calcTokenCount").mockResolvedValue(5);

    grantRecipeService.updatePrompt(recipe)
      .then(updated => {
        expect(tokenSpy).toBeCalledWith("GEMINI", "Create a grant proposal including the following information:[]");
        expect(updated.tokenCount).toBe(5)
      })
  })

  it("updatePrompt", () => {

    const recipe = {
      modelType: 'GEMINI',
      prompt: "Create a grant proposal including the following information:",
      inputParameters: []
    } as unknown as GrantRecipe;

    const tokenSpy = vi.spyOn(geminiService, "calcTokenCount").mockResolvedValue(5);

    grantRecipeService.updatePrompt(recipe)
      .then(updated => {
        expect(tokenSpy).toBeCalledWith("GEMINI", "Create a grant proposal including the following information:[]");
        expect(updated.tokenCount).toBe(5)
      })
  })

});