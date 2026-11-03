/**
 * GrantContextEditor.test.ts
 *
 * @copyright 2026 Digital Aid Seattle
 */

import { describe, expect, it } from 'vitest';

import { getContextTokenLabel } from './contextTokenUtils';

describe('getContextTokenLabel', () => {
  it('shows unavailable for URL contexts before content is fetched', () => {
    const label = getContextTokenLabel({
      type: 'url',
      name: null,
      value: 'https://example.com',
    });

    expect(label).toContain('count unavailable');
  });

  it('shows the token count for a URL context once fetched', () => {
    const label = getContextTokenLabel({
      type: 'url',
      name: null,
      value: 'https://example.com',
      tokenCount: 42,
    });

    expect(label).toBe('Tokens: 42');
  });

  it('shows the token count for text contexts', () => {
    const label = getContextTokenLabel({
      type: 'text',
      name: null,
      value: 'hello world',
      tokenCount: 12,
    });

    expect(label).toBe('Tokens: 12');
  });
});
