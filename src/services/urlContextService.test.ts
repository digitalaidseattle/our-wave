/**
 * urlContextService.test.ts
 *
 * @copyright 2026 Digital Aid Seattle
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UrlContextService } from './urlContextService';

function makeResponse(body: string, status = 200, statusText = 'OK'): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    text: () => Promise.resolve(body),
  } as unknown as Response;
}

describe('UrlContextService', () => {
  let service: UrlContextService;

  beforeEach(() => {
    service = new UrlContextService();
    vi.restoreAllMocks();
  });

  // ── isValidUrl ────────────────────────────────────────────────────────────

  describe('isValidUrl', () => {
    it('returns true for a valid https URL', () => {
      expect(service.isValidUrl('https://example.com')).toBe(true);
    });

    it('returns true for a valid http URL', () => {
      expect(service.isValidUrl('http://example.com/path?q=1')).toBe(true);
    });

    it('returns false for ftp scheme', () => {
      expect(service.isValidUrl('ftp://example.com')).toBe(false);
    });

    it('returns false for plain text', () => {
      expect(service.isValidUrl('not-a-url')).toBe(false);
    });

    it('returns false for an empty string', () => {
      expect(service.isValidUrl('')).toBe(false);
    });

    it('trims whitespace before validating', () => {
      expect(service.isValidUrl('  https://example.com  ')).toBe(true);
    });
  });

  // ── fetchPageText ─────────────────────────────────────────────────────────

  describe('fetchPageText', () => {
    it('fetches via proxy and returns raw html', async () => {
      const html = '<html><body><p>Hello from the web</p></body></html>';
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(html)));

      const result = await service.fetchPageText('https://example.com');
      expect(result).toBe(html);
      expect(fetch).toHaveBeenCalledWith(
        `/api/fetch-url?url=${encodeURIComponent('https://example.com')}`
      );
    });

    it('throws for an invalid URL', async () => {
      await expect(service.fetchPageText('not-a-url')).rejects.toThrow(/Invalid URL/);
    });

    it('throws when the response is not OK', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse('Not Found', 404, 'Not Found')));
      await expect(service.fetchPageText('https://example.com/missing')).rejects.toThrow(/404/);
    });

    it('propagates network errors', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
      await expect(service.fetchPageText('https://example.com')).rejects.toThrow('Failed to fetch');
    });

    it('trims whitespace from the URL before fetching', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeResponse('<p>ok</p>'));
      vi.stubGlobal('fetch', fetchMock);
      await service.fetchPageText('  https://example.com  ');
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/fetch-url?url=${encodeURIComponent('https://example.com')}`
      );
    });
  });

  // ── singleton ─────────────────────────────────────────────────────────────

  describe('getInstance', () => {
    it('returns the same instance on successive calls', () => {
      const a = UrlContextService.getInstance();
      const b = UrlContextService.getInstance();
      expect(a).toBe(b);
    });
  });
});
