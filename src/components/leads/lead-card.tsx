"use client";

import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { LeadStatus } from "@prisma/client";

type LeadCardProps = {
  lead: {
    id: number;
    businessName: string;
    phone: string;
    city: string;
    state: string;
    status: LeadStatus;
    domainRating: number | null;
    reviewCount: number | null;
    dealValueTotal: number;
    assignedUser: { id: number; name: string } | null;
    _count: { notes: number };
  };
  onClick: () => void;
};

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lead.id });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const formatCurrency = (val: number) =>
    val > 0 ? `$${val.toLocaleString()}` : "—";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 cursor-grab active:cursor-grabbing touch-manipulation select-none transition-shadow",
        isDragging && "opacity-50 shadow-lg z-50"
      )}
      {...listeners}
      {...attributes}
    >
      {/* Tap target for opening detail — sits above drag layer on quick tap */}
      <div onClick={onClick} className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-tight line-clamp-2">
            {lead.businessName}
          </h3>
          {lead.domainRating !== null && (
            <span
              className={cn(
                "flex-shrink-0 text-xs font-mono px-1.5 py-0.5 rounded",
                lead.domainRating >= 30
                  ? "bg-green-100 text-green-700"
                  : lead.domainRating >= 15
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              )}
            >
              DR {lead.domainRating}
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {lead.city}, {lead.state}
        </p>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{lead.phone}</span>
          <span className="font-medium">
            {formatCurrency(lead.dealValueTotal)}
          </span>
        </div>

        {/* Footer: assignee + note count */}
        <div className="flex items-center justify-between pt-1 border-t text-xs text-muted-foreground">
          <span>
            {lead.assignedUser?.name ?? "Unassigned"}
          </span>
          {lead._count.notes > 0 && (
            <span>💬 {lead._count.notes}</span>
          )}
        </div>
      </div>
    </Card>
  );
}
