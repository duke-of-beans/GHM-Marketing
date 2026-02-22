"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, Briefcase, Users, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface Position {
  id: number;
  name: string;
  type: string;
  compensationType: string;
  defaultAmount: number | null;
  defaultFrequency: string | null;
  dashboardAccessLevel: string;
  isActive: boolean;
  notes: string | null;
  _count: { users: number };
}

const TYPE_LABELS: Record<string, string> = {
  sales: "Sales",
  management: "Management",
  operations: "Operations",
  contractor: "Contractor",
};

const COMP_LABELS: Record<string, string> = {
  commission_residual: "Commission + Residual",
  management_fee: "Management Fee",
  flat_monthly: "Flat Monthly",
  per_deliverable: "Per Deliverable",
  manual: "Manual (Admin Approves)",
};

const ACCESS_LABELS: Record<string, string> = {
  admin: "Admin",
  master: "Manager",
  sales: "Sales",
  readonly: "Read Only",
};

const TYPE_COLORS: Record<string, string> = {
  sales: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  management: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  operations: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  contractor: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const EMPTY_FORM = {
  name: "",
  type: "operations" as string,
  compensationType: "manual" as string,
  defaultAmount: "" as string,
  defaultFrequency: "monthly" as string,
  dashboardAccessLevel: "sales" as string,
  isActive: true,
  notes: "",
};

export function PositionsTab() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Position | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { loadPositions(); }, []);

  async function loadPositions() {
    setLoading(true);
    try {
      const res = await fetch("/api/positions");
      if (res.ok) {
        const data = await res.json();
        setPositions(data.data ?? []);
      } else {
        toast.error("Failed to load positions");
      }
    } catch {
      toast.error("Failed to load positions");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(p: Position) {
    setEditing(p);
    setForm({
      name: p.name,
      type: p.type,
      compensationType: p.compensationType,
      defaultAmount: p.defaultAmount != null ? String(p.defaultAmount) : "",
      defaultFrequency: p.defaultFrequency ?? "monthly",
      dashboardAccessLevel: p.dashboardAccessLevel,
      isActive: p.isActive,
      notes: p.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Position name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        compensationType: form.compensationType,
        defaultAmount: form.defaultAmount !== "" ? Number(form.defaultAmount) : null,
        defaultFrequency: form.defaultFrequency || null,
        dashboardAccessLevel: form.dashboardAccessLevel,
        isActive: form.isActive,
        notes: form.notes || null,
      };

      const res = editing
        ? await fetch(`/api/positions/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/positions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      toast.success(editing ? "Position updated" : "Position created");
      setDialogOpen(false);
      loadPositions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(position: Position) {
    if (position._count.users > 0) {
      toast.error(`Cannot delete — ${position._count.users} user(s) assigned. Reassign them first.`);
      return;
    }
    try {
      const res = await fetch(`/api/positions/${position.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast.success("Position deleted");
      setDeleteTarget(null);
      loadPositions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Positions
          </h2>
          <p className="text-muted-foreground mt-1">
            Job functions and compensation templates. Decouples what someone does from what dashboard access they have.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Position
        </Button>
      </div>

      <div className="space-y-3">
        {positions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No positions yet. Add one to get started.
            </CardContent>
          </Card>
        ) : (
          positions.map((p) => (
            <Card key={p.id} className={!p.isActive ? "opacity-60 border-dashed" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <Badge className={TYPE_COLORS[p.type] ?? ""}>{TYPE_LABELS[p.type] ?? p.type}</Badge>
                      {!p.isActive && (
                        <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">Inactive</Badge>
                      )}
                    </div>
                    <CardDescription className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-1">
                      <span><strong>Comp:</strong> {COMP_LABELS[p.compensationType] ?? p.compensationType}</span>
                      {p.defaultAmount != null && p.defaultAmount > 0 && (
                        <span><strong>Default:</strong> ${Number(p.defaultAmount).toFixed(0)}{p.defaultFrequency === "monthly" ? "/mo" : ""}</span>
                      )}
                      <span><strong>Dashboard:</strong> {ACCESS_LABELS[p.dashboardAccessLevel] ?? p.dashboardAccessLevel}</span>
                    </CardDescription>
                    {p.notes && <p className="text-xs text-muted-foreground mt-1">{p.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {p._count.users}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:text-destructive"
                      onClick={() => setDeleteTarget(p)}
                      disabled={p._count.users > 0}
                      title={p._count.users > 0 ? "Reassign users before deleting" : "Delete position"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Position" : "New Position"}</DialogTitle>
            <DialogDescription>
              Position name and type are required. Compensation defaults apply to all users assigned this position unless overridden individually.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Position Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Account Coordinator" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Dashboard Access</Label>
                <Select value={form.dashboardAccessLevel} onValueChange={(v) => setForm({ ...form, dashboardAccessLevel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (full)</SelectItem>
                    <SelectItem value="master">Manager</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="readonly">Read Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Compensation Type</Label>
              <Select value={form.compensationType} onValueChange={(v) => setForm({ ...form, compensationType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="commission_residual">Commission + Residual (sales)</SelectItem>
                  <SelectItem value="management_fee">Management Fee (per client/mo)</SelectItem>
                  <SelectItem value="flat_monthly">Flat Monthly</SelectItem>
                  <SelectItem value="per_deliverable">Per Deliverable</SelectItem>
                  <SelectItem value="manual">Manual (admin approves each month)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Default Amount ($)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  value={form.defaultAmount}
                  onChange={(e) => setForm({ ...form, defaultAmount: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <Select value={form.defaultFrequency} onValueChange={(v) => setForm({ ...form, defaultFrequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="per_close">Per Close</SelectItem>
                    <SelectItem value="per_deliverable">Per Deliverable</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Internal notes about this position..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} id="pos-active" />
              <Label htmlFor="pos-active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save Position"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete "{deleteTarget?.name}"?</DialogTitle>
            <DialogDescription>This cannot be undone. Users assigned this position will have their position cleared.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
