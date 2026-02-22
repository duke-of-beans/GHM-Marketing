"use client";

import { useCallback, useEffect, useRef } from "react";
import type { TourConfig } from "./types";

const STORAGE_PREFIX = "tutorial_seen_";

function getStorageKey(slug: string) {
  return `${STORAGE_PREFIX}${slug}`;
}

export function hasTourBeenSeen(slug: string): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(getStorageKey(slug)) === "true";
}

export function markTourSeen(slug: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(slug), "true");
}

export function resetTour(slug: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getStorageKey(slug));
}

export function resetAllTours(): void {
  if (typeof window === "undefined") return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

export type UseTourOptions = {
  /** Auto-start on first visit (default: true) */
  autoStart?: boolean;
};

export type UseTourReturn = {
  startTour: () => void;
  hasBeenSeen: () => boolean;
};

/**
 * useTour — wraps Driver.js with per-page persistence.
 *
 * CSS is loaded globally via <TourStyles /> in the root layout.
 * Driver.js is lazy-loaded (client-side only) so it never blocks SSR.
 *
 * Usage:
 *   const { startTour } = useTour(LEADS_TOUR);
 *   <TourButton onStart={startTour} />
 *
 * First-visit auto-start is on by default.
 */
export function useTour(config: TourConfig, options: UseTourOptions = {}): UseTourReturn {
  const { autoStart = true } = options;
  const driverRef = useRef<import("driver.js").Driver | null>(null);

  const buildDriver = useCallback(async () => {
    // Lazy-load driver.js — client-side only
    const { driver } = await import("driver.js");

    driverRef.current = driver({
      animate: true,
      smoothScroll: true,
      showProgress: true,
      progressText: "{{current}} of {{total}}",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Done ✓",
      onDestroyed: () => {
        markTourSeen(config.slug);
      },
      steps: config.steps.map((step) => ({
        element: step.element,
        stagePadding: step.padding ?? 8,
        popover: {
          title: step.title,
          description: step.description,
          side: step.side ?? "bottom",
        },
      })),
    });

    return driverRef.current;
  }, [config]);

  const startTour = useCallback(async () => {
    const d = await buildDriver();
    d.drive();
  }, [buildDriver]);

  // Auto-start on first visit
  useEffect(() => {
    if (!autoStart) return;
    if (hasTourBeenSeen(config.slug)) return;

    // Small delay so the page's DOM settles before we highlight elements
    const timer = setTimeout(() => {
      startTour();
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    startTour,
    hasBeenSeen: () => hasTourBeenSeen(config.slug),
  };
}
