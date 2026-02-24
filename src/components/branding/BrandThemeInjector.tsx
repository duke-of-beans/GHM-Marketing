"use client";

// BrandThemeInjector — injects tenant brand colors as CSS custom properties
// on the :root element so they're available to all descendant components.
//
// Usage: <BrandThemeInjector colors={{ primary, secondary, accent }} />
// Consumes:  var(--brand-primary)   → CTAs, active states, links
//            var(--brand-secondary) → Supporting UI, secondary buttons
//            var(--brand-accent)    → Highlights, badges, callouts
//
// Called from (dashboard)/layout.tsx (server component) — this client leaf
// does nothing visible; it only writes the CSS vars.

import { useEffect } from "react";

type BrandColors = {
  primary: string | null;
  secondary: string | null;
  accent: string | null;
};

type Props = {
  colors: BrandColors;
};

const DEFAULTS = {
  primary: "#2563eb",
  secondary: "#64748b",
  accent: "#f59e0b",
} as const;

export function BrandThemeInjector({ colors }: Props) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-primary",   colors.primary   ?? DEFAULTS.primary);
    root.style.setProperty("--brand-secondary", colors.secondary ?? DEFAULTS.secondary);
    root.style.setProperty("--brand-accent",    colors.accent    ?? DEFAULTS.accent);
  }, [colors.primary, colors.secondary, colors.accent]);

  // Render nothing — side-effect only
  return null;
}
