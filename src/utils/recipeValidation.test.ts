import { describe, expect, it } from "vitest";
import { hasRecipeName, requireRecipeName } from "./recipeValidation";

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
});
