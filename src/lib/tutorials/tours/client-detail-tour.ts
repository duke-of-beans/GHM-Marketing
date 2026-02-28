import type { TourConfig } from "../types";

/**
 * Client Detail page tour — Sprint 32-G.
 * Fires automatically on first visit to any client detail page.
 * Covers the header, health score, tabs, and what lives in each.
 */
export const CLIENT_DETAIL_TOUR: TourConfig = {
  slug: "client-detail",
  name: "Client Detail",
  steps: [
    {
      element: '[data-tour="client-header"]',
      title: "Client at a Glance",
      description:
        "Name, health score, monthly retainer, last scan date, and quick-action buttons. If the health score is red, something needs attention — don't wait for the next check-in to deal with it.",
      side: "bottom",
    },
    {
      element: '[data-tour="client-tabs"]',
      title: "Full Client Picture",
      description:
        "Each tab is a different lens on this client: Scorecard for gaps and history, Tasks for work queue, Rankings for live SEO data, Reports for PDF generation, Billing for Wave invoices. The URL updates when you switch — you can bookmark or share any tab directly.",
      side: "bottom",
    },
    {
      element: '[data-tour="client-tab-tasks"]',
      title: "Track All Work",
      description:
        "The client's full work queue. Create tasks, assign them, set due dates, and track progress through stages. Recurring task rules run automatically so nothing gets missed. AI Content Briefs live here too — click Generate and it writes the brief for you.",
      side: "bottom",
    },
    {
      element: '[data-tour="client-tab-rankings"]',
      title: "Rankings and Citations",
      description:
        "Live keyword rankings from DataForSEO — climbing, declining, and newly tracked. Updates daily via cron. Also check NAP health and citation consistency here. If a keyword disappears it's not gone, check the status filter.",
      side: "bottom",
    },
    {
      element: '[data-tour="client-tab-reports"]',
      title: "Generate Reports",
      description:
        "On-demand PDF report generation. Pulls live data — rankings, citations, scan results — into a branded PDF. Ready to send directly to the client. You can also schedule monthly delivery from this tab.",
      side: "bottom",
    },
    {
      element: '[data-tour="client-tab-billing"]',
      title: "Wave Integration",
      description:
        "Invoice history, payment status, and outstanding balance — all pulled live from Wave. Invoices generate automatically each month. If a payment is late, confirm it here, then call them.",
      side: "bottom",
    },
    {
      element: '[data-tour="client-tab-audit"]',
      title: "One-Click Audit",
      description:
        "Runs a full technical audit of the client's website: PageSpeed, Core Web Vitals, broken links, on-page SEO gaps. Generates a shareable PDF and opens the demo builder so you can present findings directly to the client.",
      side: "bottom",
    },
  ],
};
