import { grantProposalService } from "../services/grantProposalService";
import { grantRecipeService } from "../services/grantRecipeService";
import type { GrantProposal, GrantRecipe } from "../types";

export async function deleteProposal(
  proposal: Pick<GrantProposal, "id" | "grantRecipeId">,
  recipe?: GrantRecipe | null
): Promise<void> {
  if (!proposal.id) {
    throw new Error("Proposal ID is required");
  }

  const proposalId = String(proposal.id);
  const recipeId = proposal.grantRecipeId ? String(proposal.grantRecipeId) : "";

  await grantProposalService.delete(proposalId);

  if (recipeId.trim() === "") {
    return;
  }

  try {
    const parentRecipe = recipe ?? await grantRecipeService.getById(recipeId);
    const nextProposalIds = (parentRecipe.proposalIds ?? []).filter((id) => id !== proposalId);

    if (nextProposalIds.length !== (parentRecipe.proposalIds ?? []).length) {
      await grantRecipeService.update(parentRecipe.id as string, {
        ...parentRecipe,
        proposalIds: nextProposalIds,
      });
    }
  } catch (error) {
    console.warn("Proposal deleted but recipe reference cleanup failed:", error);
  }
}
