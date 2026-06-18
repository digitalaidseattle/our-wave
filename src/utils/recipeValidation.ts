import type { GrantRecipe } from "../types";

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
