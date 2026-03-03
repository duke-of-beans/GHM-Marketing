"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface AIProgressIndicatorProps {
  steps: string[];
  /** ms delay before advancing to each successive step (length: steps.length - 1) */
  intervals?: number[];
}

export function AIProgressIndicator({
  steps,
  intervals = [1500, 3000, 5000, 8000],
}: AIProgressIndicatorProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = intervals.map((delay, i) =>
      setTimeout(() => setStep((prev) => Math.max(prev, i + 1)), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <p key={step} className="text-sm text-muted-foreground animate-in fade-in duration-300">
        {steps[Math.min(step, steps.length - 1)]}
      </p>
    </div>
  );
}
