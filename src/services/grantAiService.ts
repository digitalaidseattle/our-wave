/**
 * GrantAiService.ts
 *
 *  @copyright 2026 Digital Aid Seattle
 * 
*/

import { StorageFile } from "./OurWaveStorageService";
import { AiResponse, GrantContext } from "../types";


export interface GrantAiService {

    structuredQuery(prompt: string, schemaParams: string[], modelType?: string, contexts?: GrantContext[]): Promise<AiResponse>;

    query(prompt: string, modelType?: string, contexts?: GrantContext[]): Promise<AiResponse>;

    calcTokenCount(model: string, content: string): Promise<number>;

    calcFileTokenCount(model: string, file: File): Promise<number | null>;

    calcStorageFileTokenCount(model: string, file: StorageFile): Promise<number>;

    getModels(): string[];

    getDefaultModel(): string

}

