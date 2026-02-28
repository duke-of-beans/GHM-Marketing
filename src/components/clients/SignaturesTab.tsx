"use client";

/**
 * SignaturesTab — DocuSign envelope history for a client.
 * Shown on client detail page (elevated users only — gated in profile.tsx).
 * Sprint 32-E.
 */

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PenLine } from "lucide-react";
import { SendForSignatureDialog } from "@/components/vault/SendForSignatureDialog";

// ─── Types ────────────────────────────────────────────────────────────────────

type SignatureEnvelope = {
  id: number;
  documentName: string;
  recipientEmail: string;
  recipientName: string;
  status: string;
  sentAt: string | null;
  completedAt: string | null;
  createdAt: string;
  envelopeId: string | null;
  vaultFile: { id: number; displayName: string | null; name: string; blobUrl: string } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    draft:    { label: "Draft",    className: "bg-muted text-muted-foreground border-muted-foreground/30" },
    sent:     { label: "Sent",     className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800" },
    viewed:   { label: "Viewed",   className: "bg-status-warning-bg text-status-warning border-status-warning-border" },
    signed:   { label: "Signed",   className: "bg-status-success-bg text-status-success border-status-success-border" },
    declined: { label: "Declined", className: "bg-status-danger-bg text-status-danger border-status-danger-border" },
    voided:   { label: "Voided",   className: "bg-muted text-muted-foreground border-muted-foreground/30" },
  };

  const config = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };

  return (
    <Badge
      variant="outline"
      className={`text-[11px] px-2 py-0.5 font-medium ${config.className}`}
    >
      {config.label}
    </Badge>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function SignaturesTab({ clientId }: { clientId: number }) {
  const [envelopes, setEnvelopes] = useState<SignatureEnvelope[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/signatures?clientId=${clientId}`);
      const json = await res.json();
      if (json.success) {
        setEnvelopes(json.data as SignatureEnvelope[]);
      } else {
        setError(json.error ?? "Failed to load signature envelopes");
      }
    } catch {
      setError("Failed to load signature envelopes");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  // Reload after a new envelope is sent
  function handleDialogClose(open: boolean) {
    setDialogOpen(open);
    if (!open) load();
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <Skeleton className="h-9 w-44 rounded-md" />
        </div>
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-3">
          <p className="text-sm text-status-danger">{error}</p>
          <Button size="sm" variant="outline" onClick={load}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          {envelopes.length === 0
            ? "No signature requests yet."
            : `${envelopes.length} envelope${envelopes.length !== 1 ? "s" : ""}`}
        </p>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => setDialogOpen(true)}
        >
          <PenLine className="h-4 w-4" />
          New Signature Request
        </Button>
      </div>

      {/* Empty state */}
      {envelopes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <PenLine className="h-8 w-8 mx-auto text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">No signature requests yet.</p>
            <p className="text-sm text-muted-foreground">
              Send a document for signature from the Document Vault.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Envelopes table */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                    <th className="text-left px-4 py-2.5 font-medium">Document</th>
                    <th className="text-left px-3 py-2.5 font-medium">Recipient</th>
                    <th className="text-center px-3 py-2.5 font-medium">Status</th>
                    <th className="text-right px-3 py-2.5 font-medium">Sent</th>
                    <th className="text-right px-4 py-2.5 font-medium">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {envelopes.map((env) => (
                    <tr
                      key={env.id}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="font-medium truncate" title={env.documentName}>
                          {env.documentName}
                        </p>
                        {env.envelopeId && (
                          <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                            {env.envelopeId}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium">{env.recipientName}</p>
                        <p className="text-xs text-muted-foreground">{env.recipientEmail}</p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <StatusBadge status={env.status} />
                      </td>
                      <td className="px-3 py-3 text-right text-muted-foreground text-xs">
                        {formatDate(env.sentAt ?? env.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        {env.completedAt ? (
                          <span className="text-status-success font-medium">
                            {formatDate(env.completedAt)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Signature Request dialog — pre-populated with this clientId */}
      <SendForSignatureDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        documentName=""
        documentUrl=""
        vaultFileId={0}
        defaultClientId={clientId}
      />
    </>
  );
}
