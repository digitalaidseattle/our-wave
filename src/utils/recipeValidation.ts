import type { GrantContext, GrantOutput, GrantRecipe } from "../types";

export const DUPLICATE_OUTPUT_FIELD_ERROR = "Duplicate Output Field. Please enter a unique value.";
export const DUPLICATE_PROJECT_CONTEXT_ERROR = "Duplicate Project Context. Please enter a unique value.";

export function hasRecipeName(recipe: Pick<GrantRecipe, "description">): boolean {
  return (recipe.description ?? "").trim().length > 0;
}

export function hasUniqueRecipeName(
  recipe: Pick<GrantRecipe, "id" | "description">,
  recipes: Pick<GrantRecipe, "id" | "description">[] = []
): boolean {
  const recipeName = (recipe.description ?? "").trim().toLowerCase();
  if (!recipeName) return false;

  return !recipes.some(existing => {
    const existingName = (existing.description ?? "").trim().toLowerCase();
    return existing.id !== recipe.id && existingName === recipeName;
  });
}

export function isValidRecipe(
  recipe: Pick<GrantRecipe, "id" | "description"> | null | undefined,
  recipes: Pick<GrantRecipe, "id" | "description">[] = []
): recipe is Pick<GrantRecipe, "id" | "description"> {
  return Boolean(recipe && hasRecipeName(recipe) && hasUniqueRecipeName(recipe, recipes));
}

export function requireRecipeName(
  recipe: Pick<GrantRecipe, "description">,
  action: string
): void {
  if (!hasRecipeName(recipe)) {
    throw new Error(`Recipe name is required to ${action}.`);
  }
}

function duplicateIndexes(values: Array<string | null | undefined>): Set<number> {
  const indexesByValue = new Map<string, number[]>();

  values.forEach((value, index) => {
    const normalized = (value ?? "").trim().toLowerCase();
    if (!normalized) return;

    indexesByValue.set(normalized, [...(indexesByValue.get(normalized) ?? []), index]);
  });

  const duplicates = new Set<number>();
  indexesByValue.forEach(indexes => {
    if (indexes.length > 1) {
      indexes.forEach(index => duplicates.add(index));
    }
  });

  return duplicates;
}

export function getDuplicateOutputFieldNameIndexes(outputs: Pick<GrantOutput, "name">[] = []): Set<number> {
  return duplicateIndexes(outputs.map(output => output.name));
}

export function getDuplicateProjectContextNameIndexes(contexts: Pick<GrantContext, "name">[] = []): Set<number> {
  return duplicateIndexes(contexts.map(context => context.name));
}

export function hasUniqueOutputFieldNames(outputs: Pick<GrantOutput, "name">[] = []): boolean {
  return getDuplicateOutputFieldNameIndexes(outputs).size === 0;
}

export function hasUniqueProjectContextNames(contexts: Pick<GrantContext, "name">[] = []): boolean {
  return getDuplicateProjectContextNameIndexes(contexts).size === 0;
}

export function requireUniqueOutputFieldNames(outputs: Pick<GrantOutput, "name">[] = []): void {
  if (!hasUniqueOutputFieldNames(outputs)) {
    throw new Error(DUPLICATE_OUTPUT_FIELD_ERROR);
  }
}

export function requireUniqueProjectContextNames(contexts: Pick<GrantContext, "name">[] = []): void {
  if (!hasUniqueProjectContextNames(contexts)) {
    throw new Error(DUPLICATE_PROJECT_CONTEXT_ERROR);
  }
}

export function requireUniqueRecipeConfigFields(
  recipe: Pick<GrantRecipe, "outputsWithWordCount" | "contexts">
): void {
  requireUniqueOutputFieldNames(recipe.outputsWithWordCount ?? []);
  requireUniqueProjectContextNames(recipe.contexts ?? []);
}
