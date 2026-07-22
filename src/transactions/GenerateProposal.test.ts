import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GrantProposal, GrantRecipe } from "../types";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  parameterizedQuery: vi.fn(),
  recipeInsert: vi.fn(),
  recipeUpdate: vi.fn(),
  proposalInsert: vi.fn(),
}));

vi.mock("../App", () => ({
  authService: { getUser: mocks.getUser },
}));

vi.mock("../pages/grants/grantAiService", () => ({
  GrantAiService: class {
    static getInstance() {
      return { parameterizedQuery: mocks.parameterizedQuery };
    }
  },
}));

vi.mock("../services/grantRecipeService", () => ({
  grantRecipeService: {
    insert: mocks.recipeInsert,
    update: mocks.recipeUpdate,
  },
}));

vi.mock("../services/grantProposalService", () => ({
  grantProposalService: {
    empty: () => ({}),
    insert: mocks.proposalInsert,
  },
}));

import { generateProposal } from "./GenerateProposal";

const namedRecipe = (): GrantRecipe => ({
  id: "recipe-123",
  createdAt: new Date(),
  createdBy: "tester@example.com",
  updatedAt: new Date(),
  updatedBy: "tester@example.com",
  lastSubmitted: null,
  description: "Test recipe",
  tags: [],
  rating: 0,
  template: "Test template",
  prompt: "compiled prompt",
  contexts: [],
  outputsWithWordCount: [
    { name: "Summary", maxWords: 3, unit: "words" },
    { name: "Notes", maxWords: 10, unit: "characters" },
  ],
  inputParameters: [],
  tokenCount: 0,
  modelType: "gemini-2.5-flash",
});

describe("generateProposal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds a proposal from the AI response", async () => {
    const recipe = namedRecipe();
    const savedRecipe = { ...recipe, lastSubmitted: new Date() };
    const insertedProposal = { id: "proposal-1" } as GrantProposal;
    mocks.getUser.mockResolvedValue({ email: "tester@example.com" });
    mocks.recipeUpdate.mockResolvedValue(savedRecipe);
    mocks.parameterizedQuery.mockResolvedValue({
      text: JSON.stringify({ Summary: "Summary text", Notes: "Notes text" }),
      usageMetadata: { totalTokenCount: 42 },
    });
    mocks.proposalInsert.mockResolvedValue(insertedProposal);

    await expect(generateProposal(recipe)).resolves.toBe(insertedProposal);

    expect(mocks.parameterizedQuery).toHaveBeenCalledOnce();
    expect(mocks.proposalInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        grantRecipeId: "recipe-123",
        structuredResponse: { Summary: "Summary text", Notes: "Notes text" },
        totalTokenCount: 42,
      }),
      undefined,
      undefined,
      { email: "tester@example.com" }
    );
  });

  it("rejects a blank recipe name before saving or calling AI", async () => {
    await expect(generateProposal({ ...namedRecipe(), description: " " })).rejects.toThrow(
      "Recipe name is required to generate a proposal."
    );

    expect(mocks.recipeUpdate).not.toHaveBeenCalled();
    expect(mocks.parameterizedQuery).not.toHaveBeenCalled();
  });

  it("rejects a recipe without output fields", async () => {
    await expect(generateProposal({ ...namedRecipe(), outputsWithWordCount: [] })).rejects.toThrow(
      "Recipe is missing output fields"
    );
  });
});
