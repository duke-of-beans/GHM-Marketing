import type { TourConfig } from "../types";

/**
 * Client Detail page tour.
 * Fires automatically on first visit to any client detail page.
 * Covers the header, health score, tabs, and what lives in each.
 */
export const CLIENT_DETAIL_TOUR: TourConfig = {
  slug: "client-detail",
  name: "Client Detail",
  steps: [
    {
      element: '[data-tour="client-header"]',
      title: "Client Header",
      description:
        "Name, health score, monthly revenue, quick-action buttons. Everything about this client starts here. If the health score looks bad, that's not a display bug.",
      side: "bottom",
    },
    {
      element: '[data-tour="client-health-badge"]',
      title: "Health Score",
      description:
        "0–100. Measures how this client is performing against their local competitors. 75+ is healthy. Below 50 is a problem. It updates automatically after every scan — no manual refresh needed.",
      side: "bottom",
      padding: 4,
    },
    {
      element: '[data-tour="client-tabs"]',
      title: "Tabs",
      description:
        "Each tab is a different area of the client relationship. The URL updates when you switch — you can bookmark or share a direct link to any tab. This is relevant more often than you'd think.",
      side: "bottom",
    },
    {
      element: '[data-tour="client-tab-scorecard"]',
      title: "Scorecard — Start Here",
      description:
        "Upsell opportunities, competitive gaps, full scan history. If you're not sure what to work on, this tab will tell you.",
      side: "bottom",
    },
    {
      element: '[data-tour="client-tab-tasks"]',
      title: "Tasks",
      description:
        "Work queue for this client. Create tasks, assign them, track progress. AI Content Briefs live here — click Generate and the system does the brief for you.",
      side: "bottom",
    },
    {
      element: '[data-tour="client-tab-rankings"]',
      title: "SEO — Rankings",
      description:
        "Live keyword rankings from DataForSEO. Climbing, declining, new — it's all here. Updates daily via cron. If a keyword disappeared, it's not gone, check the filter.",
      side: "bottom",
    },
    {
      element: '[data-tour="client-tab-reports"]',
      title: "Reports",
      description:
        "Generate, preview, and download the monthly client report PDF. Pulls live data — rankings, citations, scan results — into a branded PDF. Ready to send directly to the client.",
      side: "bottom",
    },
    {
      element: '[data-tour="client-tab-billing"]',
      title: "Billing",
      description:
        "Wave invoice history, payment status, and outstanding balance. Invoices generate automatically every month. If a payment is late, this is where you confirm it and then call them.",
      side: "bottom",
    },
  ],
};
