import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GrantRecipe } from "../types";

vi.mock("../services/grantRecipeService", () => ({
  grantRecipeService: {
    empty: vi.fn(),
    insert: vi.fn(),
  },
}));

import { grantRecipeService } from "../services/grantRecipeService";
import { createRecipe } from "./CreateRecipe";

describe("createRecipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a blank local recipe without persisting it", async () => {
    const recipe = { description: "" } as GrantRecipe;
    vi.mocked(grantRecipeService.empty).mockReturnValue(recipe);

    await expect(createRecipe()).resolves.toBe(recipe);

    expect(grantRecipeService.empty).toHaveBeenCalledOnce();
    expect(grantRecipeService.insert).not.toHaveBeenCalled();
  });
});
