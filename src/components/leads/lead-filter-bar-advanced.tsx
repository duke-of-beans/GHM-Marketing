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
import { ChevronDown, ChevronUp, X, HelpCircle, Filter, BookmarkPlus, Bookmark } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  priorityTiers: string[]; // "A", "B", "C"
  
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
  marketTypes: string[]; // "wealthy_suburb", "incorporated_city", "rapid_growth", etc.
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
  { value: "A", label: "Tier A (Top Priority)" },
  { value: "B", label: "Tier B (High Value)" },
  { value: "C", label: "Tier C (Standard)" },
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

  // Saved searches state
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
    if (showSaveInput) {
      setTimeout(() => saveInputRef.current?.focus(), 50);
    }
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
      // silently fail — filters still work
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
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
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

  return (
    <TooltipProvider>
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

          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="h-4 w-4 mr-1" />
            {showAdvanced ? "Less" : "More"}
            {hasActiveFilters && !activeSavedSearch && (
              <Badge variant="secondary" className="ml-2 px-1.5 py-0 h-5">
                {activeFilterCount}
              </Badge>
            )}
            {activeSavedSearch && (
              <Badge variant="default" className="ml-2 px-1.5 py-0 h-5 max-w-[120px] truncate">
                {activeSavedSearch}
              </Badge>
            )}
          </Button>

          {/* Saved searches dropdown */}
          {savedSearches.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-2">
                  <Bookmark className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
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
                <DropdownMenuItem
                  className="text-muted-foreground text-xs"
                  onSelect={() => setShowSaveInput(true)}
                >
                  <BookmarkPlus className="h-3.5 w-3.5 mr-1.5" />
                  Save current filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Save button (shown when no saved searches yet, or as primary CTA) */}
          {hasActiveFilters && !showSaveInput && savedSearches.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2"
              onClick={() => setShowSaveInput(true)}
            >
              <BookmarkPlus className="h-4 w-4 mr-1" />
              Save
            </Button>
          )}

          {/* Inline save input */}
          {showSaveInput && (
            <div className="flex items-center gap-1.5">
              <Input
                ref={saveInputRef}
                placeholder="Name this filter..."
                value={saveInputValue}
                onChange={(e) => setSaveInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveSearch();
                  if (e.key === "Escape") { setShowSaveInput(false); setSaveInputValue(""); }
                }}
                className="h-9 w-44"
              />
              <Button size="sm" className="h-9" onClick={handleSaveSearch} disabled={saving || !saveInputValue.trim()}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" size="sm" className="h-9 px-2" onClick={() => { setShowSaveInput(false); setSaveInputValue(""); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

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

        {/* Active Filter Summary Tags */}
        {(filters.statuses.length > 0 || 
          filters.dateRange !== "all" ||
          filters.priorityTiers.length > 0 ||
          filters.marketTypes.length > 0) && (
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
            {filters.priorityTiers.map((tier) => (
              <Badge
                key={tier}
                variant="default"
                className="text-xs cursor-pointer"
                onClick={() => togglePriorityTier(tier)}
              >
                Tier {tier}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
            {filters.marketTypes.map((type) => (
              <Badge
                key={type}
                variant="outline"
                className="text-xs cursor-pointer hover:bg-muted"
                onClick={() => toggleMarketType(type)}
              >
                {MARKET_TYPE_OPTIONS.find((m) => m.value === type)?.label.split(" ")[0]}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="pt-3 border-t space-y-4">
            {/* Status & Date Range */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <label className="text-sm font-medium">Pipeline Status</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={filters.statuses.includes(option.value)}
                        onCheckedChange={() => toggleStatus(option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <label className="text-sm font-medium">Date Range</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
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
                      onClick={() => onChange({ ...filters, dateRange: option.value as any })}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Priority & Quality Scores */}
            <Collapsible open={showQuality} onOpenChange={setShowQuality}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span className="font-medium">Priority & Quality Filters</span>
                  {showQuality ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-3">
                {/* Priority Tiers */}
                <div>
                  <Label className="text-sm mb-2 block">Priority Tier</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRIORITY_TIER_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={filters.priorityTiers.includes(option.value)}
                          onCheckedChange={() => togglePriorityTier(option.value)}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Impact Score */}
                <div>
                  <Label className="text-sm mb-2 flex items-center gap-1.5">
                    Impact Score: {filters.impactScoreMin}-{filters.impactScoreMax}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Revenue opportunity (0-100). High = strong fundamentals but poor visibility.
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Slider
                    value={[filters.impactScoreMin, filters.impactScoreMax]}
                    onValueChange={([min, max]) => onChange({ ...filters, impactScoreMin: min, impactScoreMax: max })}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                {/* Close Likelihood */}
                <div>
                  <Label className="text-sm mb-2 flex items-center gap-1.5">
                    Close Likelihood: {filters.closeLikelihoodMin}-{filters.closeLikelihoodMax}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Sales engagement probability (0-100). High = likely to respond and engage.
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Slider
                    value={[filters.closeLikelihoodMin, filters.closeLikelihoodMax]}
                    onValueChange={([min, max]) => onChange({ ...filters, closeLikelihoodMin: min, closeLikelihoodMax: max })}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                {/* Rating Range */}
                <div>
                  <Label className="text-sm mb-2">
                    Rating: {filters.ratingMin.toFixed(1)}-{filters.ratingMax.toFixed(1)} stars
                  </Label>
                  <Slider
                    value={[filters.ratingMin * 20, filters.ratingMax * 20]}
                    onValueChange={([min, max]) => onChange({ ...filters, ratingMin: min / 20, ratingMax: max / 20 })}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                {/* Review Count */}
                <div>
                  <Label className="text-sm mb-2">
                    Review Count: {filters.reviewCountMin}-{filters.reviewCountMax}
                  </Label>
                  <Slider
                    value={[filters.reviewCountMin, filters.reviewCountMax]}
                    onValueChange={([min, max]) => onChange({ ...filters, reviewCountMin: min, reviewCountMax: max })}
                    min={0}
                    max={1000}
                    step={10}
                    className="mt-2"
                  />
                </div>

                {/* Domain Rating */}
                <div>
                  <Label className="text-sm mb-2">
                    Domain Rating: {filters.domainRatingMin}-{filters.domainRatingMax}
                  </Label>
                  <Slider
                    value={[filters.domainRatingMin, filters.domainRatingMax]}
                    onValueChange={([min, max]) => onChange({ ...filters, domainRatingMin: min, domainRatingMax: max })}
                    min={0}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                {/* Has Website / Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm mb-2 block">Has Website</Label>
                    <Select
                      value={filters.hasWebsite}
                      onValueChange={(value: any) => onChange({ ...filters, hasWebsite: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block">Has Email</Label>
                    <Select
                      value={filters.hasEmail}
                      onValueChange={(value: any) => onChange({ ...filters, hasEmail: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Deal Value Range */}
                <div>
                  <Label className="text-sm mb-2 block">
                    Deal Value: ${filters.dealValueMin.toLocaleString()}–${filters.dealValueMax === 50000 ? "50k+" : filters.dealValueMax.toLocaleString()}
                  </Label>
                  <Slider
                    value={[filters.dealValueMin, filters.dealValueMax]}
                    onValueChange={([min, max]) => onChange({ ...filters, dealValueMin: min, dealValueMax: max })}
                    min={0}
                    max={50000}
                    step={500}
                    className="mt-2"
                  />
                </div>

                {/* Days in Stage */}
                <div>
                  <Label className="text-sm mb-2 flex items-center gap-1.5">
                    Days in Current Stage: {filters.daysInStageMin}–{filters.daysInStageMax === 365 ? "365+" : filters.daysInStageMax}
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
                    min={0}
                    max={365}
                    step={1}
                    className="mt-2"
                  />
                </div>

                {/* Lead Source */}
                {leadSources.length > 0 && (
                  <div>
                    <Label className="text-sm mb-2 block">Lead Source</Label>
                    <div className="grid grid-cols-2 gap-2">
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
              </CollapsibleContent>
            </Collapsible>

            {/* Market Intelligence */}
            <Collapsible open={showMarket} onOpenChange={setShowMarket}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span className="font-medium">Market Intelligence Filters</span>
                  {showMarket ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-3">
                {/* Market Types */}
                <div>
                  <Label className="text-sm mb-2 block">Market Type</Label>
                  <div className="space-y-2">
                    {MARKET_TYPE_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-start gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={filters.marketTypes.includes(option.value)}
                          onCheckedChange={() => toggleMarketType(option.value)}
                          className="mt-0.5"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

