"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onCreated?: () => void;
  prefill?: Record<string, unknown>;
};

const SITE_STATUSES = ["ACTIVE", "BUILDING", "MONETIZING", "PARKED", "FOR_SALE", "SOLD", "ARCHIVED"];
const MONETIZATION_OPTIONS = ["affiliate", "display", "both", "flip"];
export function AddSiteDialog({ open, onOpenChange, onSuccess, onCreated, prefill }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    domain: "", displayName: "", niche: "", category: "", status: "ACTIVE",
    launchDate: "", acquisitionDate: "", acquisitionCost: "",
    monthlyRevenueCurrent: "", monthlyTrafficCurrent: "",
    domainAuthority: "", domainRating: "",
    cms: "", hostingProvider: "", hostingCostMonthly: "",
    monetizationMix: "affiliate", notes: "",
  });

  useEffect(() => {
    if (prefill && open) {
      setForm(prev => ({
        ...prev,
        domain: String(prefill.domain ?? prev.domain),
        niche: String(prefill.niche ?? prev.niche),
        acquisitionCost: String(prefill.purchaseCost ?? prev.acquisitionCost),
        acquisitionDate: String(prefill.purchaseDate ?? prev.acquisitionDate),
        status: String(prefill.status ?? prev.status),
      }));
    }
  }, [prefill, open]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.domain.trim()) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = { domain: form.domain, status: form.status };
      if (form.displayName) body.displayName = form.displayName;
      if (form.niche) body.niche = form.niche;
      if (form.category) body.category = form.category;
      if (form.launchDate) body.launchDate = new Date(form.launchDate).toISOString();
      if (form.acquisitionDate) body.acquisitionDate = new Date(form.acquisitionDate).toISOString();
      if (form.acquisitionCost) body.acquisitionCost = parseFloat(form.acquisitionCost);
      if (form.monthlyRevenueCurrent) body.monthlyRevenueCurrent = parseFloat(form.monthlyRevenueCurrent);
      if (form.monthlyTrafficCurrent) body.monthlyTrafficCurrent = parseInt(form.monthlyTrafficCurrent, 10);
      if (form.domainAuthority) body.domainAuthority = parseInt(form.domainAuthority, 10);
      if (form.domainRating) body.domainRating = parseInt(form.domainRating, 10);
      if (form.cms) body.cms = form.cms;
      if (form.hostingProvider) body.hostingProvider = form.hostingProvider;
      if (form.hostingCostMonthly) body.hostingCostMonthly = parseFloat(form.hostingCostMonthly);
      if (form.monetizationMix) body.monetizationMix = form.monetizationMix;
      if (form.notes) body.notes = form.notes;

      const res = await fetch("/api/affiliate/sites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Failed to create site");
      onOpenChange(false);
      onSuccess?.();
      onCreated?.();
    } catch (err) {
      console.error("Add site error:", err);
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Site</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Domain *</Label>
            <Input value={form.domain} onChange={(e) => update("domain", e.target.value)} placeholder="example.com" />
          </div>
          <div>
            <Label>Display Name</Label>
            <Input value={form.displayName} onChange={(e) => update("displayName", e.target.value)} />
          </div>
          <div>
            <Label>Niche</Label>
            <Input value={form.niche} onChange={(e) => update("niche", e.target.value)} placeholder="e.g. Outdoor Gear" />
          </div>
          <div>
            <Label>Category</Label>
            <Input value={form.category} onChange={(e) => update("category", e.target.value)} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => update("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SITE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Launch Date</Label>
            <Input type="date" value={form.launchDate} onChange={(e) => update("launchDate", e.target.value)} />
          </div>
          <div>
            <Label>Acquisition Date</Label>
            <Input type="date" value={form.acquisitionDate} onChange={(e) => update("acquisitionDate", e.target.value)} />
          </div>
          <div>
            <Label>Acquisition Cost ($)</Label>
            <Input type="number" value={form.acquisitionCost} onChange={(e) => update("acquisitionCost", e.target.value)} />
          </div>
          <div>
            <Label>Monthly Revenue ($)</Label>
            <Input type="number" value={form.monthlyRevenueCurrent} onChange={(e) => update("monthlyRevenueCurrent", e.target.value)} />
          </div>
          <div>
            <Label>Monthly Traffic</Label>
            <Input type="number" value={form.monthlyTrafficCurrent} onChange={(e) => update("monthlyTrafficCurrent", e.target.value)} />
          </div>
          <div>
            <Label>Domain Authority</Label>
            <Input type="number" value={form.domainAuthority} onChange={(e) => update("domainAuthority", e.target.value)} />
          </div>
          <div>
            <Label>Domain Rating</Label>
            <Input type="number" value={form.domainRating} onChange={(e) => update("domainRating", e.target.value)} />
          </div>
          <div>
            <Label>CMS</Label>
            <Input value={form.cms} onChange={(e) => update("cms", e.target.value)} placeholder="WordPress" />
          </div>
          <div>
            <Label>Hosting Provider</Label>
            <Input value={form.hostingProvider} onChange={(e) => update("hostingProvider", e.target.value)} />
          </div>
          <div>
            <Label>Hosting Cost ($/mo)</Label>
            <Input type="number" value={form.hostingCostMonthly} onChange={(e) => update("hostingCostMonthly", e.target.value)} />
          </div>
          <div>
            <Label>Monetization Mix</Label>
            <Select value={form.monetizationMix} onValueChange={(v) => update("monetizationMix", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONETIZATION_OPTIONS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.domain.trim()}>
            {saving ? "Saving..." : "Add Site"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}