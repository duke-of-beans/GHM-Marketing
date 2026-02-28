import type { TourConfig } from "../types";

/**
 * Leads / Sales Pipeline page tour — Sprint 32-F.
 * Fires automatically on first visit. Covers the pipeline stages, filtering,
 * lead card intelligence, and bulk operations.
 */
export const LEADS_TOUR: TourConfig = {
  slug: "leads-pipeline",
  name: "Sales Pipeline",
  steps: [
    {
      element: '[data-tour="leads-heading"]',
      title: "Your Lead Pipeline",
      description:
        "Every prospect flows through six stages: New → Contacted → Proposal → Paperwork → Won / Lost. You move them — the system tracks everything else. Drag a card to advance it or click to open the full detail sheet.",
      side: "bottom",
    },
    {
      element: '[data-tour="leads-filter-bar"]',
      title: "Smart Filtering",
      description:
        "Search by name, phone, or city. Save your most-used filter combinations as saved searches so you can jump straight to your hot list, your territory, or your highest-impact prospects in one click.",
      side: "bottom",
    },
    {
      element: '[data-tour="leads-kanban"]',
      title: "Lead Intelligence",
      description:
        "Each card shows what you need at a glance: Impact Score (how big is the opportunity), Close Score (how likely is a yes), and the enrichment badge when background data is fresh. High score + high likelihood = work this one today.",
      side: "top",
    },
    {
      element: '[data-tour="leads-bulk-actions"]',
      title: "Work at Scale",
      description:
        "Import leads from a CSV, run batch enrichment across your entire filtered view, or export to a spreadsheet for offline review. Bulk actions apply to up to 200 leads at a time — use filters first to narrow the target set.",
      side: "bottom",
    },
  ],
};
