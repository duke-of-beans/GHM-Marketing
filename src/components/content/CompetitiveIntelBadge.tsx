/**
 * CompetitiveIntelBadge
 *
 * Shows a compact "workload indicator" in each Content Studio panel header.
 * Tells you exactly how far behind the competition you are in that dimension
 * so you know what to work on the moment you open the panel.
 *
 * Visual: battery-style fill bars (5 segments) + a plain-English label.
 * Red = urgent work, Yellow = moderate, Green = ahead / nothing to do.
 */

"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type IntelLevel = "urgent" | "moderate" | "good" | "none";

export interface PanelIntel {
  level: IntelLevel;
  /** Short badge label e.g. "14 gaps" */
  label: string;
  /** Tooltip detail lines */
  details: string[];
  /** 0–5 filled segments */
  filledSegments: number;
}

interface Props {
  intel: PanelIntel | null;
}

const LEVEL_COLORS: Record<IntelLevel, { fill: string; text: string; border: string }> = {
  urgent:   { fill: "bg-status-danger-bg",    text: "text-status-danger",    border: "border-status-danger-border" },
  moderate: { fill: "bg-status-warning-bg", text: "text-status-warning", border: "border-status-warning-border" },
  good:     { fill: "bg-status-success-bg",  text: "text-status-success", border: "border-status-success-border" },
  none:     { fill: "bg-muted",      text: "text-muted-foreground",              border: "border-border" },
};

export function CompetitiveIntelBadge({ intel }: Props) {
  if (!intel) return null;

  const colors = LEVEL_COLORS[intel.level];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium cursor-help select-none",
              colors.text,
              colors.border,
              "bg-transparent"
            )}
            onClick={(e) => e.stopPropagation()} // don't collapse panel on tooltip click
          >
            {/* Battery segments */}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-3 rounded-sm",
                    i < intel.filledSegments ? colors.fill : "bg-muted-foreground/20"
                  )}
                />
              ))}
            </div>
            <span>{intel.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="max-w-xs space-y-1">
          {intel.details.map((line, i) => (
            <p key={i} className="text-xs">{line}</p>
          ))}
          <p className="text-[10px] text-muted-foreground pt-1">Based on last competitive scan</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
