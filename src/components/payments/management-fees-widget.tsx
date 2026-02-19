"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, HelpCircle } from "lucide-react";
import { useRefetchOnFocus } from "@/lib/hooks/use-refetch-on-focus";
import { formatCurrency } from "@/components/dashboard/metric-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ManagementFeesData {
  totalFeesEarned: number;
  monthlyFees: number;
  managedClients: number;
  pendingFees: number;
}

export function ManagementFeesWidget() {
  const [data, setData] = useState<ManagementFeesData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFees = useCallback(async () => {
    try {
      const res = await fetch("/api/payments/management-fees");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch management fees:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFees(); }, [fetchFees]);
  useRefetchOnFocus(fetchFees);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Management Fees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Management Fees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No management fees data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Management Fees
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Your earnings as a Master Manager. You receive $240/month for each client you manage, starting in Month 1 after onboarding. Owner accounts are exempt from paying themselves management fees.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Earned */}
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(data.totalFeesEarned)}
            </p>
            <p className="text-xs text-muted-foreground">Total Paid</p>
          </div>
        </div>

        {/* Monthly Recurring */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium">This Month</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Expected management fees for this month based on clients you&apos;re currently managing.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-lg font-bold text-blue-600">
              {formatCurrency(data.monthlyFees)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Managing {data.managedClients} {data.managedClients === 1 ? "client" : "clients"}
          </p>
        </div>

        {/* Pending */}
        {data.pendingFees > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-sm font-medium text-orange-600">
                {formatCurrency(data.pendingFees)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
