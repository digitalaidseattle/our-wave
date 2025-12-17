import type { Identifier, User } from "@digitalaidseattle/core";
import { FirestoreService } from "@digitalaidseattle/firebase";
import type { GrantProposal, GrantRecipe } from "../types";
import { grantAiService } from "../pages/grants/grantAiService";

class GrantProposalService extends FirestoreService<GrantProposal> {
  constructor() {
    super("grant-proposal");
  }

  // Default shape for a new proposal
  empty(): GrantProposal {
    const now = new Date();
    return {
      id: undefined,
      createdAt: now,
      createdBy: "",
      grantRecipeId: "",
      rating: null,
      structuredResponse: undefined,
    };
  }

  // Insert a new proposal with metadata added
  async insert(
    entity: GrantProposal,
    select?: string,
    mapper?: (json: any) => GrantProposal,
    user?: User
  ): Promise<GrantProposal> {
    if (!user?.email) throw new Error("User email is required");

    return super.insert(
      {
        ...entity,
        createdAt: new Date(),
        createdBy: user.email,
      },
      select,
      mapper,
      user
    );
  }

  // Update a proposal
  async update(
    entityId: Identifier,
    updatedFields: GrantProposal,
    select?: string,
    mapper?: (json: any) => GrantProposal,
    user?: User
  ): Promise<GrantProposal> {
    if (!user?.email) throw new Error("User email is required");

    return super.update(
      entityId,
      {
        ...updatedFields,
        createdBy: user.email,
      },
      select,
      mapper,
      user
    );
  }

  /**
   * Creates a proposal draft from a recipe using AI.
   *
   * Notes:
   * - The prompt is already compiled and stored on the recipe.
   * - Output limits are expected to be enforced by the AI via the template.
   * - This service does NOT modify or truncate AI output.
   */
  async generate(recipe: GrantRecipe): Promise<GrantProposal> {
    if (!recipe.id) throw new Error("Recipe ID is required");

    const outputs = recipe.outputsWithWordCount ?? [];
    if (outputs.length === 0) {
      throw new Error("Recipe is missing output fields");
    }

    // The prompt should already be generated and saved with the recipe
    if (!recipe.prompt) {
      throw new Error("Recipe prompt has not been generated");
    }

    // Ask AI for structured JSON using output field names as keys
    const schemaParams = outputs.map((o) => o.name);
    const structuredResponse = await grantAiService.parameterizedQuery(
      schemaParams,
      recipe.prompt,
      recipe.modelType
    );

    // Return proposal draft (not persisted yet)
    const base = this.empty();
    return {
      ...base,
      grantRecipeId: String(recipe.id),
      structuredResponse,
      rating: null,
    };
  }
}

export const grantProposalService = new GrantProposalService();
