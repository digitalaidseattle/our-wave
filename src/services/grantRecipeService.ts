import { FirestoreService } from "@digitalaidseattle/firebase";
import type { GrantRecipe } from "../types";
import type { Identifier, User } from "@digitalaidseattle/core";

// Handles all Firestore operations for the "grant-recipes" collection
class GrantRecipeService extends FirestoreService<GrantRecipe> {
  constructor() {
    super("grant-recipes"); // sets the Firestore collection name
  }

  // Creates a blank GrantRecipe object with default values
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

  // Adds a new recipe to Firestore and includes timestamps and user info
  async insert(entity: GrantRecipe, select?: string, user?: User): Promise<GrantRecipe> {
    const now = new Date();
    const email = user?.email ?? entity.createdBy ?? "";
    return super.insert(
      {
        ...entity,
        createdAt: now,
        updatedAt: now,
        createdBy: email,
        updatedBy: email,
      },
      select,
      user
    );
  }

  // Gets all recipes from Firestore (optionally limit or filter fields)
  async getAll(count?: number, select?: string): Promise<GrantRecipe[]> {
    return super.getAll(count, select);
  }

  // Gets a single recipe by its document ID
  async getById(id: string, select?: string): Promise<GrantRecipe> {
    return super.getById(id, select);
  }

  // Updates a recipe and refreshes the last updated info
  async update(
    entityId: Identifier,
    updatedFields: GrantRecipe,
    select?: string,
    user?: User
  ): Promise<GrantRecipe> {
    const email = user?.email ?? updatedFields.updatedBy ?? "";
    return super.update(
      entityId,
      {
        ...updatedFields,
        updatedAt: new Date(),
        updatedBy: email,
      },
      select,
      user
    );
  }

  // Deletes a recipe by its ID
  async delete(entityId: Identifier): Promise<void> {
    return super.delete(entityId);
  }
}
// Export a single instance for use across the app
export const grantRecipeService = new GrantRecipeService();
