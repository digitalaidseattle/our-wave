/**
 *  CreateRecipe.ts
 *
 *  @copyright 2024 Digital Aid Seattle
 *
 */

import { authService } from "../App";
import { GrantAiService } from "../pages/grants/grantAiService";
import { GrantProposalService } from "../services/grantProposalService";
import { grantRecipeService } from "../services/grantRecipeService";
import { GrantProposal, GrantRecipe } from "../types";

// Format: "6/22 2:27:09 PM"
function formatProposalDate(date: Date): string {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${month}/${day} ${hour12}:${minutes}:${seconds} ${ampm}`;
}

export async function generateProposal(recipe: GrantRecipe): Promise<GrantProposal> {
    const grantAiService = GrantAiService.getInstance();

    if (!recipe.id) {
        throw new Error("Recipe ID is required");
    }

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
    const savedRecipe = await grantRecipeService.update(recipe.id, updatedRecipe);

    // Ask AI for structured JSON using output field names as keys
    const schemaParams = outputs.map((o) => o.name);
    const response = await grantAiService.parameterizedQuery(
        recipe.prompt,
        schemaParams,
        recipe.modelType,
        recipe.contexts,
    );

    // Build a unique proposal name using the recipe description + generation timestamp.
    // If a proposal with that name already exists (e.g. two generates in the same second),
    // increment by one second until the name is free.
    const recipeId = String(savedRecipe.id);
    let nameDate = new Date();
    let proposalName: string;
    do {
        proposalName = `${savedRecipe.description} ${formatProposalDate(nameDate)}`;
        const exists = await GrantProposalService.getInstance().proposalNameExists(proposalName, recipeId);
        if (!exists) break;
        nameDate = new Date(nameDate.getTime() + 1000);
    } while (true);

    const proposal = {
        ...GrantProposalService.getInstance().empty(),
        name: proposalName,
        grantRecipeId: recipeId,
        structuredResponse: JSON.parse(response.text!),
        rating: null,
        totalTokenCount: response.usageMetadata ? response.usageMetadata.totalTokenCount : null,
        model: recipe.modelType
    };

    return GrantProposalService.getInstance().insert(proposal,
        undefined,
        undefined,
        user);
}