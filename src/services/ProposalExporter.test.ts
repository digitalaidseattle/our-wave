import { describe, expect, it, vi, afterEach } from "vitest";
import type { GrantProposal } from "../types";
import {
  createMarkdownContent,
  createProposalClipboardPlainText,
  ProposalExporter,
  type SUPPORTED_DOWNLOAD_TYPE,
} from "./ProposalExporter";

const buildProposal = (): GrantProposal => ({
  id: "proposal-1",
  createdAt: new Date(2026, 4, 10, 12, 0, 0),
  createdBy: "tester@example.com",
  updatedAt: new Date(2026, 4, 10, 12, 0, 0),
  updatedBy: "tester@example.com",
  grantRecipeId: "recipe-1",
  name: "Community Garden Proposal",
  rating: null,
  structuredResponse: {
    Summary: "This proposal supports a neighborhood garden.\n\n- Build planters\n- Train volunteers",
    Impact: "1. Increase food access\n2. Improve community ties"
  },
  totalTokenCount: 123,
  model: "gemini-2.5-flash",
  outputs: []
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function readBlobBuffer(blob: Blob): Promise<Buffer> {
  if (typeof blob.arrayBuffer === "function") {
    return Buffer.from(await blob.arrayBuffer());
  }

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(Buffer.from(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read blob."));
    reader.readAsArrayBuffer(blob);
  });
}

describe("ProposalExporter", () => {
  it("builds markdown content with structured proposal sections", () => {
    const proposal = buildProposal();
    const markdown = createMarkdownContent(proposal);

    expect(markdown).toContain("# Community Garden Proposal");
    expect(markdown).toContain("## Summary");
    expect(markdown).toContain("## Impact");
    expect(markdown).toContain("Build planters");
  });

  it("builds clipboard plain text with visible structure", () => {
    const proposal = buildProposal();
    const plainText = createProposalClipboardPlainText(proposal);

    expect(plainText).toContain("Community Garden Proposal");
    expect(plainText).toContain("Summary");
    expect(plainText).toContain("Impact");
    expect(plainText).toContain("Build planters");
  });

  it.each([
    ["markdown", "Community Garden Proposal.md"],
    ["text", "Community Garden Proposal.txt"],
    ["json", "Community Garden Proposal.json"],
    ["docx", "Community Garden Proposal.docx"],
    ["pdf", "Community Garden Proposal.pdf"]
  ] as [SUPPORTED_DOWNLOAD_TYPE, string][])("downloads %s with the expected filename", async (downloadType, filename) => {
    const exporter = new ProposalExporter();
    const proposal = buildProposal();
    const click = vi.fn();
    const createObjectURL = vi.fn().mockReturnValue("blob:test");
    const revokeObjectURL = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL
    });
    const createElement = vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") {
        return {
          href: "",
          download: "",
          click
        } as unknown as HTMLAnchorElement;
      }

      return originalCreateElement(tagName);
    });

    await exporter.run(proposal, downloadType);

    expect(createElement).toHaveBeenCalledWith("a");
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");

    const link = createElement.mock.results[0]?.value as HTMLAnchorElement;
    expect(link.href).toBe("blob:test");
    expect(link.download).toBe(filename);
  });

  it("generates a docx export with proposal text and formatting blocks", async () => {
    const exporter = new ProposalExporter();
    const proposal = buildProposal();
    const mammoth = await import("mammoth");
    const blob = await exporter.exporters.docx.createDownloadBlob(proposal);
    const buffer = await readBlobBuffer(blob);
    const result = await mammoth.extractRawText({ buffer });

    expect(blob.type).toContain("wordprocessingml.document");
    expect(result.value).toContain("Community Garden Proposal");
    expect(result.value).toContain("Summary");
    expect(result.value).toContain("Build planters");
    expect(result.value).toContain("Increase food access");
  });

  it("generates a pdf export as a non-empty PDF blob", async () => {
    const exporter = new ProposalExporter();
    const proposal = buildProposal();
    const blob = await exporter.exporters.pdf.createDownloadBlob(proposal);
    const pdfText = (await readBlobBuffer(blob)).toString("latin1");

    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(0);
    expect(pdfText.startsWith("%PDF-")).toBe(true);
  });
});
