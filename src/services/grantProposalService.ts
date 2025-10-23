import { FirestoreService } from "@digitalaidseattle/firebase";
import type { GrantProposal } from "../types";
import type { Identifier, User } from "@digitalaidseattle/core";

// Firestore service for "grant-proposal" collection
class GrantProposalService extends FirestoreService<GrantProposal> {
  constructor() {
    super("grant-proposal"); // Firestore collection name
  }

  // Returns a blank proposal with default values with optional fields (textResponse, structuredResponse)
  empty(): GrantProposal {
    const now = new Date();
    return {
      id: undefined,
      createdAt: now,
      createdBy: "",
      grantRecipeId: "",
      rating: null,
    };
  }

  // Create: adds createdAt and createdBy before saving
  async insert(entity: GrantProposal, select?: string, user?: User): Promise<GrantProposal> {
    if (!user?.email) throw new Error("grantProposalService.insert: user.email is required");
    const now = new Date();

    return super.insert(
      {
        ...entity,
        createdAt: now,
        createdBy: user.email,
      },
      select,
      user
    );
  }

  // Update: refreshes createdBy if needed (optional behavior)
  async update(
    entityId: Identifier,
    updatedFields: GrantProposal,
    select?: string,
    user?: User
  ): Promise<GrantProposal> {
    if (!user?.email) throw new Error("grantProposalService.update: user.email is required");

    return super.update(
      entityId,
      {
        ...updatedFields,
        createdBy: user.email, // reuse same metadata pattern
      },
      select,
      user
    );
  }
}

export const grantProposalService = new GrantProposalService();
