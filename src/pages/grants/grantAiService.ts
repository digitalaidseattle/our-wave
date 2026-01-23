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
import { createPartFromUri, createUserContent, GoogleGenAI, Part } from "@google/genai";

class GrantAiService {

    //ai = getAI(firebaseClient, { backend: new GoogleAIBackend() });
    ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    /**
     * Runs a basic text generation request.
     * This is for prompts where we just want the model to return a text response.
     */
    async query(prompt: string, modelType?: string, contexts?: GrantContext[]): Promise<string> {
        const parts = contexts ? await this.uploadFiles(contexts) : [];
        const response = await this.ai.models.generateContent({
            model: modelType ?? "gemini-2.5-flash",
            contents: createUserContent([
                prompt, ...parts
            ]),
        });
        return response.text!;
    }


    async uploadFiles(contexts: GrantContext[]): Promise<Part[]> {
        return [] as Part[];
        // createPartFromUri("", "")
        // (myfile.uri, myfile.mimeType)
        // const myfile = await this.ai.files.upload({
        //     file: "path/to/sample.mp3",
        //     config: { mimeType: "audio/mpeg" },

        // })
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
    ): Promise<Record<string, string>> {
        const parts = contexts ? await this.uploadFiles(contexts) : [];
        const responseSchema = this.createSchema(schemaParams);
        const response = await this.ai.models.generateContent({
            model: modelType ?? "gemini-2.5-flash",
            contents: [prompt, ...parts],
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: responseSchema,
            },
        });
        return JSON.parse(response.text!) as Record<string, string>;
    }

}

const grantAiService = new GrantAiService();
export { grantAiService };
