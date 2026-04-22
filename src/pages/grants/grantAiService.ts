/**
 * Institution AI Service
 * This service interacts with the AI backend to generate content related to institutions.
 * It uses the Firebase AI SDK to create a generative model that can respond to prompts
 * about institutions, such as listing philanthropic organizations in a specific area.  
 * 
 * Provision Firebase application  in Google Cloud
 * <ol>
 * <li>Go to the Google Cloud Console.</li>
 * <li>Select an existing project.</li>
 * <li>Navigate to the "APIs & Services" page.</li>
 * <li>Click on "Credential".</li>
 * <li>Edit API (the key should match the API key in the .env file).</li>
 * <li>Enable the "Generative Language API" and "Firebase AI Logic API" restrictions.</li>
 * </ol>
 */

import { createPartFromText, createPartFromUri, createUserContent, GoogleGenAI, Part } from "@google/genai";
import { storageService } from "../../App";
import { FIREBASE_STORAGE_FOLDER } from "../../constants/storage";
import { StorageFile } from "../../services/OurWaveStorageService";
import { GrantContext } from "../../types";

class GrantAiService {

    static models = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite"];
    static instance: GrantAiService;

    static getInstance() {
        if (!GrantAiService.instance) {
            GrantAiService.instance = new GrantAiService();
        }
        return GrantAiService.instance;
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
    async query(prompt: string, modelType?: string, contexts?: GrantContext[]): Promise<any> {
        const ai = this.requireAi();
        const parts = this.createParts(contexts ?? []);
        return await ai.models.generateContent({
            model: modelType ?? GrantAiService.models[0],
            contents: createUserContent([
                prompt, ...parts
            ]),
        });
    }

    createParts(contexts: GrantContext[]): Part[] {
        const parts: Part[] = [];
        contexts.forEach(async (gc, idx) => {
            if (gc.type === 'text') {
                parts.push(createPartFromText(gc.value!));
            } else {
                const uri = await storageService.getDownloadURL(`${FIREBASE_STORAGE_FOLDER}/${gc.name}`);
                parts.push(createPartFromUri(uri, contexts[idx].type));
            }
        });
        return parts;
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
    async parameterizedQuery(
        prompt: string,
        schemaParams: string[],
        modelType?: string,
        contexts?: GrantContext[],
    ): Promise<any> {
        const ai = this.requireAi();
        const parts = this.createParts(contexts ?? []);
        console.log('parameterizedQuery parts:', parts);
        const responseSchema = this.createSchema(schemaParams);
        return await ai.models.generateContent({
            model: modelType ?? GrantAiService.models[0],
            contents: [prompt, ...parts],
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: responseSchema,
            },
        });
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

    async calcFileTokenCount(model: string, file: File): Promise<number> {
        const ai = this.requireAi();
        // const bytes = await fileToBase64(file);
        console.log("Calculating token count for file:", file);
        const uploaded = await ai.files.upload({
            file: file,
            config: { mimeType: file.type },
        });

        return ai.models
            .countTokens(
                {
                    model: model,
                    contents: createUserContent([
                        "Count tokens for this document",
                        createPartFromUri(uploaded.uri!, uploaded.mimeType!),
                    ])
                })
            .then(response => response.totalTokens ?? 0)
            .catch(err => {
                console.error("Error calculating token count for file", err);
                return 0;
            })
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
}

export { GrantAiService };
