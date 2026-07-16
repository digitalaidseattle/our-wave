import { describe, expect, it, vi } from "vitest";
import type { GrantRecipe } from "../types";

vi.mock("../App", () => ({
  authService: { getUser: vi.fn() },
}));

vi.mock("./settingsService", () => ({
  SettingsService: {
    getInstance: () => ({
      getSettings: vi.fn().mockResolvedValue({
        outputTemplate: "",
        lowerBoundPercentage: 0.5,
      }),
    }),
  },
}));

import { grantRecipeService } from "./grantRecipeService";

describe("grantRecipeService", () => {
  it("generates a prompt with output word-count bounds", async () => {
    const recipe = {
      template: "Write {{#each outputs}}{{name}} {{lowerBound}}-{{upperBound}}{{/each}}",
      outputsWithWordCount: [
        { name: "Summary", maxWords: 200, unit: "words" },
      ],
    } as GrantRecipe;

    await expect(grantRecipeService.generatePromptWithInputs(recipe)).resolves.toBe(
      "Write Summary 100-200"
    );
  });

  it("updates the local compiled prompt without persisting", async () => {
    const recipe = {
      description: "Named recipe",
      template: "Write {{#each outputs}}{{name}}{{/each}}",
      outputsWithWordCount: [
        { name: "Summary", maxWords: 200, unit: "words" },
      ],
      prompt: "old prompt",
      tokenCount: 5,
    } as GrantRecipe;

    await expect(grantRecipeService.updatePrompt(recipe)).resolves.toEqual(
      expect.objectContaining({ prompt: "Write Summary", tokenCount: 5 })
    );
  });

  it("rejects unnamed recipes before inserting them", async () => {
    await expect(
      grantRecipeService.insert({ description: " " } as GrantRecipe)
    ).rejects.toThrow("Recipe name is required to save.");
  });
});
