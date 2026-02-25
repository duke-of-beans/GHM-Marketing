"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Trash2, Palette, Building2, RotateCcw, MessageSquare, Paintbrush } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BrandingState = {
  companyName: string;
  companyTagline: string;
  logoUrl: string | null;
  brandColor: string;
  brandColorSecondary: string;
  brandColorAccent: string;
};

type VoiceState = {
  voiceTone: string;
  voiceKeywords: string;
  voiceAntiKeywords: string;
  voiceSampleCopy: string;
  voiceIndustry: string;
  voiceAudience: string;
};

type StyleState = {
  styleFontHeading: string;
  styleFontBody: string;
  styleCornerRadius: string;
  styleDensity: string;
};

const DEFAULTS: BrandingState = {
  companyName: "",
  companyTagline: "",
  logoUrl: null,
  brandColor: "#2563eb",
  brandColorSecondary: "#64748b",
  brandColorAccent: "#f59e0b",
};

const VOICE_DEFAULTS: VoiceState = {
  voiceTone: "",
  voiceKeywords: "",
  voiceAntiKeywords: "",
  voiceSampleCopy: "",
  voiceIndustry: "",
  voiceAudience: "",
};

const STYLE_DEFAULTS: StyleState = {
  styleFontHeading: "Inter",
  styleFontBody: "Inter",
  styleCornerRadius: "rounded",
  styleDensity: "comfortable",
};

type ColorRole = {
  key: keyof BrandingState;
  label: string;
  description: string;
  defaultHex: string;
};

const COLOR_ROLES: ColorRole[] = [
  {
    key: "brandColor",
    label: "Primary",
    description: "CTAs, active states, links",
    defaultHex: DEFAULTS.brandColor,
  },
  {
    key: "brandColorSecondary",
    label: "Secondary",
    description: "Supporting UI elements, secondary buttons",
    defaultHex: DEFAULTS.brandColorSecondary,
  },
  {
    key: "brandColorAccent",
    label: "Accent",
    description: "Highlights, badges, callouts",
    defaultHex: DEFAULTS.brandColorAccent,
  },
];

