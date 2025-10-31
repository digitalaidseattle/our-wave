import { z } from "zod";
import { MSG, VALIDATION } from "../../constants/validation";

// required trimmed text (e.g., "Title is required")
const req = (label: string) =>
  z.string().trim().min(VALIDATION.MIN_LEN, { message: MSG.required(label) });

// GrantInput { key, value }
const grantInput = z.object({
  key: req("Key"),
  value: req("Value"),
});

// GrantOutput { name, maxWords }
const grantOutput = z.object({
  name: req("Name"),
  maxWords: z.number().int().gte(0),
});

// Recipe rules (only the fields that matter today)
export const grantRecipeSchema = z.object({
  description: req("Description"),
  prompt: req("Prompt"),
  modelType: req("Model type"),

  tokenString: z.string().trim().optional(),
  tokenCount: z.number().int().nonnegative().optional(),

  inputParameters: z.array(grantInput).optional(),
  outputsWithWordCount: z.array(grantOutput).optional(),
  proposalIds: z.array(z.string().trim()).optional(),
});

// Proposal rules
export const grantProposalSchema = z.object({
  grantRecipeId: req("Grant recipe"),
  rating: z.number().min(VALIDATION.RATING_MIN).max(VALIDATION.RATING_MAX).nullable().optional(),
  textResponse: z.string().trim().optional(),
  structuredResponse: z.record(z.string(), z.string()).optional(), // { [key: string]: string }
});

// exported input types for callers
export type GrantRecipeInput = z.input<typeof grantRecipeSchema>;
export type GrantProposalInput = z.input<typeof grantProposalSchema>;
