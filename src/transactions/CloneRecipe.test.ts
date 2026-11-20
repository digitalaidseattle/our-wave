import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCoreServices, type User } from "@digitalaidseattle/core";
import type { GrantRecipe } from "../types";

const { authService } = vi.hoisted(() => ({
  authService: { getUser: vi.fn() },
}));

vi.mock("@digitalaidseattle/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@digitalaidseattle/core")>()),
  getCoreServices: () => ({ authService }),
}));

vi.mock("../services/grantRecipeService", () => ({
  grantRecipeService: { insert: vi.fn() },
}));

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
    vi.mocked(getCoreServices().authService!.getUser).mockResolvedValue(user);
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

    expect(getCoreServices().authService!.getUser).not.toHaveBeenCalled();
    expect(grantRecipeService.insert).not.toHaveBeenCalled();
  });
});
