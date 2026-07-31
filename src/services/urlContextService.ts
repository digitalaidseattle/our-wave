/**
 * urlContextService.ts
 *
 * Fetches a URL and extracts readable plain text from the HTML content,
 * suitable for use as a GrantContext value.
 *
 * Note: Browser CORS restrictions apply — this works for pages that allow
 * cross-origin requests. For restricted pages a server-side proxy is needed.
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
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  /**
   * Fetches the page at `url` and returns its readable plain-text content.
   * Strips HTML tags, collapses whitespace, and trims the result.
   *
   * Throws if the URL is invalid, the fetch fails, or the response is not OK.
   */
  async fetchPageText(url: string): Promise<string> {
    const trimmed = url.trim();

    if (!this.isValidUrl(trimmed)) {
      throw new Error(`Invalid URL: "${trimmed}". Only http and https URLs are supported.`);
    }

    const response = await fetch(trimmed);

    if (!response.ok) {
      throw new Error(`Failed to fetch URL (${response.status} ${response.statusText}): ${trimmed}`);
    }

    const html = await response.text();
    return this.extractText(html);
  }

  /**
   * Extracts readable plain text from an HTML string.
   * Uses DOMParser when available (browser/jsdom), falls back to regex stripping.
   *
   * Block-level elements are replaced with a space before text extraction so
   * adjacent headings/paragraphs are separated in the output.
   */
  extractText(html: string): string {
    // Block-level tags whose closing tag should become a space separator
    const blockTagPattern = /<\/?(?:address|article|aside|blockquote|canvas|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|nav|noscript|ol|p|pre|section|summary|table|tfoot|thead|tbody|tr|td|th|ul|video)\b[^>]*>/gi;

    if (typeof DOMParser !== "undefined") {
      const doc = new DOMParser().parseFromString(html, "text/html");

      // Remove script and style elements
      doc.querySelectorAll("script, style, noscript").forEach(el => el.remove());

      // `innerText` respects CSS visibility but is not reliable in jsdom;
      // use textContent after inserting space markers at block boundaries.
      const text = doc.body?.innerHTML ?? "";
      const withSpaces = text.replace(blockTagPattern, " ");
      const stripped = withSpaces.replace(/<[^>]+>/g, "");
      // Decode common HTML entities
      const decoded = stripped
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");
      return this.normalizeWhitespace(decoded);
    }

    // Fallback: strip tags with regex (used in Node environments without jsdom)
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(blockTagPattern, " ")
      .replace(/<[^>]+>/g, "");
    return this.normalizeWhitespace(stripped);
  }

  private normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, " ").trim();
  }
}

export const urlContextService = UrlContextService.getInstance();
