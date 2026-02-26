"use client";

/**
 * RecurringTasksClient
 * Full management UI for RecurringTaskRule records.
 * Elevated users only (enforced on page + API side).
 */

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { RecurringTaskForm } from "./recurring-task-form";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface RecurringRule {
  id: number;
  name: string;
  clientId: number | null;
  clientName: string | null;
  category: string;
  title: string;
  priority: string;
  cronExpression: string;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  checklistTemplateName: string | null;
}

export function RecurringTasksClient() {
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editRule, setEditRule] = useState<RecurringRule | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch("/api/recurring-tasks?include=client,template");
      const json = await res.json();
      if (json.success) setRules(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  async function toggleActive(rule: RecurringRule) {
    const prev = rules;
    setRules((r) => r.map((x) => x.id === rule.id ? { ...x, isActive: !x.isActive } : x));
    const res = await fetch(`/api/recurring-tasks/${rule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    const json = await res.json();
    if (!json.success) { setRules(prev); toast.error("Failed to update"); }
  }

  async function deleteRule(id: number) {
    if (!confirm("Delete this recurring rule? Tasks already created are unaffected.")) return;
    const res = await fetch(`/api/recurring-tasks/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      setRules((r) => r.filter((x) => x.id !== id));
      toast.success("Rule deleted");
    } else {
      toast.error("Failed to delete");
    }
  }

  function formatCron(expr: string): string {
    const parts = expr.trim().split(/\s+/);
    if (parts.length < 5) return expr;
    const [min, hour, dom] = parts;
    if (dom === "1") return `Monthly (1st, ${hour}:${min.padStart(2, "0")} UTC)`;
    if (dom === "*") return `Daily (${hour}:${min.padStart(2, "0")} UTC)`;
    return expr;
  }

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse bg-muted rounded-lg" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditRule(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          New Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <Card className="p-6 text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No recurring rules yet.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Create a rule to automate task creation on a schedule.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <Card key={rule.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{rule.name}</p>
                    <Badge variant="outline" className="text-[10px]">{rule.category.replace(/_/g, " ")}</Badge>
                    <Badge className={`text-[10px] ${rule.priority === "P1" ? "bg-status-danger-bg text-status-danger" : rule.priority === "P2" ? "bg-status-warning-bg text-status-warning" : "bg-blue-100 text-blue-700"}`}>
                      {rule.priority}
                    </Badge>
                    {!rule.isActive && <Badge variant="secondary" className="text-[10px]">Paused</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    Task title: &ldquo;{rule.title}&rdquo;
                    {rule.clientName ? ` — ${rule.clientName}` : " — All active clients"}
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                    <span>{formatCron(rule.cronExpression)}</span>
                    <span>Last run: {formatDate(rule.lastRunAt)}</span>
                    <span>Next run: {formatDate(rule.nextRunAt)}</span>
                    {rule.checklistTemplateName && <span>{rule.checklistTemplateName}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => toggleActive(rule)}
                    title={rule.isActive ? "Pause rule" : "Activate rule"}
                  />
                  <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Edit rule" onClick={() => { setEditRule(rule); setFormOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit rule</TooltipContent>
                </Tooltip>
                  <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive" aria-label="Delete rule" onClick={() => deleteRule(rule.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete rule permanently</TooltipContent>
                </Tooltip>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {formOpen && (
        <RecurringTaskForm
          rule={editRule}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); fetchRules(); }}
        />
      )}
    </div>
  );
}
