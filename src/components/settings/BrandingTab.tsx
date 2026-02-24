"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Trash2, Palette, Building2 } from "lucide-react";

type BrandingState = {
  companyName: string;
  companyTagline: string;
  logoUrl: string | null;
  brandColor: string;
};

const DEFAULTS: BrandingState = {
  companyName: "",
  companyTagline: "",
  logoUrl: null,
  brandColor: "#2563eb",
};

export function BrandingTab() {
  const [branding, setBranding] = useState<BrandingState>(DEFAULTS);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/onboarding")
      .then((r) => r.json())
      .then((data) => {
        if (data.branding) {
          setBranding({
            companyName: data.branding.companyName ?? "",
            companyTagline: data.branding.companyTagline ?? "",
            logoUrl: data.branding.logoUrl ?? null,
            brandColor: data.branding.brandColor ?? "#2563eb",
          });
        }
      })
      .catch(() => {});
  }, []);

  const update = (key: keyof BrandingState, value: string | null) => {
    setBranding((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: branding.companyName || null,
          companyTagline: branding.companyTagline || null,
          brandColor: branding.brandColor || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Branding saved");
      setDirty(false);
    } catch {
      toast.error("Failed to save branding");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/settings/branding", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setBranding((prev) => ({ ...prev, logoUrl: data.url }));
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
      const res = await fetch("/api/settings/branding", { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setBranding((prev) => ({ ...prev, logoUrl: null }));
      toast.success("Logo removed");
    } catch {
      toast.error("Failed to remove logo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Logo</CardTitle>
          <CardDescription>PNG, JPG, SVG, or WebP — max 2 MB. Shown in the navbar and on client-facing documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {branding.logoUrl ? (
            <div className="flex items-center gap-4">
              <img src={branding.logoUrl} alt="Company logo" className="h-16 max-w-48 object-contain border rounded p-2 bg-white" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  Replace
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={handleLogoDelete} disabled={uploading}>
                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-10 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleLogoUpload(f); }}
            >
              <Upload className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm font-medium">{uploading ? "Uploading…" : "Drop logo here or click to browse"}</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, SVG, WebP · max 2 MB</p>
            </div>
          )}
          <input ref={fileRef} type="file" className="hidden" accept=".png,.jpg,.jpeg,.svg,.webp"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ""; }} />
        </CardContent>
      </Card>

      {/* Company info + color */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Company Identity</CardTitle>
          <CardDescription>Shown in the navbar header and on generated documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" value={branding.companyName} placeholder="GHM Agency" onChange={(e) => update("companyName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyTagline">Tagline</Label>
              <Input id="companyTagline" value={branding.companyTagline} placeholder="Grow your business online" onChange={(e) => update("companyTagline", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brandColor" className="flex items-center gap-1.5"><Palette className="h-4 w-4" />Brand Color</Label>
            <div className="flex items-center gap-3">
              <input id="brandColor" type="color" value={branding.brandColor} onChange={(e) => update("brandColor", e.target.value)}
                className="h-10 w-20 cursor-pointer rounded border border-input p-1" />
              <Input value={branding.brandColor} onChange={(e) => update("brandColor", e.target.value)} className="w-32 font-mono" placeholder="#2563eb" />
              <span className="text-sm text-muted-foreground">Used for report accent colors and email headers</span>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={!dirty || saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
