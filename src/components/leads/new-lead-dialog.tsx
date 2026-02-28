"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

type Territory = { id: number; name: string };

type FormState = {
  businessName: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  territoryId: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  businessName: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  territoryId: "",
  notes: "",
};

export function NewLeadDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // Load territories when dialog opens
  useEffect(() => {
    if (!open) return;
    fetch("/api/territories")
      .then((r) => r.json())
      .then((data) => { if (data.success) setTerritories(data.data); })
      .catch(() => { /* degrade gracefully — territory select hidden */ });
  }, [open]);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.businessName.trim()) next.businessName = "Business name is required";
    if (!form.phone.trim()) next.phone = "Phone is required";
    if (!form.city.trim()) next.city = "City is required";
    if (!form.state.trim()) next.state = "State is required";
    if (!form.zipCode.trim()) next.zipCode = "ZIP code is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        businessName: form.businessName.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zipCode: form.zipCode.trim(),
      };
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.website.trim()) payload.website = form.website.trim();
      if (form.address.trim()) payload.address = form.address.trim();
      if (form.territoryId) payload.territoryId = parseInt(form.territoryId, 10);

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Failed to create lead");
      }

      // Attach initial note if provided
      if (form.notes.trim() && data.data?.id) {
        await fetch(`/api/leads/${data.data.id}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: form.notes.trim() }),
        });
      }

      toast.success(`${form.businessName} added to pipeline`);
      setForm(EMPTY_FORM);
      setErrors({});
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create lead");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) { setForm(EMPTY_FORM); setErrors({}); }
    setOpen(next);
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="h-9 gap-1.5">
        <Plus className="h-4 w-4" />
        New Lead
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">

            {/* Business Name */}
            <div className="space-y-1.5">
              <Label htmlFor="nl-businessName">
                Business Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nl-businessName"
                value={form.businessName}
                onChange={(e) => set("businessName", e.target.value)}
                placeholder="Acme Roofing Co."
                autoFocus
              />
              {errors.businessName && (
                <p className="text-xs text-destructive">{errors.businessName}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="nl-phone">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nl-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="(555) 555-5555"
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone}</p>
              )}
            </div>

            {/* Email + Website */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nl-email">Email</Label>
                <Input
                  id="nl-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="owner@business.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nl-website">Website</Label>
                <Input
                  id="nl-website"
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* Street Address */}
            <div className="space-y-1.5">
              <Label htmlFor="nl-address">Street Address</Label>
              <Input
                id="nl-address"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="123 Main St"
              />
            </div>

            {/* City / State / ZIP */}
            <div className="grid grid-cols-[1fr_80px_100px] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nl-city">
                  City <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nl-city"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="Chicago"
                />
                {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nl-state">
                  State <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nl-state"
                  value={form.state}
                  onChange={(e) => set("state", e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="IL"
                  maxLength={2}
                />
                {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nl-zipCode">
                  ZIP <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nl-zipCode"
                  value={form.zipCode}
                  onChange={(e) => set("zipCode", e.target.value)}
                  placeholder="60601"
                  maxLength={10}
                />
                {errors.zipCode && <p className="text-xs text-destructive">{errors.zipCode}</p>}
              </div>
            </div>

            {/* Territory — only shown when user has access */}
            {territories.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="nl-territory">Territory</Label>
                <Select value={form.territoryId} onValueChange={(v) => set("territoryId", v)}>
                  <SelectTrigger id="nl-territory">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {territories.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="nl-notes">Notes</Label>
              <Textarea
                id="nl-notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="First impression, referral source, talking points…"
                rows={3}
                className="resize-none text-sm"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Adding…" : "Add Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
