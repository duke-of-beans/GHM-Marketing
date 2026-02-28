// src/lib/format.ts
// Shared formatting utilities. Import from here — never inline number formatting.

/**
 * Format a number for display in a metric tile.
 * Abbreviates large numbers (1K, 2.4M) and falls back to locale-formatted
 * integers for values under 1,000.
 *
 * Examples:
 *   formatMetric(850)        → "850"
 *   formatMetric(1500)       → "1.5K"
 *   formatMetric(24000)      → "24K"
 *   formatMetric(1200000)    → "1.2M"
 *   formatMetric(3000000000) → "3B"
 */
export function formatMetric(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    const v = value / 1_000_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    const v = value / 1_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    const v = value / 1_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Format a number as USD currency with no decimal places.
 * Uses Intl.NumberFormat — consistent with browser locale.
 *
 * Examples:
 *   formatCurrency(2400)    → "$2,400"
 *   formatCurrency(28800)   → "$28,800"
 *   formatCurrency(1250000) → "$1,250,000"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number as USD currency, abbreviated for metric tiles.
 * Under $1K: full value. $1K+: abbreviated.
 *
 * Examples:
 *   formatCurrencyCompact(850)     → "$850"
 *   formatCurrencyCompact(1500)    → "$1.5K"
 *   formatCurrencyCompact(28800)   → "$28.8K"
 *   formatCurrencyCompact(1250000) → "$1.3M"
 */
export function formatCurrencyCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    const v = value / 1_000;
    return `$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}K`;
  }
  return formatCurrency(value);
}

/**
 * Format a delta value as a signed percentage string.
 *
 * Examples:
 *   formatDelta(2.3)  → "+2.3%"
 *   formatDelta(-1.1) → "-1.1%"
 *   formatDelta(0)    → "+0.0%"
 */
export function formatDelta(delta: number): string {
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}
