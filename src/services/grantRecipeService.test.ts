import { beforeEach, describe, expect, it, vi } from "vitest";
import { GrantAiService } from "../pages/grants/grantAiService";
import { GrantRecipe } from "../types";
import { grantRecipeService } from "./grantRecipeService";

describe("grantRecipeService", () => {
  const grantAiService = {
    calcTokenCount: vi.fn(),
  } as unknown as GrantAiService;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  /*
  Please follow these output constraints strictly:
  - Executive Summary: maximum 200 words
  - Mission Statement: maximum 400 words
  
  Adjust wording as needed to stay within these limits.
  */
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
    expect(result).toContain("Executive Summary: maximum 200 words");
    expect(result).toContain("Mission Statement: maximum 400 words");
  })

  it("updatePrompt", () => {
    const recipe = {
      modelType: 'GEMINI',
      template: "Create a grant proposal including the following information:",
      inputParameters: [],
      outputsWithWordCount: []
    } as unknown as GrantRecipe;

    const singletonSpy = vi.spyOn(GrantAiService, "getInstance").mockReturnValue(grantAiService);
    const tokenSpy = vi.spyOn(grantAiService, "calcTokenCount").mockResolvedValue(5)

    grantRecipeService.updatePrompt(recipe)
      .then(updated => {
        expect(singletonSpy).toHaveBeenCalled();
        expect(tokenSpy).toBeCalledWith("GEMINI", expect.stringContaining("Create a grant proposal including the following information:"));
        expect(updated.tokenCount).toBe(5)
      })
  })

});