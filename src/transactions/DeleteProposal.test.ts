import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GrantProposal } from "../types";

const mocks = vi.hoisted(() => ({
  deleteMock: vi.fn(),
}));

vi.mock("../services/grantProposalService", () => ({
  grantProposalService: {
    delete: mocks.deleteMock,
  },
}));

import { deleteProposal } from "./DeleteProposal";

describe("deleteProposal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the proposal", async () => {
    mocks.deleteMock.mockResolvedValue(undefined);

    await deleteProposal(
      { id: "proposal-1", grantRecipeId: "recipe-123" } as GrantProposal
    );

    expect(mocks.deleteMock).toHaveBeenCalledWith("proposal-1");
  });

  it("throws if proposal has no id", async () => {
    await expect(
      deleteProposal({ id: undefined, grantRecipeId: "recipe-123" } as any)
    ).rejects.toThrow("Proposal ID is required");
  });
});
