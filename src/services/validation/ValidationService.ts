import { z } from "zod";
import {
  grantProposalSchema,
  grantRecipeSchema,
  type GrantProposalInput,
  type GrantRecipeInput,
} from "./schemas";

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
}

// Instance based; schemas are injectable for tests
export class ValidationService implements IValidationService {
  constructor(
    private readonly recipeSchema = grantRecipeSchema,
    private readonly proposalSchema = grantProposalSchema
  ) {}

  validateGrantRecipe(data: GrantRecipeInput): ValidationResult {
    const r = this.recipeSchema.safeParse(data);
    return r.success ? { valid: true, errors: {} } : { valid: false, errors: mapIssues(r.error.issues) };
  }

  validateGrantProposal(data: GrantProposalInput): ValidationResult {
    const r = this.proposalSchema.safeParse(data);
    return r.success ? { valid: true, errors: {} } : { valid: false, errors: mapIssues(r.error.issues) };
  }
}

export const validationService = new ValidationService();
