"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle2, ArrowRight, ArrowLeft, Upload, Trash2, Building2,
  Palette, Rocket, AlertTriangle, Users, FileSpreadsheet,
  Plug, CheckCheck, Loader2, XCircle, Clock, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────

type Branding = {
  companyName: string;
  companyTagline: string;
  logoUrl: string | null;
  brandColor: string;
  brandColorSecondary: string;
  brandColorAccent: string;
};

type IntegrationStatus = {
  id: string;
  name: string;
  configured: boolean;
  healthy: boolean | null;
  latencyMs: number | null;
  error: string | null;
  note: string | null;
};

type Props = {
  initialBranding: Branding;
  initialStep?: number;
};

// ── Step manifest ─────────────────────────────────────────────────────────

const STEPS = [
  { id: "welcome",       label: "Welcome"       },
  { id: "company",       label: "Company"       },
  { id: "branding",      label: "Branding"      },
  { id: "team",          label: "Team"          },
  { id: "import",        label: "Import"        },
  { id: "integrations",  label: "Integrations"  },
  { id: "done",          label: "Done"          },
];
const LAST_STEP = STEPS.length - 1;

// ── Color role metadata ───────────────────────────────────────────────────

const COLOR_ROLES = [
  { key: "brandColor"          as keyof Branding, label: "Primary",   description: "CTAs, active states, links", default: "#2563eb" },
  { key: "brandColorSecondary" as keyof Branding, label: "Secondary", description: "Supporting elements, secondary buttons", default: "#64748b" },
  { key: "brandColorAccent"    as keyof Branding, label: "Accent",    description: "Highlights, badges, callouts", default: "#f59e0b" },
];

// ── Shared save helpers ───────────────────────────────────────────────────

