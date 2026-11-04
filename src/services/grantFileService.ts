import type { GrantContext, GrantRecipe } from "../types";
import { Configuration } from "./Configuration";

export const DUPLICATE_RECIPE_NAME_ERROR = "Duplicate recipe name already exists.";

export class GrantFileService {
  static SUPPORTED_FILE_TYPES = [
    "text/plain",
    "application/pdf",
    "text/html",
    "application/json",
    "text/markdown"
  ];

  static TEXT_READABLE_TYPES = [
    "text/plain",
    "text/html",
    "application/json",
    "text/markdown"
  ];

  isFileContext(context: GrantContext): boolean {
    return GrantFileService.SUPPORTED_FILE_TYPES.includes(context.type);
  }

  isSupportFileType(fileType: string): boolean {
    return GrantFileService.SUPPORTED_FILE_TYPES.includes(fileType);
  }

  async createContext(recipe: GrantRecipe, files: File[]): Promise<GrantContext[]> {
    const grantAiService = Configuration.getInstance().aiService;

    const contexts: GrantContext[] = [];
    for (const file of files) {
      // Calculate token counts; null means unavailable (e.g. browser CORS restriction on Gemini Files API)
      // Text-readable files are read directly and counted via calcTokenCount (works in browser).
      // Binary files (e.g. PDF) must use calcFileTokenCount which requires server-side API — returns null in browser.
      let tokenCount: number | null = null;
      if (GrantFileService.TEXT_READABLE_TYPES.includes(file.type)) {
        try {
          const text = await file.text();
          tokenCount = await grantAiService.calcTokenCount(recipe.modelType, text);
        } catch (err) {
          console.error("Error calculating token count for text file", err);
          tokenCount = null;
        }
      } else {
        tokenCount = await grantAiService.calcFileTokenCount(recipe.modelType, file);
      }
      const newContext: GrantContext = {
        type: file.type,
        value: "",
        name: file.name,
        file: file
      };
      // Firestore rejects literal `undefined` field values, so only set tokenCount when known
      if (tokenCount !== null) {
        newContext.tokenCount = tokenCount;
      }
      contexts.push(newContext);
    }
    return contexts;
  }


}
