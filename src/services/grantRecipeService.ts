import type { Identifier, User } from "@digitalaidseattle/core";
import { FirestoreService } from "@digitalaidseattle/firebase";
import type { GrantRecipe } from "../types";
import Handlebars from "handlebars";
import { authService } from "../App";
import { geminiService } from "../api/geminiService";

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

    const sessionUser = user ?? this.getUser()!;
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
    const sessionUser = user ?? this.getUser()!;
    return super.update(
      entityId,
      {
        ...updatedFields,
        updatedAt: new Date(),
        updatedBy: sessionUser.email,
      },
      select,
      mapper,
      user
    );
  }

  generatePromptWithInputs(recipe: GrantRecipe): string {
    var template = Handlebars.compile(recipe.prompt);
    return template({
      inputs: recipe.inputParameters,
      outputs: recipe.outputsWithWordCount
    });
  }

  async updatePrompt(recipe: GrantRecipe): Promise<GrantRecipe> {
    // TODO include generating the tokenString using Handlebars
    const newPrompt = recipe.prompt + JSON.stringify(recipe.inputParameters);
    //
    return geminiService.calcTokenCount(recipe.modelType ?? "gemini-2.5-flash", newPrompt)
      .then(count => ({ ...recipe, tokenCount: count, tokenString: newPrompt }));
  }
}

export const grantRecipeService = new GrantRecipeService();
