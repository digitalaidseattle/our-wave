import { User } from "@digitalaidseattle/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authService, storageService } from "../App";
import { DUPLICATE_RECIPE_NAME_ERROR, grantRecipeService } from "../services/grantRecipeService";
import { GrantRecipe } from "../types";
import { DUPLICATE_OUTPUT_FIELD_ERROR, DUPLICATE_PROJECT_CONTEXT_ERROR } from "../utils/recipeValidation";
import { saveRecipe } from "./SaveRecipe";

vi.mock("../App", () => ({
  authService: {
    getUser: vi.fn(),
  },
  storageService: {
    list: vi.fn().mockResolvedValue([]),
    removeFile: vi.fn(),
    upload: vi.fn(),
  },
}));

describe("saveRecipe", () => {
  beforeEach(() => {
    vi.mocked(storageService.list).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("raises the shared duplicate error from service-level validation", async () => {
    vi.spyOn(grantRecipeService, "descriptionExists").mockResolvedValue(true);

    await expect(grantRecipeService.assertUniqueDescription("Existing Recipe")).rejects.toThrow(
      DUPLICATE_RECIPE_NAME_ERROR
    );
  });

  it("blocks saving a recipe with a duplicate description", async () => {
    const user = { email: "email@me.com" } as User;
    const recipe = {
      description: "Existing Recipe",
      contexts: [],
    } as unknown as GrantRecipe;

    vi.spyOn(authService, "getUser").mockResolvedValue(user);
    vi.spyOn(grantRecipeService, "descriptionExists").mockResolvedValue(true);
    const generatePromptSpy = vi.spyOn(grantRecipeService, "generatePromptWithInputs");
    const insertSpy = vi.spyOn(grantRecipeService, "insert");
    const updateSpy = vi.spyOn(grantRecipeService, "update");

    await expect(saveRecipe(recipe)).rejects.toThrow(DUPLICATE_RECIPE_NAME_ERROR);

    expect(grantRecipeService.descriptionExists).toHaveBeenCalledWith("Existing Recipe", undefined);
    expect(generatePromptSpy).not.toHaveBeenCalled();
    expect(insertSpy).not.toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("blocks saving a recipe with duplicate output field names before service calls", async () => {
    const recipe = {
      description: "Unique Recipe",
      contexts: [],
      outputsWithWordCount: [
        { name: "Summary", maxWords: 500, unit: "words" },
        { name: " summary ", maxWords: 250, unit: "words" },
      ],
    } as unknown as GrantRecipe;

    const descriptionExistsSpy = vi.spyOn(grantRecipeService, "descriptionExists");
    const generatePromptSpy = vi.spyOn(grantRecipeService, "generatePromptWithInputs");

    await expect(saveRecipe(recipe)).rejects.toThrow(DUPLICATE_OUTPUT_FIELD_ERROR);

    expect(descriptionExistsSpy).not.toHaveBeenCalled();
    expect(generatePromptSpy).not.toHaveBeenCalled();
  });

  it("blocks saving a recipe with duplicate project context names before service calls", async () => {
    const recipe = {
      description: "Unique Recipe",
      contexts: [
        { type: "application/pdf", name: "Project.pdf", value: "" },
        { type: "application/pdf", name: " project.pdf ", value: "" },
      ],
      outputsWithWordCount: [],
    } as unknown as GrantRecipe;

    const descriptionExistsSpy = vi.spyOn(grantRecipeService, "descriptionExists");
    const generatePromptSpy = vi.spyOn(grantRecipeService, "generatePromptWithInputs");

    await expect(saveRecipe(recipe)).rejects.toThrow(DUPLICATE_PROJECT_CONTEXT_ERROR);

    expect(descriptionExistsSpy).not.toHaveBeenCalled();
    expect(generatePromptSpy).not.toHaveBeenCalled();
  });

  it("saves a recipe when the description is unique", async () => {
    const user = { email: "email@me.com" } as User;
    const recipe = {
      description: " Unique Recipe ",
      contexts: [],
    } as unknown as GrantRecipe;
    const inserted = { id: "recipe-1", description: "Unique Recipe" } as GrantRecipe;

    vi.spyOn(authService, "getUser").mockResolvedValue(user);
    vi.spyOn(grantRecipeService, "descriptionExists").mockResolvedValue(false);
    vi.spyOn(grantRecipeService, "generatePromptWithInputs").mockResolvedValue("prompt");
    const insertSpy = vi.spyOn(grantRecipeService, "insert").mockResolvedValue(inserted);

    await expect(saveRecipe(recipe)).resolves.toBe(inserted);

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ description: "Unique Recipe", prompt: "prompt" }),
      undefined,
      undefined,
      user
    );
  });
});
