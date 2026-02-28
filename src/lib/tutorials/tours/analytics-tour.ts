import type { TourConfig } from "../types";

/**
 * Analytics page tour — Sprint 32-H.
 * Fires automatically on first visit. Covers revenue trends, portfolio growth,
 * churn risk signals, health trajectories, and platform telemetry.
 */
export const ANALYTICS_TOUR: TourConfig = {
  slug: "analytics",
  name: "Business Analytics",
  steps: [
    {
      element: '[data-tour="analytics-revenue-chart"]',
      title: "Revenue Trajectory",
      description:
        "MRR plotted month-over-month with the 12-month trend line. The dashed section is the projection based on current growth rate. If the line is flattening, that's your signal to review churn and upsell before it becomes a problem.",
      side: "bottom",
    },
    {
      element: '[data-tour="analytics-client-chart"]',
      title: "Portfolio Growth",
      description:
        "New clients vs. churned clients per month. Green bars closing deals, red bars losing them. Net growth is the gap. If you're closing more than you're losing but revenue is flat, check average retainer size — that's the missing variable.",
      side: "bottom",
    },
    {
      element: '[data-tour="analytics-churn-panel"]',
      title: "Early Warning System",
      description:
        "Clients grouped by churn risk: Critical (immediate action), High (plan this week), Medium (monitor), Low (healthy). Risk score is calculated from health score trajectory, missed invoices, and task velocity. Don't wait for a client to cancel — address Critical and High this week.",
      side: "top",
    },
    {
      element: '[data-tour="analytics-health-sparklines"]',
      title: "Portfolio Health at a Glance",
      description:
        "Average health score across all active clients plotted over time. A dropping trend means the portfolio is sliding competitively — even if revenue looks fine. Health leads revenue by 1–2 months, so a dip here is an early warning, not a lagging indicator.",
      side: "top",
    },
    {
      element: '[data-tour="analytics-usage-panel"]',
      title: "Platform Telemetry",
      description:
        "Admin-only: feature heatmap showing which tools your team actually uses, daily active users, and session depth. Use this to spot training gaps — if a high-value feature shows low usage, your team isn't capturing the value it could be.",
      side: "top",
    },
  ],
};
