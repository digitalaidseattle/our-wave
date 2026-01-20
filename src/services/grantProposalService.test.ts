import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GrantRecipe } from "../types";

// Mock Firebase
vi.mock("@digitalaidseattle/firebase", () => ({
  firebaseClient: { app: {} },
  FirestoreService: class { },
}));

import { grantProposalService } from "./grantProposalService";
import { GrantAiService } from "../pages/grants/grantAiService";

describe("grantProposalService.generate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("builds structuredResponse from AI output", async () => {
    const recipe: GrantRecipe = {
      id: "recipe-123",
      createdAt: new Date(),
      createdBy: "tester@example.com",
      updatedAt: new Date(),
      updatedBy: "tester@example.com",
      description: "Test recipe",
      tags: [],
      rating: 0,
      template: "Test {{#each outputs}}{{name}} {{/each}}",
      prompt: "compiled prompt",
      inputParameters: [],
      outputsWithWordCount: [
        { name: "Summary", maxWords: 3, unit: "words" },
        { name: "Notes", maxWords: 10, unit: "characters" },
      ],
      tokenCount: 0,
      proposalIds: [],
      modelType: "gemini-2.5-flash",
    };

    const querySpy = vi.spyOn(GrantAiService, "getInstance").mockReturnValue(
      ({
        parameterizedQuery: vi.fn().mockResolvedValue({
          Summary: "This should be trimmed",
          Notes: "abcdefghijklmnop",
        }),
      } as any)
    );

    const proposal = await grantProposalService.generate(recipe);

    expect(querySpy).toHaveBeenCalledTimes(1);
    expect(proposal.grantRecipeId).toBe("recipe-123");

    // AI output is preserved as-is
    expect(proposal.structuredResponse?.Summary).toBe("This should be trimmed");
    expect(proposal.structuredResponse?.Notes).toBe("abcdefghijklmnop");
  });

  it("throws if recipe has no id", async () => {
    await expect(
      grantProposalService.generate({
        outputsWithWordCount: [{ name: "Test", maxWords: 3, unit: "words" }],
      } as any)
    ).rejects.toThrow("Recipe ID is required");
  });

  it("throws if outputsWithWordCount is empty", async () => {
    const badRecipe: GrantRecipe = {
      id: "no-outputs",
      createdAt: new Date(),
      createdBy: "",
      updatedAt: new Date(),
      updatedBy: "",
      description: "",
      tags: [],
      rating: 0,
      template: "",
      prompt: "",
      inputParameters: [],
      outputsWithWordCount: [],
      tokenCount: 0,
      proposalIds: [],
      modelType: "gemini-2.5-flash",
    };

    await expect(
      grantProposalService.generate(badRecipe)
    ).rejects.toThrow("Recipe is missing output fields");
  });
});
