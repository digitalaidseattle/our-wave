/**
 * urlContextService.ts
 *
 * Fetches raw HTML from a URL.
 *
 * Requests are routed through the Vite dev-server proxy at /api/fetch-url
 * to avoid browser CORS restrictions.
 *
 * @copyright 2026 Digital Aid Seattle
 */

export class UrlContextService {
  private static instance: UrlContextService;

  static getInstance(): UrlContextService {
    if (!UrlContextService.instance) {
      UrlContextService.instance = new UrlContextService();
    }
    return UrlContextService.instance;
  }

  /**
   * Validates that the given string is a well-formed http/https URL.
   */
  isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Fetches the page at `url` and returns raw HTML text.
   * Routes through /api/fetch-url proxy to avoid CORS restrictions.
   * Throws if the URL is invalid, the fetch fails, or the response is not OK.
   */
  async fetchPageText(url: string): Promise<string> {
    const trimmed = url.trim();

    if (!this.isValidUrl(trimmed)) {
      throw new Error(`Invalid URL: "${trimmed}". Only http and https URLs are supported.`);
    }

    const proxyUrl = `/api/fetch-url?url=${encodeURIComponent(trimmed)}`;
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch URL (${response.status} ${response.statusText}): ${trimmed}`);
    }

    return response.text();
  }
}

export const urlContextService = UrlContextService.getInstance();
