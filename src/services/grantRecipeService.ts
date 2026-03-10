import type { Identifier, User } from "@digitalaidseattle/core";
import { FirestoreService } from "@digitalaidseattle/firebase";
import Handlebars from "handlebars";
import { authService } from "../App";
import type { GrantRecipe } from "../types";

class GrantRecipeService extends FirestoreService<GrantRecipe> {
  constructor() {
    super("grant-recipes");
  }
  /**
   * Creates a blank recipe with default values.
   */
  empty(): GrantRecipe {
    const now = new Date();

    return {
      id: undefined,
      createdAt: now,
      createdBy: "",
      updatedAt: now,
      updatedBy: "",
      lastSubmitted: null,
      description: "",
      tags: [],
      rating: 0,
      template: "Create a grant proposal",
      prompt: "",
      contexts: [{ type: 'text', name: null, value: '', tokenCount: 0 }],
      outputsWithWordCount: [{ name: '', maxWords: 500, unit: 'words' }],
      inputParameters: [],
      tokenCount: 0,
      proposalIds: [],
      modelType: "gemini-2.5-flash",
    };
  }

  /**
   * Create: generates and stores the compiled prompt,
   * then adds timestamps and user metadata.
   */
  async insert(
    entity: GrantRecipe,
    select?: string,
    mapper?: (json: any) => GrantRecipe,
    user?: User
  ): Promise<GrantRecipe> {
    const sessionUser = user ?? await authService.getUser();
    if (!sessionUser?.email) {
      throw new Error("grantRecipeService.insert: user.email is required");
    }

    const now = new Date();

    // Compile prompt from template before saving
    const prompt = this.generatePromptWithInputs(entity);
    const { id, ...entityWithoutId } = entity;

    return super.insert(
      {
        ...entityWithoutId,
        prompt,
        createdAt: now,
        createdBy: sessionUser.email,
        updatedAt: now,
        updatedBy: sessionUser.email,
      } as GrantRecipe,
      select,
      mapper,
      user
    );
  }

  /**
   * Update: regenerates the prompt from the template
   * and refreshes metadata.
   */
  async update(
    entityId: Identifier,
    updatedFields: GrantRecipe,
    select?: string,
    mapper?: (json: any) => GrantRecipe,
    user?: User
  ): Promise<GrantRecipe> {
    const sessionUser = user ?? await authService.getUser();
    if (!sessionUser) {
      throw new Error("No valid user found.");
    }

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
    const compiled = Handlebars.compile(recipe.template + `Where {{#each outputs}}{{#unless @first}} and{{/unless}} the output "{{name}}" cannot have more than {{maxWords}} of {{unit}} {{/each}}.`);

    return compiled({
      outputs: recipe.outputsWithWordCount,
    });

  }
  async updatePrompt(recipe: GrantRecipe): Promise<GrantRecipe> {
    const prompt = this.generatePromptWithInputs(recipe);

    // If token counting is needed later, it can live here
    // For now we keep existing tokenCount
    return {
      ...recipe,
      prompt,
    };
  }
}

export const grantRecipeService = new GrantRecipeService();
