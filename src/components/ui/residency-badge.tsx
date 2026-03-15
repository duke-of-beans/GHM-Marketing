"use client";

/**
 * ResidencyBadge — TRUST-002
 * Sprint COVOS-SEC-02, March 2026
 *
 * Displays a small colored dot + optional label indicating where an AI feature
 * processes data. Color scheme matches the Data Residency Summary in
 * PrivacyDashboardTab (TRUST-001).
 *
 * 🟢 local       — processed on COVOS servers, no external API
 * 🔵 claude      — Claude API (encrypted in transit, not used for training)
 * 🟡 third-party — third-party enrichment (Ahrefs, SerpAPI, Outscraper, PageSpeed)
 */

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ResidencyType = "local" | "claude" | "third-party";

interface ResidencyBadgeProps {
  type: ResidencyType;
  label?: string;
  size?: "sm" | "md";
}

const RESIDENCY_CONFIG: Record<
  ResidencyType,
  { dotColor: string; defaultLabel: string; tooltip: string }
> = {
  local: {
    dotColor: "bg-green-500",
    defaultLabel: "Local",
    tooltip:
      "Processed locally — no data leaves COVOS servers. Deterministic logic only.",
  },
  claude: {
    dotColor: "bg-blue-500",
    defaultLabel: "Claude API",
    tooltip:
      "Processed via Anthropic's Claude API. Encrypted in transit. Not used for model training.",
  },
  "third-party": {
    dotColor: "bg-yellow-500",
    defaultLabel: "Third-party",
    tooltip:
      "Processed via a third-party API (Ahrefs, SerpAPI, Outscraper, or PageSpeed). Domain or keyword data only — no client PII.",
  },
};

export function ResidencyBadge({
  type,
  label,
  size = "sm",
}: ResidencyBadgeProps) {
  const config = RESIDENCY_CONFIG[type];
  const displayLabel = label ?? config.defaultLabel;
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const dotSize = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1.5 text-muted-foreground cursor-default select-none ${textSize}`}
            aria-label={`Data residency: ${displayLabel}`}
          >
            <span
              className={`inline-flex rounded-full flex-shrink-0 ${dotSize} ${config.dotColor}`}
            />
            {displayLabel}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] text-xs">
          {config.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
