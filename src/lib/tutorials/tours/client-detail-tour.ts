import type { TourConfig } from "../types";

/**
 * Client Detail page tour.
 *
 * Targets elements via data-tour="[id]" attributes added to profile.tsx.
 * Steps cover: header, health score, tab bar, key tabs (scorecard, tasks, SEO, reports).
 */
export const CLIENT_DETAIL_TOUR: TourConfig = {
  slug: "client-detail",
  name: "Client Detail",
  steps: [
    {
      element: '[data-tour="client-header"]',
      title: "Client Overview",
      description:
        "The header shows the client's name, health score, monthly revenue, and quick-action buttons. Everything about this client starts here.",
      side: "bottom",
    },
    {
      element: '[data-tour="client-health-badge"]',
      title: "Health Score",
      description:
        "The health score (0–100) measures how well the client is performing relative to their local competitors. 75+ is healthy. Below 50 needs attention. It updates automatically after every competitive scan.",
      side: "bottom",
      padding: 4,
    },
    {
      element: '[data-tour="client-tabs"]',
      title: "Tab Navigation",
      description:
        "Each tab focuses on a different area: Scorecard (overall health + opportunities), Tasks (work queue), SEO (rankings + citations), Reports, Billing, and more. The URL updates when you switch tabs — you can bookmark or share a direct link to any tab.",
      side: "bottom",
    },
    {
      element: '[data-tour="client-tab-scorecard"]',
      title: "Scorecard Tab",
      description:
        "Start here. The Scorecard shows upsell opportunities, competitive gaps, and the full scan history. This tells you exactly what work is most impactful right now.",
      side: "bottom",
    },
    {
      element: '[data-tour="client-tab-tasks"]',
      title: "Tasks Tab",
      description:
        "The task queue for this client. Create tasks, assign them to team members, and track progress. AI Content Briefs live here — click Generate to create one with a single click.",
      side: "bottom",
    },
    {
      element: '[data-tour="client-tab-rankings"]',
      title: "SEO Tab — Rankings",
      description:
        "Live keyword rankings pulled from DataForSEO. See which keywords are climbing, declining, or newly appearing. Rank data updates daily via cron.",
      side: "bottom",
    },
    {
      element: '[data-tour="client-tab-reports"]',
      title: "Reports Tab",
      description:
        "Generate, preview, and download the monthly client report PDF. Reports pull live data — rankings, citations, scan results — into a branded PDF you can send directly to the client.",
      side: "bottom",
    },
    {
      element: '[data-tour="client-tab-billing"]',
      title: "Billing Tab",
      description:
        "Wave invoice history, payment status, and outstanding balance for this client. Invoices are generated automatically every month — check here if a payment is late.",
      side: "bottom",
    },
  ],
};
