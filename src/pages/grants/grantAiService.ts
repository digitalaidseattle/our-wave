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

import { GrantContext } from "../../types";
import { createPartFromText, createUserContent, GoogleGenAI, Part } from "@google/genai";
class GrantAiService {

    static models = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite"];
    static instance: GrantAiService;
    
    static getInstance() {
        if (!GrantAiService.instance) {
            GrantAiService.instance = new GrantAiService();
        }
        return GrantAiService.instance;
    }

    //ai = getAI(firebaseClient, { backend: new GoogleAIBackend() });
    ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    /**
     * Runs a basic text generation request.
     * This is for prompts where we just want the model to return a text response.
     */
    async query(prompt: string, modelType?: string, contexts?: GrantContext[]): Promise<any> {
        const parts = contexts ? await this.uploadFiles(contexts) : [];
        return await this.ai.models.generateContent({
            model: modelType ?? GrantAiService.models[0],
            contents: createUserContent([
                prompt, ...parts
            ]),
        });
    }

    async uploadFiles(contexts: GrantContext[]): Promise<Part[]> {
        return contexts.map(gc => createPartFromText(gc.value!));
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
        const parts = contexts ? await this.uploadFiles(contexts) : [];
        const responseSchema = this.createSchema(schemaParams);
        return await this.ai.models.generateContent({
            model: modelType ?? GrantAiService.models[0],
            contents: [prompt, ...parts],
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: responseSchema,
            },
        });
    }

}

export { GrantAiService };
