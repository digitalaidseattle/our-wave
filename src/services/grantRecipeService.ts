import type { Identifier, User } from "@digitalaidseattle/core";
import { FirestoreService } from "@digitalaidseattle/firebase";
import type { GrantRecipe } from "../types";
import Handlebars from "handlebars";

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
      template: "Create a grant proposal",
      prompt: "",
      inputParameters: [],
      outputsWithWordCount: [],
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
    user?: User
  ): Promise<GrantRecipe> {
    if (!user?.email) {
      throw new Error("grantRecipeService.insert: user.email is required");
    }

    const now = new Date();

    // Compile prompt before saving
    const prompt = this.generatePromptWithInputs(entity);

    const { id, ...entityWithoutId } = entity;

    return super.insert(
      {
        ...entityWithoutId,
        prompt,
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

  // Update: refreshes metadata and regenerates prompt
  async update(
    entityId: Identifier,
    updatedFields: GrantRecipe,
    select?: string,
    mapper?: (json: any) => GrantRecipe,
    user?: User
  ): Promise<GrantRecipe> {
    if (!user?.email) {
      throw new Error("grantRecipeService.update: user.email is required");
    }

    const prompt = this.generatePromptWithInputs(updatedFields);

    return super.update(
      entityId,
      {
        ...updatedFields,
        prompt,
        updatedAt: new Date(),
        updatedBy: user.email,
      },
      select,
      mapper,
      user
    );
  }

  async clone(_recipe: GrantRecipe): Promise<GrantRecipe> {
    throw new Error("Method not implemented.");
  }

  /**
   * Compiles the Handlebars template into the final prompt
   * using the recipe's inputs and outputs.
   */
  generatePromptWithInputs(recipe: GrantRecipe): string {
    const compiled = Handlebars.compile(recipe.template);

    return compiled({
      inputs: recipe.inputParameters,
      outputs: recipe.outputsWithWordCount,
    });
  }
}

export const grantRecipeService = new GrantRecipeService();
