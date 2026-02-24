"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, RefreshCw, Globe, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Competitor {
  id: number;
  businessName: string;
  domain: string | null;
  addedAt: string;
}

interface CompetitorsTabProps {
  clientId: number;
}

export function CompetitorsTab({ clientId }: CompetitorsTabProps) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Competitor | null>(null);
  const [form, setForm] = useState({ businessName: "", domain: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/competitors`);
      const data = await res.json();
      setCompetitors(data.competitors ?? []);
    } catch {
      toast.error("Failed to load competitors");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.businessName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/competitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: form.businessName, domain: form.domain || null }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${form.businessName} added`);
      setForm({ businessName: "", domain: "" });
      setAddOpen(false);
      await load();
    } catch {
      toast.error("Failed to add competitor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/clients/${clientId}/competitors/${deleteTarget.id}`, { method: "DELETE" });
      toast.success(`${deleteTarget.businessName} removed`);
      setDeleteTarget(null);
      await load();
    } catch {
      toast.error("Failed to remove competitor");
    }
  };

  const handleRefreshScan = async () => {
    setScanLoading(true);
    try {
      const res = await fetch("/api/scans/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (!res.ok) throw new Error();
      toast.success("Competitive scan queued — results will appear shortly");
    } catch {
      toast.error("Failed to trigger scan");
    } finally {
      setScanLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold">Tracked Competitors</h3>
          <p className="text-sm text-muted-foreground">Monitored in weekly scans. Up to 5.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefreshScan} disabled={scanLoading} className="gap-1.5">
            {scanLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Run Scan Now
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5" disabled={competitors.length >= 5}>
                <Plus className="h-3.5 w-3.5" />Add Competitor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Competitor</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Business Name <span className="text-red-500">*</span></Label>
                  <Input placeholder="Acme Plumbing Co." value={form.businessName}
                    onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Website <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input placeholder="acmeplumbing.com" value={form.domain}
                    onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                  <Button onClick={handleAdd} disabled={submitting || !form.businessName.trim()}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}Add
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : competitors.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No competitors tracked yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Add up to 5 to include in weekly scans.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {competitors.map(c => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3 rounded-lg border bg-card">
              <div className="flex items-center gap-3 min-w-0">
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{c.businessName}</p>
                  {c.domain && (
                    <a href={`https://${c.domain.replace(/^https?:\/\//, "")}`} target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-blue-600 flex items-center gap-1 w-fit">
                      <Globe className="h-3 w-3" />{c.domain}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                  Added {new Date(c.addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(c)}
                  className="text-muted-foreground hover:text-red-600 h-7 w-7 p-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {competitors.length < 5 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              {5 - competitors.length} slot{5 - competitors.length !== 1 ? "s" : ""} remaining
            </p>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Competitor</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{deleteTarget?.businessName}</strong> from tracking? They won&apos;t appear in future scans.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
