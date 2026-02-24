"use client";

/**
 * InfoTip — subdued, outline-style "?" for contextual definitions and metric explanations.
 * Visual language: muted, informational only. Does NOT launch any tour or guided flow.
 *
 * TourTip (see TourButton) — filled accent "?" that signals an interactive guided step.
 * Users learn: muted ? = "what is this", filled accent ? = "show me how to use this".
 *
 * Usage:
 *   <InfoTip content="Health score reflects GBP engagement over the last 30 days." />
 *   <InfoTip content="..." side="left" />
 */

import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";
import type { TooltipContent as TooltipContentType } from "@radix-ui/react-tooltip";

type InfoTipProps = {
  /** Tooltip text — keep brief and informational. */
  content: string;
  /** Icon size class (default: h-3.5 w-3.5) */
  size?: string;
  className?: string;
  side?: ComponentPropsWithoutRef<typeof TooltipContentType>["side"];
};

export function InfoTip({
  content,
  size = "h-3.5 w-3.5",
  className,
  side = "top",
}: InfoTipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center cursor-help text-muted-foreground/60 hover:text-muted-foreground transition-colors",
              className
            )}
            aria-label={content}
          >
            <HelpCircle className={size} />
          </span>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs text-xs leading-relaxed">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
