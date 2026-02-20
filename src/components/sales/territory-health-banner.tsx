"use client";

import { CheckCircle2, AlertTriangle, XCircle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface TerritoryHealthBannerProps {
  territoryName: string | null;
  rolling90DayAvg: number;
  thresholdTarget: number;
  thresholdProgress: number;
  thresholdStatus: "good" | "warning" | "danger";
  closedLast90: number;
}

export function TerritoryHealthBanner({
  territoryName,
  rolling90DayAvg,
  thresholdTarget,
  thresholdProgress,
  thresholdStatus,
  closedLast90,
}: TerritoryHealthBannerProps) {
  if (!territoryName) return null;

  const statusConfig = {
    good: {
      icon: CheckCircle2,
      bg: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
      text: "text-green-800 dark:text-green-300",
      bar: "bg-green-500",
      label: "On track",
      sublabel: "Territory secure",
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
      text: "text-amber-800 dark:text-amber-300",
      bar: "bg-amber-500",
      label: "Below threshold",
      sublabel: "Close more to protect territory",
    },
    danger: {
      icon: XCircle,
      bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
      text: "text-red-800 dark:text-red-300",
      bar: "bg-red-500",
      label: "At risk",
      sublabel: "Territory may be forfeited — act now",
    },
  };

  const cfg = statusConfig[thresholdStatus];
  const Icon = cfg.icon;

  return (
    <div className={cn("rounded-xl border px-4 py-3", cfg.bg)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className={cn("h-4 w-4 flex-shrink-0", cfg.text)} />
          <div className="min-w-0">
            <p className={cn("text-sm font-semibold truncate", cfg.text)}>
              {territoryName}
            </p>
            <p className={cn("text-xs", cfg.text, "opacity-70")}>
              {closedLast90} close{closedLast90 !== 1 ? "s" : ""} in last 90 days ·{" "}
              {rolling90DayAvg.toFixed(1)}/mo avg · {thresholdTarget}/mo required
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Icon className={cn("h-4 w-4", cfg.text)} />
          <span className={cn("text-xs font-medium", cfg.text)}>{cfg.label}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2.5">
        <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", cfg.bar)}
            style={{ width: `${thresholdProgress}%` }}
          />
        </div>
        {thresholdStatus !== "good" && (
          <p className={cn("text-xs mt-1 opacity-70", cfg.text)}>{cfg.sublabel}</p>
        )}
      </div>
    </div>
  );
}
