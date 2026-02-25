"use client";

/**
 * StatusBadge — universal status indicator using COVOS semantic tokens.
 *
 * Replaces 12 independent color systems with 5 semantic variants.
 * Maps to --status-{variant}, --status-{variant}-bg, --status-{variant}-border
 * tokens in globals.css. These are COVOS platform colors — never overridden by tenants.
 *
 * Usage:
 *   <StatusBadge variant="success">Active</StatusBadge>
 *   <StatusBadge variant="danger" dot>Critical</StatusBadge>
 *   <StatusBadge variant="warning" size="sm">At Risk</StatusBadge>
 */

import { type ReactNode } from "react";

export type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

type StatusBadgeProps = {
  variant: StatusVariant;
  children: ReactNode;
  /** Show a colored dot before the label */
  dot?: boolean;
  /** Size preset */
  size?: "sm" | "md";
  /** Additional className for positioning, margins, etc. */
  className?: string;
};

/**
 * Tailwind class map using semantic status tokens.
 * These map to globals.css --status-* variables via tailwind.config.ts.
 */
const VARIANT_CLASSES: Record<StatusVariant, { badge: string; dot: string }> = {
  success: {
    badge: "bg-status-success-bg text-status-success border-status-success-border",
    dot:   "bg-green-500 dark:bg-green-400",
  },
  warning: {
    badge: "bg-status-warning-bg text-status-warning border-status-warning-border",
    dot:   "bg-yellow-500 dark:bg-yellow-400",
  },
  danger: {
    badge: "bg-status-danger-bg text-status-danger border-status-danger-border",
    dot:   "bg-red-500 dark:bg-red-400",
  },
  info: {
    badge: "bg-status-info-bg text-status-info border-status-info-border",
    dot:   "bg-blue-500 dark:bg-blue-400",
  },
  neutral: {
    badge: "bg-status-neutral-bg text-status-neutral border-status-neutral-border",
    dot:   "bg-slate-400 dark:bg-slate-500",
  },
};

const SIZE_CLASSES = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2 py-0.5",
} as const;

const DOT_SIZES = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
} as const;

export function StatusBadge({
  variant,
  children,
  dot = false,
  size = "sm",
  className = "",
}: StatusBadgeProps) {
  const v = VARIANT_CLASSES[variant];
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded border ${v.badge} ${SIZE_CLASSES[size]} ${className}`}
    >
      {dot && <span className={`rounded-full shrink-0 ${v.dot} ${DOT_SIZES[size]}`} />}
      {children}
    </span>
  );
}

/**
 * Helper: map a numeric score to a status variant.
 * Used by health scores, churn risk, etc.
 *
 * Usage:
 *   const variant = scoreToVariant(healthScore, { danger: 50, warning: 75 });
 */
export function scoreToVariant(
  score: number,
  thresholds: { danger: number; warning: number },
): StatusVariant {
  if (score < thresholds.danger) return "danger";
  if (score < thresholds.warning) return "warning";
  return "success";
}
