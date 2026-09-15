/**
 * Configuration.ts
 * 
 * @copyright 2025 Digital Aid Seattle
*/

import { GrantAiService } from "./grantAiService";

export class Configuration {
    private static instance: Configuration;

    public static getInstance(): Configuration {
        if (!Configuration.instance) {
            throw new Error('Ai system needs to be configured.');
        }
        return Configuration.instance;
    }

    static props(props: { aiService: GrantAiService }) {
        Configuration.instance = new Configuration(props);
    }

    aiService: GrantAiService;

    private constructor(props: { aiService: GrantAiService }) {
        this.aiService = props.aiService;
    }
}