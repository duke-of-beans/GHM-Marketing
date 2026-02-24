"use client";
// BulkActionBar — floats at bottom of screen when items are selected
// Drop-in for any list. Consumers pass actions as config; bar handles loading states and results.
import { useState } from "react";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type BulkAction = {
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "destructive" | "outline";
  /** Return true = success. Throw or return false = failure. */
  run: (ids: number[]) => Promise<{ processed: number; failed: number; errors?: { id: number; message: string }[] }>;
  /** If true, show confirmation before running */
  confirm?: string;
  /** Roles that can see this action — omit for all */
  permission?: "admin" | "elevated";
};

type Props = {
  selectedIds: number[];
  onClear: () => void;
  actions: BulkAction[];
  entityLabel?: string; // "lead" | "client" | "task" etc — for display
};

export function BulkActionBar({ selectedIds, onClear, actions, entityLabel = "item" }: Props) {
  const [running, setRunning] = useState<string | null>(null);
  const count = selectedIds.length;

  if (count === 0) return null;

  const label = count === 1 ? `1 ${entityLabel}` : `${count} ${entityLabel}s`;

  async function handleAction(action: BulkAction) {
    if (action.confirm) {
      const ok = window.confirm(action.confirm.replace("{count}", String(count)));
      if (!ok) return;
    }
    setRunning(action.label);
    try {
      const result = await action.run(selectedIds);
      if (result.failed === 0) {
        toast.success(`${result.processed} ${entityLabel}${result.processed !== 1 ? "s" : ""} updated`);
        onClear();
      } else {
        toast.warning(`${result.processed} succeeded, ${result.failed} failed`, {
          description: result.errors?.slice(0, 3).map(e => e.message).join(" · "),
        });
        if (result.processed > 0) onClear();
      }
    } catch (err) {
      toast.error(`Operation failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border border-border bg-background shadow-2xl ring-1 ring-black/5">
      {/* Count badge */}
      <span className="text-sm font-medium text-foreground mr-2 min-w-[80px]">{label} selected</span>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Action buttons */}
      {actions.map((action) => (
        <Button
          key={action.label}
          size="sm"
          variant={action.variant ?? "outline"}
          disabled={running !== null}
          onClick={() => handleAction(action)}
          className="gap-1.5"
        >
          {running === action.label ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : action.icon ? (
            <span className="h-3.5 w-3.5">{action.icon}</span>
          ) : null}
          {action.label}
        </Button>
      ))}

      <div className="w-px h-5 bg-border mx-1" />

      {/* Clear */}
      <Button size="sm" variant="ghost" onClick={onClear} className="gap-1 text-muted-foreground hover:text-foreground">
        <X className="h-3.5 w-3.5" />
        Clear
      </Button>
    </div>
  );
}
