/**
 * GeminiService.ts
 *
 *  @copyright 2026 Digital Aid Seattle
 * 
*/

import { createPartFromText, createPartFromUri, createUserContent, GoogleGenAI, Part } from "@google/genai";
import { SettingsService } from "../settingsService";
import { AiResponse, GrantContext } from "../../types";
import { storageService } from "../../App";
import { UrlContextService } from "../urlContextService";
import { StorageFile } from "@digitalaidseattle/core";
import { GrantAiService } from "../grantAiService";

const CLOUD_FOLDER = import.meta.env.VITE_FIREBASE_STORAGE_FOLDER;

export class GeminiService implements GrantAiService {

    static DEFAULT_MODEL = "gemini-flash-latest";
    static instance: GeminiService;

    static getInstance() {
        if (!GeminiService.instance) {
            GeminiService.instance = new GeminiService();
        }
        return GeminiService.instance;
    }

    // Lazy initialize so missing key does not crash page render.
    private ai?: GoogleGenAI;

    constructor() {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (apiKey) {
            this.ai = new GoogleGenAI({ apiKey });
        }
    }

    private requireAi(): GoogleGenAI {
        if (!this.ai) {
            throw new Error("Gemini API key is missing. Set VITE_GEMINI_API_KEY in your environment.");
        }
        return this.ai;
    }

    /**
     * Runs a basic text generation request.
     * This is for prompts where we just want the model to return a text response.
     */
    async query(prompt: string, modelType?: string, contexts?: GrantContext[]): Promise<AiResponse> {
        const ai = this.requireAi();
        const parts = await this.createParts(contexts ?? []);
        const model = modelType ?? await this.getDefaultModel();
        const response = await ai.models.generateContent({
            model: model,
            contents: createUserContent([
                prompt, ...parts
            ]),
        });
        return {
            content: response.text!,
            tokenCount: response.usageMetadata ? response.usageMetadata.totalTokenCount : undefined
        }
    }

    async createParts(contexts: GrantContext[]): Promise<Part[]> {
        const parts = await Promise.all(contexts.map(async (gc, idx) => {
            switch (gc.type) {
                case 'url':
                    return gc.value ? this.createPartFromURL(gc.value) : null;
                case 'text':
                    return gc.value ? createPartFromText(gc.value) : null;
                default: {
                    // Any other type is a file MIME type (e.g. application/pdf)
                    const uri = await storageService.getDownloadURL(`${CLOUD_FOLDER}/${gc.name}`);
                    return createPartFromUri(uri, contexts[idx].type);
                }
            }
        }));
        return parts.filter((part): part is Part => part !== null);
    }

    async createPartFromURL(value: string): Promise<Part> {
        const html = await UrlContextService.getInstance().fetchPageText(value);
        return createPartFromText(html);
    }

    createSchema(schemaParams: string[]): any {
        return {
            type: 'object',
            properties: Object.fromEntries(
                schemaParams.map(field => [field, { type: "string" }])
            ),
            required: schemaParams
        };
    }
    /**
     * Sends a prompt to the AI and tells it which fields to return.
     * 
     * You give it a list of field names (like ["Summary", "Budget"]),
     * and the AI will return a JSON object with those fields filled in.
     */
    async structuredQuery(
        prompt: string,
        schemaParams: string[],
        modelType?: string,
        contexts?: GrantContext[],
    ): Promise<AiResponse> {
        const ai = this.requireAi();
        const parts = await this.createParts(contexts ?? []);
        const responseSchema = this.createSchema(schemaParams);
        const model = modelType ?? await this.getDefaultModel();

        const response = await ai.models.generateContent({
            model: model,
            contents: [prompt, ...parts],
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: responseSchema,
            },
        });
        return ({
            content: JSON.parse(response.text!),
            tokenCount: response.usageMetadata ? response.usageMetadata.totalTokenCount : undefined,
        })
    }

    async calcTokenCount(model: string, content: string): Promise<number> {
        const ai = this.requireAi();
        return ai.models
            .countTokens({
                model: model,
                contents: ["Count tokens for this document", content]
            })
            .then(response => response.totalTokens ?? 0);
    }

    async calcFileTokenCount(model: string, file: File): Promise<number | null> {
        try {
            const ai = this.requireAi();
            const uploaded = await ai.files.upload({
                file: file,
                config: { mimeType: file.type },
            });
            const response = await ai.models.countTokens({
                model: model,
                contents: createUserContent([
                    "Count tokens for this document",
                    createPartFromUri(uploaded.uri!, uploaded.mimeType!),
                ])
            });
            return response.totalTokens ?? 0;
        } catch (err) {
            // NOTE: ai.files.upload() is a server-side Gemini Files API — it fails in the
            // browser due to CORS and API key restrictions. Token count will be unavailable
            // for binary files (e.g. PDFs) uploaded directly from the browser.
            // calcStorageFileTokenCount has the same issue and also returns null-equivalent.
            // TODO: Move file token counting to a Firebase Cloud Function.
            console.error("Error calculating token count for file", err);
            return null;
        }
    }

    async calcStorageFileTokenCount(model: string, file: StorageFile): Promise<number> {
        try {
            const ai = this.requireAi();
            const uri = await storageService.getDownloadURL(file.fullPath);
            return ai.models
                .countTokens({
                    model: model,
                    contents: createUserContent([
                        "Count tokens for this document",
                        createPartFromUri(uri, file.type ?? "application/octet-stream"),
                    ])
                })
                .then(response => response.totalTokens ?? 0);
        } catch (err) {
            console.error("Error calculating token count for FirebaseStorageFile", err);
            return 0;
        }
    }

    async getModels(): Promise<string[]> {
        return SettingsService.getInstance()
            .getSettings()
            .then(settings => settings.models ?? [])
    }

    async getDefaultModel(): Promise<string> {
        return SettingsService.getInstance()
            .getSettings()
            .then(settings => settings.models ? settings.models[0] : GeminiService.DEFAULT_MODEL)
    }

}
