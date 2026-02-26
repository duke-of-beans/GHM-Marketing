"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle2,
  Filter,
  Target,
  MessageSquare,
  LayoutDashboard,
  UserCog,
  BarChart3,
} from "lucide-react";

type TutorialStep = {
  title: string;
  description: string;
  icon: React.ReactNode;
  tips: string[];
  action?: string;
  route?: string; // page to navigate to when this step is shown
};

// ─── Sales Rep Tutorial ───────────────────────────────────────────────────────
// Covers: dashboard orientation, earnings, goals, team feed, profile.
// Leads + pipeline mechanics are intentionally omitted — the Leads page has its
// own Driver.js tour that handles that in context, where it's actually useful.

const SALES_REP_TUTORIAL: TutorialStep[] = [
  {
    title: "Welcome to GHM Dashboard.",
    description: "We're skipping the motivational poster. This is a quick tour of what's on your screen and what it means. The Leads page will walk you through the actual pipeline work when you get there.",
    icon: <Target className="h-12 w-12 text-blue-600" />,
    tips: [
      "You can relaunch this tour anytime from the Help menu, in case you forget everything immediately",
      "Press ESC or click outside to skip — we won't take it personally",
    ],
  },
  {
    title: "Your Dashboard",
    description: "Every number on this screen is yours specifically — your territory, your pipeline, your money. It's not decorative.",
    icon: <TrendingUp className="h-12 w-12 text-status-success" />,
    route: "/sales",
    tips: [
      "Available = unclaimed leads sitting in your territory right now",
      "My Active = leads you own and are currently working",
      "Won = clients you've closed — they move to Clients automatically",
      "Earnings widget shows both your one-time commissions and your monthly residuals",
    ],
    action: "This is your scoreboard. It updates in real time.",
  },
  {
    title: "How You Get Paid",
    description: "Two income streams. One when you close, one every month after that. The math gets interesting fast if you actually retain clients.",
    icon: <DollarSign className="h-12 w-12 text-status-success" />,
    route: "/sales",
    tips: [
      "Commission: one-time payment when a client closes (Month 1)",
      "Residuals: recurring monthly payment per active client starting Month 2",
      "Residuals stack — every client you retain adds to your baseline",
      "Rates are set by your manager — if the numbers look wrong, ask them, not us",
    ],
    action: "Each retained client pays you every month indefinitely. Plan accordingly.",
  },
  {
    title: "Your Goals",
    description: "The Goals widget tracks your progress against your monthly targets. It does not grade on a curve.",
    icon: <Target className="h-12 w-12 text-blue-600" />,
    route: "/sales",
    tips: [
      "Goals are configured by your manager — the targets are theirs, not ours",
      "Progress bars update in real time as you move leads and close deals",
      "Green = on track. Yellow = falling behind. Red = you already know.",
    ],
    action: "Check it before your weekly check-in, not during.",
  },
  {
    title: "Team Feed",
    description: "Your manager communicates through here. Announcements, direct messages, pinned updates. It is not optional reading.",
    icon: <MessageSquare className="h-12 w-12 text-violet-600" />,
    route: "/sales",
    tips: [
      "Amber border = pinned message — read these before anything else",
      "Urgent and Important badges mean exactly what they say",
      "Blue dot = unread. Click to mark read.",
      "Click 'View all' to open the full feed panel and send direct messages",
    ],
    action: "Check it daily. Your manager can see who hasn't.",
  },
  {
    title: "Your Profile",
    description: "Name, email, password — all yours to update. Your manager doesn't need to be involved.",
    icon: <UserCog className="h-12 w-12 text-muted-foreground" />,
    route: "/profile",
    tips: [
      "'My Profile' is in the left sidebar — it's not hidden, just not loud about it",
      "Password changes require your current password to confirm, as they should",
      "Territory and role changes go through your manager in Settings, not here",
    ],
  },
  {
    title: "That's the dashboard.",
    description: "Head to the Leads page when you're ready — it'll walk you through the pipeline, claiming leads, and how the kanban works. That tour fires once, automatically.",
    icon: <CheckCircle2 className="h-12 w-12 text-status-success" />,
    route: "/leads",
    tips: [
      "Hover any ? icon in the app for inline explanations",
      "Help menu (top right) has support options and lets you relaunch any tour",
      "If something seems broken, it's probably not. But the Help menu is still there.",
    ],
    action: "Leads page →",
  },
];

// ─── Master Tutorial ──────────────────────────────────────────────────────────

