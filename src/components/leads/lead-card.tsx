"use client";

import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LEAD_STATUS_CONFIG, ACTIVE_STATUSES } from "@/types";
import type { LeadStatus } from "@prisma/client";

const KANBAN_STATUSES: LeadStatus[] = [...ACTIVE_STATUSES, "won"];

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
  onStatusChange?: (leadId: number, newStatus: LeadStatus) => void;
};

export function LeadCard({ lead, onClick, onStatusChange }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lead.id });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const formatCurrency = (val: number) =>
    val > 0 ? `$${val.toLocaleString()}` : "—";

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(lead.id, newStatus as LeadStatus);
    }
  };

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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      "flex-shrink-0 text-xs font-mono px-1.5 py-0.5 rounded cursor-help",
                      lead.domainRating >= 30
                        ? "bg-status-success-bg text-status-success"
                        : lead.domainRating >= 15
                          ? "bg-status-warning-bg text-status-warning"
                          : "bg-status-danger-bg text-status-danger"
                    )}
                  >
                    DR {lead.domainRating}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">Domain Rating (0–100) — website authority score. Green (30+) = established site. Yellow (15–29) = developing. Red (&lt;15) = low authority. Higher DR = better SEO starting point.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
            <span>{lead._count.notes} notes</span>
          )}
        </div>
      </div>

      {/* Mobile-only stage selector */}
      {onStatusChange && (
        <div className="md:hidden mt-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
          <Select value={lead.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KANBAN_STATUSES.map((status) => (
                <SelectItem key={status} value={status} className="text-xs">
                  {LEAD_STATUS_CONFIG[status].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground mt-1">
            Tap to change stage
          </p>
        </div>
      )}
    </Card>
  );
}
