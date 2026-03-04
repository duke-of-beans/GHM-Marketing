"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, ChevronDown, ChevronUp, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { AddSiteDialog } from "./add-site-dialog";

type Target = {
  id: number; domain: string; niche: string | null; source: string | null;
  stage: string; askingPrice: number | null; monthlyRevenue: number | null;
  monthlyTraffic: number | null; domainAuthority: number | null;
  purchasePrice: number | null; purchasedDate: string | null;
  notes: string | null; createdAt: string;
};
const STAGES = ["RESEARCHING", "DUE_DILIGENCE", "NEGOTIATING", "PURCHASED", "PASSED"] as const;
const STAGE_LABELS: Record<string, string> = {
  RESEARCHING: "Researching", DUE_DILIGENCE: "Due Diligence",
  NEGOTIATING: "Negotiating", PURCHASED: "Purchased", PASSED: "Passed",
};

function formatCurrency(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function AcquisitionPipeline({ targets, tenantId }: { targets: Target[]; tenantId: number }) {
  const router = useRouter();
  const [items, setItems] = useState(targets);
  const [addOpen, setAddOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Target | null>(null);
  const [passedExpanded, setPassedExpanded] = useState(false);
  const [createSiteOpen, setCreateSiteOpen] = useState(false);
  const [createSitePrefill, setCreateSitePrefill] = useState<Record<string, unknown>>({});
  const [form, setForm] = useState({ domain: "", niche: "", source: "", askingPrice: "", monthlyRevenue: "", monthlyTraffic: "", domainAuthority: "", notes: "" });

  const byStage = useMemo(() => {
    const map = new Map<string, Target[]>();
    for (const s of STAGES) map.set(s, []);
    for (const t of items) {
      const arr = map.get(t.stage) ?? [];
      arr.push(t);
      map.set(t.stage, arr);
    }
    return map;
  }, [items]);
  async function addTarget() {
    const body: Record<string, unknown> = { domain: form.domain };
    if (form.niche) body.niche = form.niche;
    if (form.source) body.source = form.source;
    if (form.askingPrice) body.askingPrice = parseFloat(form.askingPrice);
    if (form.monthlyRevenue) body.monthlyRevenue = parseFloat(form.monthlyRevenue);
    if (form.monthlyTraffic) body.monthlyTraffic = parseInt(form.monthlyTraffic, 10);
    if (form.domainAuthority) body.domainAuthority = parseInt(form.domainAuthority, 10);
    if (form.notes) body.notes = form.notes;
    const res = await fetch("/api/affiliate/acquisitions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      const data = await res.json();
      setItems(prev => [data.data, ...prev]);
      setAddOpen(false);
      setForm({ domain: "", niche: "", source: "", askingPrice: "", monthlyRevenue: "", monthlyTraffic: "", domainAuthority: "", notes: "" });
    }
  }

  async function updateTarget(id: number, updates: Record<string, unknown>) {
    const res = await fetch(`/api/affiliate/acquisitions/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
    if (res.ok) {
      const data = await res.json();
      setItems(prev => prev.map(t => t.id === id ? data.data : t));
      if (detailTarget?.id === id) setDetailTarget(data.data);
    }
  }

  async function deleteTarget(id: number) {
    await fetch(`/api/affiliate/acquisitions/${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(t => t.id !== id));
    setDetailTarget(null);
  }

  function handleStageChange(target: Target, newStage: string) {
    updateTarget(target.id, { stage: newStage });
    // If changed to PURCHASED, show create site prompt
    if (newStage === "PURCHASED") {
      setCreateSitePrefill({
        domain: target.domain, niche: target.niche ?? "",
        acquisitionCost: target.purchasePrice ?? target.askingPrice ?? "",
        acquisitionDate: target.purchasedDate ?? new Date().toISOString().split("T")[0],
      });
    }
  }
  if (items.length === 0 && !addOpen) {
    return (
      <EmptyState
        icon={Globe}
        title="No acquisition targets yet"
        description="Start tracking domains you're evaluating for purchase."
        action={{ label: "Add Target", onClick: () => setAddOpen(true) }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Target</Button>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {STAGES.map(stage => {
          const stageItems = byStage.get(stage) ?? [];
          const isPassed = stage === "PASSED";
          const show = isPassed ? passedExpanded : true;

          return (
            <div key={stage} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {STAGE_LABELS[stage]} <Badge variant="outline" className="ml-1">{stageItems.length}</Badge>
                </h3>
                {isPassed && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPassedExpanded(!passedExpanded)}>
                    {passedExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </Button>
                )}
              </div>

              {isPassed && !show ? (
                <button onClick={() => setPassedExpanded(true)} className="text-xs text-muted-foreground hover:text-primary">
                  {stageItems.length} passed — click to show
                </button>
              ) : stageItems.length === 0 ? (
                <Card className="border-dashed"><CardContent className="p-4 text-center text-xs text-muted-foreground">No targets</CardContent></Card>
              ) : (
                stageItems.map(target => (
                  <Card key={target.id} className="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-shadow" onClick={() => setDetailTarget(target)}>
                    <CardContent className="p-3 space-y-1">
                      <p className="font-bold text-sm">{target.domain}</p>
                      {target.niche && <p className="text-xs text-muted-foreground">{target.niche}</p>}
                      <div className="flex gap-2 text-xs">
                        {target.askingPrice != null && <span>{formatCurrency(target.askingPrice)}</span>}
                        {target.monthlyRevenue != null && <span className="text-muted-foreground">{formatCurrency(target.monthlyRevenue)}/mo</span>}
                      </div>
                      {target.domainAuthority != null && <p className="text-xs text-muted-foreground">DA {target.domainAuthority}</p>}
                      {target.source && <Badge variant="outline" className="text-[10px]">{target.source}</Badge>}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          );
        })}
      </div>
      {/* Add Target Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Acquisition Target</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Domain *</Label><Input value={form.domain} onChange={(e) => setForm(p => ({ ...p, domain: e.target.value }))} placeholder="example.com" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Niche</Label><Input value={form.niche} onChange={(e) => setForm(p => ({ ...p, niche: e.target.value }))} /></div>
              <div><Label>Source</Label><Input value={form.source} onChange={(e) => setForm(p => ({ ...p, source: e.target.value }))} placeholder="Flippa, broker, etc." /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Asking Price ($)</Label><Input type="number" value={form.askingPrice} onChange={(e) => setForm(p => ({ ...p, askingPrice: e.target.value }))} /></div>
              <div><Label>Monthly Revenue ($)</Label><Input type="number" value={form.monthlyRevenue} onChange={(e) => setForm(p => ({ ...p, monthlyRevenue: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Monthly Traffic</Label><Input type="number" value={form.monthlyTraffic} onChange={(e) => setForm(p => ({ ...p, monthlyTraffic: e.target.value }))} /></div>
              <div><Label>Domain Authority</Label><Input type="number" value={form.domainAuthority} onChange={(e) => setForm(p => ({ ...p, domainAuthority: e.target.value }))} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addTarget} disabled={!form.domain.trim()}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Detail Drawer Dialog */}
      {detailTarget && (
        <Dialog open={!!detailTarget} onOpenChange={(open) => { if (!open) setDetailTarget(null); }}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{detailTarget.domain}</DialogTitle></DialogHeader>
            <div className="grid gap-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Stage</Label>
                  <Select value={detailTarget.stage} onValueChange={(v) => handleStageChange(detailTarget, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STAGES.map(s => <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Source</Label><Input defaultValue={detailTarget.source ?? ""} onBlur={(e) => updateTarget(detailTarget.id, { source: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Niche</Label><Input defaultValue={detailTarget.niche ?? ""} onBlur={(e) => updateTarget(detailTarget.id, { niche: e.target.value })} /></div>
                <div><Label>DA</Label><Input type="number" defaultValue={detailTarget.domainAuthority ?? ""} onBlur={(e) => updateTarget(detailTarget.id, { domainAuthority: e.target.value ? parseInt(e.target.value) : null })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Asking Price ($)</Label><Input type="number" defaultValue={detailTarget.askingPrice ?? ""} onBlur={(e) => updateTarget(detailTarget.id, { askingPrice: e.target.value ? parseFloat(e.target.value) : null })} /></div>
                <div><Label>Monthly Revenue ($)</Label><Input type="number" defaultValue={detailTarget.monthlyRevenue ?? ""} onBlur={(e) => updateTarget(detailTarget.id, { monthlyRevenue: e.target.value ? parseFloat(e.target.value) : null })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Purchase Price ($)</Label><Input type="number" defaultValue={detailTarget.purchasePrice ?? ""} onBlur={(e) => updateTarget(detailTarget.id, { purchasePrice: e.target.value ? parseFloat(e.target.value) : null })} /></div>
                <div><Label>Monthly Traffic</Label><Input type="number" defaultValue={detailTarget.monthlyTraffic ?? ""} onBlur={(e) => updateTarget(detailTarget.id, { monthlyTraffic: e.target.value ? parseInt(e.target.value) : null })} /></div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea defaultValue={detailTarget.notes ?? ""} rows={4} onBlur={(e) => updateTarget(detailTarget.id, { notes: e.target.value })} />
              </div>
              {detailTarget.stage === "PURCHASED" && (
                <div className="bg-muted p-3 rounded-md border">
                  <p className="text-sm font-medium mb-2">This domain has been purchased. Create a site record?</p>
                  <Button size="sm" onClick={() => {
                    setCreateSitePrefill({
                      domain: detailTarget.domain,
                      niche: detailTarget.niche ?? "",
                      purchaseCost: detailTarget.purchasePrice ?? detailTarget.askingPrice ?? "",
                      purchaseDate: detailTarget.purchasedDate ?? new Date().toISOString().slice(0, 10),
                      status: "ACTIVE",
                    });
                    setCreateSiteOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-1" /> Create Site Record
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter className="flex justify-between sm:justify-between">
              <Button variant="destructive" size="sm" onClick={async () => {
                if (!confirm("Delete this acquisition target?")) return;
                await fetch(`/api/affiliate/acquisitions/${detailTarget.id}`, { method: "DELETE" });
                setItems(prev => prev.filter(t => t.id !== detailTarget.id));
                setDetailTarget(null);
              }}>Delete</Button>
              <Button variant="outline" onClick={() => setDetailTarget(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* Add Site from Purchase */}
      <AddSiteDialog
        open={createSiteOpen}
        onOpenChange={setCreateSiteOpen}
        prefill={createSitePrefill}
        onCreated={() => {
          setCreateSiteOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
