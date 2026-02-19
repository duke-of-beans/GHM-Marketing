"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { HelpCircle, PlayCircle, Bug } from "lucide-react";
import { BugReportDialog } from "@/components/bug-report/BugReportDialog";

export function HelpMenu() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"bug" | "feature">("bug");

  const restartTutorial = () => {
    if (typeof window !== "undefined" && (window as any).restartTutorial) {
      (window as any).restartTutorial();
    }
  };

  const openFeedback = (type: "bug" | "feature") => {
    setFeedbackType(type);
    setFeedbackOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground transition-colors w-full text-left">
            <span>❓</span>
            Help
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={restartTutorial}>
            <PlayCircle className="h-4 w-4 mr-2" />
            Restart Tutorial
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openFeedback("bug")}>
            <Bug className="h-4 w-4 mr-2" />
            Report a Bug
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openFeedback("feature")}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Request a Feature
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BugReportDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        defaultType={feedbackType}
      />
    </>
  );
}
