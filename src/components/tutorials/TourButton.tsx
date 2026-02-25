"use client";

/**
 * TourButton — signals an interactive guided tour. Visually distinct from
 * InfoTip (passive help) via sparkle badge: "this will show me something."
 *
 * Design: ghost button with HelpCircle icon + a small Sparkles badge
 * absolutely positioned top-right. No animation — tasteful, not distracting.
 */

import { HelpCircle, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

type TourButtonProps = {
  onStart: () => void;
  label?: string;
  tooltip?: string;
  className?: string;
};

export function TourButton({
  onStart,
  label,
  tooltip = "Take a tour of this page",
  className = "",
}: TourButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onStart}
            className={`relative gap-1.5 text-primary/70 hover:text-primary hover:bg-primary/10 ${className}`}
            aria-label={tooltip}
          >
            {/* Sparkle badge — signals guided/interactive vs passive InfoTip */}
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center
                         w-3.5 h-3.5 rounded-full bg-amber-400 dark:bg-amber-500
                         ring-1 ring-background"
              aria-hidden="true"
            >
              <Sparkles className="h-2 w-2 text-white" strokeWidth={2.5} />
            </span>
            <HelpCircle className="h-4 w-4" />
            {label && <span className="text-xs font-medium">{label}</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
