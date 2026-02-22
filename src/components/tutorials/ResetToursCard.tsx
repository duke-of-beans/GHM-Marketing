"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { resetAllTours } from "@/lib/tutorials";

/**
 * ResetToursCard — shown on the Profile page.
 * Lets users clear the "seen" flag for all page tours so they auto-start again on next visit.
 */
export function ResetToursCard() {
  const [resetting, setResetting] = useState(false);

  function handleReset() {
    setResetting(true);
    try {
      resetAllTours();
      toast.success("All page tours reset — they'll run again on your next visit to each page.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4" />
          Page Tours
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Each page has a guided tour that runs automatically on your first visit. Once you&apos;ve seen it, it won&apos;t show again — but you can re-run any tour using the <strong>?</strong> icon in the page header.
        </p>
        <p className="text-sm text-muted-foreground">
          Reset all tours here to replay them from the beginning on your next visit.
        </p>
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={resetting}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All Tours
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
