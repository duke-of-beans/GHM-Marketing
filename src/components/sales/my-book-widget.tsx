"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/components/dashboard/metric-card";
import { useRefetchOnFocus } from "@/lib/hooks/use-refetch-on-focus";

interface MyBookWidgetProps {
  activeClients: number;
}

interface EarningsData {
  monthlyResidual: number;
  activeClients: number;
}

// Churn-adjusted projection: compound monthly at (1 - churnRate) + new closes
function projectBook(
  currentResidual: number,
  months: number,
  monthlyChurnRate = 0.03
): number {
  let residual = currentResidual;
  for (let i = 0; i < months; i++) {
    residual = residual * (1 - monthlyChurnRate);
  }
  return residual;
}

export function MyBookWidget({ activeClients }: MyBookWidgetProps) {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/payments/my-earnings");
      const json = await res.json();
      if (json.success) setEarnings(json.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useRefetchOnFocus(fetchData);

  const monthly = earnings?.monthlyResidual ?? 0;
  const proj6 = projectBook(monthly, 6);
  const proj12 = projectBook(monthly, 12);
  const avgPerClient = activeClients > 0 ? monthly / activeClients : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BookOpen className="h-4 w-4 text-status-success" />
          My Book
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current monthly residual */}
            <div>
              <p className="text-3xl font-bold text-status-success">
                {formatCurrency(monthly)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monthly residual · {activeClients} active client{activeClients !== 1 ? "s" : ""}
                {activeClients > 0 && ` · ${formatCurrency(avgPerClient)} avg`}
              </p>
            </div>

            {/* Projections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                <p className="text-xs text-muted-foreground mb-0.5">6 months</p>
                <p className="text-base font-semibold">
                  {formatCurrency(proj6)}
                  <span className="text-xs text-muted-foreground font-normal">/mo</span>
                </p>
                <p className="text-[11px] text-muted-foreground">with 3% churn</p>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                <p className="text-xs text-muted-foreground mb-0.5">12 months</p>
                <p className="text-base font-semibold">
                  {formatCurrency(proj12)}
                  <span className="text-xs text-muted-foreground font-normal">/mo</span>
                </p>
                <p className="text-[11px] text-muted-foreground">with 3% churn</p>
              </div>
            </div>

            {monthly === 0 && activeClients === 0 && (
              <p className="text-xs text-muted-foreground text-center py-1">
                Close your first client to start building residual income.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
