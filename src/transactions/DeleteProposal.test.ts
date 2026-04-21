import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GrantProposal, GrantRecipe } from "../types";

const mocks = vi.hoisted(() => ({
  deleteMock: vi.fn(),
  getByIdMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock("../services/grantProposalService", () => ({
  grantProposalService: {
    delete: mocks.deleteMock,
  },
}));

vi.mock("../services/grantRecipeService", () => ({
  grantRecipeService: {
    getById: mocks.getByIdMock,
    update: mocks.updateMock,
  },
}));

import { deleteProposal } from "./DeleteProposal";

describe("deleteProposal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the proposal and removes its id from the parent recipe", async () => {
    const recipe: GrantRecipe = {
      id: "recipe-123",
      createdAt: new Date(),
      createdBy: "tester@example.com",
      updatedAt: new Date(),
      updatedBy: "tester@example.com",
      lastSubmitted: null,
      description: "Recipe",
      tags: [],
      rating: 0,
      template: "",
      prompt: "",
      contexts: [],
      outputsWithWordCount: [],
      inputParameters: [],
      tokenCount: 0,
      proposalIds: ["proposal-1", "proposal-2"],
      modelType: "gemini-2.5-flash",
    };

    mocks.deleteMock.mockResolvedValue(undefined);
    mocks.updateMock.mockResolvedValue({ ...recipe, proposalIds: ["proposal-2"] });

    await deleteProposal(
      {
        id: "proposal-1",
        grantRecipeId: "recipe-123",
      } as GrantProposal,
      recipe
    );

    expect(mocks.deleteMock).toHaveBeenCalledWith("proposal-1");
    expect(mocks.getByIdMock).not.toHaveBeenCalled();
    expect(mocks.updateMock).toHaveBeenCalledWith("recipe-123", {
      ...recipe,
      proposalIds: ["proposal-2"],
    });
  });

  it("fetches the recipe when one is not provided", async () => {
    const recipe: GrantRecipe = {
      id: "recipe-123",
      createdAt: new Date(),
      createdBy: "tester@example.com",
      updatedAt: new Date(),
      updatedBy: "tester@example.com",
      lastSubmitted: null,
      description: "Recipe",
      tags: [],
      rating: 0,
      template: "",
      prompt: "",
      contexts: [],
      outputsWithWordCount: [],
      inputParameters: [],
      tokenCount: 0,
      proposalIds: ["proposal-1"],
      modelType: "gemini-2.5-flash",
    };

    mocks.deleteMock.mockResolvedValue(undefined);
    mocks.getByIdMock.mockResolvedValue(recipe);
    mocks.updateMock.mockResolvedValue({ ...recipe, proposalIds: [] });

    await deleteProposal({
      id: "proposal-1",
      grantRecipeId: "recipe-123",
    } as GrantProposal);

    expect(mocks.getByIdMock).toHaveBeenCalledWith("recipe-123");
    expect(mocks.updateMock).toHaveBeenCalledWith("recipe-123", {
      ...recipe,
      proposalIds: [],
    });
  });

  it("skips recipe cleanup when the proposal has no recipe id", async () => {
    mocks.deleteMock.mockResolvedValue(undefined);

    await deleteProposal({
      id: "proposal-1",
      grantRecipeId: "",
    } as GrantProposal);

    expect(mocks.deleteMock).toHaveBeenCalledWith("proposal-1");
    expect(mocks.getByIdMock).not.toHaveBeenCalled();
    expect(mocks.updateMock).not.toHaveBeenCalled();
  });
});
