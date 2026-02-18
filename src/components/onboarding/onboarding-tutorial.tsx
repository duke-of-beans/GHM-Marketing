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

const SALES_REP_TUTORIAL: TutorialStep[] = [
  {
    title: "Welcome to GHM Dashboard! 👋",
    description: "Let's get you up to speed in about 2 minutes. This tour covers everything you need to start claiming leads, moving deals, and tracking your income.",
    icon: <Target className="h-12 w-12 text-blue-600" />,
    tips: [
      "You can restart this tour anytime from the Help menu",
      "Press ESC or click outside to skip",
    ],
  },
  {
    title: "Your Personal Dashboard",
    description: "This is your command center. Every number here is personalized to you — your territory, your pipeline, your money.",
    icon: <TrendingUp className="h-12 w-12 text-green-600" />,
    route: "/sales",
    tips: [
      "Available leads = unclaimed leads in your territory, ready to grab",
      "My Active = leads you're currently working through the pipeline",
      "Won deals = closed clients you've converted",
      "Your earnings widget shows commissions earned and monthly residuals",
    ],
    action: "Check your dashboard every morning — it's your scoreboard",
  },
  {
    title: "Claiming Leads",
    description: "Head to the Leads page to see all available opportunities in your territory. Leads are first-come, first-served — don't sleep on them.",
    icon: <Users className="h-12 w-12 text-purple-600" />,
    route: "/leads",
    tips: [
      "The 'Available' column shows unclaimed leads in your territory",
      "Click any lead card to view details and claim it",
      "Once claimed, it moves to your personal pipeline",
      "Use filters (territory, value, date) to find the best targets",
    ],
    action: "Go claim your first lead now!",
  },
  {
    title: "Working Your Pipeline",
    description: "The Kanban board is your sales process visualized. Move leads from left to right as they progress through each stage.",
    icon: <Filter className="h-12 w-12 text-orange-600" />,
    route: "/leads",
    tips: [
      "Stages: Available → Scheduled → Contacted → Follow Up → Paperwork → Won",
      "Drag & drop a lead card to move it to a new stage",
      "Click a lead to add notes, update contact info, or attach details",
      "Won leads automatically convert into active clients in the Clients tab",
    ],
    action: "Keep leads moving — stale pipelines don't pay",
  },
  {
    title: "Track Your Earnings",
    description: "Your earnings widget shows exactly what you've made and what's on the way — commissions when a deal closes, residuals every month after that.",
    icon: <DollarSign className="h-12 w-12 text-green-600" />,
    route: "/sales",
    tips: [
      "Commission: one-time payment when a client closes (Month 1)",
      "Residuals: recurring monthly payment per active client starting Month 2",
      "The more clients you close and retain, the higher your monthly passive income",
      "Your exact rates are configured by your manager — check with them if something looks off",
    ],
    action: "Every retained client is recurring income — forever",
  },
  {
    title: "Your Goals",
    description: "The Goals widget on your dashboard tracks progress toward your personal targets for the month. Use it to keep yourself on track.",
    icon: <Target className="h-12 w-12 text-blue-600" />,
    route: "/sales",
    tips: [
      "Goals are configured by your manager — check with them if something looks off",
      "Progress bars update in real time as you close deals and move leads",
      "Green = on track, yellow = behind pace, red = needs attention",
    ],
    action: "Know your numbers — hit your targets",
  },
  {
    title: "Team Feed",
    description: "The Team Feed widget keeps you connected with the rest of the team. Check here for announcements, updates, and direct messages from your manager.",
    icon: <MessageSquare className="h-12 w-12 text-violet-600" />,
    route: "/sales",
    tips: [
      "Pinned messages (amber border) are important — read these first",
      "Urgent and Important badges signal priority messages from management",
      "Click 'View all' or the compose bar to open the full feed panel",
      "You can reply to messages and send direct messages to team members",
      "Unread messages show a blue dot — click the message to mark it read",
    ],
    action: "Check the Team Feed daily for updates from your manager",
  },
  {
    title: "Your Profile",
    description: "Keep your account info current. You can update your name, email, and password anytime from the My Profile page in the navigation.",
    icon: <UserCog className="h-12 w-12 text-slate-600" />,
    route: "/profile",
    tips: [
      "Find 'My Profile' in the left sidebar navigation",
      "Change your name or email without needing your manager",
      "Password changes require your current password to confirm",
    ],
  },
  {
    title: "You're Ready! 🚀",
    description: "That's everything you need to hit the ground running. Claim leads, work your pipeline, close deals, and watch your residual income grow every month.",
    icon: <CheckCircle2 className="h-12 w-12 text-green-600" />,
    route: "/leads",
    tips: [
      "Hover over any ? icon in the app for in-context explanations",
      "Need help? Use the Help menu in the top right for support options",
      "You can relaunch this tour anytime from the Help menu",
    ],
    action: "Start claiming leads →",
  },
];

// ─── Master Tutorial ──────────────────────────────────────────────────────────

