import { FirestoreService, firebaseClient } from "@digitalaidseattle/firebase";
import { collection, getDocs, query as firestoreQuery, getFirestore } from "firebase/firestore";
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
  async insert(entity: GrantProposal,
    select?: string,
    mapper?: (json: any) => GrantProposal,
    user?: User): Promise<GrantProposal> {
    if (!user?.email) throw new Error("grantProposalService.insert: user.email is required");
    const now = new Date();

    return super.insert(
      {
        ...entity,
        createdAt: now,
        createdBy: user.email,
      },
      select,
      mapper,
      user
    );
  }

  // Update: refreshes createdBy if needed (optional behavior)
  async update(
    entityId: Identifier,
    updatedFields: GrantProposal,
    select?: string,
    mapper?: (json: any) => GrantProposal,
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
      mapper,
      user
    );
  }

  // Fetch all proposals
  async findAll(): Promise<GrantProposal[]> {
    try {
      const db = getFirestore(firebaseClient);
      const proposalsCollection = collection(db, "grant-proposal");
      const q = firestoreQuery(proposalsCollection);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as GrantProposal[];
    } catch (error) {
      console.error("Error fetching all proposals:", error);
      throw error;
    }
  }

  // Delete a proposal
  async delete(entityId: Identifier): Promise<void> {
    return super.delete(entityId);
  }
}

export const grantProposalService = new GrantProposalService();
