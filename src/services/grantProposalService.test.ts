import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GrantRecipe } from "../types";

// Mock the AI service
vi.mock("../pages/grants/grantAiService", () => {
  return {
    grantAiService: {
      parameterizedQuery: vi.fn(),
    },
  };
});

// Mock firebase client to avoid crashes
vi.mock("@digitalaidseattle/firebase", () => {
  return {
    firebaseClient: {
      app: {},
    },
    FirestoreService: class {},
  };
});

import { grantAiService } from "../pages/grants/grantAiService";
import { grantProposalService } from "./grantProposalService";

describe("grantProposalService.generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds a proposal with structuredResponse and applies limits", async () => {
    const recipe: GrantRecipe = {
      id: "recipe-123",
      createdAt: new Date(),
      createdBy: "tester@example.com",
      updatedAt: new Date(),
      updatedBy: "tester@example.com",
      description: "Test recipe",
      prompt: "Test prompt for {{#each outputs}}{{name}} {{/each}}",
      inputParameters: [],
      outputsWithWordCount: [
        { name: "Summary", maxWords: 3, unit: "words" },
        { name: "Notes", maxWords: 10, unit: "characters" },
      ],
      tokenString: "",
      tokenCount: 0,
      proposalIds: [],
      modelType: "gemini-2.5-flash",
    };

    // Mock AI response
    (grantAiService.parameterizedQuery as any).mockResolvedValue({
      Summary: "This should be trimmed",
      Notes: "abcdefghijklmnop",
    });

    const proposal = await grantProposalService.generate(recipe);

    expect(grantAiService.parameterizedQuery).toHaveBeenCalledTimes(1);

    // Validate schema keys passed to AI
    const [schemaParams] = (grantAiService.parameterizedQuery as any).mock.calls[0];
    expect(schemaParams).toEqual(["Summary", "Notes"]);

    // Validate trimmed results
    expect(proposal.structuredResponse?.Summary).toBe("This should be");
    expect(proposal.structuredResponse?.Notes).toBe("abcdefghij");

    // Validate recipe linkage
    expect(proposal.grantRecipeId).toBe("recipe-123");

    // Should store raw JSON text
    expect(proposal.textResponse).toContain("trimmed");
  });

  it("throws if recipe has no id", async () => {
    const badRecipe: any = {
      id: undefined,
      outputsWithWordCount: [{ name: "Test", maxWords: 3, unit: "words" }],
    };

    await expect(
      grantProposalService.generate(badRecipe)
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
      prompt: "",
      inputParameters: [],
      outputsWithWordCount: [],
      tokenString: "",
      tokenCount: 0,
      proposalIds: [],
      modelType: "gemini-2.5-flash",
    };

    await expect(
      grantProposalService.generate(badRecipe)
    ).rejects.toThrow("Recipe is missing output fields");
  });
});
