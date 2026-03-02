"use client";

import { useEffect } from "react";

const DENSITY_KEY = "covos:display-density";
const DEFAULT_DENSITY = "comfortable";

export type Density = "compact" | "comfortable";

export function applyDensity(density: Density) {
  if (typeof document === "undefined") return;
  document.body.setAttribute("data-density", density);
  localStorage.setItem(DENSITY_KEY, density);
}

export function getSavedDensity(): Density {
  if (typeof window === "undefined") return DEFAULT_DENSITY as Density;
  const saved = localStorage.getItem(DENSITY_KEY);
  if (saved === "compact" || saved === "comfortable") return saved;
  return DEFAULT_DENSITY as Density;
}

export function DensityProvider() {
  useEffect(() => {
    // Apply saved density on mount
    const density = getSavedDensity();
    document.body.setAttribute("data-density", density);
  }, []);

  return null; // No UI — just applies the attribute
}
