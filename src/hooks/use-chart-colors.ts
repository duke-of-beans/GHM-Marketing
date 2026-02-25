"use client";

/**
 * useChartColors — resolves COVOS chart tokens to hex for recharts.
 *
 * Recharts requires resolved hex/rgb values (not CSS variable references).
 * This hook reads the computed --chart-N variables from the DOM and returns
 * them as hex strings. Updates when theme changes (light/dark).
 *
 * Usage:
 *   const colors = useChartColors();
 *   <Bar fill={colors[0]} />      // chart-1
 *   <Line stroke={colors[2]} />   // chart-3
 *
 * Also exports CHART_FALLBACKS for server-side / static contexts.
 */

import { useState, useEffect } from "react";

/** Light-mode fallbacks matching globals.css --chart-1 through --chart-8 */
export const CHART_FALLBACKS = [
  "#4f46e5", // indigo  (chart-1)
  "#d97706", // amber   (chart-2)
  "#2ba8a0", // teal    (chart-3)
  "#e11d48", // rose    (chart-4)
  "#8b5cf6", // violet  (chart-5)
  "#0891b2", // cyan    (chart-6)
  "#65a30d", // lime    (chart-7)
  "#ea580c", // orange  (chart-8)
] as const;

function resolveChartColors(): string[] {
  if (typeof window === "undefined") return [...CHART_FALLBACKS];

  const style = getComputedStyle(document.documentElement);
  return Array.from({ length: 8 }, (_, i) => {
    const raw = style.getPropertyValue(`--chart-${i + 1}`).trim();
    if (!raw) return CHART_FALLBACKS[i];
    // Convert HSL components "H S% L%" to hex via canvas
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return CHART_FALLBACKS[i];
      ctx.fillStyle = `hsl(${raw})`;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      const r = d[0], g = d[1], b = d[2];
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    } catch {
      return CHART_FALLBACKS[i];
    }
  });
}

export function useChartColors(): string[] {
  const [colors, setColors] = useState<string[]>([...CHART_FALLBACKS]);

  useEffect(() => {
    setColors(resolveChartColors());

    // Re-resolve when dark mode toggles (class change on <html>)
    const observer = new MutationObserver(() => {
      setColors(resolveChartColors());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return colors;
}
