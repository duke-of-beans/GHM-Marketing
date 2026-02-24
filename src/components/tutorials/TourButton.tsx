"use client";

/**
 * TourButton — filled accent "?" that signals an interactive guided step.
 * Visual contrast vs InfoTip (subdued outline): filled accent = "show me how to use this".
 */

import { HelpCircle } from "lucide-react";
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
            className={`gap-1.5 text-primary/70 hover:text-primary hover:bg-primary/10 ${className}`}
            aria-label={tooltip}
          >
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
