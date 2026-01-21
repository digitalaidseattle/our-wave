import type { Identifier, User } from "@digitalaidseattle/core";
import { FirestoreService } from "@digitalaidseattle/firebase";
import type { GrantProposal, GrantRecipe } from "../types";
import { GrantAiService } from "../pages/grants/grantAiService";
import { authService } from "../App";
import { grantRecipeService } from "./grantRecipeService";

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
      updatedAt: now,
      updatedBy: "",
      grantRecipeId: "",
      name: "",
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

    // Firestore can't store `undefined` (and we don't want to persist id anyway)
    // so remove it before insert.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...entityWithoutId } = entity;

    return super.insert(
      {
        ...entityWithoutId,
        createdAt: new Date(),
        createdBy: user.email,
      } as GrantProposal,
      select,
      mapper,
      user
    );
  }

  // Update a proposal
  async update(
    entityId: Identifier,
    updatedFields: Partial<GrantProposal>,
    select?: string,
    mapper?: (json: any) => GrantProposal,
    user?: User
  ): Promise<GrantProposal> {
    if (!user?.email) throw new Error("User email is required");

    // Firestore can't store `undefined` (and we don't want to persist id anyway)
    // so remove it before insert.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...entityWithoutId } = updatedFields;

    return super.update(
      entityId,
      {
        ...entityWithoutId,
        createdAt: new Date(),
        createdBy: user.email,
        updatedAt: new Date(),
        updatedBy: user.email,
      } as GrantProposal,
      select,
      mapper,
      user
    );
  }

  // --- real generation (still returns a draft; not persisted) ---
  async generate(recipe: GrantRecipe): Promise<GrantProposal> {
    const grantAiService = GrantAiService.getInstance();

    if (!recipe.id) throw new Error("Recipe ID is required");

    const outputs = recipe.outputsWithWordCount ?? [];
    if (outputs.length === 0) {
      throw new Error("Recipe is missing output fields");
    }

    // The prompt should already be generated and saved with the recipe
    if (!recipe.prompt) {
      throw new Error("Recipe prompt has not been generated");
    }

    const sessionUser = await authService.getUser();
    if (!sessionUser) throw new Error("User email is required");

    // Ask AI for structured JSON using output field names as keys
    const schemaParams = outputs.map((o) => o.name);
    const structuredResponse = await grantAiService.parameterizedQuery(
      recipe.modelType,
      recipe.prompt,
      schemaParams
    );

    // Persist proposal
    const saved = await grantProposalService.insert(
      {
        ...this.empty(),
        grantRecipeId: recipe.id,
        name: `${recipe.description} (${recipe.proposalIds.length + 1})`,
        structuredResponse,
        rating: null,
      },
      undefined,
      undefined,
      sessionUser
    );

    await grantRecipeService.update(recipe.id, {
      ...recipe,
      updatedAt: new Date(),
      updatedBy: sessionUser.email,
      proposalIds: [...recipe.proposalIds, saved.id as string]
    })

    return saved;
  }
}

export const grantProposalService = new GrantProposalService();