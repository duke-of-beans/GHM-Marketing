"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users } from "lucide-react";
import { formatCurrency } from "@/components/dashboard/metric-card";

interface EarningsData {
  totalCommissionEarned: number;
  totalResidualEarned: number;
  monthlyResidual: number;
  activeClients: number;
  pendingCommissions: number;
  projectedMonthly: number;
}

export function MyEarningsWidget() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const res = await fetch("/api/payments/my-earnings");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch earnings:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const totalEarned = data.totalCommissionEarned + data.totalResidualEarned;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          My Earnings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Earned */}
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalEarned)}
            </p>
            <p className="text-xs text-muted-foreground">Total Paid</p>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <div>
              <p className="text-muted-foreground">Commissions</p>
              <p className="font-medium">{formatCurrency(data.totalCommissionEarned)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Residuals</p>
              <p className="font-medium">{formatCurrency(data.totalResidualEarned)}</p>
            </div>
          </div>
        </div>

        {/* Monthly Recurring */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium">Monthly Recurring</p>
            </div>
            <p className="text-lg font-bold text-blue-600">
              {formatCurrency(data.monthlyResidual)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            From {data.activeClients} active {data.activeClients === 1 ? "client" : "clients"}
          </p>
        </div>

        {/* Pending */}
        {data.pendingCommissions > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-sm font-medium text-orange-600">
                {formatCurrency(data.pendingCommissions)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
