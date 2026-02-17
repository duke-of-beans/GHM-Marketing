"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";
import { BugReportDialog } from "./BugReportDialog";

interface Props {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  defaultCategory?: string;
  contextInfo?: Record<string, any>;
  children?: React.ReactNode;
}

export function BugReportButton({
  variant = "ghost",
  size = "sm",
  className,
  defaultCategory,
  contextInfo,
  children,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        {children || (
          <>
            <Bug className="h-4 w-4 mr-2" />
            Report Bug
          </>
        )}
      </Button>

      <BugReportDialog
        open={open}
        onOpenChange={setOpen}
        defaultCategory={defaultCategory}
        contextInfo={contextInfo}
      />
    </>
  );
}
