// src/services/grantProposalService.ts
import { FirestoreService } from "@digitalaidseattle/firebase";
import type { GrantProposal } from "../types";
import type { Identifier, User } from "@digitalaidseattle/core";

// Handles Firestore operations for the "grant-proposals" collection
class GrantProposalService extends FirestoreService<GrantProposal> {
  constructor() {
    super("grant-proposal"); // sets Firestore collection name
  }

  // Creates a blank GrantProposal object with default values
  empty(): GrantProposal {
    const now = new Date();
    return {
      id: undefined,
      createdAt: now,
      createdBy: "",
      grantRecipeId: "",
      rating: null,
      textResponse: "",
      structuredResponse: {}, // key-value pairs for AI structured data
    };
  }

  // Adds a new proposal with timestamps and user info
  async insert(entity: GrantProposal, select?: string, user?: User): Promise<GrantProposal> {
    const now = new Date();
    const email = user?.email ?? entity.createdBy ?? "";

    return super.insert(
      {
        ...entity,
        createdAt: now,
        createdBy: email,
      },
      select,
      user
    );
  }

  // Gets all proposals (optionally limit or select fields)
  async getAll(count?: number, select?: string): Promise<GrantProposal[]> {
    return super.getAll(count, select);
  }

  // Gets one proposal by its Firestore document ID
  async getById(id: string, select?: string): Promise<GrantProposal> {
    return super.getById(id, select);
  }

  // Updates a proposal (full object required)
  async update(
    entityId: Identifier,
    updatedFields: GrantProposal,
    select?: string,
    user?: User
  ): Promise<GrantProposal> {
    const email = user?.email ?? updatedFields.createdBy ?? "";

    return super.update(
      entityId,
      {
        ...updatedFields,
        createdBy: email, // reuse same metadata pattern
      },
      select,
      user
    );
  }

  // Deletes a proposal by its document ID
  async delete(entityId: Identifier): Promise<void> {
    return super.delete(entityId);
  }
}

// Export a single instance to use across the app
export const grantProposalService = new GrantProposalService();
