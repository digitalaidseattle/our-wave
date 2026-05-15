/**
 * dashboard.ts
 *
 * @copyright 2026 Digital Aid Seattle
 */
import { DASHBOARD_LABELS } from "./labels";

// Keep the legacy export name while extending labels used only on the dashboard page.
export const DASHBOARD_STRINGS = {
  ...DASHBOARD_LABELS,
  tokenUsage: "Token Usage by Model",
  monthlyTokenUsage: "Monthly token usage",
  thisMonthTokensUsed: "This month tokens used",
  currentMonthByModel: "Current month by model",
  allTimeTokensUsed: "All time tokens used",
  unspecifiedModel: "Unspecified model",
  loadingTokenUsage: "Loading...",
};
