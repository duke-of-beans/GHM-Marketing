"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, HelpCircle } from "lucide-react";
import { formatCurrency } from "@/components/dashboard/metric-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProfitabilityData {
  totalRevenue: number;
  totalCommissions: number;
  totalResiduals: number;
  totalMasterFees: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  activeClients: number;
  totalPaid: number;
  totalPending: number;
}

export function CompanyProfitabilityWidget() {
  const [data, setData] = useState<ProfitabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    fetchProfitability();
  }, []);

  const fetchProfitability = async () => {
    try {
      const res = await fetch("/api/payments/profitability");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch profitability:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Company Profitability
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
            <TrendingUp className="h-4 w-4" />
            Company Profitability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No profitability data available</p>
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
              <TrendingUp className="h-4 w-4" />
              Company Profitability
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Company profit breakdown showing revenue vs expenses. Net profit = monthly revenue minus all compensation (commissions, residuals, master fees). Owners only.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
      <CardContent className="space-y-4">
        {/* Net Profit */}
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(data.netProfit)}
            </p>
            <p className="text-xs text-muted-foreground">Net Profit</p>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <p className="text-sm text-muted-foreground">
              {data.profitMargin.toFixed(1)}% margin · {data.activeClients} active clients
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Profit margin = (Net Profit ÷ Total Revenue) × 100. Higher margins indicate better operational efficiency.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Revenue & Expenses */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monthly Revenue</span>
            <span className="font-medium">{formatCurrency(data.totalRevenue)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Expenses</span>
            <span className="font-medium text-red-600">
              ({formatCurrency(data.totalExpenses)})
            </span>
          </div>
        </div>

        {/* Breakdown Toggle */}
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-xs text-blue-600 hover:underline w-full text-left"
        >
          {showBreakdown ? "Hide" : "Show"} expense breakdown
        </button>

        {/* Expense Breakdown */}
        {showBreakdown && (
          <div className="pt-3 border-t space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Commissions</span>
              <span>{formatCurrency(data.totalCommissions)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Residuals</span>
              <span>{formatCurrency(data.totalResiduals)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Master Fees</span>
              <span>{formatCurrency(data.totalMasterFees)}</span>
            </div>
          </div>
        )}

        {/* Payment Status */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Paid Out</p>
              <p className="font-medium text-green-600">{formatCurrency(data.totalPaid)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pending</p>
              <p className="font-medium text-orange-600">{formatCurrency(data.totalPending)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
