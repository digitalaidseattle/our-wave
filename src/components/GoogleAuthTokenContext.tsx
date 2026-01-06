/**
 * HelpTopicContext.tsx
 * 
 * @copyright 2025 Digital Aid Seattle
*/
import { createContext } from "react";

interface GoogleAuthTokenContextType {
    token: string | null,
    setToken: (t: string | null) => void
}
export const GoogleAuthTokenContext = createContext<GoogleAuthTokenContextType>({
    token: null,
    setToken: () => { }
});

