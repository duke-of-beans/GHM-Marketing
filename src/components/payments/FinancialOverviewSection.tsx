"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface BankAccount {
  id: string;
  name: string;
  balance: number;
  currency: { code: string; symbol: string };
  subtype: { name: string; value: string };
}

interface WaveTx {
  id: string;
  description: string | null;
  date: string;
  amount: number;
  account: { id: string; name: string } | null;
}

interface LiveSummary {
  bankAccounts: BankAccount[];
  totalBankBalance: number;
  ar: {
    totalOutstanding: number;
    totalOverdue: number;
    overdueCount: number;
    collectedMTD: number;
    nextExpected: { dueDate: string; amount: number; status: string } | null;
  };
  ap: {
    totalPending: number;
    pendingCount: number;
  };
  netCash: number;
  recentTransactions: WaveTx[];
  waveError: string | null;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function FinancialOverviewSection() {
  const [data, setData] = useState<LiveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/finance/live-summary");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  );

  if (error) return (
    <Card className="border-destructive">
      <CardContent className="pt-4 text-sm text-destructive">
        Failed to load live summary: {error}
        <Button size="sm" variant="outline" className="ml-3" onClick={load}>Retry</Button>
      </CardContent>
    </Card>
  );

  if (!data) return null;

  const { bankAccounts, totalBankBalance, ar, ap, netCash, recentTransactions, waveError } = data;
  const netPositive = netCash >= 0;

  return (
    <div className="space-y-4">
      {/* Wave error warning (non-fatal — DB data still shown) */}
      {waveError && (
        <div className="flex items-center gap-2 text-sm text-status-warning bg-status-warning-bg border border-status-warning-border rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Live bank data unavailable. Showing payment records only.</span>
          <Button size="sm" variant="ghost" className="ml-auto h-6 px-2 text-status-warning hover:text-status-warning" onClick={load}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Bank balance */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Bank Balance</p>
              <Landmark className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold">{fmt(totalBankBalance)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {bankAccounts.length > 0
                ? bankAccounts.map(a => a.name).join(", ")
                : "Connected accounts"}
            </p>
          </CardContent>
        </Card>

        {/* AR outstanding */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Cash In (AR)</p>
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className={`text-xl font-bold ${ar.totalOutstanding > 0 ? "text-status-warning" : "text-status-success"}`}>
              {fmt(ar.totalOutstanding)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              outstanding invoices
              {ar.overdueCount > 0 && (
                <span className="ml-1 text-status-danger">· {ar.overdueCount} overdue</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* AP pending */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Cash Out (AP)</p>
              <TrendingDown className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-status-warning">{fmt(ap.totalPending)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {ap.pendingCount} partner payment{ap.pendingCount !== 1 ? "s" : ""} pending
            </p>
          </CardContent>
        </Card>

        {/* Net cash */}
        <Card className={netPositive ? "" : "border-status-danger-border"}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Net Position</p>
              <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className={`text-xl font-bold ${netPositive ? "text-status-success" : "text-status-danger"}`}>
              {fmt(netCash)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">bank − pending AP</p>
          </CardContent>
        </Card>
      </div>

      {/* AR/AP detail + recent transactions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AR + AP detail */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cash Flow Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Accounts Receivable</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Collected MTD</span>
                <span className="font-medium text-status-success">{fmt(ar.collectedMTD)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outstanding</span>
                <span className={`font-medium ${ar.totalOutstanding > 0 ? "text-status-warning" : ""}`}>
                  {fmt(ar.totalOutstanding)}
                </span>
              </div>
              {ar.totalOverdue > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-status-danger" /> Overdue
                  </span>
                  <span className="font-medium text-status-danger">{fmt(ar.totalOverdue)}</span>
                </div>
              )}
              {ar.nextExpected && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next expected</span>
                  <span className="font-medium">
                    {fmt(ar.nextExpected.amount)} · {format(new Date(ar.nextExpected.dueDate), "MMM d")}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t pt-3 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Accounts Payable</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending partner payments</span>
                <span className="font-medium text-status-warning">{fmt(ap.totalPending)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transactions</span>
                <span className="font-medium">{ap.pendingCount}</span>
              </div>
            </div>

            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Net working capital</span>
              <span className={netPositive ? "text-status-success" : "text-status-danger"}>{fmt(netCash)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Wave transactions */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
              <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Refresh transactions" onClick={load}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh transactions</TooltipContent>
            </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {waveError ? "Wave connection required to show transactions." : "No recent transactions."}
              </p>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      {tx.amount >= 0
                        ? <ArrowUpRight className="w-3.5 h-3.5 text-status-success shrink-0" />
                        : <ArrowDownRight className="w-3.5 h-3.5 text-status-danger shrink-0" />
                      }
                      <div className="min-w-0">
                        <p className="truncate font-medium">{tx.description ?? "Transaction"}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(tx.date), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    <span className={`font-medium ml-2 shrink-0 ${tx.amount >= 0 ? "text-status-success" : "text-status-danger"}`}>
                      {tx.amount >= 0 ? "+" : ""}{fmt(Math.abs(tx.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bank account detail (if multiple accounts) */}
      {bankAccounts.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {bankAccounts.map(acct => (
            <Card key={acct.id} className="bg-muted/30">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground truncate">{acct.name}</p>
                <p className="text-base font-semibold mt-0.5">{fmt(acct.balance)}</p>
                <Badge variant="outline" className="text-xs mt-1">{acct.subtype.name}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
