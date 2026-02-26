"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useRefetchOnFocus } from "@/lib/hooks/use-refetch-on-focus";
import { formatCurrency } from "@/components/dashboard/metric-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ClientBreakdownItem {
  id: number;
  businessName: string;
  retainerAmount: number;
  lockedResidualAmount: number | null;
  closedInMonth: string | null;
  onboardedMonth: string | null;
}

interface UpsellLineItem {
  id: number;
  amount: number;
  status: string;
  month: string;
  clientName: string;
  notes: string;
}

interface EarningsData {
  totalCommissionEarned: number;
  totalResidualEarned: number;
  totalUpsellEarned: number;
  monthlyResidual: number;
  activeClients: number;
  pendingCommissions: number;
  pendingUpsell: number;
  projectedMonthly: number;
  clientBreakdown: ClientBreakdownItem[];
  upsellLineItems: UpsellLineItem[];
  thisMonthResidualsPaid: number;
  thisMonthResidualsPending: number;
}

export function MyEarningsWidget() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookBreakdown, setShowBookBreakdown] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);

  const fetchEarnings = useCallback(async () => {
    try {
      const res = await fetch("/api/payments/my-earnings");
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (error) {
      console.error("Failed to fetch earnings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);
  useRefetchOnFocus(fetchEarnings);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            My Earnings
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
            <DollarSign className="h-4 w-4" />
            My Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No earnings data available</p>
        </CardContent>
      </Card>
    );
  }

  const totalEarned = data.totalCommissionEarned + data.totalResidualEarned + data.totalUpsellEarned;
  const totalPending = data.pendingCommissions + data.pendingUpsell;

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              My Earnings
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Total paid earnings from commissions, residuals, and service commissions.
                  Residual rates are locked at the retainer amount when the deal was closed.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Total Earned */}
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-status-success">{formatCurrency(totalEarned)}</p>
              <p className="text-xs text-muted-foreground">Total Paid</p>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
              <div>
                <p className="text-muted-foreground">Commissions</p>
                <p className="font-medium">{formatCurrency(data.totalCommissionEarned)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Residuals</p>
                <p className="font-medium">{formatCurrency(data.totalResidualEarned)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Service Commissions</p>
                <p className="font-medium">{formatCurrency(data.totalUpsellEarned)}</p>
              </div>
            </div>
          </div>


          {/* Monthly Book — locked rates breakdown */}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium">Monthly Book</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(data.monthlyResidual)}
                </p>
                <button
                  onClick={() => setShowBookBreakdown(!showBookBreakdown)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Toggle book breakdown"
                >
                  {showBookBreakdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.activeClients} active clients · locked rates at close
            </p>

            {showBookBreakdown && data.clientBreakdown.length > 0 && (
              <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
                {data.clientBreakdown.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.businessName}</p>
                      <p className="text-muted-foreground">${c.retainerAmount.toLocaleString()}/mo retainer</p>
                    </div>
                    <div className="text-right ml-2 shrink-0">
                      {c.lockedResidualAmount !== null ? (
                        <Badge variant="secondary" className="text-xs">
                          {formatCurrency(c.lockedResidualAmount)}/mo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          legacy
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showBookBreakdown && data.clientBreakdown.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">No active clients yet.</p>
            )}
          </div>


          {/* This month residual status */}
          {(data.thisMonthResidualsPaid > 0 || data.thisMonthResidualsPending > 0) && (
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">This Month</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {data.thisMonthResidualsPaid > 0 && (
                  <div>
                    <p className="text-muted-foreground">Residuals Paid</p>
                    <p className="font-medium text-status-success">{formatCurrency(data.thisMonthResidualsPaid)}</p>
                  </div>
                )}
                {data.thisMonthResidualsPending > 0 && (
                  <div>
                    <p className="text-muted-foreground">Residuals Pending</p>
                    <p className="font-medium text-status-warning">{formatCurrency(data.thisMonthResidualsPending)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Service Commissions */}
          {(data.totalUpsellEarned > 0 || data.pendingUpsell > 0 || data.upsellLineItems.length > 0) && (
            <div className="pt-3 border-t">
              <button
                onClick={() => setShowUpsell(!showUpsell)}
                className="flex items-center justify-between w-full text-sm font-medium hover:text-foreground"
              >
                <span>Service Commissions</span>
                <div className="flex items-center gap-1">
                  {data.pendingUpsell > 0 && (
                    <Badge variant="outline" className="text-xs text-status-warning border-status-warning-border">
                      {formatCurrency(data.pendingUpsell)} pending
                    </Badge>
                  )}
                  {showUpsell ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {showUpsell && (
                <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                  {data.upsellLineItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No service commissions yet.</p>
                  ) : (
                    data.upsellLineItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{item.clientName}</p>
                          <p className="text-muted-foreground">
                            {new Date(item.month).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                          <span className="font-medium">{formatCurrency(item.amount)}</span>
                          <Badge
                            variant={item.status === "paid" ? "secondary" : "outline"}
                            className={`text-xs ${item.status === "pending" ? "text-status-warning border-status-warning-border" : ""}`}
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Pending total */}
          {totalPending > 0 && (
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Total Pending</p>
                <p className="font-medium text-status-warning">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
