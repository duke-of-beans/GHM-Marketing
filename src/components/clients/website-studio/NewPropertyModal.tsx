"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WebPropertyTier } from "@/types/website-studio";

const TIER_DESCRIPTIONS: Record<WebPropertyTier, { label: string; desc: string; color: string }> = {
  tier1: {
    label: "Tier 1 — Site Extension",
    desc: "Pages appear part of the client's existing site. GHM hosts under client subdomain. Visual + Voice DNA cloned from client.",
    color: "border-blue-400 bg-blue-50 dark:bg-blue-950/30",
  },
  tier2: {
    label: "Tier 2 — Branded Satellite",
    desc: "Separate domain, same brand identity. Geographic or service expansion. Visual + Voice DNA from client.",
    color: "border-purple-400 bg-purple-50 dark:bg-purple-950/30",
  },
  tier3: {
    label: "Tier 3 — Pure Satellite",
    desc: "Fully independent brand, domain, and voice. GHM owns everything. Strongest lock-in.",
    color: "border-amber-400 bg-amber-50 dark:bg-amber-950/30",
  },
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clientId: number;
  businessName: string;
  onCreated: () => void;
}

export function NewPropertyModal({ open, onOpenChange, clientId, businessName, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [tier, setTier] = useState<WebPropertyTier | null>(null);
  const [brandSegment, setBrandSegment] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [voiceProfileSlug, setVoiceProfileSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setStep(1);
    setTier(null);
    setBrandSegment("");
    setTargetUrl("");
    setVoiceProfileSlug("");
    setSubmitting(false);
  }

  function handleClose(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  async function handleCreate() {
    if (!tier || !brandSegment.trim() || !targetUrl.trim()) {
      toast.error("Tier, brand segment, and target URL are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/website-studio/${clientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          brandSegment: brandSegment.trim(),
          targetUrl: targetUrl.trim(),
          voiceProfileSlug: voiceProfileSlug.trim() || null,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success(`${brandSegment} ${tier.replace("tier", "T")} property created and scaffolded.`);
      reset();
      onCreated();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create property");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Web Property — {businessName}</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">Select property tier:</p>
            {(["tier1", "tier2", "tier3"] as WebPropertyTier[]).map((t) => {
              const cfg = TIER_DESCRIPTIONS[t];
              return (
                <button
                  key={t}
                  onClick={() => { setTier(t); setStep(2); }}
                  className={`w-full text-left rounded-lg border-2 px-4 py-3 transition-all hover:opacity-90 ${
                    tier === t ? cfg.color + " border-opacity-100" : "border-border"
                  }`}
                >
                  <p className="text-sm font-medium">{cfg.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cfg.desc}</p>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && tier && (
          <div className="space-y-4 pt-2">
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setStep(1)}
            >
              ← Back to tier selection
            </button>

            <div className={`rounded-lg border-2 px-3 py-2 text-sm font-medium ${TIER_DESCRIPTIONS[tier].color}`}>
              {TIER_DESCRIPTIONS[tier].label}
            </div>

            <div className="space-y-1">
              <Label htmlFor="brand-segment">Brand Segment</Label>
              <Input
                id="brand-segment"
                placeholder="e.g. BMW, Audi, Quattro Authority"
                value={brandSegment}
                onChange={(e) => setBrandSegment(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Used to organize the matrix and as the Vercel project suffix.</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="target-url">Target URL / Domain</Label>
              <Input
                id="target-url"
                placeholder={tier === "tier1" ? "bmw.germanauto.doctor" : "quattroauthority.com"}
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
              />
            </div>

            {(tier === "tier1" || tier === "tier2") && (
              <div className="space-y-1">
                <Label htmlFor="voice-slug">Voice Profile Slug (optional)</Label>
                <Input
                  id="voice-slug"
                  placeholder="e.g. gad-main"
                  value={voiceProfileSlug}
                  onChange={(e) => setVoiceProfileSlug(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Leave blank to use client default. Tier 3 generates a new profile.</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? "Creating..." : "Create & Scaffold"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
