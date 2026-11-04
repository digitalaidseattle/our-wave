import { describe, expect, it } from "vitest";
import {
  DUPLICATE_OUTPUT_FIELD_ERROR,
  DUPLICATE_PROJECT_CONTEXT_ERROR,
  getDuplicateOutputFieldNameIndexes,
  getDuplicateProjectContextNameIndexes,
  hasRecipeName,
  hasUniqueOutputFieldNames,
  hasUniqueProjectContextNames,
  hasUniqueRecipeName,
  isValidRecipe,
  requireRecipeName,
  requireUniqueOutputFieldNames,
  requireUniqueProjectContextNames
} from "./recipeValidation";

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

describe("recipe configurable field validation", () => {
  it("detects duplicate output field names case-insensitively", () => {
    const duplicates = getDuplicateOutputFieldNameIndexes([
      { name: "Summary" },
      { name: "Budget" },
      { name: " summary " },
      { name: "" },
      { name: " " },
    ]);

    expect([...duplicates]).toEqual([0, 2]);
    expect(hasUniqueOutputFieldNames([{ name: "Summary" }, { name: "Budget" }])).toBe(true);
    expect(hasUniqueOutputFieldNames([{ name: "Summary" }, { name: "summary" }])).toBe(false);
    expect(() => requireUniqueOutputFieldNames([{ name: "Summary" }, { name: "summary" }])).toThrow(
      DUPLICATE_OUTPUT_FIELD_ERROR
    );
  });

  it("detects duplicate project context names case-insensitively and ignores blanks", () => {
    const duplicates = getDuplicateProjectContextNameIndexes([
      { name: "project.pdf" },
      { name: null },
      { name: " PROJECT.pdf " },
      { name: "" },
    ]);

    expect([...duplicates]).toEqual([0, 2]);
    expect(hasUniqueProjectContextNames([{ name: "notes.txt" }, { name: null }])).toBe(true);
    expect(hasUniqueProjectContextNames([{ name: "notes.txt" }, { name: "NOTES.txt" }])).toBe(false);
    expect(() => requireUniqueProjectContextNames([{ name: "notes.txt" }, { name: "NOTES.txt" }])).toThrow(
      DUPLICATE_PROJECT_CONTEXT_ERROR
    );
  });
});
