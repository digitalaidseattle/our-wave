/**
 *  CreateRecipe.ts
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */

import { authService } from "../App";
import { GrantAiService } from "../pages/grants/grantAiService";
import { grantProposalService } from "../services/grantProposalService";
import { grantRecipeService } from "../services/grantRecipeService";
import { GrantProposal, GrantRecipe } from "../types";

export async function generateProposal(recipe: GrantRecipe): Promise<GrantProposal> {
    const grantAiService = GrantAiService.getInstance();

    const outputs = recipe.outputsWithWordCount ?? [];
    if (outputs.length === 0) {
        throw new Error("Recipe is missing output fields");
    }

    // The prompt should already be generated and saved with the recipe
    if (!recipe.prompt) {
        throw new Error("Recipe prompt has not been generated");
    }

    const user = await authService.getUser();
    if (!user) {
        throw new Error("generateProposal: user.email is required");
    }

    const now = new Date();
    const updatedRecipe = {
        ...recipe,
        lastSubmitted: now
    }

    let savedRecipe: GrantRecipe;
    if (recipe.id) {
        savedRecipe = await grantRecipeService.update(recipe.id, updatedRecipe);
    } else {
        savedRecipe = await grantRecipeService.insert(updatedRecipe);
    }

    // Ask AI for structured JSON using output field names as keys
    const schemaParams = outputs.map((o) => o.name);
    const response = await grantAiService.parameterizedQuery(
        recipe.prompt,
        schemaParams,
        recipe.modelType,
        recipe.contexts,
    );

    console.log(response);

    const proposal = {
        ...grantProposalService.empty(),
        name: `${savedRecipe.description} (${savedRecipe.proposalIds.length + 1})`,
        grantRecipeId: String(savedRecipe.id),
        structuredResponse: JSON.parse(response.text!),
        rating: null,
        totalTokenCount: response.usageMetadata ? response.usageMetadata.totalTokenCount : null,
        model: recipe.modelType
    };

    return grantProposalService.insert(proposal,
        undefined,
        undefined,
        user);
}