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
  async insert(entity: GrantRecipe, select?: string, mapper?: (json: any) => GrantRecipe, user?: User): Promise<GrantRecipe> {
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
      mapper,
      user
    );
  }

  // Update: updates fields and refreshes metadata
  async update(
    entityId: Identifier,
    updatedFields: GrantRecipe,
    select?: string,
    mapper?: (json: any) => GrantRecipe,
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
      mapper,
      user
    );
  }

  async clone(recipe: GrantRecipe): Promise<GrantRecipe> {
    console.log('recipe', recipe);
    throw new Error("Method not implemented.");
  }
}

export const grantRecipeService = new GrantRecipeService();
