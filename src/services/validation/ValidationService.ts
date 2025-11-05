// runs schema checks and returns { valid, errors }
import { z } from "zod";
import {
  grantProposalSchema,
  grantRecipeSchema,
  type GrantProposalInput,
  type GrantRecipeInput,
} from "./schemas";

export type ValidationResult = { valid: boolean; errors: Record<string, string> };

// turn Zod issues into { field: message }
const mapIssues = (issues: z.ZodError["issues"]): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.join("."); // "description" or "inputParameters.0.key"
    if (!out[key]) out[key] = issue.message;
  }
  return out;
};

export class ValidationService {
  static validateGrantRecipe(data: GrantRecipeInput): ValidationResult {
    const r = grantRecipeSchema.safeParse(data);
    return r.success ? { valid: true, errors: {} } : { valid: false, errors: mapIssues(r.error.issues) };
  }

  static validateGrantProposal(data: GrantProposalInput): ValidationResult {
    const r = grantProposalSchema.safeParse(data);
    return r.success ? { valid: true, errors: {} } : { valid: false, errors: mapIssues(r.error.issues) };
  }
}
