import { FirestoreService, firebaseClient } from "@digitalaidseattle/firebase";
import { collection, getDocs, query as firestoreQuery, getFirestore } from "firebase/firestore";
import type { GrantRecipe } from "../types";
import type { Identifier, User } from "@digitalaidseattle/core";

class GrantRecipeService extends FirestoreService<GrantRecipe> {
  constructor() {
    super("grant-recipes");
  }

  // Creates a blank recipe with default values
  empty(): GrantRecipe {
    const now = new Date();
    return {
      id: undefined,
      createdAt: now,
      createdBy: "",
      updatedAt: now,
      updatedBy: "",
      description: "",
      prompt: "",
      inputParameters: [],
      outputsWithWordCount: [],
      tokenString: "",
      tokenCount: 0,
      proposalIds: [],
      modelType: "gemini-2.5-flash",
    };
  }

  // Create: adds timestamps and user info before saving
  async insert(entity: GrantRecipe, select?: string, user?: User): Promise<GrantRecipe> {
    if (!user?.email) throw new Error("grantRecipeService.insert: user.email is required");
    const now = new Date();
    // Remove id field as Firestore will auto-generate it
    const { id, ...entityWithoutId } = entity;
    return super.insert(
      {
        ...entityWithoutId,
        createdAt: now,
        updatedAt: now,
        createdBy: user.email,
        updatedBy: user.email,
      } as GrantRecipe,
      select,
      user
    );
  }

  // Update: updates fields and refreshes metadata
  async update(
    entityId: Identifier,
    updatedFields: GrantRecipe,
    select?: string,
    user?: User
  ): Promise<GrantRecipe> {
    if (!user?.email) throw new Error("grantRecipeService.update: user.email is required");
    return super.update(
      entityId,
      {
        ...updatedFields,
        updatedAt: new Date(),
        updatedBy: user.email,
      },
      select,
      user
    );
  }

  // Fetch all recipes
  async findAll(): Promise<GrantRecipe[]> {
    try {
      const db = getFirestore(firebaseClient);
      const recipesCollection = collection(db, "grant-recipes");
      const q = firestoreQuery(recipesCollection);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as GrantRecipe[];
    } catch (error) {
      console.error("Error fetching all recipes:", error);
      throw error;
    }
  }

  // Delete a recipe
  async delete(entityId: Identifier): Promise<void> {
    return super.delete(entityId);
  }
}

export const grantRecipeService = new GrantRecipeService();
