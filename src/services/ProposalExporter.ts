/**
 *  PlanExporter.ts
 *
 *  @copyright 2026 Digital Aid Seattle
 *
 */
import { Document, HeadingLevel, Packer, Paragraph } from "docx";
import { jsPDF } from "jspdf";
import { GrantProposal } from "../types";

type ExportBlock =
    | { type: "heading1"; text: string }
    | { type: "heading2"; text: string }
    | { type: "bullet"; text: string }
    | { type: "paragraph"; text: string }
    | { type: "blank"; text: string };

type ProposalSection = {
    name: string;
    value: string;
};

function getProposalSections(proposal: GrantProposal): ProposalSection[] {
    return Object.entries(proposal.structuredResponse ?? {}).map(([name, value]) => ({
        name,
        value,
    }));
}

export function createMarkdownContent(proposal: GrantProposal): string {
    let data = `# ${proposal.name}\n\n`;

    getProposalSections(proposal).forEach((entry) => {
        data += `## ${entry.name}\n\n`;
        data += `${entry.value}\n\n`;
    });

    return data;
}

export function createProposalClipboardPlainText(proposal: GrantProposal): string {
    const sections = getProposalSections(proposal);
    const lines = [proposal.name, ""];

    sections.forEach((section) => {
        lines.push(section.name, "", section.value, "");
    });

    return lines.join("\n").trimEnd();
}

function parseExportBlocks(content: string): ExportBlock[] {
    return content.split("\n").map((line) => {
        const trimmed = line.trim();

        if (!trimmed) {
            return { type: "blank", text: "" };
        }

        if (trimmed.startsWith("## ")) {
            return { type: "heading2", text: trimmed.replace(/^##\s+/, "") };
        }

        if (trimmed.startsWith("# ")) {
            return { type: "heading1", text: trimmed.replace(/^#\s+/, "") };
        }

        if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
            return { type: "bullet", text: trimmed.replace(/^([-*]|\d+\.)\s+/, "") };
        }

        return { type: "paragraph", text: trimmed };
    });
}

abstract class AbstractExporter {
    async run(proposal: GrantProposal): Promise<void> {
        const blob = await this.createDownloadBlob(proposal);
        const extension = this.getDownloadExtension();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${proposal.name}.${extension}`;
        link.click();
        URL.revokeObjectURL(url);
    }

    abstract getDownloadExtension(): string;
    abstract createDownloadBlob(proposal: GrantProposal): Promise<Blob>;
}


class TextExporter extends AbstractExporter {
    getDownloadExtension(): string {
        return 'txt';
    }
    async createDownloadBlob(proposal: GrantProposal): Promise<Blob> {
        return new Blob([createProposalClipboardPlainText(proposal)], { type: 'text/plain;charset=utf-8' });
    }
}

class MarkdownExporter extends AbstractExporter {
    getDownloadExtension(): string {
        return 'md';
    }
    async createDownloadBlob(proposal: GrantProposal): Promise<Blob> {
        return new Blob([createMarkdownContent(proposal)], { type: 'text/markdown' });
    }
}


class JsonExporter extends AbstractExporter {
    getDownloadExtension(): string {
        return 'json';
    }
    async createDownloadBlob(proposal: GrantProposal): Promise<Blob> {
        return new Blob([JSON.stringify(
            {
                title: proposal.name,
                sections: proposal.structuredResponse ?? []
            }
        )], { type: 'application/json' });
    }
}

class DocxExporter extends AbstractExporter {
    getDownloadExtension(): string {
        return "docx";
    }

    async createDownloadBlob(proposal: GrantProposal): Promise<Blob> {
        const blocks = parseExportBlocks(createMarkdownContent(proposal));
        const paragraphs = blocks.map((block) => {
            switch (block.type) {
                case "heading1":
                    return new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        text: block.text,
                        spacing: { after: 240 }
                    });
                case "heading2":
                    return new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        text: block.text,
                        spacing: { before: 120, after: 160 }
                    });
                case "bullet":
                    return new Paragraph({
                        text: block.text,
                        bullet: { level: 0 },
                        spacing: { after: 120 }
                    });
                case "blank":
                    return new Paragraph({ text: "", spacing: { after: 120 } });
                default:
                    return new Paragraph({
                        text: block.text,
                        spacing: { after: 120 }
                    });
            }
        });

        const doc = new Document({
            sections: [{ children: paragraphs }]
        });

        return Packer.toBlob(doc);
    }
}

class PdfExporter extends AbstractExporter {
    getDownloadExtension(): string {
        return "pdf";
    }

    async createDownloadBlob(proposal: GrantProposal): Promise<Blob> {
        const pdf = new jsPDF({ unit: "pt", format: "letter" });
        const blocks = parseExportBlocks(createMarkdownContent(proposal));
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 54;
        let cursorY = margin;

        const ensureSpace = (height: number) => {
            if (cursorY + height <= pageHeight - margin) {
                return;
            }

            pdf.addPage();
            cursorY = margin;
        };

        const renderText = (text: string, fontSize: number, fontStyle: "normal" | "bold", indent = 0) => {
            pdf.setFont("helvetica", fontStyle);
            pdf.setFontSize(fontSize);
            const lineHeight = fontSize * 1.4;
            const lines = pdf.splitTextToSize(text, pageWidth - (margin * 2) - indent);

            lines.forEach((line: string) => {
                ensureSpace(lineHeight);
                pdf.text(line, margin + indent, cursorY);
                cursorY += lineHeight;
            });
        };

        blocks.forEach((block) => {
            switch (block.type) {
                case "heading1":
                    cursorY += 8;
                    renderText(block.text, 18, "bold");
                    cursorY += 8;
                    break;
                case "heading2":
                    cursorY += 4;
                    renderText(block.text, 14, "bold");
                    cursorY += 6;
                    break;
                case "bullet":
                    renderText(`• ${block.text}`, 11, "normal", 12);
                    cursorY += 4;
                    break;
                case "blank":
                    cursorY += 8;
                    break;
                default:
                    renderText(block.text, 11, "normal");
                    cursorY += 4;
                    break;
            }
        });

        return pdf.output("blob");
    }
}


export type SUPPORTED_DOWNLOAD_TYPE = "text" | "markdown" | "json" | "docx" | "pdf";

export class ProposalExporter {

    exporters = {
        text: new TextExporter(),
        json: new JsonExporter(),
        markdown: new MarkdownExporter(),
        docx: new DocxExporter(),
        pdf: new PdfExporter()
    }

    async run(proposal: GrantProposal, downloadType: SUPPORTED_DOWNLOAD_TYPE): Promise<void> {
        const exporter = this.exporters[downloadType];
        return exporter.run(proposal);
    }

}
