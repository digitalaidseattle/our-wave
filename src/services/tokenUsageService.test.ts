import { describe, expect, it } from "vitest";
import type { GrantProposal } from "../types";
import { tokenUsageService } from "./tokenUsageService";

const buildProposal = (overrides: Partial<GrantProposal>): GrantProposal => ({
  id: "proposal-1",
  createdAt: new Date(2026, 4, 10, 12, 0, 0),
  createdBy: "tester@example.com",
  updatedAt: new Date(2026, 4, 10, 12, 0, 0),
  updatedBy: "tester@example.com",
  grantRecipeId: "recipe-1",
  name: "Proposal",
  rating: null,
  structuredResponse: {},
  totalTokenCount: 0,
  model: "",
  ...overrides,
});

describe("tokenUsageService", () => {
  it("summarizes token usage by model", () => {
    const summary = tokenUsageService.summarizeByModel([
      buildProposal({ id: "1", totalTokenCount: 100, model: "gemini-2.5-flash" }),
      buildProposal({ id: "2", totalTokenCount: 50, model: "gemini-2.5-flash" }),
      buildProposal({ id: "3", totalTokenCount: 25, model: "gpt-5.3-codex" }),
      buildProposal({ id: "4", totalTokenCount: 10, model: "" }),
    ]);

    expect(summary.totalTokensUsed).toBe(185);
    expect(summary.modelSummaries).toEqual([
      { model: "gemini-2.5-flash", tokensUsed: 150, totalUsagePercent: expect.closeTo(81.081, 2) },
      { model: "gpt-5.3-codex", tokensUsed: 25, totalUsagePercent: expect.closeTo(13.513, 2) },
      { model: "Unspecified model", tokensUsed: 10, totalUsagePercent: expect.closeTo(5.405, 2) },
    ]);
  });

  it("filters proposals to the selected month", () => {
    const mayDate = new Date(2026, 4, 1, 12, 0, 0);
    const filtered = tokenUsageService.filterToMonth([
      buildProposal({ id: "1", createdAt: new Date(2026, 4, 10, 12, 0, 0) }),
      buildProposal({ id: "2", createdAt: new Date(2026, 4, 29, 12, 0, 0) }),
      buildProposal({ id: "3", createdAt: new Date(2026, 3, 30, 12, 0, 0) }),
    ], mayDate);

    expect(filtered.map((proposal) => proposal.id)).toEqual(["1", "2"]);
  });

  it("builds monthly usage points for the requested window", () => {
    const points = tokenUsageService.summarizeMonthlyUsage([
      buildProposal({ id: "1", createdAt: new Date(2026, 2, 10, 12, 0, 0), totalTokenCount: 100 }),
      buildProposal({ id: "2", createdAt: new Date(2026, 3, 15, 12, 0, 0), totalTokenCount: 200 }),
      buildProposal({ id: "3", createdAt: new Date(2026, 4, 1, 12, 0, 0), totalTokenCount: 300 }),
      buildProposal({ id: "4", createdAt: new Date(2026, 4, 20, 12, 0, 0), totalTokenCount: 50 }),
    ], 3, new Date(2026, 4, 21, 12, 0, 0));

    expect(points).toEqual([
      { monthKey: "2026-03", monthLabel: "Mar 2026", tokensUsed: 100 },
      { monthKey: "2026-04", monthLabel: "Apr 2026", tokensUsed: 200 },
      { monthKey: "2026-05", monthLabel: "May 2026", tokensUsed: 350 },
    ]);
  });
});
