/**
 * grants/types.ts
 */

import { Entity, Identifier } from "@digitalaidseattle/core";

export type Timestamp = {
  seconds: number;
  nanoseconds: number;
};

export type GrantInput = {
  key: string;
  value: string;
};

export type GrantOutput = {
  name: string;
  maxWords: number;
  unit: "words" | "characters";
};

export type GrantRecipe = Entity & {
  createdAt: Timestamp | Date;
  createdBy: string;
  updatedAt: Timestamp | Date;
  updatedBy: string;
  description: string;
  rating: number;
  tags: string[];
  template: string;
  prompt: string;
  inputParameters: GrantInput[];
  outputsWithWordCount: GrantOutput[];
  tokenCount: number;
  proposalIds: string[];
  modelType: string; // "gemini-2.5-flash", etc.
};

export type GrantProposal = Entity & {
  createdAt: Timestamp | Date;
  createdBy: string;
  updatedAt: Timestamp | Date;
  updatedBy: string;
  grantRecipeId: Identifier;
  name: string;
  rating: number | null;
  structuredResponse?: { [key: string]: string };
};
