/**
 * Per-page tutorial system types.
 * Tours are data-driven: each page exports a TourConfig.
 * The useTour hook handles Driver.js lifecycle + localStorage persistence.
 */

export type TourStep = {
  /** CSS selector OR data-tour="[id]" selector for the element to highlight */
  element: string;
  /** Short heading shown in the popover */
  title: string;
  /** Body copy shown in the popover */
  description: string;
  /** Which side the popover prefers. Driver.js will auto-flip if needed. */
  side?: "top" | "bottom" | "left" | "right";
  /** Extra padding around the highlighted element in px */
  padding?: number;
};

export type TourConfig = {
  /** Unique slug — used as the localStorage key: tutorial_seen_[slug] */
  slug: string;
  /** Human-readable name (used in reset UI) */
  name: string;
  steps: TourStep[];
};
