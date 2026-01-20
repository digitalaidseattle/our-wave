import type { Identifier, User } from "@digitalaidseattle/core";
import { FirestoreService } from "@digitalaidseattle/firebase";
import type { GrantRecipe } from "../types";
import Handlebars from "handlebars";
import { authService } from "../App";

class GrantRecipeService extends FirestoreService<GrantRecipe> {
  constructor() {
    super("grant-recipes");
  }

  /**
   * Returns the currently authenticated user (if available).
   */
  getUser(): User | null | undefined {
    if (authService) {
      return authService.currentUser;
    }
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
      description: "",
      tags:[],
      rating: 0,
      template: "Create a grant proposal",
      prompt: "",
      inputParameters: [],
      outputsWithWordCount: [],
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
    const sessionUser = user ?? this.getUser();
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
    const sessionUser = user ?? this.getUser();
    if (!sessionUser?.email) {
      throw new Error("grantRecipeService.update: user.email is required");
    }

    const prompt = this.generatePromptWithInputs(updatedFields);

    return super.update(
      entityId,
      {
        ...updatedFields,
        prompt,
        updatedAt: new Date(),
        updatedBy: sessionUser.email,
      },
      select,
      mapper,
      user
    );
  }

  generatePromptWithInputs(recipe: GrantRecipe): string {
    const compiled = Handlebars.compile(recipe.template ?? "");

    const basePrompt = compiled({
      inputs: recipe.inputParameters,
      outputs: recipe.outputsWithWordCount,
    });

    const outputConstraints = recipe.outputsWithWordCount
      .map(o => `- ${o.name}: maximum ${o.maxWords} ${o.unit}`)
      .join("\n");

    return `
${basePrompt}

Please follow these output constraints strictly:
${outputConstraints}

Adjust wording as needed to stay within these limits.
`;
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
