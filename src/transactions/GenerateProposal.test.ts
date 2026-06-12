import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GrantRecipe } from "../types";

// Mock App to avoid pulling in the full React app tree
vi.mock("../App", () => ({
  authService: {
    getUser: vi.fn().mockResolvedValue({ email: "test@example.com" }),
  },
}));

// Mock AI service
const mockParameterizedQuery = vi.fn();
vi.mock("../pages/grants/grantAiService", () => ({
  GrantAiService: {
    getInstance: vi.fn(() => ({ parameterizedQuery: mockParameterizedQuery })),
  },
}));

// Mock Firebase
vi.mock("@digitalaidseattle/firebase", () => ({
  firebaseClient: { app: {} },
  FirestoreService: class { },
}));

// Mock proposal service
const { mockProposalNameExists, mockInsert } = vi.hoisted(() => ({
  mockProposalNameExists: vi.fn(),
  mockInsert: vi.fn(),
}));
vi.mock("../services/grantProposalService", () => ({
  GrantProposalService: {
    getInstance: vi.fn(() => ({
      empty: vi.fn(() => ({
        id: undefined,
        createdAt: new Date(),
        createdBy: "",
        updatedAt: new Date(),
        updatedBy: "",
        grantRecipeId: "",
        name: "",
        rating: null,
        structuredResponse: undefined,
        totalTokenCount: null,
        model: "",
      })),
      proposalNameExists: mockProposalNameExists,
      insert: mockInsert,
    })),
  },
}));

// Mock recipe service
vi.mock("../services/grantRecipeService", () => ({
  grantRecipeService: {
    update: vi.fn().mockImplementation(async (id, recipe) => ({ ...recipe, id })),
  },
}));

import { generateProposal } from "./GenerateProposal";

describe("GenerateProposal", () => {
  const baseRecipe: GrantRecipe = {
    id: "recipe-123",
    createdAt: new Date(),
    createdBy: "tester@example.com",
    updatedAt: new Date(),
    updatedBy: "tester@example.com",
    lastSubmitted: null,
    description: "testing naming",
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
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 22, 14, 27, 9)); // June 22 2026, 2:27:09 PM
    vi.clearAllMocks();
    mockParameterizedQuery.mockResolvedValue({
      text: JSON.stringify({ Summary: "This should be trimmed", Notes: "abcdefghijklmnop" }),
      usageMetadata: null,
    });
    mockProposalNameExists.mockResolvedValue(false);
    mockInsert.mockImplementation(async (proposal: any) => ({ ...proposal, id: "new-proposal-id" }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds structuredResponse from AI output", async () => {
    const proposal = await generateProposal(baseRecipe);

    expect(mockParameterizedQuery).toHaveBeenCalledTimes(1);
    expect(proposal.grantRecipeId).toBe("recipe-123");
    expect(proposal.structuredResponse?.Summary).toBe("This should be trimmed");
    expect(proposal.structuredResponse?.Notes).toBe("abcdefghijklmnop");
  });

  it("names proposal using recipe description and current date-time", async () => {
    mockProposalNameExists.mockResolvedValue(false);

    await generateProposal(baseRecipe);

    const insertedProposal = mockInsert.mock.calls[0][0];
    expect(insertedProposal.name).toBe("testing naming 6/22 2:27:09 PM");
  });

  it("increments time by 1 second when a proposal with that name already exists", async () => {
    // "testing naming 6/22 2:27:09 PM" is taken, "testing naming 6/22 2:27:10 PM" is free
    mockProposalNameExists
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    await generateProposal(baseRecipe);

    const insertedProposal = mockInsert.mock.calls[0][0];
    expect(insertedProposal.name).toBe("testing naming 6/22 2:27:10 PM");
  });

  it("keeps incrementing until a free name is found", async () => {
    // First two names taken, third is free
    mockProposalNameExists
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    await generateProposal(baseRecipe);

    const insertedProposal = mockInsert.mock.calls[0][0];
    expect(insertedProposal.name).toBe("testing naming 6/22 2:27:11 PM");
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
      ...baseRecipe,
      outputsWithWordCount: [],
    };
    await expect(generateProposal(badRecipe)).rejects.toThrow("Recipe is missing output fields");
  });
});

