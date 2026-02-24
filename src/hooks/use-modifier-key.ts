"use client";

import { useMemo } from "react";

/**
 * Returns the platform modifier key symbol and label.
 * macOS → ⌘ / Cmd
 * Windows/Linux → Ctrl
 *
 * Safe for SSR: falls back to Ctrl (most common).
 */
export function useModifierKey(): { symbol: string; label: string; isMac: boolean } {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return { symbol: "Ctrl", label: "Ctrl", isMac: false };
    }
    const mac =
      navigator.platform?.toLowerCase().includes("mac") ||
      (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform
        ?.toLowerCase()
        .includes("mac") ||
      false;
    return mac
      ? { symbol: "⌘", label: "Cmd", isMac: true }
      : { symbol: "Ctrl", label: "Ctrl", isMac: false };
  }, []);
}
