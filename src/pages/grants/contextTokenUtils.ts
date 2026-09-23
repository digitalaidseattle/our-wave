/**
 * contextTokenUtils.ts
 *
 * @copyright 2026 Digital Aid Seattle
 */

import { GrantContext } from '../../types';
import { RECIPE_STRINGS } from '../../constants/grantRecipe';

export function getContextTokenLabel(context: GrantContext): string {
    if (context.tokenCount !== undefined) {
        return `Tokens: ${context.tokenCount}`;
    }

    return `Tokens: ${RECIPE_STRINGS.tokenCountUnavailable}`;
}
