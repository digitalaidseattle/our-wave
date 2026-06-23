import { grantProposalService } from "../services/grantProposalService";
import type { GrantProposal } from "../types";

export async function deleteProposal(
  proposal: Pick<GrantProposal, "id" | "grantRecipeId">
): Promise<void> {
  if (!proposal.id) {
    throw new Error("Proposal ID is required");
  }

  const proposalId = String(proposal.id);

  await grantProposalService.delete(proposalId);
}