const MASTER_TUTORIAL: TutorialStep[] = [
  {
    title: "Welcome to GHM Dashboard! 👋",
    description: "As a Master Manager, you have full visibility into team performance, client health, and company financials. This tour covers all the tools at your disposal.",
    icon: <Target className="h-12 w-12 text-blue-600" />,
    tips: [
      "You can restart this tour anytime from the Help menu",
      "Press ESC or click outside to skip",
    ],
  },
  {
    title: "Your Master Dashboard",
    description: "Your dashboard gives you a live view of everything: company-wide metrics, pipeline health, team leaderboard, revenue trends, and your managed client earnings.",
    icon: <LayoutDashboard className="h-12 w-12 text-green-600" />,
    route: "/master",
    tips: [
      "Top metrics row: total leads, active pipeline, won deals, and MRR/ARR",
      "Pipeline Funnel shows conversion at each sales stage",
      "Rep Leaderboard ranks your team by deals closed and revenue",
      "Management Fees widget shows your $240/month per-client earnings",
      "Company Profitability widget is visible to owners only",
    ],
    action: "Review your dashboard every morning — know your team's health",
  },
  {
    title: "Arrange Your Dashboard",
    description: "Your dashboard is fully customizable. Move and resize any widget to match how you work. Your layout is saved per user, so it's yours alone.",
    icon: <LayoutDashboard className="h-12 w-12 text-slate-600" />,
    route: "/master",
    tips: [
      "Click 'Arrange widgets' in the top right corner to enter edit mode",
      "Drag widgets using the handle bar that appears at the top of each card",
      "Resize widgets by dragging the handle at the bottom-right corner",
      "Layout saves automatically — no need to click save",
      "Click 'Reset to default' to restore the original layout anytime",
    ],
    action: "Customize your layout to match your daily workflow",
  },
  {
    title: "Client Portfolio",
    description: "The Clients tab is your full client roster. Monitor health scores, scan status, service details, and upcoming tasks all in one place.",
    icon: <Users className="h-12 w-12 text-purple-600" />,
    route: "/clients",
    tips: [
      "Health score: 75+ = healthy, 50–74 = competitive pressure, below 50 = needs attention",
      "Filter clients by revenue tier, health score, scan status, or assigned rep",
      "Click any client to see full details, tasks, notes, and service history",
      "Won leads automatically appear here once converted by a sales rep",
    ],
    action: "Keep client health scores high — it drives retention",
  },
  {
    title: "Team Management",
    description: "The Settings → Team tab is where you manage your reps: territories, compensation rates, permissions, and account status.",
    icon: <Filter className="h-12 w-12 text-orange-600" />,
    route: "/settings",
    tips: [
      "Default compensation rates are configured in Settings — reps see their own rates on their dashboard",
      "Override compensation rates per rep or per client as needed",
      "Permission presets (Sales, Master, Owner) control what each role can access",
      "Deactivate inactive reps without deleting their data — reactivate any time",
      "Hard delete removes a rep permanently and requires typing DELETE to confirm",
    ],
    action: "Configure compensation before your team starts closing deals",
  },
  {
    title: "Your Earnings",
    description: "As a Master Manager, you earn a management fee for every client under your management — from Month 1. If you also close deals, you earn commissions and residuals on top.",
    icon: <DollarSign className="h-12 w-12 text-green-600" />,
    route: "/master",
    tips: [
      "Management fees: per-client monthly earnings starting Month 1, for every client you manage",
      "Sales commission: one-time per deal you personally close",
      "Sales residuals: monthly per client from Month 2 if you sold them",
      "Your exact rates are configured in Settings — check with the owner if something looks off",
      "All earnings are tracked in the Management Fees widget on your dashboard",
    ],
    action: "Grow your managed book — every client is $240/month",
  },
  {
    title: "Team Feed",
    description: "Team Feed is your broadcast and messaging channel. Communicate directly with your team without leaving the dashboard.",
    icon: <MessageSquare className="h-12 w-12 text-violet-600" />,
    route: "/master",
    tips: [
      "Post to Everyone, a specific role (masters/sales), or a single person (Direct)",
      "Pin messages to float them to the top of everyone's feed permanently",
      "Mark messages Urgent or Important to signal priority to your team",
      "Team members can reply to messages — replies thread under the original",
      "Read receipts show who has seen a message — useful for important announcements",
      "Messages auto-refresh every 30 seconds — no need to reload",
    ],
    action: "Use Team Feed for announcements, kudos, and quick updates",
  },
  {
    title: "Analytics & Reports",
    description: "The Analytics tab provides deeper insights: conversion funnels, revenue trends, client health distribution, and rep performance breakdowns.",
    icon: <BarChart3 className="h-12 w-12 text-blue-600" />,
    route: "/analytics",
    tips: [
      "Filter by date range, territory, or rep for granular views",
      "Health score distribution shows the overall wellness of your client base",
      "Rep performance table ranks by deals closed, revenue generated, and activity",
      "Use trends over time to spot seasonal patterns or declining performance early",
    ],
    action: "Review analytics weekly to stay ahead of problems",
  },
  {
    title: "Your Profile",
    description: "Keep your account info current. Update your name, email, or password anytime from My Profile in the navigation — no need to go through settings.",
    icon: <UserCog className="h-12 w-12 text-slate-600" />,
    route: "/profile",
    tips: [
      "Find 'My Profile' in the left sidebar navigation",
      "Role, territory, and permissions changes are done in Settings → Team",
      "Password changes require your current password to confirm",
    ],
  },
  {
    title: "You're All Set! 🚀",
    description: "You now know every tool in the dashboard. Focus on keeping client health high, supporting your reps, and growing your managed book.",
    icon: <CheckCircle2 className="h-12 w-12 text-green-600" />,
    route: "/master",
    tips: [
      "Hover over any ? icon in the app for in-context explanations",
      "Need help? Use the Help menu for support options and to report bugs",
      "You can relaunch this tour anytime from the Help menu",
    ],
    action: "Let's build something great →",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

type OnboardingTutorialProps = {
  userRole: "sales" | "master" | "owner";
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

  // Navigate to the relevant page when a step has a route
  useEffect(() => {
    if (isOpen && step.route) {
      router.push(step.route);
    }
  }, [currentStep, isOpen]);

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
                  ? "w-1.5 bg-green-600"
                  : "w-1.5 bg-gray-300"
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
