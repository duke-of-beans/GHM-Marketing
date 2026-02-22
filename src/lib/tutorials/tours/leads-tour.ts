import type { TourConfig } from "../types";

/**
 * Leads / Sales Pipeline page tour.
 *
 * Targets elements via data-tour="[id]" attributes added to leads/client.tsx
 * and kanban-board.tsx / kanban-column.tsx.
 */
export const LEADS_TOUR: TourConfig = {
  slug: "leads-pipeline",
  name: "Sales Pipeline",
  steps: [
    {
      element: '[data-tour="leads-heading"]',
      title: "Sales Pipeline",
      description:
        "This is your pipeline — every lead you're working, from first contact to closed deal. Leads move left-to-right through stages as you progress them.",
      side: "bottom",
    },
    {
      element: '[data-tour="leads-filter-bar"]',
      title: "Filters & Search",
      description:
        "Search by business name, phone, or city. Use Advanced Filters to narrow by Impact Score, Close Likelihood, Priority Tier, or market type. Filters apply instantly — no page reload.",
      side: "bottom",
    },
    {
      element: '[data-tour="leads-kanban"]',
      title: "Kanban Board — Drag to Advance",
      description:
        "Each column is a pipeline stage: Available → Scheduled → Contacted → Follow Up → Paperwork → Won. Drag a card between columns to advance a lead. Click any card to open the full detail sheet — notes, contact info, audit PDF, demo generator, and pipeline actions all live there.",
      side: "top",
    },
    {
      element: '[data-tour="kanban-column-available"]',
      title: "Available Leads",
      description:
        "Unclaimed leads in your territory. First come, first served — click any card and claim it to move it into your personal pipeline. New leads from the Discovery engine land here automatically.",
      side: "right",
    },
    {
      element: '[data-tour="kanban-column-won"]',
      title: "Won Deals",
      description:
        "Leads you've closed. Won leads automatically convert to active clients in the Clients tab — you'll start earning residuals from Month 2 onward.",
      side: "left",
    },
  ],
};
