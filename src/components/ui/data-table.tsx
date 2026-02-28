"use client";

// src/components/ui/data-table.tsx
// Shared data table component built on the shadcn/ui Table primitives.
// Enforces standard column widths, sortable headers, hover states, empty states,
// and loading skeletons across all dashboard tables.
//
// Standard column width presets (apply via the `width` prop on ColumnDef):
//   ID column:       "w-[40px]"
//   Status badge:    "w-[100px]"
//   Name / label:    "w-[200px]"  or  "min-w-[200px]"
//   Date:            "w-[120px]"
//   Number / amount: "w-[80px]"
//   Action button:   "w-[40px]"

import * as React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ColumnDef<TRow> {
  /** Unique key used for sort state tracking. Should match a TRow field name. */
  key: string;
  /** Header label rendered in the <th>. */
  header: string;
  /**
   * Tailwind width class applied to the <th> and drives column sizing.
   * Use the standard presets from the file header comment.
   */
  width?: string;
  /** When true the header renders a sort button. */
  sortable?: boolean;
  /** Render function for each cell in this column. */
  cell: (row: TRow) => React.ReactNode;
}

export type SortDirection = "asc" | "desc";

export interface SortState {
  key: string;
  direction: SortDirection;
}

interface DataTableProps<TRow> {
  columns: ColumnDef<TRow>[];
  data: TRow[];
  /** Key extractor for React reconciliation — must be unique per row. */
  getRowKey: (row: TRow) => string | number;
  /**
   * Message shown when data is empty and isLoading is false.
   * Defaults to "No results found."
   */
  emptyMessage?: string;
  /** When true renders 5 skeleton rows instead of real data. */
  isLoading?: boolean;
  /** Controlled sort state. Provide alongside onSortChange for controlled mode. */
  sortState?: SortState;
  /** Called when the user clicks a sortable column header. */
  onSortChange?: (sort: SortState) => void;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

const SKELETON_ROW_COUNT = 5;

export function DataTable<TRow>({
  columns,
  data,
  getRowKey,
  emptyMessage = "No results found.",
  isLoading = false,
  sortState,
  onSortChange,
  className,
}: DataTableProps<TRow>) {
  // Internal sort state for uncontrolled usage.
  const [internalSort, setInternalSort] = React.useState<SortState | null>(
    null
  );

  const activeSort = sortState ?? internalSort;

  function handleSort(col: ColumnDef<TRow>) {
    if (!col.sortable) return;
    const next: SortState =
      activeSort?.key === col.key && activeSort.direction === "asc"
        ? { key: col.key, direction: "desc" }
        : { key: col.key, direction: "asc" };
    if (onSortChange) {
      onSortChange(next);
    } else {
      setInternalSort(next);
    }
  }

  function SortIcon({ col }: { col: ColumnDef<TRow> }) {
    if (!col.sortable) return null;
    if (activeSort?.key !== col.key) {
      return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />;
    }
    return activeSort.direction === "asc" ? (
      <ArrowUp className="ml-1.5 h-3.5 w-3.5 shrink-0" />
    ) : (
      <ArrowDown className="ml-1.5 h-3.5 w-3.5 shrink-0" />
    );
  }

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((col) => (
            <TableHead
              key={col.key}
              className={cn(col.width, col.sortable && "cursor-pointer select-none")}
              onClick={() => handleSort(col)}
            >
              <span className="inline-flex items-center">
                {col.header}
                <SortIcon col={col} />
              </span>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>

      <TableBody>
        {/* Loading state — 5 skeleton rows */}
        {isLoading &&
          Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
            <TableRow key={`skeleton-${i}`} className="hover:bg-muted/50">
              {columns.map((col) => (
                <TableCell key={col.key} className={col.width}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}

        {/* Empty state */}
        {!isLoading && data.length === 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={columns.length}
              className="py-12 text-center"
            >
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </TableCell>
          </TableRow>
        )}

        {/* Data rows */}
        {!isLoading &&
          data.map((row) => (
            <TableRow
              key={getRowKey(row)}
              className="hover:bg-muted/50"
            >
              {columns.map((col) => (
                <TableCell key={col.key} className={col.width}>
                  {col.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