export function BrandingTab() {
  const [branding, setBranding] = useState<BrandingState>(DEFAULTS);
  const [voice, setVoice] = useState<VoiceState>(VOICE_DEFAULTS);
  const [style, setStyle] = useState<StyleState>(STYLE_DEFAULTS);
  const [dirty, setDirty] = useState(false);
  const [voiceDirty, setVoiceDirty] = useState(false);
  const [styleDirty, setStyleDirty] = useState(false);
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
            brandColor: data.branding.brandColor ?? DEFAULTS.brandColor,
            brandColorSecondary:
              data.branding.brandColorSecondary ?? DEFAULTS.brandColorSecondary,
            brandColorAccent: data.branding.brandColorAccent ?? DEFAULTS.brandColorAccent,
          });
        }
        if (data.voice) {
          setVoice({
            voiceTone: data.voice.voiceTone ?? "",
            voiceKeywords: data.voice.voiceKeywords ?? "",
            voiceAntiKeywords: data.voice.voiceAntiKeywords ?? "",
            voiceSampleCopy: data.voice.voiceSampleCopy ?? "",
            voiceIndustry: data.voice.voiceIndustry ?? "",
            voiceAudience: data.voice.voiceAudience ?? "",
          });
        }
        if (data.style) {
          setStyle({
            styleFontHeading: data.style.styleFontHeading ?? STYLE_DEFAULTS.styleFontHeading,
            styleFontBody: data.style.styleFontBody ?? STYLE_DEFAULTS.styleFontBody,
            styleCornerRadius: data.style.styleCornerRadius ?? STYLE_DEFAULTS.styleCornerRadius,
            styleDensity: data.style.styleDensity ?? STYLE_DEFAULTS.styleDensity,
          });
        }
      })
      .catch(() => {});
  }, []);

  const update = (key: keyof BrandingState, value: string | null) => {
    setBranding((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const updateVoice = (key: keyof VoiceState, value: string) => {
    setVoice((prev) => ({ ...prev, [key]: value }));
    setVoiceDirty(true);
  };

  const updateStyle = (key: keyof StyleState, value: string) => {
    setStyle((prev) => ({ ...prev, [key]: value }));
    setStyleDirty(true);
  };

  const handleSaveVoice = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceTone: voice.voiceTone || null,
          voiceKeywords: voice.voiceKeywords || null,
          voiceAntiKeywords: voice.voiceAntiKeywords || null,
          voiceSampleCopy: voice.voiceSampleCopy || null,
          voiceIndustry: voice.voiceIndustry || null,
          voiceAudience: voice.voiceAudience || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Voice profile saved");
      setVoiceDirty(false);
    } catch {
      toast.error("Failed to save voice profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStyle = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          styleFontHeading: style.styleFontHeading || null,
          styleFontBody: style.styleFontBody || null,
          styleCornerRadius: style.styleCornerRadius || null,
          styleDensity: style.styleDensity || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Visual style saved");
      setStyleDirty(false);
    } catch {
      toast.error("Failed to save visual style");
    } finally {
      setSaving(false);
    }
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
          brandColorSecondary: branding.brandColorSecondary || null,
          brandColorAccent: branding.brandColorAccent || null,
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
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />Logo
          </CardTitle>
          <CardDescription>
            PNG, JPG, SVG, or WebP — max 2 MB. Shown in the navbar, login screen, and client-facing documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {branding.logoUrl ? (
            <div className="flex items-center gap-4">
              <img
                src={branding.logoUrl}
                alt="Company logo"
                className="h-16 max-w-48 object-contain border rounded p-2 bg-white"
              />
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
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) handleLogoUpload(f);
              }}
            >
              <Upload className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm font-medium">
                {uploading ? "Uploading…" : "Drop logo here or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, SVG, WebP · max 2 MB</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".png,.jpg,.jpeg,.svg,.webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleLogoUpload(f);
              e.target.value = "";
            }}
          />
        </CardContent>
      </Card>

      {/* Company identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />Company Identity
          </CardTitle>
          <CardDescription>Shown in the navbar header and on generated documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={branding.companyName}
                placeholder="GHM Agency"
                onChange={(e) => update("companyName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyTagline">Tagline</Label>
              <Input
                id="companyTagline"
                value={branding.companyTagline}
                placeholder="Grow your business online"
                onChange={(e) => update("companyTagline", e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={!dirty || saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3-color branding system (UX-AUDIT-012) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />Brand Colors
          </CardTitle>
          <CardDescription>
            Three color roles consumed as CSS variables across the dashboard. Changes take effect on next page load.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {COLOR_ROLES.map((role) => {
            const val = branding[role.key] as string;
            return (
              <div key={role.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{role.label}</Label>
                    <p className="text-xs text-muted-foreground">{role.description}</p>
                  </div>
                  {val !== role.defaultHex && (
                    <button
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => update(role.key, role.defaultHex)}
                      title="Reset to default"
                    >
                      <RotateCcw className="h-3 w-3" /> Reset
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={val}
                    onChange={(e) => update(role.key, e.target.value)}
                    className="h-10 w-20 cursor-pointer rounded border border-input p-1"
                  />
                  <Input
                    value={val}
                    onChange={(e) => update(role.key, e.target.value)}
                    className="w-32 font-mono text-sm"
                    placeholder={role.defaultHex}
                    maxLength={7}
                  />
                  <span
                    className="h-8 w-8 rounded-full border border-border flex-shrink-0"
                    style={{ backgroundColor: val }}
                  />
                </div>
              </div>
            );
          })}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={!dirty || saving}>
              {saving ? "Saving…" : "Save Colors"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voice Profile (FEAT-016) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />Voice Profile
          </CardTitle>
          <CardDescription>
            Defines how generated content sounds — brochures, audit reports, competitive sheets, and AI-written copy all pull from this profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="voiceIndustry">Industry</Label>
              <Input
                id="voiceIndustry"
                value={voice.voiceIndustry}
                placeholder="Digital marketing agency"
                onChange={(e) => updateVoice("voiceIndustry", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="voiceAudience">Target Audience</Label>
              <Input
                id="voiceAudience"
                value={voice.voiceAudience}
                placeholder="Local service businesses"
                onChange={(e) => updateVoice("voiceAudience", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="voiceTone">Tone</Label>
            <Input
              id="voiceTone"
              value={voice.voiceTone}
              placeholder="Confident, direct, professional — no fluff"
              onChange={(e) => updateVoice("voiceTone", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">How your brand speaks. Used as a directive for all generated copy.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="voiceKeywords">Preferred Terms</Label>
              <Input
                id="voiceKeywords"
                value={voice.voiceKeywords}
                placeholder="ROI, visibility, dominate, growth"
                onChange={(e) => updateVoice("voiceKeywords", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Comma-separated. Words your brand uses.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="voiceAntiKeywords">Terms to Avoid</Label>
              <Input
                id="voiceAntiKeywords"
                value={voice.voiceAntiKeywords}
                placeholder="cheap, guaranteed rankings, instant results"
                onChange={(e) => updateVoice("voiceAntiKeywords", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Comma-separated. Words your brand never uses.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="voiceSampleCopy">Sample Approved Copy</Label>
            <Textarea
              id="voiceSampleCopy"
              value={voice.voiceSampleCopy}
              placeholder="Paste a paragraph that represents your ideal brand voice. Generated content will match this style."
              onChange={(e) => updateVoice("voiceSampleCopy", e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveVoice} disabled={!voiceDirty || saving}>
              {saving ? "Saving…" : "Save Voice Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Visual Style (FEAT-016) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5" />Document Style
          </CardTitle>
          <CardDescription>
            Controls the look of generated documents — audit PDFs, brochures, demo pages, and comp sheets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="styleFontHeading">Heading Font</Label>
              <Select value={style.styleFontHeading} onValueChange={(v) => updateStyle("styleFontHeading", v)}>
                <SelectTrigger id="styleFontHeading"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Plus Jakarta Sans">Plus Jakarta Sans</SelectItem>
                  <SelectItem value="DM Sans">DM Sans</SelectItem>
                  <SelectItem value="Outfit">Outfit</SelectItem>
                  <SelectItem value="Space Grotesk">Space Grotesk</SelectItem>
                  <SelectItem value="Sora">Sora</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="styleFontBody">Body Font</Label>
              <Select value={style.styleFontBody} onValueChange={(v) => updateStyle("styleFontBody", v)}>
                <SelectTrigger id="styleFontBody"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Plus Jakarta Sans">Plus Jakarta Sans</SelectItem>
                  <SelectItem value="DM Sans">DM Sans</SelectItem>
                  <SelectItem value="Source Sans 3">Source Sans 3</SelectItem>
                  <SelectItem value="IBM Plex Sans">IBM Plex Sans</SelectItem>
                  <SelectItem value="Nunito Sans">Nunito Sans</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="styleCornerRadius">Corner Style</Label>
              <Select value={style.styleCornerRadius} onValueChange={(v) => updateStyle("styleCornerRadius", v)}>
                <SelectTrigger id="styleCornerRadius"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sharp">Sharp — squared edges</SelectItem>
                  <SelectItem value="rounded">Rounded — subtle radius</SelectItem>
                  <SelectItem value="pill">Pill — fully rounded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="styleDensity">Layout Density</Label>
              <Select value={style.styleDensity} onValueChange={(v) => updateStyle("styleDensity", v)}>
                <SelectTrigger id="styleDensity"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact — tight spacing</SelectItem>
                  <SelectItem value="comfortable">Comfortable — balanced</SelectItem>
                  <SelectItem value="spacious">Spacious — generous whitespace</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveStyle} disabled={!styleDirty || saving}>
              {saving ? "Saving…" : "Save Document Style"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
