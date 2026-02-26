"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Sparkles, Copy, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdVariant {
  variant: string;
  headlines: string[];
  descriptions: string[];
}

interface PPCGeneratorProps {
  clientId: number;
}

const HEADLINE_LIMIT = 30;
const DESC_LIMIT = 90;

function CharCount({ text, limit }: { text: string; limit: number }) {
  const count = text.length;
  const over = count > limit;
  return (
    <span className={cn("text-[10px] tabular-nums", over ? "text-status-danger font-semibold" : "text-muted-foreground")}>
      {count}/{limit}
      {over && <AlertCircle className="inline h-3 w-3 ml-0.5" />}
    </span>
  );
}

export function PPCGenerator({ clientId }: PPCGeneratorProps) {
  const [service, setService] = useState("");
  const [keywords, setKeywords] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [useVoiceProfile, setUseVoiceProfile] = useState(false);
  const [hasVoiceProfile, setHasVoiceProfile] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [variants, setVariants] = useState<AdVariant[]>([]);

  useEffect(() => {
    fetch(`/api/clients/${clientId}/voice-profile`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          setHasVoiceProfile(true);
        }
      })
      .catch(() => {});
  }, [clientId]);

  async function handleGenerate() {
    if (!service.trim()) {
      toast.error("Enter a service or campaign focus");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/content/generate-ppc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, service, keywords, callToAction, useVoiceProfile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate ad copy");
      setVariants(data.results as AdVariant[]);
      toast.success("Ad copy variants generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate ad copy");
    } finally {
      setGenerating(false);
    }
  }

  function copyVariant(variant: AdVariant) {
    const text = [
      `=== ${variant.variant} ===`,
      "",
      "HEADLINES:",
      ...variant.headlines.map((h, i) => `${i + 1}. ${h}`),
      "",
      "DESCRIPTIONS:",
      ...variant.descriptions.map((d, i) => `${i + 1}. ${d}`),
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Variant copied to clipboard");
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Generate Google Ads-formatted headlines (max 30 chars) and descriptions (max 90 chars) in multiple variants for A/B testing.
      </p>

      <div className="grid gap-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Service / Campaign Focus <span className="text-status-danger">*</span></label>
          <Input
            placeholder="e.g. Emergency Plumbing Services, Roof Replacement"
            value={service}
            onChange={(e) => setService(e.target.value)}
            disabled={generating}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Target Keywords <span className="text-muted-foreground text-xs">(optional)</span></label>
            <Input
              placeholder="e.g. emergency plumber near me"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              disabled={generating}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Call to Action <span className="text-muted-foreground text-xs">(optional)</span></label>
            <Input
              placeholder="e.g. Call Now, Get a Free Quote"
              value={callToAction}
              onChange={(e) => setCallToAction(e.target.value)}
              disabled={generating}
            />
          </div>
        </div>

        {hasVoiceProfile && (
          <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
            <Checkbox
              id="ppc-voice"
              checked={useVoiceProfile}
              onCheckedChange={(v) => setUseVoiceProfile(v as boolean)}
              disabled={generating}
            />
            <label htmlFor="ppc-voice" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              Use client&apos;s captured brand voice
            </label>
          </div>
        )}

        <Button onClick={handleGenerate} disabled={generating || !service.trim()} className="w-full">
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating ad copy...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Ad Copy Variants
            </>
          )}
        </Button>
      </div>

      {variants.length > 0 && (
        <div className="space-y-4 pt-2">
          {variants.map((variant, i) => (
            <div key={i} className="rounded-lg border bg-muted/20 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/40">
                <span className="text-sm font-semibold">{variant.variant}</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => copyVariant(variant)}>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Headlines</p>
                  <div className="space-y-1.5">
                    {variant.headlines.map((h, j) => (
                      <div key={j} className="flex items-center justify-between gap-2 px-3 py-1.5 rounded bg-background border">
                        <span className="text-sm">{h}</span>
                        <CharCount text={h} limit={HEADLINE_LIMIT} />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Descriptions</p>
                  <div className="space-y-1.5">
                    {variant.descriptions.map((d, j) => (
                      <div key={j} className="flex items-start justify-between gap-2 px-3 py-1.5 rounded bg-background border">
                        <span className="text-sm leading-snug">{d}</span>
                        <CharCount text={d} limit={DESC_LIMIT} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
