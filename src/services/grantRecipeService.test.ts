import { describe, it } from "vitest";
import { GrantRecipe } from "../types";
import { grantRecipeService } from "./grantRecipeService";

describe("grantRecipeService", () => {
 
  it("generatePromptWithInputs", () => {

    const recipe = {
      prompt: "Create a grant proposal including the following information:\n {{#each inputs}}{{key}} = {{value}},\n{{/each}}"
        + " where{{#each outputs}}{{#unless @first}} and{{/unless}} the output {{name}} is constrained by a maximum {{maxWords}} of {{unit}} {{/each}}.",
      inputParameters: [
        { key: "organizationName", value: "Our Wave" },
        { key: "projectDescription", value: "Community garden for local residents" },
        { key: "requestedAmount", value: "$5000" }
      ],
      outputsWithWordCount: [
        { name: "Executive Summary", maxWords: 200, unit: "words" },
        { name: "Mission Statement", maxWords: 400, unit: "words" },
      ]
    } as unknown as GrantRecipe;

    const result = grantRecipeService.generatePromptWithInputs(recipe)
    console.log(result);
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