import { z } from "zod";
import {
  grantProposalSchema,
  grantRecipeSchema,
  type GrantProposalInput,
  type GrantRecipeInput,
} from "./schemas";
import type { GrantContext } from "../../types";
import { DUPLICATE_FILE_NAME_ERROR, DUPLICATE_PROJECT_CONTEXT_ERROR, INVALID_URL_CONTEXT_ERROR } from "../../utils/recipeValidation";
import { UrlContextService } from "../urlContextService";

export type ValidationResult = { valid: boolean; errors: Record<string, string> };

// zod issues -> { field: message }
const mapIssues = (issues: z.ZodError["issues"]): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
};

// Small interface so tests can mock/replace this easily
export interface IValidationService {
  validateGrantRecipe(data: GrantRecipeInput): ValidationResult;
  validateGrantProposal(data: GrantProposalInput): ValidationResult;
  validateContextValue(context: GrantContext, contexts: GrantContext[]): ValidationResult;
  validateFiles(files: File[], contexts: GrantContext[]): ValidationResult;
}

// Instance based; schemas are injectable for tests
export class ValidationService implements IValidationService {
  constructor(
    private readonly recipeSchema = grantRecipeSchema,
    private readonly proposalSchema = grantProposalSchema,
    private readonly urlContextService = UrlContextService.getInstance()
  ) { }

  validateGrantRecipe(data: GrantRecipeInput): ValidationResult {
    const r = this.recipeSchema.safeParse(data);
    return r.success ? { valid: true, errors: {} } : { valid: false, errors: mapIssues(r.error.issues) };
  }

  validateGrantProposal(data: GrantProposalInput): ValidationResult {
    const r = this.proposalSchema.safeParse(data);
    return r.success ? { valid: true, errors: {} } : { valid: false, errors: mapIssues(r.error.issues) };
  }

  // fails when a url context is not a valid http/https url,
  // or when another context (not this one) has the same trimmed, case-insensitive value
  validateContextValue(context: GrantContext, contexts: GrantContext[]): ValidationResult {
    const value = (context.value ?? "").trim().toLowerCase();
    if (!value) return { valid: true, errors: {} };

    if (context.type === "url" && !this.urlContextService.isValidUrl(value)) {
      return { valid: false, errors: { value: INVALID_URL_CONTEXT_ERROR } };
    }

    const isDuplicate = contexts
      .some(other => (other.value ?? "").trim().toLowerCase() === value);

    return isDuplicate
      ? { valid: false, errors: { value: DUPLICATE_PROJECT_CONTEXT_ERROR } }
      : { valid: true, errors: {} };
  }

  // fails for each file whose trimmed, case-insensitive name matches an existing context value;
  // errors are keyed by file name
  validateFiles(files: File[], contexts: GrantContext[]): ValidationResult {
    const values = new Set(
      contexts
        .filter(context => !!context.name)
        .map(context => (context.name ?? "").trim().toLowerCase()).filter(Boolean)
    );
    const errors: Record<string, string> = {};
    for (const file of files) {
      if (values.has(file.name.trim().toLowerCase())) {
        errors[file.name] = DUPLICATE_FILE_NAME_ERROR;
      }
    }
    return { valid: Object.keys(errors).length === 0, errors };
  }
}

export const validationService = new ValidationService();