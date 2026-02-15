"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

type Territory = { id: number; name: string };
type Rep = { id: number; name: string };

type FilterState = {
  search: string;
  territoryId: number | null;
  assignedToId: number | null;
};

type LeadFilterBarProps = {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  showTerritoryFilter: boolean; // Only for master role
};

export function LeadFilterBar({
  filters,
  onChange,
  showTerritoryFilter,
}: LeadFilterBarProps) {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [reps, setReps] = useState<Rep[]>([]);

  useEffect(() => {
    if (showTerritoryFilter) {
      fetch("/api/territories")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setTerritories(d.data);
        })
        .catch(() => {});
    }

    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setReps(d.data);
      })
      .catch(() => {});
  }, [showTerritoryFilter]);

  return (
    <div className="flex flex-wrap gap-2">
      <Input
        placeholder="Search businesses..."
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        className="w-full md:w-56 h-9"
      />

      {showTerritoryFilter && territories.length > 0 && (
        <select
          className="h-9 px-2 text-sm border rounded bg-background min-w-[140px]"
          value={filters.territoryId ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              territoryId: e.target.value ? Number(e.target.value) : null,
            })
          }
        >
          <option value="">All territories</option>
          {territories.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}

      {reps.length > 0 && (
        <select
          className="h-9 px-2 text-sm border rounded bg-background min-w-[130px]"
          value={filters.assignedToId ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              assignedToId: e.target.value ? Number(e.target.value) : null,
            })
          }
        >
          <option value="">All reps</option>
          <option value="0">Unassigned</option>
          {reps.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      )}

      {(filters.search || filters.territoryId || filters.assignedToId) && (
        <button
          className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground border rounded"
          onClick={() =>
            onChange({ search: "", territoryId: null, assignedToId: null })
          }
        >
          Clear
        </button>
      )}
    </div>
  );
}

export type { FilterState };
