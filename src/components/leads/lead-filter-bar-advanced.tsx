"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, X, HelpCircle, SlidersHorizontal, BookmarkPlus, Bookmark } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Territory = { id: number; name: string };
type Rep = { id: number; name: string };
type LeadSource = { id: number; name: string; type: string | null };
type SavedSearch = { id: number; name: string; filtersJson: AdvancedFilterState; createdAt: string };

export type AdvancedFilterState = {
  // Basic
  search: string;
  territoryId: number | null;
  assignedToId: number | null;
  statuses: string[];
  dateRange: "all" | "7d" | "30d" | "90d";
  sortBy: "newest" | "oldest" | "value-high" | "value-low" | "updated" | "impact-high" | "impact-low" | "close-high" | "close-low";

  // Priority/Quality
  impactScoreMin: number;
  impactScoreMax: number;
  closeLikelihoodMin: number;
  closeLikelihoodMax: number;
  priorityTiers: string[];

  // Business Quality
  ratingMin: number;
  ratingMax: number;
  reviewCountMin: number;
  reviewCountMax: number;
  domainRatingMin: number;
  domainRatingMax: number;
  hasWebsite: "all" | "yes" | "no";
  hasEmail: "all" | "yes" | "no";

  // Market Intelligence
  marketTypes: string[];
  suppressionSignals: string[];
  municipalMismatch: "all" | "yes" | "no";
  wealthScoreMin: number;
  wealthScoreMax: number;
  distanceFromMetroMin: number;
  distanceFromMetroMax: number;

  // Exclusions
  excludeChains: boolean;
  excludeFranchises: boolean;
  excludeCorporate: boolean;

  // Pipeline debt additions
  leadSourceIds: number[];
  dealValueMin: number;
  dealValueMax: number;
  daysInStageMin: number;
  daysInStageMax: number;
};

