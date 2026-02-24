"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, ArrowRight, ArrowLeft, Upload, Trash2, Building2, Palette, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

type Branding = {
  companyName: string;
  companyTagline: string;
  logoUrl: string | null;
  brandColor: string;
};

type Props = {
  initialBranding: Branding;
};

const STEPS = [
  { id: "welcome",  label: "Welcome"  },
  { id: "company",  label: "Company"  },
  { id: "branding", label: "Branding" },
  { id: "done",     label: "Done"     },
];

export function AdminSetupWizard({ initialBranding }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [branding, setBranding] = useState<Branding>(initialBranding);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (key: keyof Branding, value: string | null) =>
    setBranding((prev) => ({ ...prev, [key]: value }));

  const saveBranding = async () => {
    await fetch("/api/admin/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: branding.companyName || null,
        companyTagline: branding.companyTagline || null,
        brandColor: branding.brandColor || null,
      }),
    });
  };

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/settings/branding", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      update("logoUrl", data.url);
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleLogoDelete = async () => {
    setUploading(true);
    try {
      await fetch("/api/settings/branding", { method: "DELETE" });
      update("logoUrl", null);
    } catch {
      toast.error("Failed to remove logo");
    } finally {
      setUploading(false);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await saveBranding();
      await fetch("/api/admin/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complete: true }),
      });
      setStep(3); // Done step
    } catch {
      toast.error("Failed to save — please try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                i < step ? "bg-primary text-primary-foreground" :
                i === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                "bg-muted text-muted-foreground"
              )}>
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("h-0.5 w-8", i < step ? "bg-primary" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-card border rounded-2xl shadow-lg p-8 space-y-6">

          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
            <div className="space-y-4 text-center">
              <div className="text-5xl">👋</div>
              <h1 className="text-2xl font-bold">Welcome to your dashboard</h1>
              <p className="text-muted-foreground">Let&apos;s take 2 minutes to set up your company profile and branding so the platform feels like home.</p>
              <Button className="w-full mt-4" onClick={() => setStep(1)}>
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <button className="text-sm text-muted-foreground underline" onClick={handleFinish} disabled={saving}>
                Skip setup and go to dashboard
              </button>
            </div>
          )}

          {/* ── Step 1: Company ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Company Identity</h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" value={branding.companyName} placeholder="Acme Agency" onChange={(e) => update("companyName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input id="tagline" value={branding.companyTagline} placeholder="Growing businesses online" onChange={(e) => update("companyTagline", e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(0)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                <Button className="flex-1" onClick={() => setStep(2)}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* ── Step 2: Branding ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Logo &amp; Colors</h2>
              </div>
              <div className="space-y-4">
                {/* Logo */}
                <div className="space-y-2">
                  <Label>Logo</Label>
                  {branding.logoUrl ? (
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <img src={branding.logoUrl} alt="Logo preview" className="h-10 max-w-32 object-contain" />
                      <div className="flex gap-2 ml-auto">
                        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>Replace</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={handleLogoDelete} disabled={uploading}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center gap-2 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => fileRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleLogoUpload(f); }}
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <p className="text-sm">{uploading ? "Uploading…" : "Click or drag to upload logo"}</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, SVG, WebP · max 2 MB</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" className="hidden" accept=".png,.jpg,.jpeg,.svg,.webp"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ""; }} />
                </div>
                {/* Color */}
                <div className="space-y-2">
                  <Label>Brand Color</Label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={branding.brandColor} onChange={(e) => update("brandColor", e.target.value)}
                      className="h-10 w-16 cursor-pointer rounded border border-input p-1" />
                    <Input value={branding.brandColor} onChange={(e) => update("brandColor", e.target.value)} className="w-32 font-mono" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                <Button className="flex-1" onClick={handleFinish} disabled={saving}>
                  {saving ? "Saving…" : "Finish Setup"} <Rocket className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="text-5xl">🎉</div>
              <h2 className="text-2xl font-bold">You&apos;re all set!</h2>
              <p className="text-muted-foreground">Your platform is configured and ready to use. You can update branding anytime in Settings → Branding.</p>
              <Button className="w-full mt-4" onClick={() => router.push("/master")}>
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
