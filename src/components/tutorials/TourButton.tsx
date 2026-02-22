"use client";

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
  /** Optional label shown next to the icon (default: hidden, icon only) */
  label?: string;
  /** Tooltip text (default: "Take a tour of this page") */
  tooltip?: string;
  className?: string;
};

/**
 * TourButton — a small ? icon button that launches the page tour.
 * Drop this anywhere in a page header to give users on-demand access to the tour.
 *
 * Usage:
 *   const { startTour } = useTour(LEADS_TOUR);
 *   <TourButton onStart={startTour} />
 */
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
            className={`gap-1.5 text-muted-foreground hover:text-foreground ${className}`}
            aria-label={tooltip}
          >
            <HelpCircle className="h-4 w-4" />
            {label && <span className="text-xs">{label}</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
