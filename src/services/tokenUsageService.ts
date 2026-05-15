import type { GrantProposal, Timestamp } from "../types";

export type TokenUsageModelSummary = {
  model: string;
  tokensUsed: number;
  totalUsagePercent: number;
};

export type TokenUsageSummary = {
  totalTokensUsed: number;
  modelSummaries: TokenUsageModelSummary[];
};

export type MonthlyTokenUsagePoint = {
  monthKey: string;
  monthLabel: string;
  tokensUsed: number;
};

const UNSPECIFIED_MODEL = "Unspecified model";

const monthLabelFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  year: "numeric",
});

const monthKeyFormatter = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");

  return `${year}-${month}`;
};

const toDate = (value: Date | Timestamp): Date => {
  if (value instanceof Date) return value;
  return new Date(value.seconds * 1000);
};

const getMonthStart = (value: Date) => new Date(value.getFullYear(), value.getMonth(), 1);

export const tokenUsageService = {
  normalizeModelName(model: string | null | undefined): string {
    return model?.trim() || UNSPECIFIED_MODEL;
  },

  getTokenCount(proposal: GrantProposal): number {
    const tokenCount = Number(proposal.totalTokenCount ?? 0);
    return Number.isFinite(tokenCount) ? tokenCount : 0;
  },

  summarizeByModel(proposals: GrantProposal[]): TokenUsageSummary {
    const tokensByModel = proposals.reduce<Record<string, number>>((usage, proposal) => {
      const tokenCount = this.getTokenCount(proposal);
      const model = this.normalizeModelName(proposal.model);
      usage[model] = (usage[model] ?? 0) + tokenCount;

      return usage;
    }, {});

    const totalTokensUsed = Object.values(tokensByModel).reduce((sum, tokensUsed) => sum + tokensUsed, 0);

    const modelSummaries = Object.entries(tokensByModel)
      .map(([model, tokensUsed]) => ({
        model,
        tokensUsed,
        totalUsagePercent: totalTokensUsed > 0 ? (tokensUsed / totalTokensUsed) * 100 : 0,
      }))
      .sort((a, b) => b.tokensUsed - a.tokensUsed);

    return {
      totalTokensUsed,
      modelSummaries,
    };
  },

  filterToMonth(proposals: GrantProposal[], targetDate: Date): GrantProposal[] {
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    return proposals.filter((proposal) => {
      const proposalDate = toDate(proposal.createdAt);
      return proposalDate.getFullYear() === year && proposalDate.getMonth() === month;
    });
  },

  summarizeMonthlyUsage(proposals: GrantProposal[], monthCount = 6, now = new Date()): MonthlyTokenUsagePoint[] {
    const currentMonth = getMonthStart(now);
    const monthStarts = Array.from({ length: monthCount }, (_, index) => {
      const monthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - (monthCount - index - 1), 1);
      return monthDate;
    });

    const totalsByMonth = proposals.reduce<Record<string, number>>((usage, proposal) => {
      const proposalDate = getMonthStart(toDate(proposal.createdAt));
      const monthKey = monthKeyFormatter(proposalDate);
      usage[monthKey] = (usage[monthKey] ?? 0) + this.getTokenCount(proposal);

      return usage;
    }, {});

    return monthStarts.map((monthStart) => {
      const monthKey = monthKeyFormatter(monthStart);

      return {
        monthKey,
        monthLabel: monthLabelFormatter.format(monthStart),
        tokensUsed: totalsByMonth[monthKey] ?? 0,
      };
    });
  },
};
