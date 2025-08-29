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

class GeminiService {

    ai = getAI(firebaseClient, { backend: new GoogleAIBackend() });

    // Create a `GenerativeModel` instance with a model that supports your use case
    model = getGenerativeModel(this.ai, {
        model: "gemini-2.5-flash"
    });


    // Wrap in an async function so you can use await
    query(prompt: string): Promise<any> {
        // To generate text output, call generateContent with the text input
        console.log("Querying AI with prompt: ", prompt, this.model);
        return this.model.generateContent(prompt)
            .then(result => result.response.text())
            .catch(error => {
                console.error("Error querying AI: ", error);
                throw new Error("Failed to query AI: " + error.message);
            });
    }

    // Wrap in an async function so you can use await
    parameterizedQuery(schemaParams: string[], prompt: string): Promise<any> {
        // Provide a JSON schema object using a standard format.
        // Later, pass this schema object into `responseSchema` in the generation config.
        const schema = Schema.object({
            properties: {
                characters: Schema.array({
                    items: Schema.object({
                        properties: Object.fromEntries(schemaParams.map(field => [field, Schema.string()]))
                    }),
                }),
            }
        });

        // Create a `GenerativeModel` instance with a model that supports your use case
        const jModel = getGenerativeModel(this.ai, {
            model: "gemini-2.5-flash",
            // In the generation config, set the `responseMimeType` to `application/json`
            // and pass the JSON schema object into `responseSchema`.
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema
            },
        });

        // To generate text output, call generateContent with the text input
        console.log("Querying AI with prompt: ", prompt, this.model);
        return jModel.generateContent(prompt)
            .then(result => JSON.parse(result.response.text()).characters[0])
            .catch(error => {
                console.error("Error querying AI: ", error);
                throw new Error("Failed to query AI: " + error.message);
            });
    }

}

const geminiService = new GeminiService();
export { geminiService };

