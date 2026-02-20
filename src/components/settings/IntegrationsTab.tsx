"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Circle, RefreshCw, Zap } from "lucide-react";
import { toast } from "sonner";
import { CostDashboard } from "./CostDashboard";

interface IntegrationStatus {
  id:         string;
  name:       string;
  configured: boolean;
  healthy:    boolean | null;
  latencyMs:  number | null;
  error:      string | null;
  note:       string | null;
}

export function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading]           = useState(true);
  const [checking, setChecking]         = useState(false);

  async function load() {
    try {
      setChecking(true);
      const res  = await fetch("/api/settings/integrations");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setIntegrations(json.data.integrations);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load integration status");
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }

  useEffect(() => { load(); }, []);

  function StatusIcon({ status }: { status: IntegrationStatus }) {
    if (!status.configured) return <Circle className="h-4 w-4 text-muted-foreground" />;
    if (status.healthy === true)  return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status.healthy === false) return <XCircle className="h-4 w-4 text-destructive" />;
    return <Circle className="h-4 w-4 text-muted-foreground" />;
  }

  function StatusBadge({ status }: { status: IntegrationStatus }) {
    if (!status.configured) return <Badge variant="outline">Not Configured</Badge>;
    if (status.healthy === true)  return <Badge className="bg-green-500/10 text-green-700 border-green-200">Healthy</Badge>;
    if (status.healthy === false) return <Badge variant="destructive">Error</Badge>;
    return <Badge variant="secondary">Unknown</Badge>;
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Integration Health
            </CardTitle>
            <CardDescription className="mt-1">
              Live status of all external API connections
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={checking}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking…" : "Refresh"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <StatusIcon status={integration} />
                  <div>
                    <p className="text-sm font-medium">{integration.name}</p>
                    {integration.note && (
                      <p className="text-xs text-muted-foreground mt-0.5">{integration.note}</p>
                    )}
                    {integration.error && (
                      <p className="text-xs text-destructive mt-0.5">{integration.error}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {integration.latencyMs !== null && (
                    <span className="text-xs text-muted-foreground">
                      {integration.latencyMs}ms
                    </span>
                  )}
                  <StatusBadge status={integration} />
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          Credentials are read from server environment variables. To update, redeploy with updated env vars in Vercel.
        </p>
      </CardContent>
    </Card>

    {/* Cost + Cache Dashboard */}
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          💰 Cost &amp; Cache Dashboard
        </CardTitle>
        <CardDescription>
          AI + enrichment spend and cache utilization — last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CostDashboard />
      </CardContent>
    </Card>
    </>
  );
}
