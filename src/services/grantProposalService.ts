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

  // --- DEV scaffolding so Wave-70 UI can be tested without persisted proposals ---

  private mockProposal(id: string): GrantProposal {
    return {
      id,
      createdAt: new Date(),
      createdBy: "scaffold@digitalaidseattle.org",
      grantRecipeId: "mock-recipe-id",
      rating: null,
      structuredResponse: {
        "Executive Summary":
          "Scaffold data for Wave-70. This should render as-is (no truncation) and show word/character counts.",
        "Project Description":
          "Longer scaffold text to validate layout/wrapping.\n\nSecond paragraph to validate spacing and line breaks.",
        "Budget Justification":
          "Another section to validate multiple cards and counters.",
      },
    };
  }

  private mockAll(): GrantProposal[] {
    return [
      this.mockProposal("test-1"),
      {
        ...this.mockProposal("test-2"),
        structuredResponse: {
          "Need Statement":
            "Second mocked proposal so the list page renders more than one row.",
          "Timeline":
            "Jan: planning\nFeb: implementation\nMar: evaluation",
        },
      },
    ];
  }

  async getAll(
    count?: number,
    select?: string,
    mapper?: (json: any) => GrantProposal
  ): Promise<GrantProposal[]> {
    if (import.meta.env.DEV) return this.mockAll();
    return super.getAll(count, select, mapper);
  }

  async getById(
    entityId: string,
    select?: string,
    mapper?: (json: any) => GrantProposal
  ): Promise<GrantProposal> {
    if (import.meta.env.DEV) return this.mockProposal(entityId);
    return super.getById(entityId, select, mapper);
  }

  // --- real generation (still returns a draft; not persisted) ---
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

    return {
      ...this.empty(),
      grantRecipeId: String(recipe.id),
      structuredResponse,
      rating: null,
    };
  }
}

export const grantProposalService = new GrantProposalService();