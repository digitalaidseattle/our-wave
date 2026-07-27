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
import { requireRecipeName, requireUniqueRecipeConfigFields } from "../utils/recipeValidation";

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
    requireRecipeName(recipe, "generate a proposal");
    requireUniqueRecipeConfigFields(recipe);

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


    // Build a unique proposal name using recipe description + generation timestamp.
    // Try once — if the name already exists, fail fast.
    const recipeId = String(savedRecipe.id);
    const proposalName = `${savedRecipe.description} ${formatProposalDate(new Date())}`;

    if (await GrantProposalService.getInstance().proposalNameExists(proposalName)) {
        throw new Error(`A proposal named "${proposalName}" already exists. Please try again in a moment.`);
    }

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
