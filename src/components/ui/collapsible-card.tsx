"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
  panelKey: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  headerExtra?: React.ReactNode;
}

export function CollapsibleCard({
  panelKey,
  title,
  description,
  children,
  defaultOpen = true,
  headerExtra,
}: CollapsibleCardProps) {
  const storageKey = `content-studio-panel-${panelKey}`;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      setIsOpen(stored === "true");
    }
    setMounted(true);
  }, [storageKey]);

  function toggle() {
    const next = !isOpen;
    setIsOpen(next);
    localStorage.setItem(storageKey, String(next));
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-start justify-between p-6 text-left hover:bg-muted/30 transition-colors rounded-t-lg"
        aria-expanded={isOpen}
      >
        <div className="space-y-1 pr-4">
          <h3 className="font-semibold leading-none tracking-tight">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {headerExtra}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isOpen ? "rotate-0" : "-rotate-90"
            )}
          />
        </div>
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          mounted ? (isOpen ? "max-h-[9999px] opacity-100" : "max-h-0 opacity-0") : "max-h-[9999px] opacity-100"
        )}
      >
        <div className="px-6 pb-6 pt-0">{children}</div>
      </div>
    </div>
  );
}
