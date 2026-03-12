import type { Identifier, User } from "@digitalaidseattle/core";
import { FirestoreService } from "@digitalaidseattle/firebase";
import { authService } from "../App";
import { FIRESTORE_COLLECTIONS } from "../constants/firestoreCollections";
import type { GrantProposal } from "../types";

class GrantProposalService extends FirestoreService<GrantProposal> {
  constructor() {
    super(FIRESTORE_COLLECTIONS.grantProposals);
  }

  // Default shape for a new proposal
  empty(): GrantProposal {
    const now = new Date();
    return {
      id: undefined,
      createdAt: now,
      createdBy: "",
      updatedAt: now,
      updatedBy: "",
      grantRecipeId: "",
      name: "",
      rating: null,
      structuredResponse: undefined,
      totalTokenCount: null,
      model: ""
    };
  }

  // Insert a new proposal with metadata added
  async insert(
    entity: GrantProposal,
    select?: string,
    mapper?: (json: any) => GrantProposal,
    user?: User
  ): Promise<GrantProposal> {
    const sessionUser = user ?? await authService.getUser();
    if (!sessionUser) throw new Error("Valid user not found.");

    const now = new Date();
    // Firestore can't store `undefined` (and we don't want to persist id anyway)
    // so remove it before insert.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...entityWithoutId } = entity;

    return super.insert(
      {
        ...entityWithoutId,
        createdAt: now,
        createdBy: sessionUser.email,
        updatedAt: now,
        updatedBy: sessionUser.email,
      } as GrantProposal,
      select,
      mapper,
      user
    );
  }

  // Update a proposal
  async update(
    entityId: Identifier,
    updatedFields: Partial<GrantProposal>,
    select?: string,
    mapper?: (json: any) => GrantProposal,
    user?: User
  ): Promise<GrantProposal> {
    const sessionUser = user ?? await authService.getUser();
    if (!sessionUser) throw new Error("Valid user not found.");

    const partial = {
      ...updatedFields,
      updatedAt: new Date(),
      updatedBy: sessionUser.email
    } as GrantProposal;
    try {
      return super.update(entityId, partial, select, mapper, sessionUser)
    } catch (e) {
      console.error("Error updating document: ", e);
      throw e;
    }
  }
}

export const grantProposalService = new GrantProposalService();
