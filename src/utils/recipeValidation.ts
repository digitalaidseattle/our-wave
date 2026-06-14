import type { GrantRecipe } from "../types";

export function hasRecipeName(recipe: Pick<GrantRecipe, "description">): boolean {
  return (recipe.description ?? "").trim().length > 0;
}

export function requireRecipeName(
  recipe: Pick<GrantRecipe, "description">,
  action: string
): void {
  if (!hasRecipeName(recipe)) {
    throw new Error(`Recipe name is required to ${action}.`);
  }
}
