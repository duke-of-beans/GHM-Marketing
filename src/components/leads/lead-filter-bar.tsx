"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp, X } from "lucide-react";

type Territory = { id: number; name: string };
type Rep = { id: number; name: string };

type FilterState = {
  search: string;
  territoryId: number | null;
  assignedToId: number | null;
  statuses: string[];
  dateRange: "all" | "7d" | "30d" | "90d";
  sortBy: "newest" | "oldest" | "value-high" | "value-low" | "updated";
};

type LeadFilterBarProps = {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  showTerritoryFilter: boolean;
};

const STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "scheduled", label: "Scheduled" },
  { value: "contacted", label: "Contacted" },
  { value: "follow_up", label: "Follow Up" },
  { value: "paperwork", label: "Paperwork" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export function LeadFilterBar({
  filters,
  onChange,
  showTerritoryFilter,
}: LeadFilterBarProps) {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [reps, setReps] = useState<Rep[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  const toggleStatus = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, statuses: newStatuses });
  };

  const clearFilters = () => {
    onChange({
      search: "",
      territoryId: null,
      assignedToId: null,
      statuses: [],
      dateRange: "all",
      sortBy: "newest",
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.territoryId ||
    filters.assignedToId ||
    filters.statuses.length > 0 ||
    filters.dateRange !== "all" ||
    filters.sortBy !== "newest";

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-card">
      {/* Basic Filters Row */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search businesses, phone, city..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full md:w-64 h-9"
        />

        {showTerritoryFilter && territories.length > 0 && (
          <Select
            value={filters.territoryId?.toString() || "all"}
            onValueChange={(value) =>
              onChange({
                ...filters,
                territoryId: value === "all" ? null : Number(value),
              })
            }
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Territory" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All territories</SelectItem>
              {territories.map((t) => (
                <SelectItem key={t.id} value={t.id.toString()}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {reps.length > 0 && (
          <Select
            value={
              filters.assignedToId === null
                ? "all"
                : filters.assignedToId === 0
                ? "unassigned"
                : filters.assignedToId.toString()
            }
            onValueChange={(value) =>
              onChange({
                ...filters,
                assignedToId:
                  value === "all"
                    ? null
                    : value === "unassigned"
                    ? 0
                    : Number(value),
              })
            }
          >
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Assigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All reps</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {reps.map((r) => (
                <SelectItem key={r.id} value={r.id.toString()}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={filters.sortBy}
          onValueChange={(value: any) => onChange({ ...filters, sortBy: value })}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="updated">Recently updated</SelectItem>
            <SelectItem value="value-high">Value: High to Low</SelectItem>
            <SelectItem value="value-low">Value: Low to High</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              More
            </>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      {(filters.statuses.length > 0 || filters.dateRange !== "all") && (
        <div className="flex flex-wrap gap-1.5">
          {filters.statuses.map((status) => (
            <Badge
              key={status}
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-muted"
              onClick={() => toggleStatus(status)}
            >
              {STATUS_OPTIONS.find((s) => s.value === status)?.label}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          {filters.dateRange !== "all" && (
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-muted"
              onClick={() => onChange({ ...filters, dateRange: "all" })}
            >
              Last{" "}
              {filters.dateRange === "7d"
                ? "7 days"
                : filters.dateRange === "30d"
                ? "30 days"
                : "90 days"}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="pt-3 border-t space-y-3">
          {/* Status Checkboxes */}
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {STATUS_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.statuses.includes(option.value)}
                    onChange={() => toggleStatus(option.value)}
                    className="rounded border-gray-300"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <div className="flex gap-2">
              <Button
                variant={filters.dateRange === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...filters, dateRange: "all" })}
              >
                All time
              </Button>
              <Button
                variant={filters.dateRange === "7d" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...filters, dateRange: "7d" })}
              >
                Last 7 days
              </Button>
              <Button
                variant={filters.dateRange === "30d" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...filters, dateRange: "30d" })}
              >
                Last 30 days
              </Button>
              <Button
                variant={filters.dateRange === "90d" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...filters, dateRange: "90d" })}
              >
                Last 90 days
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export type { FilterState };
