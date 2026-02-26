"use client";

/**
 * TaskChecklist  —  inline checklist for task detail sheet
 * Fetches items on mount, supports toggle/add/delete/apply-template.
 */

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, CheckSquare, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface ChecklistItem {
  id: number;
  label: string;
  completed: boolean;
  completedAt: string | null;
  sortOrder: number;
}

interface Template {
  id: number;
  name: string;
  category: string;
}

interface Props {
  taskId: number;
  category: string;
}

export function TaskChecklist({ taskId, category }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/checklist`);
      const json = await res.json();
      if (json.success) {
        // API returns { data: ChecklistItem[], meta: { total, done, pct } }
        const apiItems = (json.data as Array<{ id: number; label: string; isComplete: boolean; completedAt: string | null; sortOrder: number }>);
        setItems(apiItems.map((i) => ({ ...i, completed: i.isComplete })));
        setProgress({ done: json.meta.done, total: json.meta.total });
      }
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const fetchTemplates = useCallback(async () => {
    const res = await fetch(`/api/checklist-templates`);
    const json = await res.json();
    if (json.success) {
      setTemplates(json.data.filter((t: Template) => !t.category || t.category === category));
    }
  }, [category]);

  useEffect(() => {
    fetchItems();
    fetchTemplates();
  }, [fetchItems, fetchTemplates]);

  async function toggleItem(item: ChecklistItem) {
    const prev = [...items];
    setItems((curr) =>
      curr.map((i) => i.id === item.id ? { ...i, completed: !i.completed } : i)
    );
    try {
      const res = await fetch(`/api/tasks/${taskId}/checklist/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isComplete: !item.completed }),
      });
      const json = await res.json();
      if (!json.success) throw new Error();
      await fetchItems();
    } catch {
      setItems(prev);
      toast.error("Failed to update item");
    }
  }

  async function addItem() {
    if (!newLabel.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error();
      setNewLabel("");
      setAdding(false);
      await fetchItems();
    } catch {
      toast.error("Failed to add item");
    }
  }

  async function deleteItem(itemId: number) {
    try {
      await fetch(`/api/tasks/${taskId}/checklist/${itemId}`, { method: "DELETE" });
      await fetchItems();
    } catch {
      toast.error("Failed to delete item");
    }
  }

  async function applyTemplate(templateId: number) {
    try {
      const res = await fetch(`/api/tasks/${taskId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error();
      toast.success("Template applied");
      await fetchItems();
    } catch {
      toast.error("Failed to apply template");
    }
  }

  if (loading) {
    return <div className="h-6 w-full animate-pulse rounded bg-muted/40" />;
  }

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setCollapsed((c) => !c)}
        >
          <CheckSquare className="h-3.5 w-3.5" />
          <span className="font-medium">Checklist</span>
          {progress.total > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0">
              {progress.done}/{progress.total}
            </Badge>
          )}
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>

        {items.length === 0 && templates.length > 0 && !collapsed && (
          <select
            className="text-[11px] border rounded px-1.5 py-0.5 bg-background text-muted-foreground"
            defaultValue=""
            onChange={(e) => { if (e.target.value) applyTemplate(parseInt(e.target.value)); }}
          >
            <option value="">Apply template…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      {!collapsed && (
        <>
          {progress.total > 0 && (
            <div className="w-full bg-muted rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all ${pct === 100 ? "bg-status-success-bg" : "bg-blue-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}

          <div className="space-y-1">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 group py-0.5">
                <Checkbox
                  id={`check-${item.id}`}
                  checked={item.completed}
                  onCheckedChange={() => toggleItem(item)}
                  className="h-3.5 w-3.5 flex-shrink-0"
                />
                <label
                  htmlFor={`check-${item.id}`}
                  className={`flex-1 text-xs cursor-pointer select-none ${item.completed ? "line-through text-muted-foreground" : ""}`}
                >
                  {item.label}
                </label>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          {adding ? (
            <div className="flex gap-1.5 items-center">
              <input
                autoFocus
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addItem(); if (e.key === "Escape") { setAdding(false); setNewLabel(""); } }}
                placeholder="Item label..."
                className="flex-1 text-xs border rounded px-2 py-1 bg-background"
              />
              <Button size="sm" className="h-6 text-xs px-2" onClick={addItem} disabled={!newLabel.trim()}>Add</Button>
              <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => { setAdding(false); setNewLabel(""); }}>Cancel</Button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add item
            </button>
          )}
        </>
      )}
    </div>
  );
}
