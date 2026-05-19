/**
 * HelpTopicContext.tsx
 * 
 * @copyright 2025 Digital Aid Seattle
*/
import { createContext } from "react";
import { GrantRecipe } from "../types";

interface GrantRecipeContextType {
    recipe: GrantRecipe,
    setRecipe: (t: GrantRecipe) => void
}

export const GrantRecipeContext = createContext<GrantRecipeContextType>({
    recipe: {} as GrantRecipe,
    setRecipe: () => { }
});

