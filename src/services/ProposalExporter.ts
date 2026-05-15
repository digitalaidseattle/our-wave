/**
 *  PlanExporter.ts
 *
 *  @copyright 2026 Digital Aid Seattle
 *
 */
import { saveAs } from "file-saver";

import { GrantProposal } from "../types";

abstract class AbstractExporter {
    async run(proposal: GrantProposal): Promise<void> {
        const data = this.createDownloadData(proposal);
        const type = this.getApplicationType()
        const extension = this.getDownloadExtension()
        const blob = new Blob([data], { type: type });
        saveAs(blob, `${proposal.name}.${extension}`);
    }
    abstract getApplicationType(): string;
    abstract getDownloadExtension(): string;
    abstract createDownloadData(proposal: GrantProposal): string;
}


class TextExporter extends AbstractExporter {
    getApplicationType(): string {
        return 'text/plain;charset=utf-8';
    };

    getDownloadExtension(): string {
        return 'txt';
    }
    createDownloadData(proposal: GrantProposal): string {
        let data = `${proposal.name}\n\n`;

        Object.entries(proposal.structuredResponse ?? []).forEach(entry => {
            data += entry[0] + "\n\n";
            data += entry[1] + "\n\n";
        });
        return data
    }
}

class MarkdownExporter extends AbstractExporter {
    getApplicationType(): string {
        return 'text/markdown';
    };
    getDownloadExtension(): string {
        return 'md';
    }
    createDownloadData(proposal: GrantProposal): string {
        let data = `# ${proposal.name} #\n\n`;

        Object.entries(proposal.structuredResponse ?? []).forEach(entry => {
            data += `## ${entry[0]} ##\n\n`;
            data += entry[1] + "\n\n";
        });
        return data
    }
}


class JsonExporter extends AbstractExporter {
    getApplicationType(): string {
        return 'application/json';
    };
    getDownloadExtension(): string {
        return 'json';
    }
    createDownloadData(proposal: GrantProposal): string {
        return JSON.stringify(
            {
                title: proposal.name,
                sections: proposal.structuredResponse ?? []
            }
        )
    }
}


export type SUPPORTED_DOWNLOAD_TYPE = "text" | "markdown" | "json";

export class ProposalExporter {

    exporters = {
        text: new TextExporter(),
        json: new JsonExporter(),
        markdown: new MarkdownExporter()
    }

    async run(proposal: GrantProposal, downloadType: SUPPORTED_DOWNLOAD_TYPE): Promise<void> {
        const exporter = this.exporters[downloadType];
        return exporter.run(proposal);
    }

}