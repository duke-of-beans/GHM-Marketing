"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2, ChevronRight, ChevronLeft, MapPin,
  FileText, MonitorPlay, BookOpen, DollarSign, Target, Rocket,
  ExternalLink, Building2, Loader2, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Territory { id: number; name: string; }

interface Props {
  userName: string;
  currentStep: number;
  territory: Territory | null;
  positionType: string;           // "sales" | "management" | "operations" | "contractor"
  positionName: string | null;
  role: string;
  hasContractorEntity: boolean;
}

// Step IDs — order varies by position type
type StepId = "welcome" | "profile" | "contractor" | "territory" | "tools" | "first_lead" | "resources" | "scope" | "done";

function getSteps(positionType: string): StepId[] {
  if (positionType === "sales") {
    return ["welcome", "profile", "contractor", "territory", "tools", "first_lead", "resources", "done"];
  }
  if (positionType === "management") {
    return ["welcome", "profile", "contractor", "scope", "tools", "done"];
  }
  // operations / contractor / default
  return ["welcome", "profile", "contractor", "scope", "tools", "done"];
}

function StepCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("border-0 shadow-lg", className)}>
      <CardContent className="p-6 space-y-4">{children}</CardContent>
    </Card>
  );
}
export function OnboardingWizard({
  userName, currentStep, territory, positionType, positionName, role, hasContractorEntity,
}: Props) {
  const router = useRouter();
  const steps = getSteps(positionType);
  const TOTAL = steps.length;
  const [stepIndex, setStepIndex] = useState(Math.min(Math.max(0, currentStep), TOTAL - 1));
  const [saving, setSaving] = useState(false);

  // Contractor entity form state
  const [contractorEntityName, setContractorEntityName] = useState("");
  const [contractorEmail, setContractorEmail] = useState("");
  const [savingContractor, setSavingContractor] = useState(false);
  const [contractorSaved, setContractorSaved] = useState(hasContractorEntity);

  const firstName = userName.split(" ")[0];
  const progress = Math.round((stepIndex / (TOTAL - 1)) * 100);
  const currentStepId = steps[stepIndex];

  async function saveProgress(nextIndex: number, complete = false) {
    setSaving(true);
    try {
      await fetch("/api/users/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: nextIndex, completed: complete }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function advance() {
    const next = stepIndex + 1;
    if (next >= TOTAL) {
      await saveProgress(TOTAL, true);
      router.push(role === "sales" ? "/sales" : "/manager");
      return;
    }
    await saveProgress(next);
    setStepIndex(next);
  }

  function back() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  async function saveContractorEntity() {
    if (!contractorEntityName.trim()) {
      toast.error("Entity name is required");
      return;
    }
    setSavingContractor(true);
    try {
      const res = await fetch("/api/users/onboarding/contractor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractorEntityName: contractorEntityName.trim(), contractorEmail: contractorEmail.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setContractorSaved(true);
      toast.success("Entity saved — your manager will complete Wave setup");
    } catch {
      toast.error("Failed to save contractor info");
    } finally {
      setSavingContractor(false);
    }
  }

  const isLastStep = stepIndex === TOTAL - 1;

  return (
    <div className="w-full max-w-lg">
      <div className="mb-6 space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Step {stepIndex + 1} of {TOTAL}</span>
          <div className="flex items-center gap-3">
            <span>{progress}% complete</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-3 w-3" />
              Sign out
            </button>
          </div>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {currentStepId === "welcome" && <StepWelcome firstName={firstName} positionName={positionName} positionType={positionType} />}
      {currentStepId === "profile" && <StepProfile firstName={firstName} />}
      {currentStepId === "contractor" && (
        <StepContractor
          positionType={positionType}
          contractorEntityName={contractorEntityName}
          setContractorEntityName={setContractorEntityName}
          contractorEmail={contractorEmail}
          setContractorEmail={setContractorEmail}
          onSave={saveContractorEntity}
          saving={savingContractor}
          saved={contractorSaved}
        />
      )}
      {currentStepId === "territory" && <StepTerritory territory={territory} />}
      {currentStepId === "tools" && <StepTools positionType={positionType} />}
      {currentStepId === "first_lead" && <StepFirstLead />}
      {currentStepId === "resources" && <StepResources />}
      {currentStepId === "scope" && <StepScope positionType={positionType} positionName={positionName} />}
      {currentStepId === "done" && <StepDone firstName={firstName} positionType={positionType} />}

      <div className="flex justify-between mt-6">
        {stepIndex > 0 ? (
          <Button variant="ghost" size="sm" onClick={back} disabled={saving}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        ) : <div />}
        <div className="flex items-center gap-2">
          {!isLastStep && (
            <Button variant="ghost" size="sm" onClick={advance} disabled={saving} className="text-muted-foreground">
              Skip
            </Button>
          )}
          <Button onClick={advance} disabled={saving} className="min-w-[120px]">
            {saving ? "Saving..." : isLastStep ? "Let's go →" : (
              <>{stepIndex === 0 ? "Get started" : "Continue"}<ChevronRight className="h-4 w-4 ml-1" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Step Components ─────────────────────────────────────────────────────────

function StepWelcome({ firstName, positionName, positionType }: { firstName: string; positionName: string | null; positionType: string }) {
  const isSales = positionType === "sales";
  const highlights = isSales
    ? [{ icon: "🎯", label: "Your territory" }, { icon: "🛠️", label: "Your tools" }, { icon: "💰", label: "Your earnings" }]
    : [{ icon: "📋", label: "Your role" }, { icon: "🛠️", label: "Your tools" }, { icon: "🏢", label: "Contractor setup" }];
  return (
    <StepCard>
      <div className="text-center space-y-3">
        <div className="text-5xl">👋</div>
        <h1 className="text-2xl font-bold">Hey {firstName}, welcome to GHM.</h1>
        <p className="text-muted-foreground">
          You&apos;re joining as{positionName ? ` a ${positionName}` : " part of the team"}. This takes about 3 minutes — setup, tools, and you&apos;re live.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 pt-2">
        {highlights.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/50 text-center">
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </StepCard>
  );
}

function StepProfile({ firstName }: { firstName: string }) {
  return (
    <StepCard>
      <h2 className="text-xl font-bold">Profile Looks Good</h2>
      <p className="text-muted-foreground text-sm">
        Your account was set up by your admin — name, email, and role are already configured. If anything looks wrong, reach out to your manager.
      </p>
      <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
        <p className="font-semibold">{firstName}</p>
        <p className="text-muted-foreground">If you need to update your name, phone, or contact preferences, head to Settings → Profile after setup.</p>
      </div>
    </StepCard>
  );
}

function StepContractor({
  positionType, contractorEntityName, setContractorEntityName,
  contractorEmail, setContractorEmail, onSave, saving, saved,
}: {
  positionType: string;
  contractorEntityName: string; setContractorEntityName: (v: string) => void;
  contractorEmail: string; setContractorEmail: (v: string) => void;
  onSave: () => void; saving: boolean; saved: boolean;
}) {
  return (
    <StepCard>
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-blue-500" />
        <h2 className="text-xl font-bold">Contractor Entity Setup</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        GHM pays all partners through their business entity — not personally. Enter your company name below. Your manager will complete the Wave vendor setup on their end.
      </p>
      {saved ? (
        <div className="rounded-lg bg-status-success-bg border border-status-success-border p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-status-success" />
            <p className="text-sm font-semibold text-status-success">Entity info saved</p>
          </div>
          <p className="text-xs text-status-success mt-1">Your manager will link this to Wave before your first payment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Business / Entity Name</Label>
            <Input value={contractorEntityName} onChange={(e) => setContractorEntityName(e.target.value)} placeholder="e.g. Smith Media LLC" />
          </div>
          <div className="space-y-1.5">
            <Label>Billing Email (optional)</Label>
            <Input type="email" value={contractorEmail} onChange={(e) => setContractorEmail(e.target.value)} placeholder="billing@yourentity.com" />
          </div>
          <Button onClick={onSave} disabled={saving} size="sm" variant="outline">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Entity Info"}
          </Button>
          <p className="text-xs text-muted-foreground">You can continue without saving — your manager can fill this in from Team settings.</p>
        </div>
      )}
    </StepCard>
  );
}

function StepTerritory({ territory }: { territory: Territory | null }) {
  return (
    <StepCard>
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-blue-500" />
        <h2 className="text-xl font-bold">Your Territory</h2>
      </div>
      {territory ? (
        <div className="space-y-3">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-4">
            <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">{territory.name}</p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">Assigned and active</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Your territory gives you exclusive prospecting rights in this market. Every client you close here stays in your book — even if territory lines shift. Production threshold is <strong>2 closes/month on a rolling 90-day average</strong>.
          </p>
        </div>
      ) : (
        <div className="rounded-lg bg-status-warning-bg border border-status-warning-border p-4">
          <p className="text-sm font-medium text-status-warning">Territory not yet assigned</p>
          <p className="text-xs text-status-warning mt-0.5">Your manager will assign it shortly. You can start exploring leads in the meantime.</p>
        </div>
      )}
    </StepCard>
  );
}

function StepTools({ positionType }: { positionType: string }) {
  const salesTools = [
    { icon: FileText, color: "text-status-warning", name: "Prospect Audit", desc: "Branded domain analysis for any prospect — rankings, competitor gap, speed. Print-ready PDF.", where: "Lead detail → Audit PDF" },
    { icon: MonitorPlay, color: "text-violet-500", name: "Live Demo", desc: "Personalized demo page using the prospect's real data — shows what GHM looks like after 90 days.", where: "Lead detail → Live Demo" },
    { icon: Target, color: "text-status-success", name: "Discovery", desc: "Search Google Maps for businesses in your territory. Filter, score, import directly into pipeline.", where: "Leads → Discovery tab" },
  ];
  const opsTools = [
    { icon: FileText, color: "text-blue-500", name: "Content Studio", desc: "Create and submit content briefs. Your work flows into the review queue for manager approval.", where: "Clients → Content tab" },
    { icon: Target, color: "text-status-success", name: "Tasks", desc: "Your assigned work lives here. Update status, add notes, and track deliverables per client.", where: "Tasks page" },
    { icon: BookOpen, color: "text-purple-500", name: "Document Vault", desc: "Shared resources, templates, and client reports. Your manager curates the shared space.", where: "Document Vault" },
  ];
  const tools = positionType === "sales" ? salesTools : opsTools;

  return (
    <StepCard>
      <h2 className="text-xl font-bold">Your Core Tools</h2>
      <div className="space-y-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div key={tool.name} className="flex gap-3 p-3 rounded-lg bg-muted/40">
              <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", tool.color)} />
              <div>
                <p className="text-sm font-semibold">{tool.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{tool.desc}</p>
                <p className="text-xs font-medium mt-1 text-primary">{tool.where}</p>
              </div>
            </div>
          );
        })}
      </div>
    </StepCard>
  );
}

function StepFirstLead() {
  return (
    <StepCard>
      <h2 className="text-xl font-bold">Find Your First Lead</h2>
      <p className="text-sm text-muted-foreground">Two ways to get your first prospect in the pipe.</p>
      <div className="grid grid-cols-2 gap-3">
        <a href="/leads?filter=available" className="flex flex-col gap-2 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 transition-colors">
          <Target className="h-6 w-6 text-blue-600" />
          <div>
            <p className="text-sm font-semibold">Claim Available Leads</p>
            <p className="text-xs text-muted-foreground mt-0.5">Leads in your territory ready to pick up</p>
          </div>
        </a>
        <a href="/leads" className="flex flex-col gap-2 p-4 rounded-lg bg-status-success-bg hover:bg-status-success-bg transition-colors">
          <Rocket className="h-6 w-6 text-status-success" />
          <div>
            <p className="text-sm font-semibold">Discovery Search</p>
            <p className="text-xs text-muted-foreground mt-0.5">Find businesses via Google Maps and import</p>
          </div>
        </a>
      </div>
    </StepCard>
  );
}

function StepResources() {
  const resources = [
    { icon: BookOpen, label: "Digital Brochure", href: "/brochure", desc: "Share on prospect calls" },
    { icon: DollarSign, label: "Comp Sheet", href: "/comp-sheet", desc: "Your earnings breakdown" },
    { icon: MapPin, label: "Territory Map", href: "/territory-map", desc: "Markets + phase info" },
  ];
  return (
    <StepCard>
      <h2 className="text-xl font-bold">Your Resources</h2>
      <div className="space-y-2">
        {resources.map((r) => {
          const Icon = r.icon;
          return (
            <a key={r.label} href={r.href} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors group">
              <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          );
        })}
      </div>
    </StepCard>
  );
}

function StepScope({ positionType, positionName }: { positionType: string; positionName: string | null }) {
  const isOps = positionType === "operations";
  return (
    <StepCard>
      <h2 className="text-xl font-bold">Your Scope</h2>
      <p className="text-sm text-muted-foreground">
        {isOps
          ? `As ${positionName ? `a ${positionName}` : "operations staff"}, your work is tied to client deliverables. Your manager assigns tasks through the system — you complete them and mark them done.`
          : `Your manager will walk you through client assignments and expectations in your first check-in. All client context lives in the Clients section.`
        }
      </p>
      <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
        <p className="font-semibold">How your work flows:</p>
        <p>→ Manager assigns tasks with client context</p>
        <p>→ You complete deliverables and update task status</p>
        <p>→ Manager reviews and approves in the Approvals queue</p>
        <p>→ Your compensation is tied to approved deliverables each month</p>
      </div>
    </StepCard>
  );
}

function StepDone({ firstName, positionType }: { firstName: string; positionType: string }) {
  const isSales = positionType === "sales";
  return (
    <StepCard>
      <div className="text-center space-y-3 py-2">
        <CheckCircle2 className="h-12 w-12 text-status-success mx-auto" />
        <h2 className="text-2xl font-bold">You're live, {firstName}.</h2>
        <p className="text-muted-foreground text-sm">
          {isSales
            ? "Your dashboard is ready. Your territory is yours. Start with the Sales Tools panel."
            : "Your dashboard is ready. Check your Tasks for any work assigned by your manager."}
        </p>
        {isSales && (
          <div className="rounded-lg bg-muted/50 p-4 text-left space-y-1 text-sm">
            <p className="font-semibold mb-2">First 48 hours:</p>
            <p>→ Grab 5–10 available leads or find them via Discovery</p>
            <p>→ Generate an audit on your 3 best prospects</p>
            <p>→ Get one call booked</p>
          </div>
        )}
      </div>
    </StepCard>
  );
}
