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

// Signal palette defaults — what an unbranded tenant sees
const DEFAULTS = {
  primary: "#4f46e5",   // indigo-600 (Signal primary)
  secondary: "#94a3b8", // slate-400 (Signal secondary)
  accent: "#d97706",    // amber-600 (Signal accent)
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
