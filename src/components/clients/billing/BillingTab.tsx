"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ExternalLink, Send, RefreshCw, DollarSign, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface InvoiceRecord {
  id: number;
  waveInvoiceId: string;
  invoiceNumber: string | null;
  amount: number;
  status: string;
  issuedDate: string;
  dueDate: string;
  paidDate: string | null;
  paidAmount: number | null;
  paymentMethod: string | null;
  waveViewUrl: string | null;
}

interface BillingData {
  client: {
    id: number;
    businessName: string;
    retainerAmount: number;
    paymentStatus: string;
    lastInvoiceDate: string | null;
    lastPaymentDate: string | null;
    waveCustomerId: string | null;
  };
  invoices: InvoiceRecord[];
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    outstanding: number;
    count: number;
  };
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  draft:    { label: "Draft",    variant: "secondary",    icon: <Clock className="w-3 h-3" /> },
  sent:     { label: "Sent",     variant: "outline",      icon: <Send className="w-3 h-3" /> },
  viewed:   { label: "Viewed",   variant: "outline",      icon: <Send className="w-3 h-3" /> },
  paid:     { label: "Paid",     variant: "default",      icon: <CheckCircle2 className="w-3 h-3" /> },
  overdue:  { label: "Overdue",  variant: "destructive",  icon: <AlertTriangle className="w-3 h-3" /> },
  cancelled:{ label: "Cancelled",variant: "secondary",    icon: null },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  current:     { label: "Current",     color: "text-status-success" },
  grace:       { label: "Grace Period",color: "text-status-warning" },
  overdue:     { label: "Overdue",     color: "text-status-warning" },
  paused:      { label: "Paused",      color: "text-status-danger" },
  collections: { label: "Collections", color: "text-status-danger font-bold" },
  terminated:  { label: "Terminated",  color: "text-muted-foreground" },
};

export function BillingTab({ clientId, businessName }: { clientId: number; businessName: string }) {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/wave/invoices/${clientId}`);
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load billing data");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const generateInvoice = async (dryRun = false) => {
    setGenerating(true);
    try {
      const res = await fetch("/api/wave/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, dryRun }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed to generate invoice");
      if (!dryRun) await load();
      return result;
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { client, invoices, summary } = data;
  const paymentStatusCfg = PAYMENT_STATUS_CONFIG[client.paymentStatus] ?? { label: client.paymentStatus, color: "text-muted-foreground" };
  const hasUnpaidThisMonth = invoices.some(inv => {
    const issued = new Date(inv.issuedDate);
    const now = new Date();
    return issued.getMonth() === now.getMonth() && issued.getFullYear() === now.getFullYear() && inv.status !== "cancelled";
  });

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Payment Status</p>
            <p className={`font-semibold ${paymentStatusCfg.color}`}>{paymentStatusCfg.label}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Monthly Retainer</p>
            <p className="font-semibold">${Number(client.retainerAmount).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Outstanding</p>
            <p className={`font-semibold ${summary.outstanding > 0 ? "text-status-warning" : "text-status-success"}`}>
              ${summary.outstanding.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Total Collected</p>
            <p className="font-semibold">${summary.totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {client.lastPaymentDate && (
            <span>Last payment: {format(new Date(client.lastPaymentDate), "MMM d, yyyy")}</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>

          {!hasUnpaidThisMonth && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" disabled={generating}>
                  <DollarSign className="w-3.5 h-3.5 mr-1.5" />
                  {generating ? "Generating..." : "Generate Invoice"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Generate Invoice</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will create and send a retainer invoice for {businessName} for{" "}
                    {format(new Date(), "MMMM yyyy")} — ${Number(client.retainerAmount).toLocaleString()}.
                    The invoice will be emailed to the client via Wave.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => generateInvoice(false)}>
                    Generate & Send
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Invoice table */}
      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No invoices yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Invoice History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-medium uppercase tracking-wider">Invoice</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider">Issued</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider">Due</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider">Amount</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider">Paid</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const cfg = STATUS_CONFIG[inv.status] ?? { label: inv.status, variant: "secondary" as const, icon: null };
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs">{inv.invoiceNumber ?? inv.waveInvoiceId.slice(-8)}</TableCell>
                      <TableCell className="text-sm">{format(new Date(inv.issuedDate), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-sm">{format(new Date(inv.dueDate), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-sm font-medium">${Number(inv.amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant} className="flex items-center gap-1 w-fit text-xs">
                          {cfg.icon}
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {inv.paidDate ? format(new Date(inv.paidDate), "MMM d") : "—"}
                      </TableCell>
                      <TableCell>
                        {inv.waveViewUrl && (
                          <a href={inv.waveViewUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
