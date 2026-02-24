"use client";

/**
 * RecurringTaskForm
 * Create / edit a RecurringTaskRule via a Dialog.
 */

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const CATEGORIES = [
  "content", "technical_seo", "local_seo", "backlinks",
  "reviews", "speed", "competitor", "website", "general",
];

const PRIORITIES = ["P1", "P2", "P3", "P4"];

const CRON_PRESETS = [
  { label: "Daily at 9 AM UTC", value: "0 9 * * *" },
  { label: "Weekly Monday 9 AM UTC", value: "0 9 * * 1" },
  { label: "Monthly 1st at 9 AM UTC", value: "0 9 1 * *" },
  { label: "Monthly 15th at 9 AM UTC", value: "0 9 15 * *" },
  { label: "Custom…", value: "custom" },
];

interface Props {
  rule: {
    id: number;
    name: string;
    clientId: number | null;
    category: string;
    title: string;
    priority: string;
    cronExpression: string;
    isActive: boolean;
    checklistTemplateName: string | null;
  } | null;
  onClose: () => void;
  onSaved: () => void;
}

export function RecurringTaskForm({ rule, onClose, onSaved }: Props) {
  const isEdit = !!rule;

  const [name, setName] = useState(rule?.name ?? "");
  const [title, setTitle] = useState(rule?.title ?? "");
  const [category, setCategory] = useState(rule?.category ?? "general");
  const [priority, setPriority] = useState(rule?.priority ?? "P3");
  const [clientId, setClientId] = useState<string>(rule?.clientId?.toString() ?? "");
  const [cronPreset, setCronPreset] = useState("0 9 1 * *");
  const [customCron, setCustomCron] = useState("");
  const [checklistTemplateId, setChecklistTemplateId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [clients, setClients] = useState<Array<{ id: number; businessName: string }>>([]);
  const [templates, setTemplates] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    fetch("/api/clients?limit=200&fields=id,businessName&status=active")
      .then((r) => r.json())
      .then((j) => { if (j.success) setClients(Array.isArray(j.data) ? j.data : []); })
      .catch(() => { /* leave clients as [] */ });
    fetch("/api/checklist-templates")
      .then((r) => r.json())
      .then((j) => { if (j.success) setTemplates(Array.isArray(j.data) ? j.data : []); })
      .catch(() => { /* leave templates as [] */ });

    if (rule) {
      const preset = CRON_PRESETS.find((p) => p.value === rule.cronExpression && p.value !== "custom");
      if (preset) { setCronPreset(rule.cronExpression); }
      else { setCronPreset("custom"); setCustomCron(rule.cronExpression); }
    }
  }, [rule]);

  const finalCron = cronPreset === "custom" ? customCron : cronPreset;

  async function handleSave() {
    if (!name.trim() || !title.trim() || !finalCron.trim()) {
      toast.error("Name, title, and schedule are required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        title: title.trim(),
        category,
        priority,
        clientId: clientId ? parseInt(clientId) : null,
        cronExpression: finalCron.trim(),
        checklistTemplateId: checklistTemplateId ? parseInt(checklistTemplateId) : null,
      };

      const res = await fetch(
        isEdit ? `/api/recurring-tasks/${rule.id}` : "/api/recurring-tasks",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Save failed");
      toast.success(isEdit ? "Rule updated" : "Rule created");
      onSaved();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Recurring Rule" : "New Recurring Rule"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Rule name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Monthly content audit" />
          </div>

          <div className="space-y-1.5">
            <Label>Task title template</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Content audit — {clientName}" />
            <p className="text-[11px] text-muted-foreground">Use {"{clientName}"} to insert the client&apos;s name.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Client (optional)</Label>
            <Select value={clientId || "all"} onValueChange={(v) => setClientId(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="All active clients" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All active clients</SelectItem>
                {clients.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.businessName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Schedule</Label>
            <Select value={cronPreset} onValueChange={setCronPreset}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CRON_PRESETS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {cronPreset === "custom" && (
              <Input
                value={customCron}
                onChange={(e) => setCustomCron(e.target.value)}
                placeholder="0 9 1 * *"
                className="font-mono text-sm mt-1.5"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Checklist template (optional)</Label>
            <Select value={checklistTemplateId || "none"} onValueChange={(v) => setChecklistTemplateId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="No checklist" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No checklist</SelectItem>
                {templates.map((t) => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create rule"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
