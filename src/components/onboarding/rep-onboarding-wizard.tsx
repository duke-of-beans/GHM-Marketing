"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, ChevronRight, ChevronLeft, MapPin,
  FileText, MonitorPlay, BookOpen, DollarSign, Target, Rocket,
  ExternalLink, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Territory {
  id: number;
  name: string;
}

interface Props {
  userName: string;
  currentStep: number;
  territory: Territory | null;
}

const TOTAL_STEPS = 7;

export function RepOnboardingWizard({ userName, currentStep, territory }: Props) {
  const [step, setStep] = useState(Math.max(0, currentStep));
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const firstName = userName.split(" ")[0];

  async function saveProgress(nextStep: number, complete = false) {
    setSaving(true);
    try {
      await fetch("/api/users/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: nextStep, completed: complete }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function advance() {
    const next = step + 1;
    if (next >= TOTAL_STEPS) {
      await saveProgress(TOTAL_STEPS, true);
      router.push("/sales");
      return;
    }
    await saveProgress(next);
    setStep(next);
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  const progress = Math.round((step / (TOTAL_STEPS - 1)) * 100);

  return (
    <div className="w-full max-w-lg">
      {/* Progress */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of {TOTAL_STEPS}</span>
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

      {step === 0 && <StepWelcome firstName={firstName} />}
      {step === 1 && <StepRole />}
      {step === 2 && <StepTerritory territory={territory} />}
      {step === 3 && <StepTools />}
      {step === 4 && <StepFirstLead />}
      {step === 5 && <StepResources />}
      {step === 6 && <StepDone firstName={firstName} />}

      {/* Nav */}
      <div className="flex justify-between mt-6">
        {step > 0 ? (
          <Button variant="ghost" size="sm" onClick={back} disabled={saving}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          {step < TOTAL_STEPS - 1 && (
            <Button variant="ghost" size="sm" onClick={advance} disabled={saving} className="text-muted-foreground">
              Skip
            </Button>
          )}
          <Button onClick={advance} disabled={saving} className="min-w-[120px]">
            {saving
              ? "Saving..."
              : step === TOTAL_STEPS - 1
              ? "Go close something →"
              : (
                <>
                  {step === 0 ? "Let's go" : "Continue"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Step Components ─────────────────────────────────────────────────────────

function StepCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("border-0 shadow-lg", className)}>
      <CardContent className="p-6 space-y-4">{children}</CardContent>
    </Card>
  );
}

function StepWelcome({ firstName }: { firstName: string }) {
  return (
    <StepCard>
      <div className="text-center space-y-3">
        <div className="text-5xl">👋</div>
        <h1 className="text-2xl font-bold">Hey {firstName}, welcome to GHM.</h1>
        <p className="text-muted-foreground">
          You're about to become part of the team. This'll take about 3 minutes
          — we'll walk you through exactly what you need to know to start closing.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 pt-2">
        {[
          { icon: "🎯", label: "Your territory" },
          { icon: "🛠️", label: "Your tools" },
          { icon: "💰", label: "Your earnings" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/50 text-center"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </StepCard>
  );
}

function StepRole() {
  return (
    <StepCard>
      <h2 className="text-xl font-bold">Your role: Sales Partner</h2>
      <p className="text-muted-foreground text-sm">
        You're a commission-only partner. No base, no ceiling. Your job is to
        introduce business owners to GHM's SEO services and close them on a
        $2,400/month retainer. We handle all the delivery — you just sell.
      </p>
      <div className="space-y-2">
        {[
          { icon: "✅", text: "Find prospects in your territory" },
          { icon: "✅", text: "Generate a free audit to break the ice" },
          { icon: "✅", text: "Show them the live demo on the call" },
          { icon: "✅", text: "Close the retainer, collect your bonus" },
          { icon: "✅", text: "Light monthly check-ins keep them happy" },
        ].map((item) => (
          <div key={item.text} className="flex items-start gap-2 text-sm">
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-primary/10 p-3 text-sm">
        <strong>Your success metric:</strong> 2 closes per month on a rolling
        90-day average. Hit that and your territory is secure. Exceed it and your
        residual rate steps up automatically.
      </div>
    </StepCard>
  );
}

function StepTerritory({ territory }: { territory: { id: number; name: string } | null }) {
  return (
    <StepCard>
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-blue-500" />
        <h2 className="text-xl font-bold">Your Territory</h2>
      </div>
      {territory ? (
        <div className="space-y-3">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-4">
            <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
              {territory.name}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">
              Assigned and active
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Your territory gives you exclusive prospecting rights within this market.
            All available leads in this area are yours to claim. You keep every client
            you close here — even if territory lines ever shift.
          </p>
          <p className="text-sm text-muted-foreground">
            The production threshold is <strong>2 closes/month averaged over 90 days</strong>.
            Drop below that for more than 30 days after notice and the territory reopens.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 p-4">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Territory not yet assigned
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              Your manager will assign your territory shortly. You can start
              exploring leads in the meantime.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Once assigned, your territory gives you exclusive prospecting rights
            to a defined market. First-wave reps get the largest, most
            opportunity-rich territories.
          </p>
        </div>
      )}
    </StepCard>
  );
}

function StepTools() {
  const tools = [
    {
      icon: FileText,
      color: "text-orange-500",
      name: "Prospect Audit",
      desc: "Generates a branded domain analysis for any prospect — DR score, rankings, competitor gap, speed. Opens a print-ready PDF. Send it ahead of the call or share on screen.",
      where: "Lead detail → Audit PDF button",
    },
    {
      icon: MonitorPlay,
      color: "text-violet-500",
      name: "Live Demo",
      desc: "Creates a personalized demo page using the prospect's real data — showing what their GHM account would look like after 90 days. Use this on hot calls.",
      where: "Lead detail → Live Demo button",
    },
    {
      icon: Target,
      color: "text-green-500",
      name: "Discovery",
      desc: "Search Google Maps for businesses in your territory. Filter by vertical, score by opportunity. Import directly into your pipeline.",
      where: "Leads page → Discovery tab",
    },
  ];

  return (
    <StepCard>
      <h2 className="text-xl font-bold">Your Sales Tools</h2>
      <p className="text-sm text-muted-foreground">
        Three weapons every rep needs to know cold.
      </p>
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
      <p className="text-sm text-muted-foreground">
        Two ways to get your first prospect in the pipe.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <a
          href="/leads?filter=available"
          className="flex flex-col gap-2 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
        >
          <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-semibold">Claim Available Leads</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Leads already in your territory waiting to be picked up
            </p>
          </div>
        </a>
        <a
          href="/leads"
          className="flex flex-col gap-2 p-4 rounded-lg bg-green-50 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
        >
          <Rocket className="h-6 w-6 text-green-600 dark:text-green-400" />
          <div>
            <p className="text-sm font-semibold">Discovery Search</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Find new businesses via Google Maps and import them
            </p>
          </div>
        </a>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        You can do this after setup — just wanted you to know where to start.
      </p>
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
      <p className="text-sm text-muted-foreground">
        Bookmark these. You'll use them constantly.
      </p>
      <div className="space-y-2">
        {resources.map((r) => {
          const Icon = r.icon;
          return (
            <a
              key={r.label}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors group"
            >
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
      <p className="text-xs text-muted-foreground">
        Questions? Hit up your manager in Team Feed or check back on your dashboard.
      </p>
    </StepCard>
  );
}

function StepDone({ firstName }: { firstName: string }) {
  return (
    <StepCard>
      <div className="text-center space-y-3 py-2">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold">You're live, {firstName}.</h2>
        <p className="text-muted-foreground text-sm">
          Your dashboard is ready. Your territory is yours. Everything you need
          is in the Sales Tools panel.
        </p>
        <div className="rounded-lg bg-muted/50 p-4 text-left space-y-1 text-sm">
          <p className="font-semibold mb-2">First 48 hours:</p>
          <p>→ Grab 5-10 available leads or find them via Discovery</p>
          <p>→ Generate an audit on your 3 best prospects</p>
          <p>→ Get one call booked</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Residuals compound. The sooner you start, the sooner your book pays you
          while you sleep.
        </p>
      </div>
    </StepCard>
  );
}
