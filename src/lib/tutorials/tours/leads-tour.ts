import type { TourConfig } from "../types";

/**
 * Leads / Sales Pipeline page tour.
 * Fires automatically on first visit. Covers the stuff the onboarding tutorial
 * deliberately left out — this is where the pipeline mechanics actually live.
 */
export const LEADS_TOUR: TourConfig = {
  slug: "leads-pipeline",
  name: "Sales Pipeline",
  steps: [
    {
      element: '[data-tour="leads-heading"]',
      title: "Your Pipeline",
      description:
        "Every lead you're working lives here. Left to right, beginning to closed. The system doesn't move them — you do.",
      side: "bottom",
    },
    {
      element: '[data-tour="leads-filter-bar"]',
      title: "Filters",
      description:
        "Search by name, phone, or city. Advanced Filters let you cut by Impact Score, Close Likelihood, Priority Tier, or market type. They apply instantly. There's no search button to click.",
      side: "bottom",
    },
    {
      element: '[data-tour="leads-kanban"]',
      title: "The Board",
      description:
        "Six stages: Available → Scheduled → Contacted → Follow Up → Paperwork → Won. Drag a card to advance it. Click a card to open the full detail sheet — notes, contact info, audit PDF, demo generator, all of it.",
      side: "top",
    },
    {
      element: '[data-tour="kanban-column-available"]',
      title: "Available Leads",
      description:
        "Unclaimed leads in your territory. First come, first served. Click a card and claim it — it moves to your pipeline immediately. New leads from Discovery land here automatically.",
      side: "right",
    },
    {
      element: '[data-tour="kanban-column-won"]',
      title: "Won",
      description:
        "Deals you've closed. Won leads convert to active clients automatically — you'll see them in the Clients tab. Residuals start Month 2.",
      side: "left",
    },
  ],
};
