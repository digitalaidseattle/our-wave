/**
 * labels.tsx
 * 
 * @copyright 2026 Digital Aid Seattle
*/

const UNKNOWN_ERROR = "Unknown error";

export const DASHBOARD_LABELS = {
    recentRecipes: "Recent Recipes",
    cloneRecipe: "Clone Recipe",
    selectRecentRecipe: "Select a recent Recipe",
    newRecipe: "New Recipe",
    noProposals: "No proposals yet",
};

export const RECIPE_LABELS = {
    TITLE: "Grant Recipes",
    DELETE_PROPOSALS: "Delete Recipe(s)",
    DELETE_CONFIRMATION: "Are you sure you want to delete the recipe(s)? This action cannot be undone.",
    DELETE_SUCCESS: "Recipe(s) deleted successfully.",
    DELETE_FAILURE: "Failed to delete recipe(s): ",
    UNKNOWN_ERROR: UNKNOWN_ERROR
}

export const RECIPE_DETAIL_LABELS = {
    infoTitle: "Info",
    recipeTitle: "Recipe Title",
    templateTitle: "What would you like the grant writer to create?",
    projectContextsTitle: "Project Contexts",
    projectContextsSubtext: "Upload documents or paste text that provide helpful context, such as past proposals, project descriptions, budgets, or notes.",
    outputFieldsTitle: "Output Fields",
    outputFieldsSubtext: "Add the questions or sections from the grant application that you want the grant writer to answer.",
    promptTitle: "Prompt (system-generated)",
};

export const PROPOSAL_LABELS = {
    TITLE: "Grant Proposals",
    DELETE_PROPOSALS: "Delete Proposal(s)",
    DELETE_CONFIRMATION: "Are you sure you want to delete the proposal(s)? This action cannot be undone.",
    DELETE_SUCCESS: "Proposal(s) deleted successfully.",
    DOWNLOAD_TOOLTIP: "Download proposal as Markdown",
    DELETE_FAILURE: "Failed to delete proposal(s): ",
    UNKNOWN_ERROR: UNKNOWN_ERROR
}
