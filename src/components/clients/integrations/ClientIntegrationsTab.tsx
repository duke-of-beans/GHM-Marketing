"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ConnectionInfo {
  connected:    boolean;
  googleEmail?: string;
  locationName?: string;  // GBP only
  accountName?:  string;  // Ads only
  customerId?:   string;  // Ads only
  connectedAt?:  string;
  lastSyncAt?:   string | null;
  isActive?:     boolean;
}

interface IntegrationData {
  gbp:        ConnectionInfo;
  googleAds:  ConnectionInfo;
}

interface Props {
  clientId: number;
}

export function ClientIntegrationsTab({ clientId }: Props) {
  const [data, setData]       = useState<IntegrationData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await fetch(`/api/clients/${clientId}/integrations`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(json.data);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  async function disconnect(type: "gbp" | "google_ads") {
    if (!confirm(`Disconnect ${type === "gbp" ? "Google Business Profile" : "Google Ads"}? The client will need to re-authorize.`)) return;
    try {
      const res = await fetch(`/api/clients/${clientId}/integrations?type=${type}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success("Disconnected successfully");
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Disconnect failed");
    }
  }

  function ConnectCard({
    title,
    description,
    connection,
    connectHref,
    disconnectType,
    details,
  }: {
    title:         string;
    description:   string;
    connection:    ConnectionInfo;
    connectHref:   string;
    disconnectType: "gbp" | "google_ads";
    details?:      React.ReactNode;
  }) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {connection.connected
                ? <CheckCircle2 className="h-4 w-4 text-status-success" />
                : <Circle className="h-4 w-4 text-muted-foreground" />}
              <CardTitle className="text-base">{title}</CardTitle>
            </div>
            <Badge variant={connection.connected ? "default" : "outline"} className={connection.connected ? "bg-status-success-bg/10 text-status-success border-status-success-border" : ""}>
              {connection.connected ? "Connected" : "Not Connected"}
            </Badge>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {connection.connected ? (
            <>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Account:</span> {connection.googleEmail}</p>
                {details}
                {connection.connectedAt && (
                  <p><span className="text-muted-foreground">Connected:</span> {new Date(connection.connectedAt).toLocaleDateString()}</p>
                )}
                {connection.lastSyncAt && (
                  <p><span className="text-muted-foreground">Last sync:</span> {new Date(connection.lastSyncAt).toLocaleDateString()}</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive gap-1.5"
                onClick={() => disconnect(disconnectType)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Disconnect
              </Button>
            </>
          ) : (
            <Button size="sm" asChild className="gap-1.5">
              <a href={connectHref}>
                <ExternalLink className="h-3.5 w-3.5" />
                Connect {title}
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Connect third-party accounts to enable data sync for reports and dashboards.
        </p>
        <Button variant="ghost" size="sm" onClick={load} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      <ConnectCard
        title="Google Business Profile"
        description="Sync reviews, insights, and local search performance."
        connection={data.gbp}
        connectHref={`/api/oauth/google/connect/${clientId}`}
        disconnectType="gbp"
        details={
          data.gbp.locationName
            ? <p><span className="text-muted-foreground">Location:</span> {data.gbp.locationName}</p>
            : null
        }
      />

      <ConnectCard
        title="Google Ads"
        description="Sync campaign performance, spend, and keyword data into reports."
        connection={data.googleAds}
        connectHref={`/api/oauth/google-ads/connect/${clientId}`}
        disconnectType="google_ads"
        details={
          data.googleAds.accountName ? (
            <>
              <p><span className="text-muted-foreground">Account:</span> {data.googleAds.accountName}</p>
              <p><span className="text-muted-foreground">Customer ID:</span> {data.googleAds.customerId}</p>
            </>
          ) : null
        }
      />
    </div>
  );
}
