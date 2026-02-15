"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type KanbanColumnProps = {
  id: string;
  title: string;
  color: string;
  bgColor: string;
  count: number;
  children: React.ReactNode;
};

export function KanbanColumn({
  id,
  title,
  color,
  bgColor,
  count,
  children,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-[280px] md:w-[300px] flex flex-col rounded-lg border transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-border bg-muted/30"
      )}
    >
      {/* Column header */}
      <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-t-lg", bgColor)}>
        <span className={cn("text-sm font-semibold", color)}>{title}</span>
        <Badge variant="secondary" className="text-xs font-mono">
          {count}
        </Badge>
      </div>

      {/* Cards container */}
      <div className="flex-1 p-2 space-y-2 min-h-[100px] overflow-y-auto max-h-[calc(100vh-220px)]">
        {children}
        {count === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
            Drop leads here
          </div>
        )}
      </div>
    </div>
  );
}
