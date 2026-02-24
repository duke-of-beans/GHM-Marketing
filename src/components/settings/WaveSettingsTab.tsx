"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle, RefreshCw, Copy, ExternalLink, Zap, Users } from "lucide-react";

interface WaveProduct {
  id: string;
  name: string;
  unitPrice: number;
}

interface WaveStatus {
  connected: boolean;
  businessName: string | null;
  businessId: string | null;
  currentProductId: string | null;
  webhookConfigured: boolean;
  error?: string;
}

export function WaveSettingsTab() {
  const [status, setStatus] = useState<WaveStatus | null>(null);
  const [products, setProducts] = useState<WaveProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [syncingCustomers, setSyncingCustomers] = useState(false);
  const [syncingPartners, setSyncingPartners] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadStatus();
    // Build the webhook URL from current domain
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/wave/webhook`);
    }
  }, []);

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/wave/settings/status");
      if (res.ok) setStatus(await res.json());
    } catch {
      setStatus({ connected: false, businessName: null, businessId: null, currentProductId: null, webhookConfigured: false, error: "Failed to reach Wave API" });
    } finally {
      setLoadingStatus(false);
    }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/wave/settings/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products ?? []);
      }
    } finally {
      setLoadingProducts(false);
    }
  };

  const saveProduct = async () => {
    if (!selectedProduct) return;
    setSavingProduct(true);
    try {
      const res = await fetch("/api/wave/settings/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProduct }),
      });
      if (res.ok) {
        await loadStatus();
        setSyncResult("Product ID saved successfully.");
      } else {
        setSyncResult("Failed to save product ID.");
      }
    } finally {
      setSavingProduct(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const syncCustomers = async () => {
    setSyncingCustomers(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/wave/sync/customers", { method: "POST" });
      const data = await res.json();
      setSyncResult(`Customer sync: ${data.results?.synced ?? 0} new, ${data.results?.alreadyLinked ?? 0} already linked, ${data.results?.failed ?? 0} failed`);
    } catch {
      setSyncResult("Customer sync failed.");
    } finally {
      setSyncingCustomers(false);
    }
  };

  const syncPartners = async () => {
    setSyncingPartners(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/wave/partners/sync", { method: "POST" });
      const data = await res.json();
      setSyncResult(`Partner sync: ${data.results?.synced ?? 0} new vendors, ${data.results?.alreadyLinked ?? 0} already linked`);
    } catch {
      setSyncResult("Partner sync failed.");
    } finally {
      setSyncingPartners(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Wave Connection
            <Button variant="ghost" size="sm" onClick={loadStatus} disabled={loadingStatus}>
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? "animate-spin" : ""}`} />
            </Button>
          </CardTitle>
          <CardDescription>Current status of your Wave Accounting integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingStatus ? (
            <div className="h-16 bg-muted animate-pulse rounded" />
          ) : status ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {status.connected
                  ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                  : <XCircle className="w-4 h-4 text-red-500" />}
                <span className="font-medium">{status.connected ? "Connected" : "Not connected"}</span>
                {status.businessName && <span className="text-muted-foreground">— {status.businessName}</span>}
              </div>
              {status.error && <p className="text-destructive text-xs">{status.error}</p>}
              {!status.connected && (
                <div className="mt-3 border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 rounded-lg p-3 space-y-2 text-xs text-orange-900 dark:text-orange-100">
                  <p className="font-medium">Wave is not configured for this environment.</p>
                  <p>Add the following to your <code className="bg-orange-100 dark:bg-orange-900 px-1 rounded">.env</code> file:</p>
                  <ul className="space-y-1 font-mono">
                    <li>WAVE_API_KEY=your_api_key</li>
                    <li>WAVE_BUSINESS_ID=your_business_id</li>
                    <li>WAVE_WEBHOOK_SECRET=your_webhook_secret</li>
                    <li>WAVE_SEO_PRODUCT_ID=your_product_id</li>
                  </ul>
                  <a
                    href="https://developer.waveapps.com/hc/en-us/articles/360019493652-API-Access-and-Authentication"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline font-medium"
                  >
                    Get your Wave API credentials <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {status.connected && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Business ID</p>
                    <p className="font-mono text-xs truncate">{status.businessId ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">SEO Product ID</p>
                    <div className="flex items-center gap-1">
                      <p className="font-mono text-xs truncate">{status.currentProductId ?? "not set"}</p>
                      {status.currentProductId
                        ? <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                        : <XCircle className="w-3 h-3 text-orange-500 flex-shrink-0" />}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Webhook</p>
                    <div className="flex items-center gap-1">
                      <p className="text-xs">{status.webhookConfigured ? "Configured" : "Not configured"}</p>
                      {status.webhookConfigured
                        ? <CheckCircle2 className="w-3 h-3 text-green-600" />
                        : <XCircle className="w-3 h-3 text-orange-500" />}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Could not load Wave status.</p>
          )}
        </CardContent>
      </Card>

      {/* SEO Product selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SEO Retainer Product</CardTitle>
          <CardDescription>
            Select the Wave product used for monthly retainer invoices. You must create the product
            in Wave first, then select it here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              {products.length > 0 ? (
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — ${p.unitPrice}/mo
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  Load products from Wave to select one.
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={loadProducts} disabled={loadingProducts}>
              {loadingProducts ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Load Products"}
            </Button>
            {selectedProduct && (
              <Button size="sm" onClick={saveProduct} disabled={savingProduct}>
                {savingProduct ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Don&apos;t see your product?{" "}
            <a
              href="https://app.waveapps.com/accounting/products"
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex items-center gap-0.5"
            >
              Create it in Wave <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Webhook setup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhook Configuration</CardTitle>
          <CardDescription>
            Configure this URL in Wave to receive real-time payment events. Set the webhook secret in your
            environment as <code className="text-xs bg-muted px-1 rounded">WAVE_WEBHOOK_SECRET</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Webhook URL</p>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="sm" onClick={copyWebhookUrl}>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 rounded p-3">
            <p className="font-medium text-foreground">Setup steps:</p>
            <p>1. Go to Wave Settings → Integrations → Webhooks</p>
            <p>2. Add the URL above as your webhook endpoint</p>
            <p>3. Copy the signing secret Wave generates</p>
            <p>4. Add it to your environment as <code className="bg-muted px-1 rounded">WAVE_WEBHOOK_SECRET</code></p>
            <p>5. Subscribe to: invoice.payment.created, invoice.sent, invoice.viewed, bill.payment.created</p>
          </div>
          <a
            href="https://app.waveapps.com/settings/webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            Open Wave Webhook Settings <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </CardContent>
      </Card>

      {/* Manual sync actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manual Sync</CardTitle>
          <CardDescription>
            Run these once after initial setup to link existing clients and team members to Wave.
            Crons handle this automatically going forward.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={syncCustomers} disabled={syncingCustomers}>
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              {syncingCustomers ? "Syncing..." : "Sync Clients → Wave Customers"}
            </Button>
            <Button variant="outline" size="sm" onClick={syncPartners} disabled={syncingPartners}>
              <Users className="w-3.5 h-3.5 mr-1.5" />
              {syncingPartners ? "Syncing..." : "Sync Partners → Wave Vendors"}
            </Button>
          </div>
          {syncResult && (
            <p className="text-sm text-muted-foreground border rounded p-2 bg-muted/50">{syncResult}</p>
          )}
        </CardContent>
      </Card>

      {/* Cron schedule info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Automation Schedule</CardTitle>
          <CardDescription>Automated jobs running via Vercel Crons</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {[
              { cron: "1st of month, 00:05 UTC", label: "Monthly invoice batch", desc: "Generates and sends retainer invoices for all active clients" },
              { cron: "Daily, 14:00 UTC (9 AM ET)", label: "Payment check + escalation", desc: "Scans overdue invoices and escalates client payment status" },
            ].map((job) => (
              <div key={job.label} className="flex items-start gap-3 py-2 border-b last:border-0">
                <Badge variant="outline" className="font-mono text-xs whitespace-nowrap mt-0.5">{job.cron}</Badge>
                <div>
                  <p className="font-medium">{job.label}</p>
                  <p className="text-xs text-muted-foreground">{job.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
