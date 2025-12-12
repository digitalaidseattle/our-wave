import type { Identifier, User } from "@digitalaidseattle/core";
import { FirestoreService } from "@digitalaidseattle/firebase";
import type { GrantProposal, GrantRecipe, GrantOutput } from "../types";
import { grantAiService } from "../pages/grants/grantAiService";

/**
 * Apply the word/character limits defined in a GrantOutput field.
 */
function applyOutputLimit(raw: string, field: GrantOutput): string {
  if (!raw) return "";

  if (field.unit === "characters") {
    return raw.length <= field.maxWords ? raw : raw.slice(0, field.maxWords);
  }

  const words = raw.split(/\s+/).filter(Boolean);
  return words.length <= field.maxWords
    ? raw
    : words.slice(0, field.maxWords).join(" ");
}

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
   */
  async generate(recipe: GrantRecipe): Promise<GrantProposal> {
    if (!recipe.id) throw new Error("Recipe ID is required");

    const outputs = recipe.outputsWithWordCount ?? [];
    if (outputs.length === 0) {
      throw new Error("Recipe is missing output fields");
    }

    // Use the already-compiled prompt stored on the recipe
    if (!recipe.prompt) {
      throw new Error("Recipe prompt has not been generated");
    }

    // Ask AI for JSON with keys matching output names
    const schemaParams = outputs.map((o) => o.name);
    const aiResult = await grantAiService.parameterizedQuery(
      schemaParams,
      recipe.prompt,
      recipe.modelType
    );

    // Build structured output with limits applied
    const structuredResponse: Record<string, string> = {};

    for (const field of outputs) {
      const raw = aiResult[field.name] ?? "";
      structuredResponse[field.name] = applyOutputLimit(raw, field);
    }

    // Return a proposal object (not persisted)
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