async function patchOnboarding(body: Record<string, unknown>) {
  const res = await fetch("/api/admin/onboarding", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Save failed");
}

// ── Main component ────────────────────────────────────────────────────────

export function AdminSetupWizard({ initialBranding, initialStep = 0 }: Props) {
  const router = useRouter();

  // Core state
  const [step, setStep]       = useState(Math.min(initialStep, LAST_STEP));
  const [branding, setBranding] = useState<Branding>(initialBranding);
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Team invite state (step 3)
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole]   = useState<"sales" | "manager">("sales");
  const [inviting, setInviting]       = useState(false);
  const [inviteSent, setInviteSent]   = useState(false);

  // Lead import state (step 4)
  const csvRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile]   = useState<File | null>(null);
  const [importing, setImporting]     = useState(false);
  const [importResult, setImportResult] = useState<{ count: number } | null>(null);

  // Integration status (step 5)
  const [integrations, setIntegrations] = useState<IntegrationStatus[] | null>(null);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);

  // ── Helpers ─────────────────────────────────────────────────────────────

  const update = useCallback((key: keyof Branding, value: string | null) =>
    setBranding((prev) => ({ ...prev, [key]: value ?? "" })), []);

  const persistStep = useCallback(async (nextStep: number) => {
    try { await patchOnboarding({ step: nextStep }); } catch { /* non-blocking */ }
  }, []);

  const advance = useCallback(async (nextStep: number) => {
    await persistStep(nextStep);
    setStep(nextStep);
  }, [persistStep]);

  const saveBranding = useCallback(async () => {
    await patchOnboarding({
      companyName:          branding.companyName || null,
      companyTagline:       branding.companyTagline || null,
      brandColor:           branding.brandColor || null,
      brandColorSecondary:  branding.brandColorSecondary || null,
      brandColorAccent:     branding.brandColorAccent || null,
    });
  }, [branding]);


  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/settings/branding", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      update("logoUrl", data.url);
      toast.success("Logo uploaded");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadError(msg);
      toast.error(`Logo upload failed: ${msg}. You can add it later in Settings → Branding.`);
    } finally {
      setUploading(false);
    }
  };

  const handleLogoDelete = async () => {
    setUploading(true);
    try {
      await fetch("/api/settings/branding", { method: "DELETE" });
      update("logoUrl", null);
      setUploadError(null);
    } catch {
      toast.error("Failed to remove logo");
    } finally {
      setUploading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole, sendInvite: true }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Invite failed");
      }
      setInviteSent(true);
      toast.success(`Invite sent to ${inviteEmail}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setInviting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      const res = await fetch("/api/leads/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setImportResult({ count: data.count ?? data.imported ?? 0 });
      toast.success("Leads imported");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const loadIntegrations = async () => {
    setLoadingIntegrations(true);
    try {
      const res = await fetch("/api/settings/integrations");
      const data = await res.json();
      setIntegrations(data.data?.integrations ?? []);
    } catch {
      toast.error("Could not load integration status");
    } finally {
      setLoadingIntegrations(false);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await saveBranding();
      await patchOnboarding({ complete: true });
      setStep(LAST_STEP);
    } catch {
      toast.error("Failed to save — please try again");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    try { await saveBranding(); } finally {
      setSaving(false);
      router.push("/manager");
    }
  };


  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl">

        {/* Progress dots — collapse labels on mobile */}
        <div className="flex items-center justify-center gap-1 mb-8 flex-wrap">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                i < step  ? "bg-primary text-primary-foreground"
                : i === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                : "bg-muted text-muted-foreground"
              )}>
                {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("h-0.5 w-4", i < step ? "bg-primary" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-card border rounded-2xl shadow-lg p-8 space-y-6">

          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
            <div className="space-y-4 text-center">
              <div className="text-5xl">👋</div>
              <h1 className="text-2xl font-bold">Welcome to your dashboard</h1>
              <p className="text-muted-foreground">
                Let&apos;s take a few minutes to set up your company profile, brand colors,
                invite your team, and get your first leads imported.
              </p>
              <Button className="w-full mt-4" onClick={() => advance(1)}>
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <button className="text-sm text-muted-foreground underline" onClick={handleSkip} disabled={saving}>
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
                  <Input id="companyName" value={branding.companyName}
                    placeholder="Acme Agency"
                    onChange={(e) => update("companyName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input id="tagline" value={branding.companyTagline}
                    placeholder="Growing businesses online"
                    onChange={(e) => update("companyTagline", e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => advance(0)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                <Button className="flex-1" onClick={() => advance(2)}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
              <div className="text-center">
                <button className="text-xs text-muted-foreground underline" onClick={handleSkip} disabled={saving}>
                  Skip for now
                </button>
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

              {/* Logo upload */}
              <div className="space-y-2">
                <Label>Logo</Label>
                {uploadError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <p className="text-xs">Upload unavailable. Add your logo later in <strong>Settings → Branding</strong>.</p>
                  </div>
                )}
                {branding.logoUrl ? (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                    className={cn(
                      "flex flex-col items-center gap-2 p-8 border-2 border-dashed rounded-lg transition-colors",
                      uploadError ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-accent/50"
                    )}
                    onClick={() => !uploadError && fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); if (!uploadError) { const f = e.dataTransfer.files[0]; if (f) handleLogoUpload(f); } }}
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm">{uploading ? "Uploading…" : uploadError ? "Upload unavailable" : "Click or drag to upload logo"}</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, SVG, WebP · max 2 MB</p>
                  </div>
                )}
                <input ref={fileRef} type="file" className="hidden" accept=".png,.jpg,.jpeg,.svg,.webp"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ""; }} />
              </div>

              {/* 3-color system */}
              <div className="space-y-4">
                <Label>Brand Colors</Label>
                {COLOR_ROLES.map((role) => {
                  const val = (branding[role.key] as string) || role.default;
                  return (
                    <div key={role.key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{role.label}</p>
                          <p className="text-xs text-muted-foreground">{role.description}</p>
                        </div>
                        {val !== role.default && (
                          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => update(role.key, role.default)}>
                            <RotateCcw className="h-3 w-3" /> Reset
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="color" value={val} onChange={(e) => update(role.key, e.target.value)}
                          className="h-9 w-16 cursor-pointer rounded border border-input p-1" />
                        <Input value={val} onChange={(e) => update(role.key, e.target.value)}
                          className="w-28 font-mono text-sm" maxLength={7} />
                        <span className="h-7 w-7 rounded-full border border-border" style={{ backgroundColor: val }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => advance(1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                <Button className="flex-1" disabled={saving} onClick={async () => {
                  setSaving(true);
                  try { await saveBranding(); await advance(3); } catch { toast.error("Save failed"); } finally { setSaving(false); }
                }}>
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : <>Next <ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </div>
              <div className="text-center">
                <button className="text-xs text-muted-foreground underline" onClick={handleSkip} disabled={saving}>Skip for now</button>
              </div>
            </div>
          )}


          {/* ── Step 3: Team Setup ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Invite Your Team</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Invite your first team member. You can add more from <strong>Settings → Team</strong> at any time.
              </p>

              {inviteSent ? (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200">
                  <CheckCheck className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Invite sent!</p>
                    <p className="text-xs mt-0.5">They&apos;ll receive an email to set up their account.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="inviteEmail">Email Address</Label>
                    <Input id="inviteEmail" type="email" value={inviteEmail}
                      placeholder="rep@yourcompany.com"
                      onChange={(e) => setInviteEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="flex gap-2">
                      {(["sales", "manager"] as const).map((r) => (
                        <button key={r}
                          className={cn(
                            "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors capitalize",
                            inviteRole === r
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-foreground"
                          )}
                          onClick={() => setInviteRole(r)}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                    {inviting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</> : "Send Invite"}
                  </Button>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => advance(2)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                <Button className="flex-1" onClick={() => advance(4)}>
                  {inviteSent ? "Next" : "Skip for now"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 4: Lead Import ── */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Import Your First Leads</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a CSV or Excel file with your prospect list. Columns are auto-mapped — business name,
                phone, address, website, and more. You can also import from <strong>Leads → Import</strong> later.
              </p>

              {importResult ? (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200">
                  <CheckCheck className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{importResult.count} leads imported!</p>
                    <p className="text-xs mt-0.5">Find them in the Leads section of your dashboard.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    className="flex flex-col items-center gap-2 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => csvRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setImportFile(f); }}
                  >
                    <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                    {importFile
                      ? <p className="text-sm font-medium">{importFile.name}</p>
                      : <><p className="text-sm">Click or drag CSV / Excel file here</p><p className="text-xs text-muted-foreground">.csv, .xlsx, .xls</p></>}
                  </div>
                  <input ref={csvRef} type="file" className="hidden" accept=".csv,.xlsx,.xls"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setImportFile(f); e.target.value = ""; }} />
                  {importFile && (
                    <Button className="w-full" onClick={handleImport} disabled={importing}>
                      {importing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing…</> : `Import ${importFile.name}`}
                    </Button>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => advance(3)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                <Button className="flex-1" onClick={async () => { await advance(5); loadIntegrations(); }}>
                  {importResult ? "Next" : "Skip for now"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}


          {/* ── Step 5: Integrations Checklist ── */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Plug className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Integration Status</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                These integrations are configured via environment variables on your server.
                Ask your developer or check <strong>Settings → Integrations</strong> for details.
              </p>

              {loadingIntegrations ? (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" /> Checking integrations…
                </div>
              ) : integrations ? (
                <div className="space-y-2">
                  {integrations.map((int) => (
                    <div key={int.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        {int.configured && int.healthy === true && (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        )}
                        {int.configured && int.healthy === false && (
                          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                        )}
                        {!int.configured && (
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="text-sm font-medium">{int.name}</span>
                      </div>
                      <Badge variant={
                        int.configured && int.healthy === true ? "default"
                        : int.configured && int.healthy === false ? "destructive"
                        : "secondary"
                      } className="text-xs">
                        {int.configured && int.healthy === true ? "Connected"
                          : int.configured && int.healthy === false ? "Error"
                          : "Not configured"}
                      </Badge>
                    </div>
                  ))}
                  <button onClick={loadIntegrations}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2">
                    <RotateCcw className="h-3 w-3" /> Refresh
                  </button>
                </div>
              ) : (
                <Button variant="outline" onClick={loadIntegrations} className="w-full">
                  Check Integration Status
                </Button>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => advance(4)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                <Button className="flex-1" onClick={handleFinish} disabled={saving}>
                  {saving
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Finishing…</>
                    : <>Finish Setup <Rocket className="ml-2 h-4 w-4" /></>}
                </Button>
              </div>
              <div className="text-center">
                <button className="text-xs text-muted-foreground underline" onClick={handleSkip} disabled={saving}>
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* ── Step 6: Done ── */}
          {step === LAST_STEP && (
            <div className="space-y-4 text-center">
              <div className="text-5xl">🎉</div>
              <h2 className="text-2xl font-bold">You&apos;re all set!</h2>
              <p className="text-muted-foreground">
                Your platform is configured and ready to use.
              </p>
              <div className="rounded-lg bg-muted/50 p-4 text-left text-sm space-y-1">
                <p className="font-medium text-sm mb-2">Need to update anything later?</p>
                <p className="text-xs text-muted-foreground">
                  Go to <strong>Settings → Branding</strong> for logo and colors, <strong>Settings → Team</strong> for
                  users, and <strong>Leads → Import</strong> to add more prospects.
                </p>
              </div>
              <Button className="w-full mt-4" onClick={() => router.push("/manager")}>
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
