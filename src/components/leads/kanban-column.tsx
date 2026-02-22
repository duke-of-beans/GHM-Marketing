"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type KanbanColumnProps = {
  id: string;
  title: string;
  description?: string;
  color: string;
  bgColor: string;
  count: number;
  emptyMessage?: string;
  children: React.ReactNode;
  dataTour?: string;
};

export function KanbanColumn({
  id,
  title,
  description,
  color,
  bgColor,
  count,
  emptyMessage = "Drop leads here",
  children,
  dataTour,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      data-tour={dataTour}
      className={cn(
        "flex-shrink-0 w-[280px] md:w-[300px] flex flex-col rounded-lg border transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-border bg-muted/30"
      )}
    >
      {/* Column header */}
      <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-t-lg", bgColor)}>
        {description ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={cn("text-sm font-semibold cursor-help", color)}>{title}</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className={cn("text-sm font-semibold", color)}>{title}</span>
        )}
        <Badge variant="secondary" className="text-xs font-mono">
          {count}
        </Badge>
      </div>

      {/* Cards container */}
      <div className="flex-1 p-2 space-y-2 min-h-[100px] overflow-y-auto max-h-[calc(100vh-220px)]">
        {children}
        {count === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground text-center px-2">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
