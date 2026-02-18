"use client";

import { useState } from "react";
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
import { ChevronDown, ChevronUp, X, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type FilterState = {
  search: string;
  healthFilter: "all" | "healthy" | "competitive" | "attention";
  revenueRange: "all" | "high" | "mid" | "low";
  taskFilter: "all" | "has-tasks" | "no-tasks";
  scanFilter: "all" | "recent" | "needs-scan";
  sortBy: "health-high" | "health-low" | "revenue-high" | "revenue-low" | "name-az" | "name-za" | "scan-recent" | "newest" | "oldest";
};

type ClientFilterBarProps = {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
};

export function ClientFilterBar({ filters, onChange }: ClientFilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const clearFilters = () => {
    onChange({
      search: "",
      healthFilter: "all",
      revenueRange: "all",
      taskFilter: "all",
      scanFilter: "all",
      sortBy: "health-low",
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.healthFilter !== "all" ||
    filters.revenueRange !== "all" ||
    filters.taskFilter !== "all" ||
    filters.scanFilter !== "all" ||
    filters.sortBy !== "health-low";

  return (
    <TooltipProvider>
      <div className="space-y-3 p-4 border rounded-lg bg-card">
      {/* Basic Filters Row */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search clients, city, state..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full md:w-64 h-9"
        />

        <Select
          value={filters.healthFilter}
          onValueChange={(value: any) =>
            onChange({ ...filters, healthFilter: value })
          }
        >
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Health" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Health Levels</SelectItem>
            <SelectItem value="healthy">Healthy (75+)</SelectItem>
            <SelectItem value="competitive">Competitive (50-74)</SelectItem>
            <SelectItem value="attention">Needs Attention (&lt;50)</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sortBy}
          onValueChange={(value: any) => onChange({ ...filters, sortBy: value })}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="health-low">Health: Low to High</SelectItem>
            <SelectItem value="health-high">Health: High to Low</SelectItem>
            <SelectItem value="revenue-high">Revenue: High to Low</SelectItem>
            <SelectItem value="revenue-low">Revenue: Low to High</SelectItem>
            <SelectItem value="name-az">Name: A to Z</SelectItem>
            <SelectItem value="name-za">Name: Z to A</SelectItem>
            <SelectItem value="scan-recent">Recently Scanned</SelectItem>
            <SelectItem value="newest">Newest Client</SelectItem>
            <SelectItem value="oldest">Oldest Client</SelectItem>
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
      {(filters.healthFilter !== "all" ||
        filters.revenueRange !== "all" ||
        filters.taskFilter !== "all" ||
        filters.scanFilter !== "all") && (
        <div className="flex flex-wrap gap-1.5">
          {filters.healthFilter !== "all" && (
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-muted"
              onClick={() => onChange({ ...filters, healthFilter: "all" })}
            >
              {filters.healthFilter === "healthy"
                ? "Healthy"
                : filters.healthFilter === "competitive"
                ? "Competitive"
                : "Needs Attention"}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {filters.revenueRange !== "all" && (
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-muted"
              onClick={() => onChange({ ...filters, revenueRange: "all" })}
            >
              {filters.revenueRange === "high"
                ? "High Revenue"
                : filters.revenueRange === "mid"
                ? "Mid Revenue"
                : "Low Revenue"}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {filters.taskFilter !== "all" && (
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-muted"
              onClick={() => onChange({ ...filters, taskFilter: "all" })}
            >
              {filters.taskFilter === "has-tasks"
                ? "Has Open Tasks"
                : "No Open Tasks"}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {filters.scanFilter !== "all" && (
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-muted"
              onClick={() => onChange({ ...filters, scanFilter: "all" })}
            >
              {filters.scanFilter === "recent"
                ? "Recently Scanned"
                : "Needs Scan"}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="pt-3 border-t space-y-3">
          {/* Revenue Range */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <label className="text-sm font-medium">Monthly Revenue</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Filter clients by their monthly retainer amount. High = $2,000+, Mid = $1,000-$1,999, Low = under $1,000.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filters.revenueRange === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...filters, revenueRange: "all" })}
              >
                All
              </Button>
              <Button
                variant={filters.revenueRange === "high" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...filters, revenueRange: "high" })}
              >
                High ($2,000+)
              </Button>
              <Button
                variant={filters.revenueRange === "mid" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...filters, revenueRange: "mid" })}
              >
                Mid ($1,000-$1,999)
              </Button>
              <Button
                variant={filters.revenueRange === "low" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...filters, revenueRange: "low" })}
              >
                Low (&lt;$1,000)
              </Button>
            </div>
          </div>

          {/* Task Filter */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <label className="text-sm font-medium">Open Tasks</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Filter by whether clients have open SEO tasks. Use this to find clients who need work completed or those with no pending tasks.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filters.taskFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...filters, taskFilter: "all" })}
              >
                All Clients
              </Button>
              <Button
                variant={
                  filters.taskFilter === "has-tasks" ? "default" : "outline"
                }
                size="sm"
                onClick={() => onChange({ ...filters, taskFilter: "has-tasks" })}
              >
                Has Open Tasks
              </Button>
              <Button
                variant={
                  filters.taskFilter === "no-tasks" ? "default" : "outline"
                }
                size="sm"
                onClick={() => onChange({ ...filters, taskFilter: "no-tasks" })}
              >
                No Open Tasks
              </Button>
            </div>
          </div>

          {/* Scan Status */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <label className="text-sm font-medium">Scan Status</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Filter by when clients were last scanned. Recent = scanned within 7 days, Needs Scan = 7+ days since last scan. Regular scans track competitive position.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filters.scanFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...filters, scanFilter: "all" })}
              >
                All
              </Button>
              <Button
                variant={filters.scanFilter === "recent" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...filters, scanFilter: "recent" })}
              >
                Recently Scanned (&lt;7d)
              </Button>
              <Button
                variant={
                  filters.scanFilter === "needs-scan" ? "default" : "outline"
                }
                size="sm"
                onClick={() =>
                  onChange({ ...filters, scanFilter: "needs-scan" })
                }
              >
                Needs Scan (7d+)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}

export type { FilterState };
