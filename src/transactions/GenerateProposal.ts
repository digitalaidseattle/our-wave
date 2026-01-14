/**
 *  CreateRecipe.ts
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */

import { User } from "@digitalaidseattle/core";
import { grantAiService } from "../pages/grants/grantAiService";
import { grantProposalService } from "../services/grantProposalService";
import { grantRecipeService } from "../services/grantRecipeService";
import { GrantProposal, GrantRecipe } from "../types";
import { authService } from "../App";
/**
 * Returns the currently authenticated user (if available).
 */
function getUser(): User | null | undefined {
    if (authService) {
        return authService.currentUser;
    }
}

// --- real generation (still returns a draft; not persisted) ---
export async function generateProposal(recipe: GrantRecipe): Promise<GrantProposal> {
    if (!recipe.id) throw new Error("Recipe ID is required");

    const outputs = recipe.outputsWithWordCount ?? [];
    if (outputs.length === 0) {
        throw new Error("Recipe is missing output fields");
    }

    // The prompt should already be generated and saved with the recipe
    if (!recipe.prompt) {
        throw new Error("Recipe prompt has not been generated");
    }

    const user = getUser();
    if (!user) {
        throw new Error("generateProposal: user.email is required");
    }

    const now = new Date();
    const updatedRecipe = {
        ...recipe,
        lastSubmitted: now
    }
    if (recipe.id) {
        await grantRecipeService.update(recipe.id, updatedRecipe);
    } else {
        await grantRecipeService.insert(updatedRecipe);
    }

    // Ask AI for structured JSON using output field names as keys
    const schemaParams = outputs.map((o) => o.name);
    const structuredResponse = await grantAiService.parameterizedQuery(
        schemaParams,
        recipe.prompt,
        recipe.modelType
    );

    const proposal = {
        ...grantProposalService.empty(),
        grantRecipeId: String(recipe.id),
        structuredResponse,
        rating: null,
    };

    return grantProposalService.insert(proposal,
        undefined,
        undefined,
        user);
}