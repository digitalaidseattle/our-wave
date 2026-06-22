import type { Identifier, User } from "@digitalaidseattle/core";
import { FirestoreService } from "@digitalaidseattle/firebase";
import { collection, getDocs, limit, query, QueryConstraint, where } from "firebase/firestore";
import Handlebars from "handlebars";
import { authService } from "../App";
import { FIRESTORE_COLLECTIONS } from "../constants/firestoreCollections";
import type { GrantRecipe } from "../types";
import { SettingsService } from "./settingsService";

export const DUPLICATE_RECIPE_NAME_ERROR = "Duplicate recipe name already exists.";

class GrantRecipeService extends FirestoreService<GrantRecipe> {

  constructor() {
    super(FIRESTORE_COLLECTIONS.grantRecipes);
  }
  /**
   * Creates a blank recipe with default values.
   */
  empty(): GrantRecipe {
    const now = new Date();

    return {
      id: undefined,
      createdAt: now,
      createdBy: "",
      updatedAt: now,
      updatedBy: "",
      lastSubmitted: null,
      description: "",
      tags: [],
      rating: 0,
      template: "Create a grant proposal",
      prompt: "",
      contexts: [{ type: 'text', name: null, value: '', tokenCount: 0 }],
      outputsWithWordCount: [{ name: '', maxWords: 500, unit: 'words' }],
      inputParameters: [],
      tokenCount: 0,
      modelType: "gemini-2.5-flash",
    };
  }

  /**
   * Create: generates and stores the compiled prompt,
   * then adds timestamps and user metadata.
   */
  async insert(
    entity: GrantRecipe,
    select?: string,
    mapper?: (json: any) => GrantRecipe,
    user?: User
  ): Promise<GrantRecipe> {
    const sessionUser = user ?? await authService.getUser();
    if (!sessionUser?.email) {
      throw new Error("grantRecipeService.insert: user.email is required");
    }

    const now = new Date();
    const description = entity.description.trim();

    await this.assertUniqueDescription(description);

    // Compile prompt from template before saving
    const prompt = await this.generatePromptWithInputs(entity);

    const cleaned = {
      ...entity,
      description,
      contexts: (entity.contexts ?? []).map(gc => {
        const clone = { ...gc }
        delete clone.file;
        return clone
      })
    }
    delete cleaned.id;

    return super.insert(
      {
        ...cleaned,
        prompt,
        createdAt: now,
        createdBy: sessionUser.email,
        updatedAt: now,
        updatedBy: sessionUser.email,
      } as GrantRecipe,
      select,
      mapper,
      user
    );
  }

  /**
   * Update: regenerates the prompt from the template
   * and refreshes metadata.
   */
  async update(
    entityId: Identifier,
    updatedFields: GrantRecipe,
    select?: string,
    mapper?: (json: any) => GrantRecipe,
    user?: User
  ): Promise<GrantRecipe> {

    const sessionUser = user ?? await authService.getUser();
    if (!sessionUser) {
      throw new Error("No valid user found.");
    }

    const description = updatedFields.description.trim();

    await this.assertUniqueDescription(description, entityId);

    const cleaned = {
      ...updatedFields,
      description,
      contexts: (updatedFields.contexts ?? []).map(gc => {
        const clone = { ...gc }
        delete clone.file;
        return clone
      })
    }

    // Compile prompt from template before saving
    const prompt = await this.generatePromptWithInputs(updatedFields);
    console.log("Updating recipe with prompt:", prompt, cleaned);

    return super.update(
      entityId,
      {
        ...cleaned,
        prompt,
        updatedAt: new Date(),
        updatedBy: sessionUser.email,
      },
      select,
      mapper,
      user
    );
  }

  async generatePromptWithInputs(recipe: GrantRecipe): Promise<string> {
    const settings = await SettingsService.getInstance().getSettings();
    const output_fragment = settings.outputTemplate;
    const lowerBoundPercentage = settings.lowerBoundPercentage;
    const compiled = Handlebars.compile(recipe.template + output_fragment);

    return compiled({
      outputs: recipe.outputsWithWordCount.map(output => ({
        ...output,
        upperBound: output.maxWords,
        lowerBound: lowerBoundPercentage * output.maxWords
      }))
    });
  }

  async updatePrompt(recipe: GrantRecipe): Promise<GrantRecipe> {
    const prompt = await this.generatePromptWithInputs(recipe);

    // If token counting is needed later, it can live here
    // For now we keep existing tokenCount
    return {
      ...recipe,
      prompt,
    };
  }

  async queryByConstraints(...constraints: QueryConstraint[]): Promise<GrantRecipe[]> {
    const querySnapshot = await getDocs(query(
      collection(this.db, this.collectionName),
      ...constraints
    ));

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    } as GrantRecipe));
  }

  async findByDescription(description: string): Promise<GrantRecipe[]> {
    return this.queryByConstraints(
      where("description", "==", description.trim()),
      limit(2)
    );
  }

  async descriptionExists(description: string, currentRecipeId?: Identifier | null): Promise<boolean> {
    if (description.trim().length === 0) {
      return false;
    }

    const recipes = await this.findByDescription(description);
    const currentId = currentRecipeId == null ? null : String(currentRecipeId);

    return recipes.some(recipe => String(recipe.id) !== currentId);
  }

  async assertUniqueDescription(description: string, currentRecipeId?: Identifier | null): Promise<void> {
    const hasDuplicateDescription = await this.descriptionExists(description, currentRecipeId);
    if (hasDuplicateDescription) {
      throw new Error(DUPLICATE_RECIPE_NAME_ERROR);
    }
  }
}

export const grantRecipeService = new GrantRecipeService();
