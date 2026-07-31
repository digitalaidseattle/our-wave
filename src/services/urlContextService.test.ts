/**
 * urlContextService.test.ts
 *
 * @copyright 2026 Digital Aid Seattle
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { UrlContextService } from "./urlContextService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResponse(body: string, status = 200, statusText = "OK"): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    text: () => Promise.resolve(body),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("UrlContextService", () => {
  let service: UrlContextService;

  beforeEach(() => {
    service = new UrlContextService();
    vi.restoreAllMocks();
  });

  // ── isValidUrl ─────────────────────────────────────────────────────────────

  describe("isValidUrl", () => {
    it("returns true for a valid https URL", () => {
      expect(service.isValidUrl("https://example.com")).toBe(true);
    });

    it("returns true for a valid http URL", () => {
      expect(service.isValidUrl("http://example.com/path?q=1")).toBe(true);
    });

    it("returns false for ftp scheme", () => {
      expect(service.isValidUrl("ftp://example.com")).toBe(false);
    });

    it("returns false for plain text", () => {
      expect(service.isValidUrl("not-a-url")).toBe(false);
    });

    it("returns false for an empty string", () => {
      expect(service.isValidUrl("")).toBe(false);
    });

    it("trims whitespace before validating", () => {
      expect(service.isValidUrl("  https://example.com  ")).toBe(true);
    });
  });

  // ── extractText ────────────────────────────────────────────────────────────

  describe("extractText", () => {
    it("strips HTML tags and returns readable text", () => {
      const html = "<html><body><h1>Hello</h1><p>World</p></body></html>";
      expect(service.extractText(html)).toBe("Hello World");
    });

    it("removes script and style blocks", () => {
      const html = `<html><body>
        <script>alert('xss')</script>
        <style>.foo { color: red; }</style>
        <p>Clean text</p>
      </body></html>`;
      expect(service.extractText(html)).toBe("Clean text");
    });

    it("collapses multiple whitespace characters", () => {
      const html = "<p>  lots   of   spaces  </p>";
      expect(service.extractText(html)).toBe("lots of spaces");
    });

    it("returns empty string for empty html", () => {
      expect(service.extractText("")).toBe("");
    });
  });

  // ── fetchPageText ──────────────────────────────────────────────────────────

  describe("fetchPageText", () => {
    it("fetches a URL and returns extracted plain text", async () => {
      const html = "<html><body><p>Hello from the web</p></body></html>";
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(html)));

      const result = await service.fetchPageText("https://example.com");
      expect(result).toBe("Hello from the web");
      expect(fetch).toHaveBeenCalledWith("https://example.com");
    });

    it("throws for an invalid URL", async () => {
      await expect(service.fetchPageText("not-a-url")).rejects.toThrow(
        /Invalid URL/
      );
    });

    it("throws when the response is not OK", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(makeResponse("Not Found", 404, "Not Found"))
      );

      await expect(
        service.fetchPageText("https://example.com/missing")
      ).rejects.toThrow(/404/);
    });

    it("propagates network errors", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
      );

      await expect(
        service.fetchPageText("https://example.com")
      ).rejects.toThrow("Failed to fetch");
    });

    it("trims whitespace from the URL before fetching", async () => {
      const html = "<p>ok</p>";
      const fetchMock = vi.fn().mockResolvedValue(makeResponse(html));
      vi.stubGlobal("fetch", fetchMock);

      await service.fetchPageText("  https://example.com  ");
      expect(fetchMock).toHaveBeenCalledWith("https://example.com");
    });
  });

  // ── singleton ──────────────────────────────────────────────────────────────

  describe("getInstance", () => {
    it("returns the same instance on successive calls", () => {
      const a = UrlContextService.getInstance();
      const b = UrlContextService.getInstance();
      expect(a).toBe(b);
    });
  });
});
