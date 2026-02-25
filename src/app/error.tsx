"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { BugReportButton } from "@/components/bug-report/BugReportButton";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console
    console.error("Error boundary caught:", error);
    
    // Store in global error tracker
    if (typeof window !== "undefined") {
      (window as any).__consoleErrors = (window as any).__consoleErrors || [];
      (window as any).__consoleErrors.push({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        timestamp: new Date().toISOString(),
      });
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground">
            We encountered an unexpected error. This has been logged and will be reviewed.
          </p>
          {error.message && (
            <p className="text-sm text-red-600 font-mono bg-red-50 p-2 rounded">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="default">
            Try Again
          </Button>
          <BugReportButton 
            variant="outline"
            defaultCategory="ui"
            contextInfo={{
              errorMessage: error.message,
              errorStack: error.stack,
              errorDigest: error.digest,
            }}
          >
            Report This Error
          </BugReportButton>
        </div>

        <p className="text-[10px] tracking-widest text-muted-foreground/30 uppercase select-none pt-4">
          Powered by COVOS
        </p>
      </div>
    </div>
  );
}