type AdvancedLeadFilterBarProps = {
  filters: AdvancedFilterState;
  onChange: (filters: AdvancedFilterState) => void;
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

const MARKET_TYPE_OPTIONS = [
  { value: "wealthy_suburb", label: "Wealthy Suburb Suppression" },
  { value: "incorporated_city", label: "Incorporated City Penalty" },
  { value: "rapid_growth", label: "Rapid Growth Market" },
  { value: "border_town", label: "Interstate Border Town" },
  { value: "fragmented_metro", label: "Fragmented Metropolitan" },
  { value: "immigrant_cluster", label: "Immigrant/Ethnic Cluster" },
];

const PRIORITY_TIER_OPTIONS = [
  { value: "A", label: "Tier A" },
  { value: "B", label: "Tier B" },
  { value: "C", label: "Tier C" },
];

export const DEFAULT_FILTERS: AdvancedFilterState = {
  search: "",
  territoryId: null,
  assignedToId: null,
  statuses: [],
  dateRange: "all",
  sortBy: "newest",

  impactScoreMin: 0,
  impactScoreMax: 100,
  closeLikelihoodMin: 0,
  closeLikelihoodMax: 100,
  priorityTiers: [],

  ratingMin: 0,
  ratingMax: 5,
  reviewCountMin: 0,
  reviewCountMax: 1000,
  domainRatingMin: 0,
  domainRatingMax: 100,
  hasWebsite: "all",
  hasEmail: "all",

  marketTypes: [],
  suppressionSignals: [],
  municipalMismatch: "all",
  wealthScoreMin: 0,
  wealthScoreMax: 500,
  distanceFromMetroMin: 0,
  distanceFromMetroMax: 50,

  excludeChains: false,
  excludeFranchises: false,
  excludeCorporate: false,

  leadSourceIds: [],
  dealValueMin: 0,
  dealValueMax: 50000,
  daysInStageMin: 0,
  daysInStageMax: 365,
};

// --- Chip helpers -----------------------------------------------------------

type FilterChip = { label: string; onRemove: () => void };

function buildActiveChips(
  filters: AdvancedFilterState,
  onChange: (f: AdvancedFilterState) => void,
  leadSources: LeadSource[]
): FilterChip[] {
  const chips: FilterChip[] = [];
  const set = (patch: Partial<AdvancedFilterState>) => onChange({ ...filters, ...patch });

  // statuses
  for (const s of filters.statuses) {
    const label = STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
    chips.push({ label, onRemove: () => set({ statuses: filters.statuses.filter((x) => x !== s) }) });
  }

  // dateRange
  if (filters.dateRange !== "all") {
    const map = { "7d": "Last 7d", "30d": "Last 30d", "90d": "Last 90d" };
    chips.push({ label: map[filters.dateRange], onRemove: () => set({ dateRange: "all" }) });
  }

  // priorityTiers
  for (const t of filters.priorityTiers) {
    chips.push({ label: `Tier ${t}`, onRemove: () => set({ priorityTiers: filters.priorityTiers.filter((x) => x !== t) }) });
  }

  // impact score
  if (filters.impactScoreMin > 0 || filters.impactScoreMax < 100) {
    chips.push({ label: `Impact ${filters.impactScoreMin}–${filters.impactScoreMax}`, onRemove: () => set({ impactScoreMin: 0, impactScoreMax: 100 }) });
  }

  // close likelihood
  if (filters.closeLikelihoodMin > 0 || filters.closeLikelihoodMax < 100) {
    chips.push({ label: `Close ${filters.closeLikelihoodMin}–${filters.closeLikelihoodMax}`, onRemove: () => set({ closeLikelihoodMin: 0, closeLikelihoodMax: 100 }) });
  }

  // rating
  if (filters.ratingMin > 0 || filters.ratingMax < 5) {
    chips.push({ label: `Rating ${filters.ratingMin.toFixed(1)}–${filters.ratingMax.toFixed(1)}★`, onRemove: () => set({ ratingMin: 0, ratingMax: 5 }) });
  }

  // reviews
  if (filters.reviewCountMin > 0 || filters.reviewCountMax < 1000) {
    chips.push({ label: `Reviews ${filters.reviewCountMin}–${filters.reviewCountMax}`, onRemove: () => set({ reviewCountMin: 0, reviewCountMax: 1000 }) });
  }

  // domain rating
  if (filters.domainRatingMin > 0 || filters.domainRatingMax < 100) {
    chips.push({ label: `DR ${filters.domainRatingMin}–${filters.domainRatingMax}`, onRemove: () => set({ domainRatingMin: 0, domainRatingMax: 100 }) });
  }

  // hasWebsite / hasEmail
  if (filters.hasWebsite !== "all") {
    chips.push({ label: `Website: ${filters.hasWebsite}`, onRemove: () => set({ hasWebsite: "all" }) });
  }
  if (filters.hasEmail !== "all") {
    chips.push({ label: `Email: ${filters.hasEmail}`, onRemove: () => set({ hasEmail: "all" }) });
  }

  // deal value
  if (filters.dealValueMin > 0 || filters.dealValueMax < 50000) {
    const maxLabel = filters.dealValueMax === 50000 ? "50k+" : `$${filters.dealValueMax.toLocaleString()}`;
    chips.push({ label: `Value $${filters.dealValueMin.toLocaleString()}–${maxLabel}`, onRemove: () => set({ dealValueMin: 0, dealValueMax: 50000 }) });
  }

  // days in stage
  if (filters.daysInStageMin > 0 || filters.daysInStageMax < 365) {
    chips.push({ label: `Stage ${filters.daysInStageMin}–${filters.daysInStageMax === 365 ? "365+" : filters.daysInStageMax}d`, onRemove: () => set({ daysInStageMin: 0, daysInStageMax: 365 }) });
  }

  // market types
  for (const m of filters.marketTypes) {
    const label = MARKET_TYPE_OPTIONS.find((o) => o.value === m)?.label.split(" ")[0] ?? m;
    chips.push({ label, onRemove: () => set({ marketTypes: filters.marketTypes.filter((x) => x !== m) }) });
  }

  // lead sources
  for (const id of filters.leadSourceIds) {
    const label = leadSources.find((s) => s.id === id)?.name ?? `Source ${id}`;
    chips.push({ label, onRemove: () => set({ leadSourceIds: filters.leadSourceIds.filter((x) => x !== id) }) });
  }

  return chips;
}

// ---------------------------------------------------------------------------

export function AdvancedLeadFilterBar({
  filters,
  onChange,
  showTerritoryFilter,
}: AdvancedLeadFilterBarProps) {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [reps, setReps] = useState<Rep[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [showMarket, setShowMarket] = useState(false);

  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [activeSavedSearch, setActiveSavedSearch] = useState<string | null>(null);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveInputValue, setSaveInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const saveInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showTerritoryFilter) {
      fetch("/api/territories")
        .then((r) => r.json())
        .then((d) => { if (d.success) setTerritories(d.data); })
        .catch(() => {});
    }
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => { if (d.success) setReps(d.data); })
      .catch(() => {});
    fetch("/api/lead-sources")
      .then((r) => r.json())
      .then((d) => { if (d.success) setLeadSources(d.data); })
      .catch(() => {});
    fetch("/api/saved-searches")
      .then((r) => r.json())
      .then((d) => { if (d.success) setSavedSearches(d.data); })
      .catch(() => {});
  }, [showTerritoryFilter]);

  useEffect(() => {
    if (showSaveInput) setTimeout(() => saveInputRef.current?.focus(), 50);
  }, [showSaveInput]);

  const handleSaveSearch = async () => {
    if (!saveInputValue.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: saveInputValue.trim(), filters }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSearches((prev) => [data.data, ...prev]);
        setActiveSavedSearch(data.data.name);
        setShowSaveInput(false);
        setSaveInputValue("");
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSearch = (search: SavedSearch) => {
    onChange(search.filtersJson);
    setActiveSavedSearch(search.name);
  };

  const handleDeleteSearch = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/saved-searches/${id}`, { method: "DELETE" });
      setSavedSearches((prev) => {
        const remaining = prev.filter((s) => s.id !== id);
        const active = remaining.find((s) => s.name === activeSavedSearch);
        if (!active) setActiveSavedSearch(null);
        return remaining;
      });
    } catch {
      // silently fail
    }
  };

  const toggleStatus = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, statuses: newStatuses });
  };

  const toggleMarketType = (type: string) => {
    const newTypes = filters.marketTypes.includes(type)
      ? filters.marketTypes.filter((t) => t !== type)
      : [...filters.marketTypes, type];
    onChange({ ...filters, marketTypes: newTypes });
  };

  const togglePriorityTier = (tier: string) => {
    const newTiers = filters.priorityTiers.includes(tier)
      ? filters.priorityTiers.filter((t) => t !== tier)
      : [...filters.priorityTiers, tier];
    onChange({ ...filters, priorityTiers: newTiers });
  };

  const toggleLeadSource = (id: number) => {
    const newIds = filters.leadSourceIds.includes(id)
      ? filters.leadSourceIds.filter((s) => s !== id)
      : [...filters.leadSourceIds, id];
    onChange({ ...filters, leadSourceIds: newIds });
  };

  const clearFilters = () => {
    onChange(DEFAULT_FILTERS);
    setActiveSavedSearch(null);
  };

  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  const activeFilterCount = [
    filters.search && 1,
    filters.territoryId && 1,
    filters.assignedToId !== null && 1,
    filters.statuses.length,
    filters.dateRange !== "all" && 1,
    filters.sortBy !== "newest" && 1,
    (filters.impactScoreMin > 0 || filters.impactScoreMax < 100) && 1,
    (filters.closeLikelihoodMin > 0 || filters.closeLikelihoodMax < 100) && 1,
    filters.priorityTiers.length,
    (filters.ratingMin > 0 || filters.ratingMax < 5) && 1,
    (filters.reviewCountMin > 0 || filters.reviewCountMax < 1000) && 1,
    (filters.domainRatingMin > 0 || filters.domainRatingMax < 100) && 1,
    filters.hasWebsite !== "all" && 1,
    filters.hasEmail !== "all" && 1,
    filters.marketTypes.length,
    filters.leadSourceIds.length,
    (filters.dealValueMin > 0 || filters.dealValueMax < 50000) && 1,
    (filters.daysInStageMin > 0 || filters.daysInStageMax < 365) && 1,
  ].filter(Boolean).reduce((a, b) => Number(a) + Number(b), 0) as number;

  const activeChips = buildActiveChips(filters, onChange, leadSources);

  return (
    <TooltipProvider>
      <div className="space-y-2 p-3 border rounded-lg bg-card">

        {/* ── Row 1: Controls ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
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
                onChange({ ...filters, territoryId: value === "all" ? null : Number(value) })
              }
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Territory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All territories</SelectItem>
                {territories.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {reps.length > 0 && (
            <Select
              value={
                filters.assignedToId === null ? "all" :
                filters.assignedToId === 0 ? "unassigned" :
                filters.assignedToId.toString()
              }
              onValueChange={(value) =>
                onChange({
                  ...filters,
                  assignedToId: value === "all" ? null : value === "unassigned" ? 0 : Number(value),
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
                  <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={filters.sortBy}
            onValueChange={(value: any) => onChange({ ...filters, sortBy: value })}
          >
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="updated">Recently updated</SelectItem>
              <SelectItem value="impact-high">Impact: High → Low</SelectItem>
              <SelectItem value="impact-low">Impact: Low → High</SelectItem>
              <SelectItem value="close-high">Close: High → Low</SelectItem>
              <SelectItem value="close-low">Close: Low → High</SelectItem>
              <SelectItem value="value-high">Value: High → Low</SelectItem>
              <SelectItem value="value-low">Value: Low → High</SelectItem>
            </SelectContent>
          </Select>

          {/* More filters toggle */}
          <Button
            variant={showAdvanced ? "secondary" : "outline"}
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-0.5 px-1.5 py-0 h-5 min-w-5 text-xs font-semibold">
                {activeFilterCount}
              </Badge>
            )}
            {showAdvanced ? <ChevronUp className="h-3.5 w-3.5 ml-0.5" /> : <ChevronDown className="h-3.5 w-3.5 ml-0.5" />}
          </Button>

          {/* Saved searches */}
          {(savedSearches.length > 0 || hasActiveFilters) && !showSaveInput && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-2.5 gap-1.5">
                  <Bookmark className="h-3.5 w-3.5" />
                  {activeSavedSearch ? (
                    <span className="max-w-[100px] truncate text-xs">{activeSavedSearch}</span>
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {savedSearches.length > 0 && (
                  <>
                    {savedSearches.map((s) => (
                      <DropdownMenuItem
                        key={s.id}
                        className="flex items-center justify-between cursor-pointer"
                        onSelect={() => handleLoadSearch(s)}
                      >
                        <span className="truncate">{s.name}</span>
                        <button
                          className="ml-2 opacity-40 hover:opacity-100 text-destructive"
                          onClick={(e) => handleDeleteSearch(s.id, e)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}
                {hasActiveFilters && (
                  <DropdownMenuItem
                    className="text-muted-foreground text-xs"
                    onSelect={() => setShowSaveInput(true)}
                  >
                    <BookmarkPlus className="h-3.5 w-3.5 mr-1.5" />
                    Save current filters…
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Inline save input */}
          {showSaveInput && (
            <div className="flex items-center gap-1.5">
              <Input
                ref={saveInputRef}
                placeholder="Name this search..."
                value={saveInputValue}
                onChange={(e) => setSaveInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveSearch();
                  if (e.key === "Escape") { setShowSaveInput(false); setSaveInputValue(""); }
                }}
                className="h-9 w-44"
              />
              <Button size="sm" className="h-9" onClick={handleSaveSearch} disabled={saving || !saveInputValue.trim()}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button variant="ghost" size="sm" className="h-9 px-2" onClick={() => { setShowSaveInput(false); setSaveInputValue(""); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-9 text-muted-foreground hover:text-foreground" onClick={clearFilters}>
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* ── Row 2: Active filter chips ─────────────────────────────────── */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeChips.map((chip, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-xs gap-1 pr-1 cursor-default hover:bg-muted/80 transition-colors"
              >
                {chip.label}
                <button
                  onClick={chip.onRemove}
                  className="rounded-sm opacity-60 hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${chip.label} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* ── Advanced panel ─────────────────────────────────────────────── */}
        {showAdvanced && (
          <div className="pt-3 border-t space-y-5">

            {/* Pipeline group */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pipeline</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Status</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {STATUS_OPTIONS.map((option) => (
                      <label key={option.value} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={filters.statuses.includes(option.value)}
                          onCheckedChange={() => toggleStatus(option.value)}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Date Range</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { value: "all", label: "All time" },
                        { value: "7d", label: "Last 7 days" },
                        { value: "30d", label: "Last 30 days" },
                        { value: "90d", label: "Last 90 days" },
                      ].map((option) => (
                        <Button
                          key={option.value}
                          variant={filters.dateRange === option.value ? "default" : "outline"}
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => onChange({ ...filters, dateRange: option.value as any })}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Priority Tier</Label>
                    <div className="flex gap-2">
                      {PRIORITY_TIER_OPTIONS.map((option) => (
                        <label key={option.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <Checkbox
                            checked={filters.priorityTiers.includes(option.value)}
                            onCheckedChange={() => togglePriorityTier(option.value)}
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Deal value & Days in stage side-by-side */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Deal Value: ${filters.dealValueMin.toLocaleString()}–{filters.dealValueMax === 50000 ? "$50k+" : `$${filters.dealValueMax.toLocaleString()}`}
                  </Label>
                  <Slider
                    value={[filters.dealValueMin, filters.dealValueMax]}
                    onValueChange={([min, max]) => onChange({ ...filters, dealValueMin: min, dealValueMax: max })}
                    min={0} max={50000} step={500}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    Days in Stage: {filters.daysInStageMin}–{filters.daysInStageMax === 365 ? "365+" : filters.daysInStageMax}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        How long a lead has been in their current pipeline stage. Use to surface stale leads.
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Slider
                    value={[filters.daysInStageMin, filters.daysInStageMax]}
                    onValueChange={([min, max]) => onChange({ ...filters, daysInStageMin: min, daysInStageMax: max })}
                    min={0} max={365} step={1}
                  />
                </div>
              </div>

              {/* Lead Source */}
              {leadSources.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Lead Source</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                    {leadSources.map((source) => (
                      <label key={source.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={filters.leadSourceIds.includes(source.id)}
                          onCheckedChange={() => toggleLeadSource(source.id)}
                        />
                        {source.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quality Scores group — collapsible */}
            <div className="space-y-3">
              <button
                className="flex items-center justify-between w-full text-left group"
                onClick={() => setShowQuality(!showQuality)}
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                  Quality Scores
                </p>
                {showQuality ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>

              {showQuality && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      Impact Score: {filters.impactScoreMin}–{filters.impactScoreMax}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          Revenue opportunity (0–100). High = strong fundamentals but poor visibility.
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Slider
                      value={[filters.impactScoreMin, filters.impactScoreMax]}
                      onValueChange={([min, max]) => onChange({ ...filters, impactScoreMin: min, impactScoreMax: max })}
                      min={0} max={100} step={5}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      Close Likelihood: {filters.closeLikelihoodMin}–{filters.closeLikelihoodMax}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          Sales engagement probability (0–100). High = likely to respond and engage.
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Slider
                      value={[filters.closeLikelihoodMin, filters.closeLikelihoodMax]}
                      onValueChange={([min, max]) => onChange({ ...filters, closeLikelihoodMin: min, closeLikelihoodMax: max })}
                      min={0} max={100} step={5}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Rating: {filters.ratingMin.toFixed(1)}–{filters.ratingMax.toFixed(1)} ★
                    </Label>
                    <Slider
                      value={[filters.ratingMin * 20, filters.ratingMax * 20]}
                      onValueChange={([min, max]) => onChange({ ...filters, ratingMin: min / 20, ratingMax: max / 20 })}
                      min={0} max={100} step={5}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Review Count: {filters.reviewCountMin}–{filters.reviewCountMax}
                    </Label>
                    <Slider
                      value={[filters.reviewCountMin, filters.reviewCountMax]}
                      onValueChange={([min, max]) => onChange({ ...filters, reviewCountMin: min, reviewCountMax: max })}
                      min={0} max={1000} step={10}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Domain Rating: {filters.domainRatingMin}–{filters.domainRatingMax}
                    </Label>
                    <Slider
                      value={[filters.domainRatingMin, filters.domainRatingMax]}
                      onValueChange={([min, max]) => onChange({ ...filters, domainRatingMin: min, domainRatingMax: max })}
                      min={0} max={100} step={5}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Has Website</Label>
                      <Select value={filters.hasWebsite} onValueChange={(v: any) => onChange({ ...filters, hasWebsite: v })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Has Email</Label>
                      <Select value={filters.hasEmail} onValueChange={(v: any) => onChange({ ...filters, hasEmail: v })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Market Intelligence group — collapsible */}
            <div className="space-y-3">
              <button
                className="flex items-center justify-between w-full text-left group"
                onClick={() => setShowMarket(!showMarket)}
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                  Market Intelligence
                </p>
                {showMarket ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>

              {showMarket && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {MARKET_TYPE_OPTIONS.map((option) => (
                    <label key={option.value} className="flex items-start gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={filters.marketTypes.includes(option.value)}
                        onCheckedChange={() => toggleMarketType(option.value)}
                        className="mt-0.5"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