const MASTER_TUTORIAL: TutorialStep[] = [
  {
    title: "Welcome to GHM Dashboard.",
    description: "You're a Master Manager. This tour covers what you can see, what you can touch, and what your reps can't. It'll take about 3 minutes. You're welcome.",
    icon: <Target className="h-12 w-12 text-blue-600" />,
    tips: [
      "Relaunch this tour anytime from the Help menu, not that you'll need to",
      "Press ESC or click outside to bail — we've noted it",
    ],
  },
  {
    title: "Your Dashboard",
    description: "Everything you need to know about your team's performance is here. If a number looks bad, it's probably accurate.",
    icon: <LayoutDashboard className="h-12 w-12 text-status-success" />,
    route: "/manager",
    tips: [
      "Top row: total leads, active pipeline, won deals, MRR/ARR — company-wide, not just yours",
      "Pipeline Funnel shows where deals are converting (and where they're dying)",
      "Rep Leaderboard is visible to everyone on your team, intentionally",
      "Management Fees widget is your per-client monthly income — it adds up",
      "Company Profitability is owner-only — if you can't see it, that's why",
    ],
    action: "Check this every morning. Your team's health is your job.",
  },
  {
    title: "You Can Rearrange All of This",
    description: "The layout is yours. Every widget is moveable and resizable. The default is fine. Custom is better.",
    icon: <LayoutDashboard className="h-12 w-12 text-muted-foreground" />,
    route: "/manager",
    tips: [
      "'Arrange widgets' lives in the top right — click it to enter edit mode",
      "Drag handles appear at the top of each card in edit mode",
      "Resize from the bottom-right corner of any widget",
      "Saves automatically. No button. It just works.",
      "'Reset to default' is there when you've made it worse",
    ],
    action: "Build a layout you'll actually use every day.",
  },
  {
    title: "Your Client Roster",
    description: "The Clients tab is every active client, their health score, their assigned rep, and their service status. One screen.",
    icon: <Users className="h-12 w-12 text-purple-600" />,
    route: "/clients",
    tips: [
      "Health score: 75+ is fine, 50–74 is watching, below 50 is a problem",
      "Filter by health score, revenue tier, scan status, or rep — use it",
      "Click any client for the full detail view — tasks, notes, billing, content studio",
      "Won leads convert here automatically when a rep closes them",
      "The Client Detail page also has its own tour — it fires the first time you open one",
    ],
    action: "Health scores dropping = clients at risk. Stay ahead of it.",
  },
  {
    title: "Content Studio",
    description: "Inside every client profile is a Content Studio. Each panel shows a live competitive gap score from the latest scan. Red means someone needs to do something.",
    icon: <BarChart3 className="h-12 w-12 text-indigo-600" />,
    route: "/clients",
    tips: [
      "Battery bars (5 segments) show urgency — red is urgent, green is fine, yellow is neither",
      "Blog Generator: declining keyword count — content needed",
      "Social Media: your review count vs. the strongest competitor in their market",
      "Meta Description: on-page signals slipping — copy refresh needed",
      "PPC Generator: domain authority gap — lower DR means higher client CPCs",
      "Content Strategy: total active alerts — start here if you don't know where to start",
      "Hover any badge for a plain-English explanation of the number",
    ],
    action: "Run a scan first. The badges are only as good as the data behind them.",
  },
  {
    title: "Team Settings",
    description: "Settings → Team is where you configure your reps — territories, rates, permissions, and account status. Don't skip this before they start closing.",
    icon: <Filter className="h-12 w-12 text-status-warning" />,
    route: "/settings",
    tips: [
      "Default compensation rates apply to everyone unless you override per rep or per client",
      "Permission presets (Sales, Master, Owner) control what each role can actually access",
      "Deactivate a rep to freeze their access without losing their data",
      "Hard delete is permanent and requires typing DELETE to confirm — we made it annoying on purpose",
    ],
    action: "Set comp rates before anyone closes their first deal.",
  },
  {
    title: "How You Get Paid",
    description: "Management fees on every client you manage, starting Month 1. Sales commission and residuals on top if you're also closing. It compounds if you're doing both.",
    icon: <DollarSign className="h-12 w-12 text-status-success" />,
    route: "/manager",
    tips: [
      "Management fees: per-client monthly, every client you manage, from Month 1",
      "Sales commission: one-time per deal you personally close",
      "Sales residuals: monthly per client from Month 2 on deals you closed",
      "Rates are in Settings — talk to the owner if the numbers look wrong",
      "Management Fees widget on your dashboard tracks all of this",
    ],
    action: "More managed clients = higher monthly floor. Simple.",
  },
  {
    title: "Team Feed",
    description: "This is how you talk to your team. Posts, direct messages, pins, urgency flags — all here. Your reps see whatever you post.",
    icon: <MessageSquare className="h-12 w-12 text-violet-600" />,
    route: "/manager",
    tips: [
      "Post to Everyone, a specific role, or a single person (Direct) — your choice",
      "Pin messages to keep them at the top of everyone's feed indefinitely",
      "Urgent and Important badges are not decorative — use them correctly",
      "Replies thread under the original message",
      "Read receipts show who's actually seen it — useful when you need to know",
      "Feed refreshes every 30 seconds automatically",
    ],
    action: "Use this. Don't make your team use Slack for things that should live here.",
  },
  {
    title: "Analytics",
    description: "The Analytics tab goes deeper than the dashboard — funnels, revenue trends, health distributions, rep-by-rep breakdowns. It's all there.",
    icon: <BarChart3 className="h-12 w-12 text-blue-600" />,
    route: "/analytics",
    tips: [
      "Filter by date range, territory, or rep for the view you actually need",
      "Health score distribution shows your overall client portfolio wellness at a glance",
      "Rep performance table: deals, revenue, and activity — no editorializing",
      "Trends over time will show you problems before your reps tell you about them",
    ],
    action: "Weekly review. Not monthly. Weekly.",
  },
  {
    title: "Your Profile",
    description: "Name, email, password — update them yourself from My Profile. Role and permission changes go through Settings → Team.",
    icon: <UserCog className="h-12 w-12 text-muted-foreground" />,
    route: "/profile",
    tips: [
      "'My Profile' is in the left sidebar — not buried, just quiet",
      "Password changes require your current password",
      "Territory and role changes are a Settings → Team operation, not a profile one",
    ],
  },
  {
    title: "That's everything.",
    description: "You've got the full picture. Keep health scores up, keep your reps moving, keep your managed book growing.",
    icon: <CheckCircle2 className="h-12 w-12 text-status-success" />,
    route: "/manager",
    tips: [
      "Every ? icon in the app has an inline explanation — hover before you ask",
      "Help menu (top right) has support options, bug reporting, and tour restarts",
      "The Client Detail page has its own tour — it fires automatically the first time you open a client",
    ],
    action: "Your dashboard →",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

type OnboardingTutorialProps = {
  userRole: "sales" | "manager" | "owner";
  userName: string;
};

export function OnboardingTutorial({ userRole, userName }: OnboardingTutorialProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true);
  const [originPath, setOriginPath] = useState<string | null>(null);

  const steps = userRole === "sales" ? SALES_REP_TUTORIAL : MASTER_TUTORIAL;
  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    const seen = localStorage.getItem("tutorial-seen");
    if (!seen) {
      setHasSeenTutorial(false);
      setOriginPath(window.location.pathname);
      setIsOpen(true);
    }
  }, []);

  // Navigation is handled at completion only — per-step navigation
  // was causing the dialog to unmount mid-tutorial due to route changes.

  const handleNext = () => {
    if (isLastStep) {
      completeTutorial();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const completeTutorial = () => {
    localStorage.setItem("tutorial-seen", "true");
    setHasSeenTutorial(true);
    setIsOpen(false);
    setCurrentStep(0);
    // Return to where they started
    if (originPath) {
      router.push(originPath);
    }
  };

  // Expose restart function to Help menu
  useEffect(() => {
    (window as any).restartTutorial = () => {
      setOriginPath(window.location.pathname);
      setCurrentStep(0);
      setIsOpen(true);
    };
  }, []);

  if (hasSeenTutorial && !isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) completeTutorial(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{step.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Icon */}
          <div className="flex justify-center">{step.icon}</div>

          {/* Description */}
          <p className="text-center text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          {/* Tips */}
          <div className="space-y-2">
            {step.tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 shrink-0 text-blue-600">•</span>
                <p className="text-muted-foreground">{tip}</p>
              </div>
            ))}
          </div>

          {/* Action */}
          {step.action && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                ⚡ {step.action}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>

          <div className="flex gap-2">
            {!isFirstStep && (
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            )}
            <Button onClick={handleNext}>
              {isLastStep ? (
                <>
                  Get Started
                  <CheckCircle2 className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Skip link on first step */}
        {isFirstStep && (
          <div className="text-center pb-1">
            <button
              onClick={completeTutorial}
              className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Skip tour — I know what I&apos;m doing
            </button>
          </div>
        )}

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-1">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStep
                  ? "w-4 bg-blue-600"
                  : idx < currentStep
                  ? "w-1.5 bg-status-success-bg"
                  : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

