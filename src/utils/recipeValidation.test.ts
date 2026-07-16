import { describe, expect, it } from "vitest";
import { hasRecipeName, hasUniqueRecipeName, isValidRecipe, requireRecipeName } from "./recipeValidation";

describe("recipe name validation", () => {
  it.each(["", "   ", "\n\t"])("rejects an empty recipe name", description => {
    expect(hasRecipeName({ description })).toBe(false);
    expect(() => requireRecipeName({ description }, "save")).toThrow(
      "Recipe name is required to save."
    );
  });

  it("accepts free text with surrounding whitespace", () => {
    expect(hasRecipeName({ description: "  Community grant  " })).toBe(true);
    expect(() => requireRecipeName({ description: "Recipe" }, "clone")).not.toThrow();
  });

  it("rejects duplicate recipe names case-insensitively", () => {
    const recipes = [
      { id: "recipe-1", description: "Community grant" },
      { id: "recipe-2", description: "Capital campaign" },
    ];

    expect(hasUniqueRecipeName({ id: "recipe-3", description: " community GRANT " }, recipes)).toBe(false);
    expect(hasUniqueRecipeName({ id: "recipe-1", description: "Community grant" }, recipes)).toBe(true);
  });

  it("validates a recipe with null, name, and uniqueness checks", () => {
    const recipes = [
      { id: "recipe-1", description: "Community grant" },
    ];

    expect(isValidRecipe(undefined, recipes)).toBe(false);
    expect(isValidRecipe({ id: "recipe-2", description: " " }, recipes)).toBe(false);
    expect(isValidRecipe({ id: "recipe-2", description: "Community grant" }, recipes)).toBe(false);
    expect(isValidRecipe({ id: "recipe-2", description: "Operating support" }, recipes)).toBe(true);
  });
});
