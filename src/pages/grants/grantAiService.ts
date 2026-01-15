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

import { firebaseClient } from "@digitalaidseattle/firebase";
import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from "firebase/ai";

class GrantAiService {

    static _instance: GrantAiService;
    static getInstance(): GrantAiService {
        if (!GrantAiService._instance) {
            GrantAiService._instance = new GrantAiService();
        }
        return GrantAiService._instance;
    }

    ai;
    model;

    private constructor() {
        this.ai = getAI(firebaseClient, { backend: new GoogleAIBackend() });

        // Default model used for simple text generation
        this.model = getGenerativeModel(this.ai, {
            model: "gemini-2.5-flash"
        });
    }

    /**
     * Runs a basic text generation request.
     * This is for prompts where we just want the model to return a text response.
     */
    query(prompt: string): Promise<string> {
        console.log("Querying AI with prompt:", prompt, this.model);

        return this.model.generateContent(prompt)
            .then(result => result.response.text())
            .catch(error => {
                console.error("Error querying AI:", error);
                throw new Error("Failed to query AI: " + error.message);
            });
    }

  /**
 * Sends a prompt to the AI and tells it which fields to return.
 * 
 * You give it a list of field names (like ["Summary", "Budget"]),
 * and the AI will return a JSON object with those fields filled in.
 */

    parameterizedQuery(
        schemaParams: string[],
        prompt: string,
        modelType: string = "gemini-2.5-flash"
    ): Promise<Record<string, string>> {

        // Build a schema where each field is expected to be a string.
        // This tells the model exactly what shape the output should have.
        const schema = Schema.object({
            properties: Object.fromEntries(
                schemaParams.map(field => [field, Schema.string()])
            ),
        });

        // Create a model instance that will use this schema for responses.
        const jModel = getGenerativeModel(this.ai, {
            model: modelType,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema
            },
        });

        console.log("Querying AI with structured prompt:", prompt, jModel);

        return jModel.generateContent(prompt)
            .then(result => {
                const text = result.response.text();

                // We expect the model to return a valid JSON object
                // matching the schema we provided.
                const parsed = JSON.parse(text) as Record<string, string>;
                return parsed;
            })
            .catch(error => {
                console.error("Error querying AI (structured):", error);
                throw new Error("Failed to query AI: " + error.message);
            });
    }

    calcTokenCount(model: string, prompt: string): Promise<number> {
        return getGenerativeModel(this.ai, { model: model })
            .countTokens(prompt)
            .then(response => response.totalTokens)
    }

}

export { GrantAiService };
