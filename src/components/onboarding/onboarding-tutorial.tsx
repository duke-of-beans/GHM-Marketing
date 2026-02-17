"use client";

import { useState, useEffect } from "react";
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
  Target
} from "lucide-react";

type TutorialStep = {
  title: string;
  description: string;
  icon: React.ReactNode;
  tips: string[];
  action?: string;
};

const SALES_REP_TUTORIAL: TutorialStep[] = [
  {
    title: "Welcome to GHM Dashboard! 👋",
    description: "Let's get you up to speed in 60 seconds. This quick tour will show you everything you need to start closing deals.",
    icon: <Target className="h-12 w-12 text-blue-600" />,
    tips: [
      "You can restart this tour anytime from the Help menu",
      "Press ESC to skip the tutorial",
    ],
  },
  {
    title: "Your Personal Dashboard",
    description: "This is your command center. Track available leads in your territory, monitor your active pipeline, and see your wins and revenue at a glance.",
    icon: <TrendingUp className="h-12 w-12 text-green-600" />,
    tips: [
      "Available leads = ready to claim in your territory",
      "My Active = leads you're currently working",
      "Your earnings widget shows commissions + residuals",
    ],
    action: "Check your dashboard metrics daily",
  },
  {
    title: "Claiming Leads",
    description: "Head to the Leads page to see all available opportunities. Click the 'Available' column to see unassigned leads in your territory. Click any lead card to claim it!",
    icon: <Users className="h-12 w-12 text-purple-600" />,
    tips: [
      "Available leads = free to claim (first come, first served)",
      "Use filters to find high-value targets",
      "Drag leads across columns to update status",
    ],
    action: "Go claim your first lead now!",
  },
  {
    title: "Moving Leads Through Pipeline",
    description: "The Kanban board shows your sales pipeline. Drag leads from Available → Scheduled → Contacted → Follow Up → Paperwork → Won. Each column represents a stage in your sales process.",
    icon: <Filter className="h-12 w-12 text-orange-600" />,
    tips: [
      "Drag & drop to move leads between stages",
      "Click a lead to add notes and update details",
      "Won deals automatically become clients",
    ],
    action: "Keep your pipeline moving!",
  },
  {
    title: "Track Your Earnings",
    description: "Your earnings widget on the dashboard shows exactly how much you've made. You earn $1,000 commission when a client closes, plus $200/month residuals starting Month 2.",
    icon: <DollarSign className="h-12 w-12 text-green-600" />,
    tips: [
      "Commission: $1,000 one-time at client close",
      "Residuals: $200/month from Month 2 onwards",
      "Monthly recurring = your passive income",
    ],
    action: "Close deals to grow your recurring revenue!",
  },
  {
    title: "You're Ready! 🚀",
    description: "That's all you need to know to get started. Now go out there and close some deals! Remember: claim leads, move them through the pipeline, and watch your earnings grow.",
    icon: <CheckCircle2 className="h-12 w-12 text-green-600" />,
    tips: [
      "Need help? Look for the ? icons throughout the app",
      "Questions? Ask your manager or check the Help menu",
      "You've got this!",
    ],
    action: "Start claiming leads →",
  },
];

const MASTER_TUTORIAL: TutorialStep[] = [
  {
    title: "Welcome to GHM Dashboard! 👋",
    description: "As a Master Manager, you have access to team analytics, client portfolio management, and company profitability tracking. Let's show you around.",
    icon: <Target className="h-12 w-12 text-blue-600" />,
    tips: [
      "You can restart this tour anytime from the Help menu",
      "Press ESC to skip the tutorial",
    ],
  },
  {
    title: "Master Dashboard",
    description: "Your dashboard shows company-wide metrics: total leads, active pipeline, won deals, and MRR/ARR. Use the Pipeline Funnel and Rep Leaderboard to track team performance.",
    icon: <TrendingUp className="h-12 w-12 text-green-600" />,
    tips: [
      "Monitor conversion rates and pipeline health",
      "Track which reps are performing best",
      "Company profitability widget shows net profit (owners only)",
    ],
    action: "Review team metrics daily",
  },
  {
    title: "Client Portfolio",
    description: "The Clients page shows all active clients. Use filters to find clients needing attention, track health scores, and monitor scan status.",
    icon: <Users className="h-12 w-12 text-purple-600" />,
    tips: [
      "Health score: 75+ = healthy, 50-74 = competitive, <50 = needs attention",
      "Filter by revenue, tasks, scan status",
      "Click any client for detailed view and task management",
    ],
    action: "Keep client health scores high!",
  },
  {
    title: "Team Management",
    description: "Assign territories, configure compensation rates, and manage master assignments. Set commission amounts, residual rates, and master fees for each team member.",
    icon: <Filter className="h-12 w-12 text-orange-600" />,
    tips: [
      "Default: $1K commission, $200 residuals, $240 master fees",
      "Override rates per client if needed",
      "Owners don't pay themselves master fees",
    ],
    action: "Set up your team's compensation structure",
  },
  {
    title: "Your Earnings",
    description: "As a Master Manager, you earn $240/month for each client you manage (starting Month 1). If you also sell, you earn commissions and residuals on your own deals.",
    icon: <DollarSign className="h-12 w-12 text-green-600" />,
    tips: [
      "Management fees: $240/month per managed client",
      "These are separate from your sales commissions",
      "Track earnings in your dashboard widgets",
    ],
    action: "Maximize value for your managed clients!",
  },
  {
    title: "You're All Set! 🚀",
    description: "You now know the key features for managing your team and clients. Focus on keeping client health high and supporting your reps to hit their targets.",
    icon: <CheckCircle2 className="h-12 w-12 text-green-600" />,
    tips: [
      "Need help? Look for the ? icons throughout the app",
      "Questions? Check the Help menu or ask leadership",
      "Lead by example!",
    ],
    action: "Let's grow the business together →",
  },
];

type OnboardingTutorialProps = {
  userRole: "sales" | "master" | "owner";
  userName: string;
};

export function OnboardingTutorial({ userRole, userName }: OnboardingTutorialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true);

  const steps = userRole === "sales" ? SALES_REP_TUTORIAL : MASTER_TUTORIAL;
  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    // Check if user has seen tutorial
    const seen = localStorage.getItem(`tutorial-seen-${userRole}`);
    if (!seen) {
      setHasSeenTutorial(false);
      setIsOpen(true);
    }
  }, [userRole]);

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
    localStorage.setItem(`tutorial-seen-${userRole}`, "true");
    setHasSeenTutorial(true);
    setIsOpen(false);
    setCurrentStep(0);
  };

  const skipTutorial = () => {
    completeTutorial();
  };

  // Expose function to restart tutorial (can be called from Help menu)
  useEffect(() => {
    (window as any).restartTutorial = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };
  }, []);

  if (hasSeenTutorial && !isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {step.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Icon */}
          <div className="flex justify-center">
            {step.icon}
          </div>

          {/* Description */}
          <p className="text-center text-muted-foreground">
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

        {/* Progress Dots */}
        <div className="flex justify-center gap-1.5 pb-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                idx === currentStep
                  ? "bg-blue-600"
                  : idx < currentStep
                  ? "bg-green-600"
                  : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
