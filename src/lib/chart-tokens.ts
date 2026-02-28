// src/lib/chart-tokens.ts
// Centralised chart colour tokens for Recharts (and any other charting lib).
// Always import from here — never inline hsl(var(--chart-N)) strings in components.
//
// Token values resolve to the CSS custom properties defined in globals.css.
// Both :root and .dark are covered — Recharts reads these at render time so
// dark-mode switches happen automatically without component changes.

export const CHART_COLORS = {
  // Semantic positions (use for ordered series)
  primary:    "hsl(var(--chart-1))",
  secondary:  "hsl(var(--chart-2))",
  tertiary:   "hsl(var(--chart-3))",
  quaternary: "hsl(var(--chart-4))",
  quinary:    "hsl(var(--chart-5))",

  // Domain-specific aliases (use for named metrics)
  revenue: "hsl(var(--chart-1))",  // indigo — primary revenue metric
  clients: "hsl(var(--chart-2))",  // amber  — client count / growth
  churn:   "hsl(var(--destructive))", // red  — always destructive colour
  health:  "hsl(var(--chart-3))",  // teal   — health score
  new:     "hsl(var(--chart-4))",  // rose   — new leads / new clients
} as const;

// Grid and axis colours — match the shadcn/ui border token so charts
// blend with card borders without needing a separate design decision.
export const CHART_GRID_COLOR    = "hsl(var(--border))";
export const CHART_AXIS_COLOR    = "hsl(var(--muted-foreground))";

// Tooltip colours — use the popover surface so tooltips are themed
// consistently with all other popover UI (dropdowns, command palette, etc.)
export const CHART_TOOLTIP_BG     = "hsl(var(--popover))";
export const CHART_TOOLTIP_BORDER = "hsl(var(--border))";

/**
 * Return an ordered array of chart colours for multi-series charts.
 * Cycles through CHART_COLORS.primary → quinary then repeats.
 *
 * Usage:
 *   const colors = getChartColorScale(data.length);
 *   <Bar dataKey="value" fill={colors[index]} />
 */
export function getChartColorScale(count: number): string[] {
  const palette = [
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
    CHART_COLORS.tertiary,
    CHART_COLORS.quaternary,
    CHART_COLORS.quinary,
  ];
  return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
}
