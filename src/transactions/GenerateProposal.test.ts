import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GrantRecipe } from "../types";

// Mock AI service
vi.mock("../pages/grants/grantAiService", () => ({
  grantAiService: {
    parameterizedQuery: vi.fn(),
  },
}));

// Mock Firebase
vi.mock("@digitalaidseattle/firebase", () => ({
  firebaseClient: { app: {} },
  FirestoreService: class { },
}));

import { GrantAiService } from "../pages/grants/grantAiService";
import { generateProposal } from "./GenerateProposal";

describe("GenerateProposal", () => {
  const grantAiService = GrantAiService.getInstance();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds structuredResponse from AI output", async () => {
    const recipe: GrantRecipe = {
      id: "recipe-123",
      createdAt: new Date(),
      createdBy: "tester@example.com",
      updatedAt: new Date(),
      updatedBy: "tester@example.com",
      lastSubmitted: null,
      description: "Test recipe",
      tags: [],
      rating: 0,
      template: "Test {{#each outputs}}{{name}} {{/each}}",
      prompt: "compiled prompt",
      contexts: [],
      outputsWithWordCount: [
        { name: "Summary", maxWords: 3, unit: "words" },
        { name: "Notes", maxWords: 10, unit: "characters" },
      ],
      inputParameters: [],
      tokenCount: 0,
      proposalIds: [],
      modelType: "gemini-2.5-flash",
    };

    (grantAiService.parameterizedQuery as any).mockResolvedValue({
      Summary: "This should be trimmed",
      Notes: "abcdefghijklmnop",
    });

    const proposal = await generateProposal(recipe);

    expect(grantAiService.parameterizedQuery).toHaveBeenCalledTimes(1);
    expect(proposal.grantRecipeId).toBe("recipe-123");

    // AI output is preserved as-is
    expect(proposal.structuredResponse?.Summary).toBe("This should be trimmed");
    expect(proposal.structuredResponse?.Notes).toBe("abcdefghijklmnop");
  });

  it("throws if recipe has no id", async () => {
    await expect(
      generateProposal({
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
      lastSubmitted: null,
      description: "",
      tags: [],
      rating: 0,
      template: "",
      prompt: "",
      contexts: [],
      outputsWithWordCount: [],
      tokenCount: 0,
      inputParameters: [],
      proposalIds: [],
      modelType: "gemini-2.5-flash",
    };

    await expect(
      generateProposal(badRecipe)
    ).rejects.toThrow("Recipe is missing output fields");
  });
});
