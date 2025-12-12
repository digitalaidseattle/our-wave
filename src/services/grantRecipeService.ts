import type { Identifier, User } from "@digitalaidseattle/core";
import { FirestoreService } from "@digitalaidseattle/firebase";
import type { GrantRecipe } from "../types";
import Handlebars from "handlebars";
import { authService } from "../App";

class GrantRecipeService extends FirestoreService<GrantRecipe> {

  constructor() {
    super("grant-recipes");
  }

  getUser(): User | null | undefined {
    if (authService) {
      return authService.currentUser;
    }
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
      prompt: "Create a grant proposal",
      inputParameters: [],
      outputsWithWordCount: [],
      tokenString: "",
      tokenCount: 0,
      proposalIds: [],
      modelType: "gemini-2.5-flash",
    };
  }

  // Create: adds timestamps and user info before saving
  async insert(
    entity: GrantRecipe,
    select?: string,
    mapper?: (json: any) => GrantRecipe,
    user?: User): Promise<GrantRecipe> {
    const sessionUser = this.getUser()!;
    const now = new Date();
    // Remove id field as Firestore will auto-generate it
    const { id, ...entityWithoutId } = entity;
    return super.insert(
      {
        ...entityWithoutId,
        createdAt: now,
        updatedAt: now,
        createdBy: sessionUser.email,
        updatedBy: sessionUser.email,
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
    const now = new Date();
    const user = this.getUser();
    const name = user?.email;
    const clone = {
      ...recipe,
      id: null,
      createdAt: now,
      createdBy: name,
      updatedAt: now,
      updatedBy: name,
      description: `Clone of ${recipe.description}`,
    } as GrantRecipe;
    return this.insert(clone);
  }

  generatePromptWithInputs(recipe: GrantRecipe): string {
    var template = Handlebars.compile(recipe.prompt);
    return template({
      inputs: recipe.inputParameters,
      outputs: recipe.outputsWithWordCount
    });
  }
}

export const grantRecipeService = new GrantRecipeService();
