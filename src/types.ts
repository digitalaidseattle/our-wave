/**
 * grants/types.ts
*
*/

import { Entity } from "@digitalaidseattle/core";


export type Timestamp = {
    seconds: number;
    nanoseconds: number;
}

export type GrantInput = {
    key: string;
    value: string;
}

export type GrantOutput = {
    name: string;
    maxWords: number;
}

export type GrantRecipe = Entity & {
    createdAt: Timestamp | Date;
    createdBy: string;
    updatedAt: Timestamp | Date;
    updatedBy: string;
    description: string;
    prompt: string;  // Instructions for AI
    inputParameters: GrantInput[]; // AI will be asked to include this information
    outputsWithWordCount: GrantOutput[]; // AI will be based to output the data with these constraints
    tokenString: string;  // Store what will be sent to AI
    tokenCount: number;
    proposalIds: string[];
    modelType: string;  // "gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite";
}

export type GrantProposal = Entity & {
    createdAt: Timestamp | Date;
    createdBy: string;
    grantRecipeId: string;
    rating: number | null;  // Allow User to rate the response
    textResponse?: string;  // Store AI respons3
    structuredResponse?: Map<string, string>; // Store AI structured response
}

