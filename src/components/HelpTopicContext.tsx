/**
 * HelpTopicContext.tsx
 * 
 * @copyright 2025 Digital Aid Seattle
*/
import { createContext } from "react";

interface HelpTopicContextType {
    helpTopic: string | undefined,
    setHelpTopic: (t: string | undefined) => void
}
export const HelpTopicContext = createContext<HelpTopicContextType>({
    helpTopic: '',
    setHelpTopic: () => { }
});

