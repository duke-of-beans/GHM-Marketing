"use client";

// src/components/dashboard/metric-card.tsx
// Standard metric tile for dashboard KPI grids.
// Enforces: min-h-[120px], Intl.NumberFormat formatting, delta indicators,
// loading skeletons, and consistent label typography.

import { cn } from "@/lib/utils";
import { HelpCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency, formatDelta } from "@/lib/format";

// Re-export formatCurrency so existing callers that import it from here
// don't break. New code should import directly from @/lib/format.
export { formatCurrency } from "@/lib/format";

type MetricCardProps = {
  title: string;
  /**
   * The formatted value to display. Pass a pre-formatted string (via
   * formatCurrency / formatMetric from @/lib/format) or a raw number.
   * Raw numbers are rendered as-is with no formatting applied here —
   * format before passing.
   */
  value: string | number;
  subtitle?: string;
  /**
   * Optional signed percentage change.
   * Positive → green TrendingUp. Negative → red TrendingDown.
   * Displayed as "+2.3%" or "-1.1%".
   */
  delta?: number;
  /**
   * Legacy trend prop — kept for backward compatibility.
   * Prefer `delta` for new usage.
   */
  trend?: { value: number; label: string };
  /** When true renders a loading skeleton instead of the value. */
  isLoading?: boolean;
  className?: string;
  tooltip?: string;
};

export function MetricCard({
  title,
  value,
  subtitle,
  delta,
  trend,
  isLoading = false,
  className,
  tooltip,
}: MetricCardProps) {
  // Normalise delta — prefer explicit `delta` prop; fall back to legacy `trend.value`.
  const deltaValue = delta ?? trend?.value ?? null;

  return (
    <TooltipProvider>
      <div
        className={cn(
          "relative rounded-lg bg-card p-4 min-h-[120px] flex flex-col justify-between",
          className
        )}
      >
        {/* Label — always top */}
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          {title}
        </p>

        {/* Value block */}
        <div className="flex items-baseline gap-2 mt-auto">
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <>
              <p className="text-3xl font-bold tabular-nums">{value}</p>

              {/* Delta indicator */}
              {deltaValue !== null && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded",
                    deltaValue >= 0
                      ? "text-status-success bg-status-success-bg"
                      : "text-status-danger bg-status-danger-bg"
                  )}
                >
                  {deltaValue >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {formatDelta(deltaValue)}
                </span>
              )}
            </>
          )}
        </div>

        {/* Subtitle */}
        {subtitle && !isLoading && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}

        {/* Tooltip trigger */}
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="absolute top-3 right-3 h-3.5 w-3.5 text-muted-foreground/50 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
