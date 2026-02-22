"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { LEAD_STATUS_CONFIG, ACTIVE_STATUSES } from "@/types";
import { KanbanColumn } from "./kanban-column";
import { LeadCard } from "./lead-card";
import type { LeadStatus } from "@prisma/client";
import { toast } from "sonner";

const COLUMN_EMPTY_MESSAGES: Partial<Record<LeadStatus, string>> = {
  available: "No leads here. Import a list or run discovery.",
  scheduled: "Nothing on the calendar. The phone works both ways.",
  contacted: "First touch pending. Somebody has to go first.",
  follow_up: "Follow-up queue is clear. Either you're crushing it or nobody's calling back.",
  paperwork: "No contracts in motion. Close something.",
  won: "The win column. Currently empty — keep going.",
  lost: "Nothing here. Small victories.",
};

// Kanban shows active pipeline + "Won" as the finish line
const KANBAN_STATUSES: LeadStatus[] = [...ACTIVE_STATUSES, "won"];

type KanbanLead = {
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

type KanbanBoardProps = {
  initialLeads: KanbanLead[];
  onLeadClick: (leadId: number) => void;
};

export function KanbanBoard({ initialLeads, onLeadClick }: KanbanBoardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeId, setActiveId] = useState<number | null>(null);

  // Touch sensor with 250ms delay for mobile hold-and-pick
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  );

  const activeLead = activeId
    ? leads.find((l) => l.id === activeId)
    : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);

      const { active, over } = event;
      if (!over) return;

      const leadId = active.id as number;
      const newStatus = over.id as LeadStatus;

      const lead = leads.find((l) => l.id === leadId);
      if (!lead || lead.status === newStatus) return;

      await updateLeadStatus(leadId, newStatus, lead.status, lead.businessName);
    },
    [leads]
  );

  // Shared status update logic for both drag-and-drop and mobile dropdown
  const updateLeadStatus = async (
    leadId: number,
    newStatus: LeadStatus,
    oldStatus: LeadStatus,
    businessName: string
  ) => {
    // Optimistic update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId ? { ...l, status: newStatus } : l
      )
    );

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      toast.success(
        newStatus === "won"
          ? `🎉 ${businessName} won! Client profile created.`
          : `${businessName} → ${LEAD_STATUS_CONFIG[newStatus].label}`
      );
    } catch {
      // Revert on failure
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId ? { ...l, status: oldStatus } : l
        )
      );
      toast.error("Failed to update lead status");
    }
  };

  // Mobile status change handler
  const handleStatusChange = (leadId: number, newStatus: LeadStatus) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;
    updateLeadStatus(leadId, newStatus, lead.status, lead.businessName);
  };

  // Group leads by status
  const columns = KANBAN_STATUSES.map((status) => ({
    status,
    config: LEAD_STATUS_CONFIG[status],
    leads: leads.filter((l) => l.status === status),
  }));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 min-h-[60vh]">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            id={col.status}
            title={col.config.label}
            description={col.config.description}
            color={col.config.color}
            bgColor={col.config.bgColor}
            count={col.leads.length}
            emptyMessage={COLUMN_EMPTY_MESSAGES[col.status]}
            dataTour={
              col.status === "available"
                ? "kanban-column-available"
                : col.status === "won"
                ? "kanban-column-won"
                : undefined
            }
          >
            {col.leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onClick={() => onLeadClick(lead.id)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </KanbanColumn>
        ))}
      </div>

      <DragOverlay>
        {activeLead ? (
          <div className="opacity-90 rotate-2">
            <LeadCard lead={activeLead} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
