import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@digitalaidseattle/core";
import type { GrantRecipe } from "../types";

vi.mock("../App", () => ({
  authService: { getUser: vi.fn() },
}));

vi.mock("../services/grantRecipeService", () => ({
  grantRecipeService: { insert: vi.fn() },
}));

import { authService } from "../App";
import { grantRecipeService } from "../services/grantRecipeService";
import { cloneRecipe } from "./CloneRecipe";

describe("cloneRecipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clones a named recipe", async () => {
    const user = { email: "email@me.com" } as User;
    const recipe = { description: "desc" } as GrantRecipe;
    const inserted = { id: "clone-id" } as GrantRecipe;
    vi.mocked(authService.getUser).mockResolvedValue(user);
    vi.mocked(grantRecipeService.insert).mockResolvedValue(inserted);

    await expect(cloneRecipe(recipe)).resolves.toBe(inserted);

    expect(grantRecipeService.insert).toHaveBeenCalledWith(expect.objectContaining({
      description: "Clone of desc",
      createdBy: "email@me.com",
      updatedBy: "email@me.com",
    }));
  });

  it("rejects a blank recipe name before persistence", async () => {
    await expect(cloneRecipe({ description: "  " } as GrantRecipe)).rejects.toThrow(
      "Recipe name is required to clone."
    );

    expect(authService.getUser).not.toHaveBeenCalled();
    expect(grantRecipeService.insert).not.toHaveBeenCalled();
  });
});
