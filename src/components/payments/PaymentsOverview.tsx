"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ExternalLink, Search, DollarSign, AlertTriangle, Users, Zap } from "lucide-react";
import Link from "next/link";

interface InvoicePreview {
  id: number;
  invoiceNumber: string | null;
  amount: number;
  status: string;
  issuedDate: string;
  dueDate: string;
  paidDate: string | null;
  waveViewUrl: string | null;
}

interface ClientRow {
  id: number;
  businessName: string;
  retainerAmount: number;
  paymentStatus: string;
  lastInvoiceDate: string | null;
  lastPaymentDate: string | null;
  waveCustomerId: string | null;
  invoiceRecords: InvoicePreview[];
}

interface Partner {
  userId: number;
  user: { id: number; name: string; email: string; role: string };
  total: number;
  count: number;
}

const PAYMENT_STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  current:     { label: "Current",      variant: "default" },
  grace:       { label: "Grace",        variant: "outline" },
  overdue:     { label: "Overdue",      variant: "destructive" },
  paused:      { label: "Paused",       variant: "destructive" },
  collections: { label: "Collections", variant: "destructive" },
  terminated:  { label: "Terminated",  variant: "secondary" },
};

const INV_STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary", sent: "outline", viewed: "outline", paid: "default", overdue: "destructive", cancelled: "secondary",
};

export function PaymentsOverview({ clients, partners }: { clients: ClientRow[]; partners: Partner[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [batchRunning, setBatchRunning] = useState(false);
  const [syncRunning, setSyncRunning] = useState(false);
  const [payoutRunning, setPayoutRunning] = useState(false);

  const filtered = clients.filter((c) => {
    const matchSearch = c.businessName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.paymentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalMrr = clients.reduce((sum, c) => sum + Number(c.retainerAmount), 0);
  const overdueClients = clients.filter((c) => ["overdue", "paused", "collections"].includes(c.paymentStatus));
  const totalOutstanding = clients.reduce((sum, c) => {
    const unpaid = c.invoiceRecords.filter((i) => ["sent", "viewed", "overdue"].includes(i.status));
    return sum + unpaid.reduce((s, i) => s + Number(i.amount), 0);
  }, 0);
  const totalPendingCommissions = partners.reduce((sum, p) => sum + p.total, 0);

  const runBatch = async (dryRun: boolean) => {
    setBatchRunning(true);
    try {
      const res = await fetch("/api/wave/invoices/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      alert(dryRun
        ? `Dry run: ${data.toInvoice?.length ?? 0} clients to invoice, total $${data.totalAmount?.toLocaleString()}`
        : `Batch complete: ${data.results?.success} sent, ${data.results?.failed} failed`
      );
      if (!dryRun) window.location.reload();
    } catch (e) {
      alert("Batch failed: " + e);
    } finally {
      setBatchRunning(false);
    }
  };

  const syncCustomers = async () => {
    setSyncRunning(true);
    try {
      const res = await fetch("/api/wave/sync/customers", { method: "POST" });
      const data = await res.json();
      alert(`Sync complete: ${data.results?.synced} new, ${data.results?.alreadyLinked} already linked`);
    } catch (e) {
      alert("Sync failed: " + e);
    } finally {
      setSyncRunning(false);
    }
  };

  const runPayout = async (dryRun: boolean) => {
    setPayoutRunning(true);
    try {
      const res = await fetch("/api/wave/partners/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      if (dryRun) {
        const lines = (data.preview ?? []).map((p: any) => `${p.name}: $${p.totalAmount.toLocaleString()}`).join("\n");
        alert(`Payout preview:\n${lines || "No pending commissions"}`);
      } else {
        alert(`Payouts created: ${data.results?.processed} transactions, $${data.results?.totalPaid?.toLocaleString()}`);
      }
    } catch (e) {
      alert("Payout failed: " + e);
    } finally {
      setPayoutRunning(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground text-sm">AR, invoicing, and partner commissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={syncCustomers} disabled={syncRunning}>
            {syncRunning ? "Syncing..." : "Sync Customers"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={batchRunning}>
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                Batch Preview
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Run Invoice Batch?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will generate and send retainer invoices for all active clients not yet invoiced this month.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => runBatch(true)} className="mr-2">Dry Run</AlertDialogAction>
                <AlertDialogAction onClick={() => runBatch(false)}>Generate All</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Monthly MRR</p>
            <p className="text-xl font-bold">${totalMrr.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{clients.length} active clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Outstanding AR</p>
            <p className={`text-xl font-bold ${totalOutstanding > 0 ? "text-status-warning" : "text-status-success"}`}>
              ${totalOutstanding.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">unpaid invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">At Risk</p>
            <p className={`text-xl font-bold ${overdueClients.length > 0 ? "text-status-danger" : "text-status-success"}`}>
              {overdueClients.length}
            </p>
            <p className="text-xs text-muted-foreground">overdue / paused / collections</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Pending Commissions</p>
            <p className="text-xl font-bold">${totalPendingCommissions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{partners.length} partners</p>
          </CardContent>
        </Card>
      </div>

      {/* Client AR table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Client AR</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 w-48 text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 text-sm border rounded px-2 bg-background"
              >
                <option value="all">All statuses</option>
                <option value="current">Current</option>
                <option value="grace">Grace</option>
                <option value="overdue">Overdue</option>
                <option value="paused">Paused</option>
                <option value="collections">Collections</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-medium uppercase tracking-wider">Client</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider">Retainer</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider">Latest Invoice</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider">Due</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider">Inv Status</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider">Last Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => {
                const latest = client.invoiceRecords[0];
                const psBadge = PAYMENT_STATUS_BADGE[client.paymentStatus] ?? { label: client.paymentStatus, variant: "secondary" as const };
                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link href={`/clients/${client.id}?tab=billing`} className="font-medium hover:underline text-sm">
                        {client.businessName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={psBadge.variant} className="text-xs">{psBadge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">${Number(client.retainerAmount).toLocaleString()}</TableCell>
                    <TableCell className="text-sm font-mono text-xs">
                      {latest ? (latest.invoiceNumber ?? "—") : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {latest ? format(new Date(latest.dueDate), "MMM d") : "—"}
                    </TableCell>
                    <TableCell>
                      {latest ? (
                        <div className="flex items-center gap-1">
                          <Badge variant={INV_STATUS_BADGE[latest.status] ?? "secondary"} className="text-xs">
                            {latest.status}
                          </Badge>
                          {latest.waveViewUrl && (
                            <a href={latest.waveViewUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {client.lastPaymentDate ? format(new Date(client.lastPaymentDate), "MMM d, yyyy") : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No clients match your filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Partner commissions */}
      {partners.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Pending Partner Commissions
              </CardTitle>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" disabled={payoutRunning}>
                    <DollarSign className="w-3.5 h-3.5 mr-1.5" />
                    {payoutRunning ? "Processing..." : "Run Payouts"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Process Partner Payouts?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will create Wave bills for all {partners.length} partners with pending commissions totaling ${totalPendingCommissions.toLocaleString()}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => runPayout(true)} className="mr-2">Dry Run</AlertDialogAction>
                    <AlertDialogAction onClick={() => runPayout(false)}>Process All</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-medium uppercase tracking-wider">Partner</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider">Role</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider">Transactions</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider">Total Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((p) => (
                  <TableRow key={p.userId}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{p.user.name}</p>
                        <p className="text-xs text-muted-foreground">{p.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{p.user.role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{p.count}</TableCell>
                    <TableCell className="text-sm font-semibold">${p.total.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
