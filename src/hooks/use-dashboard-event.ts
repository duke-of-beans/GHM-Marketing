"use client";

import { useCallback, useRef } from "react";

// Stable random ID for this browser tab session — not persisted, not PII.
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const key = "ghm_sid";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, id);
  }
  return id;
}

interface TrackOptions {
  feature?: string;
  metadata?: Record<string, unknown>;
}

export function useDashboardEvent() {
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const track = useCallback(
    (eventType: string, page?: string, options?: TrackOptions) => {
      // Fire-and-forget — never await, never throw
      fetch("/api/analytics/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          page: page ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
          feature: options?.feature,
          metadata: options?.metadata,
          sessionId: getSessionId(),
        }),
      }).catch(() => {/* intentionally swallowed */});
    },
    []
  );

  // Debounced page view — prevents double-fires on React strict mode double-render
  const trackPageView = useCallback(
    (page?: string) => {
      if (pendingRef.current) clearTimeout(pendingRef.current);
      pendingRef.current = setTimeout(() => {
        track("page_view", page);
      }, 300);
    },
    [track]
  );

  const trackFeature = useCallback(
    (feature: string, metadata?: Record<string, unknown>) => {
      track("feature_use", undefined, { feature, metadata });
    },
    [track]
  );

  return { track, trackPageView, trackFeature };
}
