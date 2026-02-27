"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

type TokenStatus = "pending" | "in_progress" | "completed" | "expired";

interface OnboardingTokenData {
  id: number;
  token: string;
  status: TokenStatus;
  expiresAt: string;
  lastAccessedAt: string | null;
  accessCount: number;
  createdAt: string;
  submission?: {
    id: number;
    submittedAt: string;
    onboardingComplete: boolean;
  } | null;
}

interface OnboardingPanelProps {
  leadId: number;
  leadStatus: string;
}

const STATUS_CONFIG: Record<TokenStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "default" },
  completed: { label: "Completed", variant: "default" },
  expired: { label: "Expired", variant: "destructive" },
};

export function OnboardingPanel({ leadId, leadStatus }: OnboardingPanelProps) {
  const [tokenData, setTokenData] = useState<OnboardingTokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}/onboarding-token`);
      if (res.ok) {
        const data = await res.json();
        setTokenData(data.data ?? null);
      } else if (res.status !== 404) {
        console.error("Failed to fetch onboarding token");
      } else {
        setTokenData(null);
      }
    } catch {
      // silently fail — panel just shows "generate" state
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/onboarding/generate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Onboarding link generated");
        fetchToken();
      } else {
        toast.error(data.error || "Failed to generate link");
      }
    } catch {
      toast.error("Failed to generate link");
    } finally {
      setGenerating(false);
    }
  };

  const getLink = () => {
    if (!tokenData) return "";
    const base = window.location.origin;
    return `${base}/welcome/${tokenData.token}`;
  };

  const handleCopy = async () => {
    const link = getLink();
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Only show for paperwork/won leads
  const relevantStatuses = ["paperwork", "won", "active", "signed"];
  const isRelevant = relevantStatuses.includes(leadStatus?.toLowerCase());
  if (!isRelevant) return null;

  if (loading) {
    return (
      <div className="rounded-lg border p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Onboarding</p>
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  const link = getLink();
  const status = tokenData?.status;

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Onboarding</p>
        {tokenData && status && (
          <Badge variant={STATUS_CONFIG[status]?.variant ?? "secondary"} className="text-xs">
            {STATUS_CONFIG[status]?.label}
          </Badge>
        )}
      </div>

      {!tokenData ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Generate a secure onboarding link to send to the client.
          </p>
          <Button size="sm" onClick={handleGenerate} disabled={generating}>
            <Link2 className="h-4 w-4 mr-1.5" />
            {generating ? "Generating..." : "Generate Onboarding Link"}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {status === "completed" || tokenData.submission ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-status-success">
                Client onboarding complete
              </p>
              {tokenData.submission?.submittedAt && (
                <p className="text-xs text-muted-foreground">
                  Submitted {format(new Date(tokenData.submission.submittedAt), "MMM d, yyyy")}
                </p>
              )}
              {tokenData.submission?.id && (
                <a
                  href={`/clients/onboarding/${tokenData.submission.id}`}
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  View submission →
                </a>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 bg-muted/50 rounded px-2 py-1.5">
                <span className="text-xs text-muted-foreground truncate flex-1 font-mono">
                  {link.replace(/^https?:\/\//, "").substring(0, 42)}…
                </span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-status-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="block text-[10px] uppercase tracking-wide font-medium">Last accessed</span>
                  <span>
                    {tokenData.lastAccessedAt
                      ? formatDistanceToNow(new Date(tokenData.lastAccessedAt), { addSuffix: true })
                      : "Never"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wide font-medium">Expires</span>
                  <span>{format(new Date(tokenData.expiresAt), "MMM d, yyyy")}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCopy} className="flex-1">
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
                {status === "expired" && (
                  <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generating}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Sent {format(new Date(tokenData.createdAt), "MMM d")}
                {tokenData.accessCount > 0 && ` · Opened ${tokenData.accessCount}×`}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
