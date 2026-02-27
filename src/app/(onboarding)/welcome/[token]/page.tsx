"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import type {
  OnboardingTokenResponse,
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
  Step5Data,
  OnboardingFinalData,
  TechnicalAccess,
} from "@/lib/onboarding/types";
import { DNS_PROVIDERS, CMS_PLATFORMS, COMPETITOR_PAINS } from "@/lib/onboarding/types";

// ── Step components (defined below main component) ────────────────────────────

type StepKey = "step1" | "step2" | "step3" | "step4" | "step5";

interface FormState {
  step1: Partial<Step1Data>;
  step2: Partial<Step2Data>;
  step3: Partial<Step3Data>;
  step4: Partial<Step4Data>;
  step5: Partial<Step5Data>;
}

const STEP_LABELS = [
  "Your Business",
  "Contacts",
  "Tech Access",
  "Market & Content",
  "Review",
];

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [data, setData] = useState<OnboardingTokenResponse | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState<"idle" | "saving" | "saved">("idle");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [partnerName, setPartnerName] = useState<string>("");
  const [supportEmail, setSupportEmail] = useState<string>("support@covos.app");

  const [form, setForm] = useState<FormState>({
    step1: {},
    step2: { billingSameAsPrimary: true, requiresPO: false, multiLocation: false } as Partial<Step1Data & Step2Data>,
    step3: {
      technicalAccess: {
        dns: { method: "help", status: "help_needed" },
        gbp: { hasProfile: null, status: "pending" },
        analytics: { hasGA4: null, status: "pending" },
        searchConsole: { hasIt: null, status: "pending" },
        cms: { status: "not_applicable" },
        adAccounts: { googleAds: false, meta: false, status: "not_applicable" },
      } as TechnicalAccess,
    },
    step4: {},
    step5: {},
  });

  // Load branding (support email) on mount
  useEffect(() => {
    fetch("/api/public/branding")
      .then((r) => r.json())
      .then((d) => { if (d.supportEmail) setSupportEmail(d.supportEmail); })
      .catch(() => { /* keep default */ });
  }, []);

  // Load token data on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/onboarding/${token}`);
        if (!res.ok) {
          const body = await res.json();
          setError(body.error ?? "Something went wrong.");
          setErrorCode(res.status);
          setLoading(false);
          return;
        }
        const json: OnboardingTokenResponse = await res.json();
        setData(json);
        setPartnerName(json.partnerName);
        setCurrentStep(json.token.currentStep);

        // Merge server-saved partial data + pre-fill from lead
        const serverFormData = (json.formData ?? {}) as unknown as Partial<FormState>;
        setForm((prev) => ({
          ...prev,
          step1: {
            businessName: json.lead.businessName ?? "",
            address: json.lead.address ?? "",
            city: json.lead.city ?? "",
            state: json.lead.state ?? "",
            zipCode: json.lead.zipCode ?? "",
            phone: json.lead.phone ?? "",
            website: json.lead.website ?? "",
            primaryServices: [""],
            multiLocation: false,
            ...(serverFormData.step1 ?? {}),
          },
          step2: {
            billingSameAsPrimary: true,
            requiresPO: false,
            ...(serverFormData.step2 ?? {}),
          },
          step3: {
            ...prev.step3,
            ...(serverFormData.step3 ?? {}),
          },
          step4: { ...(serverFormData.step4 ?? {}) },
          step5: { ...(serverFormData.step5 ?? {}) },
        }));

        // Also restore from localStorage as fallback
        try {
          const local = localStorage.getItem(`onboarding_${token}`);
          if (local) {
            const parsed = JSON.parse(local) as unknown as Partial<FormState>;
            setForm((prev) => ({ ...prev, ...parsed }));
          }
        } catch { /* ignore */ }
      } catch {
        setError("Failed to load onboarding form. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  // Auto-save to localStorage on any form change
  useEffect(() => {
    if (!data) return;
    try {
      localStorage.setItem(`onboarding_${token}`, JSON.stringify(form));
    } catch { /* ignore */ }
  }, [form, token, data]);

  // Update a step's data
  const updateStep = useCallback(<K extends StepKey>(step: K, patch: Partial<FormState[K]>) => {
    setForm((prev) => ({
      ...prev,
      [step]: { ...prev[step], ...patch },
    }));
  }, []);

  // Save current step to server
  const saveToServer = useCallback(async (step: number, stepData: unknown) => {
    setSaveIndicator("saving");
    try {
      await fetch(`/api/onboarding/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, data: stepData }),
      });
      setSaveIndicator("saved");
      setTimeout(() => setSaveIndicator("idle"), 2000);
    } catch {
      setSaveIndicator("idle");
    }
  }, [token]);

  // Navigate between steps
  const goNext = useCallback(async () => {
    const stepKey = `step${currentStep}` as StepKey;
    setSaving(true);
    await saveToServer(currentStep, form[stepKey]);
    setSaving(false);
    setCurrentStep((s) => Math.min(s + 1, 5));
    window.scrollTo(0, 0);
  }, [currentStep, form, saveToServer]);

  const goBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo(0, 0);
  }, []);

  // Final submit
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const finalData: OnboardingFinalData = {
        step1: form.step1 as Step1Data,
        step2: form.step2 as Step2Data,
        step3: form.step3 as Step3Data,
        step4: form.step4 as Step4Data,
        step5: form.step5 as Step5Data,
      };
      const res = await fetch(`/api/onboarding/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalData }),
      });
      if (!res.ok) {
        const body = await res.json();
        alert(body.error ?? "Submission failed. Please try again.");
        return;
      }
      localStorage.removeItem(`onboarding_${token}`);
      setSubmitted(true);
    } catch {
      alert("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }, [form, token]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading your onboarding...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorScreen errorCode={errorCode} expiredToken={token} supportEmail={supportEmail} />;
  }

  if (submitted) {
    return <ConfirmationScreen businessName={data?.lead.businessName ?? ""} partnerName={partnerName} supportEmail={supportEmail} />;
  }

  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg mb-3">
            <span className="text-white font-bold text-sm">GHM</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Welcome, {data?.lead.businessName}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Let&apos;s get your SEO campaign started. This takes about 10 minutes.
          </p>
        </div>

        {/* Progress Steps */}
        <StepProgress current={currentStep} labels={STEP_LABELS} />

        {/* Save indicator */}
        <div className="text-right mb-2 h-4">
          {saveIndicator === "saving" && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
          {saveIndicator === "saved" && (
            <span className="text-xs text-status-success">Saved ✓</span>
          )}
        </div>

        {/* Step Card */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6">
          {currentStep === 1 && (
            <Step1
              data={form.step1}
              onChange={(patch) => updateStep("step1", patch)}
              onNext={goNext}
              saving={saving}
            />
          )}
          {currentStep === 2 && (
            <Step2
              data={form.step2}
              onChange={(patch) => updateStep("step2", patch)}
              onNext={goNext}
              onBack={goBack}
              saving={saving}
            />
          )}
          {currentStep === 3 && (
            <Step3
              data={form.step3}
              onChange={(patch) => updateStep("step3", patch)}
              onNext={goNext}
              onBack={goBack}
              saving={saving}
            />
          )}
          {currentStep === 4 && (
            <Step4
              data={form.step4}
              onChange={(patch) => updateStep("step4", patch)}
              onNext={goNext}
              onBack={goBack}
              saving={saving}
            />
          )}
          {currentStep === 5 && (
            <Step5Review
              form={form}
              onEdit={(step) => setCurrentStep(step)}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Your progress is saved automatically. You can close this and come back anytime.
        </p>
      </div>
    </div>
  );
}

// ── StepProgress ──────────────────────────────────────────────────────────────

function StepProgress({ current, labels }: { current: number; labels: string[] }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {labels.map((label, i) => {
          const step = i + 1;
          const done = step < current;
          const active = step === current;
          return (
            <div key={step} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {i > 0 && (
                  <div className={`h-0.5 flex-1 ${done ? "bg-blue-600" : "bg-secondary"}`} />
                )}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0
                    ${done ? "bg-blue-600 text-white" : active ? "bg-blue-600 text-white ring-2 ring-blue-200" : "bg-secondary text-muted-foreground"}`}
                >
                  {done ? "✓" : step}
                </div>
                {i < labels.length - 1 && (
                  <div className={`h-0.5 flex-1 ${step < current ? "bg-blue-600" : "bg-secondary"}`} />
                )}
              </div>
      <span className={`text-xs mt-1 text-center hidden sm:block ${active ? "text-blue-600 font-medium" : "text-muted-foreground"}`}>
                {label}
              </span>
              <span className={`text-[10px] mt-1 text-center sm:hidden ${active ? "text-blue-600 font-medium" : "text-muted-foreground"}`}>
                {label.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-foreground mb-1">
        {label} {required && <span className="text-status-danger">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: {
  value?: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value?: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
    />
  );
}

function RadioGroup<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[];
  value?: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5">
            <input
              type="radio"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
              ${value === opt.value ? "border-blue-600 bg-blue-600" : "border-border group-hover:border-blue-400"}`}>
              {value === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-card" />}
            </div>
          </div>
          <span className="text-sm text-foreground">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

function NavButtons({
  onNext, onBack, saving, nextLabel = "Save & Continue",
}: {
  onNext?: () => void; onBack?: () => void; saving?: boolean; nextLabel?: string;
}) {
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-6 pt-4 border-t border-border">
      {onBack ? (
        <button onClick={onBack} className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg sm:border-0">
          ← Back
        </button>
      ) : <div />}
      {onNext && (
        <button
          onClick={onNext}
          disabled={saving}
          className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : nextLabel + " →"}
        </button>
      )}
    </div>
  );
}

function SectionBadge({ level }: { level: "REQUIRED" | "RECOMMENDED" | "OPTIONAL" }) {
  const colors = {
    REQUIRED: "bg-status-danger-bg text-status-danger border-status-danger-border",
    RECOMMENDED: "bg-status-warning-bg text-status-warning border-status-warning-border",
    OPTIONAL: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${colors[level]}`}>
      {level}
    </span>
  );
}

// ── Step 1: Business Identity ─────────────────────────────────────────────────

function Step1({
  data, onChange, onNext, saving,
}: {
  data: Partial<Step1Data>;
  onChange: (patch: Partial<Step1Data>) => void;
  onNext: () => void;
  saving?: boolean;
}) {
  const addService = () => {
    const services = [...(data.primaryServices ?? [""])];
    if (services.length < 5) services.push("");
    onChange({ primaryServices: services });
  };

  const updateService = (i: number, val: string) => {
    const services = [...(data.primaryServices ?? [""])];
    services[i] = val;
    onChange({ primaryServices: services });
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-1">Step 1: Your Business</h2>
      <p className="text-sm text-muted-foreground mb-5">We&apos;ve pre-filled what we know. Please confirm or correct.</p>

      <Field label="Business Name" required>
        <Input value={data.businessName} onChange={(v) => onChange({ businessName: v })} />
      </Field>

      <Field label="Address" required>
        <Input value={data.address} onChange={(v) => onChange({ address: v })} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="col-span-1">
          <label className="block text-sm font-medium text-foreground mb-1">City <span className="text-status-danger">*</span></label>
          <Input value={data.city} onChange={(v) => onChange({ city: v })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">State <span className="text-status-danger">*</span></label>
          <Input value={data.state} onChange={(v) => onChange({ state: v })} placeholder="CA" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">ZIP <span className="text-status-danger">*</span></label>
          <Input value={data.zipCode} onChange={(v) => onChange({ zipCode: v })} />
        </div>
      </div>

      <Field label="Phone" required>
        <Input value={data.phone} onChange={(v) => onChange({ phone: v })} type="tel" />
      </Field>

      <Field label="Website">
        <Input value={data.website} onChange={(v) => onChange({ website: v })} placeholder="https://yourbusiness.com" />
      </Field>

      <Field label="Brief description of your business">
        <Textarea
          value={data.businessDescription}
          onChange={(v) => onChange({ businessDescription: v })}
          placeholder="e.g. Family-owned plumbing company serving the greater Los Angeles area since 1998."
        />
      </Field>

      <Field label="Top services or products (up to 5)">
        <div className="space-y-2">
          {(data.primaryServices ?? [""]).map((svc, i) => (
            <Input
              key={i}
              value={svc}
              onChange={(v) => updateService(i, v)}
              placeholder={`Service ${i + 1}`}
            />
          ))}
          {(data.primaryServices ?? [""]).length < 5 && (
            <button
              onClick={addService}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              + Add another
            </button>
          )}
        </div>
      </Field>

      <Field label="Service areas">
        <Textarea
          value={data.serviceAreas}
          onChange={(v) => onChange({ serviceAreas: v })}
          placeholder="e.g. Los Angeles, Burbank, Glendale, Pasadena"
          rows={2}
        />
      </Field>

      <Field label="Multiple locations?">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!data.multiLocation}
              onChange={() => onChange({ multiLocation: false, locationCount: undefined })}
              className="text-blue-600"
            />
            <span className="text-sm">No</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!!data.multiLocation}
              onChange={() => onChange({ multiLocation: true })}
              className="text-blue-600"
            />
            <span className="text-sm">Yes</span>
          </label>
          {data.multiLocation && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">How many?</span>
              <input
                type="number"
                min={2}
                value={data.locationCount ?? ""}
                onChange={(e) => onChange({ locationCount: parseInt(e.target.value) })}
                className="w-16 rounded border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </Field>

      <NavButtons onNext={onNext} saving={saving} />
    </div>
  );
}

// ── Step 2: Contacts ──────────────────────────────────────────────────────────

function Step2({
  data, onChange, onNext, onBack, saving,
}: {
  data: Partial<Step2Data>;
  onChange: (patch: Partial<Step2Data>) => void;
  onNext: () => void;
  onBack: () => void;
  saving?: boolean;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-1">Step 2: Your Contacts</h2>
      <p className="text-sm text-muted-foreground mb-5">Who should we talk to about your campaign?</p>

      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
          Primary Contact <span className="text-muted-foreground normal-case font-normal">(day-to-day communication)</span>
        </h3>
        <Field label="Full Name" required>
          <Input value={data.primaryContactName} onChange={(v) => onChange({ primaryContactName: v })} />
        </Field>
        <Field label="Title / Role">
          <Input value={data.primaryContactTitle} onChange={(v) => onChange({ primaryContactTitle: v })} placeholder="e.g. Owner, Marketing Manager" />
        </Field>
        <Field label="Email" required>
          <Input value={data.primaryContactEmail} onChange={(v) => onChange({ primaryContactEmail: v })} type="email" />
        </Field>
        <Field label="Phone" required>
          <Input value={data.primaryContactPhone} onChange={(v) => onChange({ primaryContactPhone: v })} type="tel" />
        </Field>
        <Field label="Preferred contact method">
          <div className="flex gap-4">
            {(["email", "phone", "text"] as const).map((m) => (
              <label key={m} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={data.preferredContactMethod === m}
                  onChange={() => onChange({ preferredContactMethod: m })}
                  className="text-blue-600"
                />
                <span className="text-sm capitalize">{m}</span>
              </label>
            ))}
          </div>
        </Field>
      </div>

      <div className="border-t border-border pt-5 mb-5">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">Billing Contact</h3>
        <label className="flex items-center gap-2 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={!!data.billingSameAsPrimary}
            onChange={(e) => onChange({ billingSameAsPrimary: e.target.checked })}
            className="rounded border-border text-blue-600"
          />
          <span className="text-sm text-foreground">Same as primary contact</span>
        </label>
        {!data.billingSameAsPrimary && (
          <>
            <Field label="Billing Name">
              <Input value={data.billingContactName} onChange={(v) => onChange({ billingContactName: v })} />
            </Field>
            <Field label="Billing Email">
              <Input value={data.billingContactEmail} onChange={(v) => onChange({ billingContactEmail: v })} type="email" />
            </Field>
            <Field label="Billing Phone">
              <Input value={data.billingContactPhone} onChange={(v) => onChange({ billingContactPhone: v })} type="tel" />
            </Field>
          </>
        )}
        <Field label="Payment method preference">
          <RadioGroup
            options={[
              { value: "ach", label: "ACH / Bank Transfer" },
              { value: "credit_card", label: "Credit Card" },
              { value: "check", label: "Check" },
            ]}
            value={data.paymentMethod as "ach" | "credit_card" | "check" | undefined}
            onChange={(v) => onChange({ paymentMethod: v })}
          />
        </Field>
        <Field label="Does your company require a PO number?">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={!data.requiresPO} onChange={() => onChange({ requiresPO: false, poNumber: undefined })} className="text-blue-600" />
              <span className="text-sm">No</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={!!data.requiresPO} onChange={() => onChange({ requiresPO: true })} className="text-blue-600" />
              <span className="text-sm">Yes</span>
            </label>
          </div>
          {data.requiresPO && (
            <div className="mt-2">
              <Input value={data.poNumber} onChange={(v) => onChange({ poNumber: v })} placeholder="PO Number" />
            </div>
          )}
        </Field>
      </div>

      <NavButtons onNext={onNext} onBack={onBack} saving={saving} />
    </div>
  );
}

// ── Step 3: Technical Access ──────────────────────────────────────────────────

function Step3({
  data, onChange, onNext, onBack, saving,
}: {
  data: Partial<Step3Data>;
  onChange: (patch: Partial<Step3Data>) => void;
  onNext: () => void;
  onBack: () => void;
  saving?: boolean;
}) {
  const ta = data.technicalAccess ?? {} as TechnicalAccess;

  const updateTA = (patch: Partial<TechnicalAccess>) => {
    onChange({ technicalAccess: { ...ta, ...patch } });
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-1">Step 3: Technical Access</h2>
      <p className="text-sm text-muted-foreground mb-5">
        We need a few things to start working on your campaign. Pick whichever option is easiest.
        Not sure about something? Just pick &ldquo;I need help.&rdquo;
      </p>

      {/* DNS */}
      <div className="border border-border rounded-lg p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">DNS Access</h3>
            <p className="text-xs text-muted-foreground mt-0.5">How we connect your website to the infrastructure we build.</p>
          </div>
          <SectionBadge level="REQUIRED" />
        </div>
        <Field label="Who hosts your domain?">
          <select
            value={ta.dns?.provider ?? ""}
            onChange={(e) => updateTA({ dns: { ...ta.dns, provider: e.target.value, method: ta.dns?.method ?? "help", status: ta.dns?.status ?? "pending" } })}
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {DNS_PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <p className="text-sm font-medium text-foreground mb-2">How would you like to give us access?</p>
        <RadioGroup
          options={[
            { value: "invite", label: "I'll add GHM as an authorized user — we'll send simple instructions" },
            { value: "credentials", label: "I'll share credentials securely — your GHM contact will collect these by phone or secure share" },
            { value: "help", label: "I need help with this — no problem, we'll walk you through it" },
          ]}
          value={ta.dns?.method as "invite" | "credentials" | "help" | undefined}
          onChange={(v) => updateTA({ dns: { ...ta.dns, method: v, provider: ta.dns?.provider, status: v === "help" ? "help_needed" : "pending" } })}
        />
      </div>

      {/* GBP */}
      <div className="border border-border rounded-lg p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Google Business Profile</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Your listing on Google Maps and local search.</p>
          </div>
          <SectionBadge level="REQUIRED" />
        </div>
        <p className="text-sm font-medium text-foreground mb-2">Do you have a Google Business Profile?</p>
        <div className="flex gap-4 mb-3">
          {([{ v: true, l: "Yes" }, { v: false, l: "No" }, { v: null, l: "Not sure" }] as const).map(({ v, l }) => (
            <label key={l} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={ta.gbp?.hasProfile === v}
                onChange={() => updateTA({ gbp: { ...ta.gbp, hasProfile: v, status: v === false ? "not_applicable" : "pending" } })}
                className="text-blue-600"
              />
              <span className="text-sm">{l}</span>
            </label>
          ))}
        </div>
        {ta.gbp?.hasProfile === true ? (
          <RadioGroup
            options={[
              { value: "invite", label: "I'll add GHM as a manager (preferred)" },
              { value: "credentials", label: "I'll share credentials securely" },
              { value: "help", label: "I need help" },
            ]}
            value={ta.gbp?.method as "invite" | "credentials" | "help" | undefined}
            onChange={(v) => updateTA({ gbp: { ...ta.gbp, hasProfile: true, method: v, status: v === "help" ? "help_needed" : "pending" } })}
          />
        ) : ta.gbp?.hasProfile === false || ta.gbp?.hasProfile === null ? (
          <p className="text-sm text-muted-foreground bg-muted rounded p-3">
            No worries — we can set one up or help you find your existing profile.
          </p>
        ) : null}
      </div>

      {/* Analytics */}
      <div className="border border-border rounded-lg p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-sm font-semibold text-foreground">Google Analytics (GA4)</h3>
          <SectionBadge level="RECOMMENDED" />
        </div>
        <div className="flex gap-4 mb-3">
          {([{ v: true, l: "Yes" }, { v: false, l: "No" }, { v: null, l: "Not sure" }] as const).map(({ v, l }) => (
            <label key={l} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={ta.analytics?.hasGA4 === v}
                onChange={() => updateTA({ analytics: { ...ta.analytics, hasGA4: v, status: "pending" } })}
                className="text-blue-600"
              />
              <span className="text-sm">{l}</span>
            </label>
          ))}
        </div>
        {ta.analytics?.hasGA4 === true ? (
          <RadioGroup
            options={[
              { value: "invite", label: "I'll add GHM as a user (preferred)" },
              { value: "credentials", label: "I'll share credentials securely" },
              { value: "help", label: "I need help" },
            ]}
            value={ta.analytics?.method as "invite" | "credentials" | "help" | undefined}
            onChange={(v) => updateTA({ analytics: { ...ta.analytics, hasGA4: true, method: v, status: v === "help" ? "help_needed" : "pending" } })}
          />
        ) : (ta.analytics?.hasGA4 === false || ta.analytics?.hasGA4 === null) ? (
          <p className="text-sm text-muted-foreground bg-muted rounded p-3">No problem — we&apos;ll set it up for you.</p>
        ) : null}
      </div>

      {/* CMS */}
      <div className="border border-border rounded-lg p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-sm font-semibold text-foreground">Website CMS</h3>
          <SectionBadge level="OPTIONAL" />
        </div>
        <Field label="What platform is your website on?">
          <select
            value={ta.cms?.platform ?? ""}
            onChange={(e) => updateTA({ cms: { ...ta.cms, platform: e.target.value, status: "pending" } })}
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {CMS_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        {ta.cms?.platform && (
          <RadioGroup
            options={[
              { value: "invite", label: "Yes — I'll create a login for GHM" },
              { value: "not_now", label: "Not right now" },
            ]}
            value={ta.cms?.method as "invite" | "not_now" | undefined}
            onChange={(v) => updateTA({ cms: { ...ta.cms, method: v, status: v === "invite" ? "pending" : "not_applicable" } })}
          />
        )}
      </div>

      {/* Ad Accounts */}
      <div className="border border-border rounded-lg p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-sm font-semibold text-foreground">Ad Accounts</h3>
          <SectionBadge level="OPTIONAL" />
        </div>
        <div className="flex gap-4 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!ta.adAccounts?.googleAds}
              onChange={(e) => updateTA({ adAccounts: { ...ta.adAccounts, googleAds: e.target.checked, meta: ta.adAccounts?.meta ?? false, status: "pending" } })}
              className="rounded border-border text-blue-600"
            />
            <span className="text-sm">Google Ads</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!ta.adAccounts?.meta}
              onChange={(e) => updateTA({ adAccounts: { ...ta.adAccounts, meta: e.target.checked, googleAds: ta.adAccounts?.googleAds ?? false, status: "pending" } })}
              className="rounded border-border text-blue-600"
            />
            <span className="text-sm">Meta / Facebook</span>
          </label>
        </div>
        {(ta.adAccounts?.googleAds || ta.adAccounts?.meta) && (
          <RadioGroup
            options={[
              { value: "invite", label: "Send me instructions to add GHM" },
              { value: "not_now", label: "Not right now" },
            ]}
            value={ta.adAccounts?.method as "invite" | "not_now" | undefined}
            onChange={(v) => updateTA({ adAccounts: { ...ta.adAccounts, googleAds: ta.adAccounts?.googleAds ?? false, meta: ta.adAccounts?.meta ?? false, method: v, status: v === "not_now" ? "not_applicable" : "pending" } })}
          />
        )}
      </div>

      <NavButtons onNext={onNext} onBack={onBack} saving={saving} />
    </div>
  );
}

// ── Step 4: Market & Content ──────────────────────────────────────────────────

function Step4({
  data, onChange, onNext, onBack, saving,
}: {
  data: Partial<Step4Data>;
  onChange: (patch: Partial<Step4Data>) => void;
  onNext: () => void;
  onBack: () => void;
  saving?: boolean;
}) {
  const competitors = data.competitors ?? [""];
  const pains = data.competitorPains ?? [];

  const addCompetitor = () => {
    if (competitors.length < 5) onChange({ competitors: [...competitors, ""] });
  };
  const updateCompetitor = (i: number, val: string) => {
    const next = [...competitors];
    next[i] = val;
    onChange({ competitors: next });
  };
  const togglePain = (pain: string) => {
    const next = pains.includes(pain) ? pains.filter((p) => p !== pain) : [...pains, pain];
    onChange({ competitorPains: next });
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-1">Step 4: Your Market & Content</h2>
      <p className="text-sm text-muted-foreground mb-5">Help us understand your competitive landscape and content preferences.</p>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-1">Competitors</h3>
        <p className="text-xs text-muted-foreground mb-3">Who are your top competitors online? We&apos;ll run our own research too — this just tells us who you&apos;re watching.</p>
        <div className="space-y-2 mb-2">
          {competitors.map((c, i) => (
            <Input
              key={i}
              value={c}
              onChange={(v) => updateCompetitor(i, v)}
              placeholder={`Competitor ${i + 1} (name or website)`}
            />
          ))}
        </div>
        {competitors.length < 5 && (
          <button onClick={addCompetitor} className="text-sm text-blue-600 hover:text-blue-700">
            + Add another
          </button>
        )}
      </div>

      <div className="mb-6">
        <p className="text-sm font-medium text-foreground mb-2">Where are they beating you? (Check all that apply)</p>
        <div className="space-y-2">
          {COMPETITOR_PAINS.map((pain) => (
            <label key={pain} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={pains.includes(pain)}
                onChange={() => togglePain(pain)}
                className="mt-0.5 rounded border-border text-blue-600"
              />
              <span className="text-sm text-foreground">{pain}</span>
            </label>
          ))}
        </div>
      </div>

      <Field label="Anything else about their online presence that frustrates you?">
        <Textarea
          value={data.competitorNotes}
          onChange={(v) => onChange({ competitorNotes: v })}
          placeholder="Optional — anything you've noticed"
        />
      </Field>

      <div className="border-t border-border pt-5 mb-5">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">Content Preferences</h3>
        <Field label="Topics we should focus on">
          <Textarea
            value={data.contentFocusTopics}
            onChange={(v) => onChange({ contentFocusTopics: v })}
            placeholder='e.g. "emergency plumbing," "bathroom remodels," "water heater installation"'
          />
        </Field>
        <Field label="Topics to avoid">
          <Textarea
            value={data.contentAvoidTopics}
            onChange={(v) => onChange({ contentAvoidTopics: v })}
            placeholder='e.g. "we don&apos;t do commercial work"'
          />
        </Field>
        <Field label="What tone fits your brand?">
          <RadioGroup
            options={[
              { value: "professional", label: "Professional / corporate" },
              { value: "friendly", label: "Friendly / approachable" },
              { value: "authoritative", label: "Authoritative / expert" },
              { value: "casual", label: "Casual / conversational" },
              { value: "match_existing", label: "Match what's on our existing website" },
              { value: "no_preference", label: "No preference — you decide" },
            ]}
            value={data.tonePreference}
            onChange={(v) => onChange({ tonePreference: v })}
          />
        </Field>
        <Field label="How would you like to handle content?">
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-transparent hover:border-blue-200 hover:bg-blue-50">
              <input
                type="radio"
                checked={data.contentReviewPref === "publish_and_notify"}
                onChange={() => onChange({ contentReviewPref: "publish_and_notify" })}
                className="mt-0.5 text-blue-600"
              />
              <div>
                <p className="text-sm font-medium text-foreground">GHM publishes based on strategy, then notifies me</p>
                <p className="text-xs text-muted-foreground">Recommended — fastest results</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-transparent hover:border-blue-200 hover:bg-blue-50">
              <input
                type="radio"
                checked={data.contentReviewPref === "review_before_publish"}
                onChange={() => onChange({ contentReviewPref: "review_before_publish" })}
                className="mt-0.5 text-blue-600"
              />
              <div>
                <p className="text-sm font-medium text-foreground">Send content to me for review before publishing</p>
                <p className="text-xs text-muted-foreground">Slower timeline</p>
              </div>
            </label>
          </div>
        </Field>
      </div>

      <NavButtons onNext={onNext} onBack={onBack} saving={saving} />
    </div>
  );
}

// ── Step 5: Review & Submit ───────────────────────────────────────────────────

function Step5Review({
  form, onEdit, onSubmit, submitting,
}: {
  form: FormState;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const { step1, step2, step3, step4 } = form;
  const ta = step3.technicalAccess;

  const ReviewSection = ({ title, step, children }: { title: string; step: number; children: React.ReactNode }) => (
    <div className="border border-border rounded-lg p-4 mb-3">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-status-success shrink-0" />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <button onClick={() => onEdit(step)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
          Edit
        </button>
      </div>
      <div className="text-sm text-muted-foreground space-y-0.5">{children}</div>
    </div>
  );

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-1">Step 5: Review & Submit</h2>
      <p className="text-sm text-muted-foreground mb-5">Here&apos;s everything you&apos;ve provided. Click any section to make changes.</p>

      <ReviewSection title="Your Business" step={1}>
        <p className="font-medium text-foreground">{step1.businessName}</p>
        <p>{[step1.address, step1.city, step1.state, step1.zipCode].filter(Boolean).join(", ")}</p>
        {step1.phone && <p>{step1.phone}</p>}
        {step1.website && <p className="text-blue-600">{step1.website}</p>}
      </ReviewSection>

      <ReviewSection title="Primary Contact" step={2}>
        <p className="font-medium text-foreground">{step2.primaryContactName}{step2.primaryContactTitle ? `, ${step2.primaryContactTitle}` : ""}</p>
        {step2.primaryContactEmail && <p>{step2.primaryContactEmail}</p>}
        {step2.preferredContactMethod && <p>Prefers {step2.preferredContactMethod}</p>}
      </ReviewSection>

      <ReviewSection title="Technical Access" step={3}>
        {ta?.dns && <p>DNS: {ta.dns.provider ?? "Unknown provider"} — {ta.dns.method === "help" ? "needs help" : ta.dns.method === "invite" ? "will send invite" : "will share credentials"}</p>}
        {ta?.gbp && <p>GBP: {ta.gbp.hasProfile === false ? "Will create" : ta.gbp.method === "invite" ? "Will add GHM as manager" : ta.gbp.method === "help" ? "Needs help" : "Will share credentials"}</p>}
        {ta?.cms?.platform && <p>CMS: {ta.cms.platform}{ta.cms.method === "not_now" ? " — not right now" : " — will create login"}</p>}
      </ReviewSection>

      <ReviewSection title="Market & Content" step={4}>
        {step4.competitors?.filter(Boolean).length ? (
          <p>Competitors: {step4.competitors.filter(Boolean).join(", ")}</p>
        ) : null}
        {step4.tonePreference && <p>Tone: {step4.tonePreference.replace(/_/g, " ")}</p>}
        {step4.contentReviewPref && <p>{step4.contentReviewPref === "publish_and_notify" ? "Publish and notify me" : "Review before publishing"}</p>}
      </ReviewSection>

      <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 mt-4">
        <p className="text-xs text-muted-foreground mb-3">
          By submitting, you confirm the information above is accurate and authorize GHM Digital to begin work on your SEO campaign.
        </p>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
        >
          {submitting ? "Submitting..." : "Submit & Get Started"}
        </button>
      </div>
    </div>
  );
}

// ── Confirmation Screen ───────────────────────────────────────────────────────

function ConfirmationScreen({ businessName, partnerName, supportEmail }: { businessName: string; partnerName: string; supportEmail: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg mb-6">
          <span className="text-white font-bold text-sm">GHM</span>
        </div>
        <CheckCircle2 className="h-16 w-16 text-status-success mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">You&apos;re all set, {businessName}.</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Our operations team has everything they need to get started. Here&apos;s what happens next:
        </p>
        <div className="text-left space-y-3 mb-6">
          {[
            "We'll reach out within 24 hours to collect any access items that need a walkthrough",
            "Your competitive intelligence audit kicks off immediately",
            "You'll receive your first strategy report within 2 weeks",
          ].map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-foreground">{item}</p>
            </div>
          ))}
        </div>
        {partnerName && (
          <p className="text-sm text-muted-foreground">
            Questions? Contact your GHM rep: <span className="font-medium text-foreground">{partnerName}</span>
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">Or reach us at <a href={`mailto:${supportEmail}`} className="underline underline-offset-2">{supportEmail}</a></p>
      </div>
    </div>
  );
}

// ── Error Screen ─────────────────────────────────────────────────────────────

function ErrorScreen({ errorCode, expiredToken, supportEmail }: { errorCode: number | null; expiredToken: string; supportEmail: string }) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch("/api/onboarding/refresh-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiredToken }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setRefreshed(true);
        // Redirect to new token URL after brief delay
        setTimeout(() => {
          window.location.href = `/welcome/${data.token}`;
        }, 1500);
      } else {
        setRefreshError(data.error ?? "Failed to refresh link. Please contact your GHM representative.");
      }
    } catch {
      setRefreshError("Network error. Please check your connection and try again.");
    } finally {
      setRefreshing(false);
    }
  };

  // Already submitted — show a friendly done screen, not an error
  if (errorCode === 409) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg mb-4">
            <span className="text-white font-bold text-sm">GHM</span>
          </div>
          <CheckCircle2 className="h-16 w-16 text-status-success mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-foreground mb-2">Already submitted!</h1>
          <p className="text-muted-foreground text-sm">
            Your onboarding form has already been received. Our operations team is getting everything set up for you.
          </p>
          <p className="text-muted-foreground text-xs mt-4">
            Questions? Reach us at <a href={`mailto:${supportEmail}`} className="underline underline-offset-2">{supportEmail}</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg mb-4">
          <span className="text-white font-bold text-sm">GHM</span>
        </div>
        {errorCode === 410
              ? <Clock className="h-16 w-16 text-status-warning mx-auto mb-4" />
              : <XCircle className="h-16 w-16 text-status-error mx-auto mb-4" />}
        <h1 className="text-lg font-semibold text-foreground mb-2">
          {errorCode === 410 ? "This link has expired" : "Invalid link"}
        </h1>
        <p className="text-muted-foreground text-sm mb-5">
          {errorCode === 410
            ? "Onboarding links are valid for 30 days. This one has passed that window."
            : "This onboarding link isn't valid. Please use the link your GHM representative sent you."}
        </p>

        {errorCode === 410 && (
          <>
            {refreshed ? (
              <div className="bg-status-success-bg border border-status-success-border rounded-lg p-3 mb-4">
                <p className="text-sm text-status-success font-medium">Link generated — redirecting...</p>
              </div>
            ) : (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed mb-3"
              >
                {refreshing ? "Generating new link..." : "Request a fresh link"}
              </button>
            )}
            {refreshError && (
              <p className="text-sm text-status-danger mb-3">{refreshError}</p>
            )}
          </>
        )}

        <p className="text-muted-foreground text-xs">
          Need help? Contact us at <a href={`mailto:${supportEmail}`} className="underline underline-offset-2">{supportEmail}</a>
        </p>
      </div>
    </div>
  );
}
