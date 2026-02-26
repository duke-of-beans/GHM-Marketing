"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, Building2 } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface DirectoryResult {
  key: string;
  displayName: string;
  importance: string;
  status: "match" | "mismatch" | "partial" | "missing";
  confidence: number;
  nameMatch: boolean;
  addressMatch: boolean;
  phoneMatch: boolean;
  details: string[];
  listingUrl: string | null;
  foundName: string | null;
  foundAddress: string | null;
  foundPhone: string | null;
}

interface CitationScan {
  id: number;
  scanDate: string;
  totalChecked: number;
  matches: number;
  mismatches: number;
  missing: number;
  errors: number;
  healthScore: number;
  results: DirectoryResult[];
}

interface CitationData {
  scan: CitationScan | null;
  previousHealthScore: number | null;
  previousScanDate: string | null;
  degradedDirectories: string[];
}

// ============================================================================
// Helpers
// ============================================================================

function StatusIcon({ status }: { status: DirectoryResult["status"] }) {
  if (status === "match") return <CheckCircle2 className="h-4 w-4 text-status-success" />;
  if (status === "mismatch") return <XCircle className="h-4 w-4 text-status-danger" />;
  if (status === "partial") return <AlertTriangle className="h-4 w-4 text-status-warning" />;
  return <XCircle className="h-4 w-4 text-gray-400" />;
}

function StatusLabel({ status }: { status: DirectoryResult["status"] }) {
  const map = {
    match: { label: "Match", class: "bg-status-success-bg text-status-success" },
    mismatch: { label: "Mismatch", class: "bg-status-danger-bg text-status-danger" },
    partial: { label: "Partial", class: "bg-status-warning-bg text-status-warning" },
    missing: { label: "Not Listed", class: "bg-gray-100 text-gray-500" },
  };
  const s = map[status];
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${s.class}`}>
      {s.label}
    </span>
  );
}

function FieldCheck({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`text-xs ${ok ? "text-status-success" : "text-status-danger"}`}>
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

// ============================================================================
// Citations Tab
// ============================================================================

export function CitationsTab({ clientId }: { clientId: number }) {
  const [data, setData] = useState<CitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/citations`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  async function handleScanNow() {
    setScanning(true);
    try {
      await fetch(`/api/clients/${clientId}/citations/scan`, { method: "POST" });
      await load();
    } finally {
      setScanning(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading citations...</div>;

  const scan = data?.scan ?? null;
  const results: DirectoryResult[] = (scan?.results as DirectoryResult[]) ?? [];
  const healthDelta =
    scan && data?.previousHealthScore !== null
      ? scan.healthScore - (data?.previousHealthScore ?? scan.healthScore)
      : null;

  return (
    <div className="space-y-5 p-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border rounded-lg p-3 bg-white">
          <div className="text-2xl font-bold flex items-end gap-1">
            {scan?.healthScore ?? "—"}
            {healthDelta !== null && (
              <span className={`text-sm font-normal ${healthDelta >= 0 ? "text-status-success" : "text-status-danger"}`}>
                {healthDelta > 0 ? `+${healthDelta}` : healthDelta} pts
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Citation Score</div>
        </div>
        <div className="border rounded-lg p-3 bg-white">
          <div className="text-2xl font-bold text-status-success">{scan?.matches ?? "—"}</div>
          <div className="text-xs text-gray-500 mt-0.5">Directories matched</div>
        </div>
        <div className="border rounded-lg p-3 bg-white">
          <div className="text-2xl font-bold text-status-warning">{scan ? scan.mismatches : "—"}</div>
          <div className="text-xs text-gray-500 mt-0.5">Need fixes</div>
        </div>
        <div className="border rounded-lg p-3 bg-white">
          <div className="text-2xl font-bold text-gray-500">{scan?.missing ?? "—"}</div>
          <div className="text-xs text-gray-500 mt-0.5">Not listed</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {scan
            ? `Last scan: ${new Date(scan.scanDate).toLocaleDateString()} · Quarterly schedule active`
            : "No scan yet — run one below"}
          {data?.degradedDirectories.length ? (
            <span className="ml-2 text-status-warning">
              {data.degradedDirectories.length} directories temporarily excluded
            </span>
          ) : null}
        </div>
        <Button size="sm" variant="outline" onClick={handleScanNow} disabled={scanning}>
          <RefreshCw className={`h-4 w-4 mr-1 ${scanning ? "animate-spin" : ""}`} />
          {scanning ? "Scanning..." : "Run Scan Now"}
        </Button>
      </div>

      {/* No scan state */}
      {!scan && (
        <div className="border rounded-lg p-8 text-center text-gray-500">
          <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm mb-1">No citation scan on record.</p>
          <p className="text-xs">Run a scan to check NAP consistency across {results.length || "all"} directories.</p>
        </div>
      )}

      {/* Directory table */}
      {results.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">Directory Status</span>
            <span className="text-xs text-gray-400">{results.length} checked</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-gray-500 bg-gray-50/50">
                <th className="text-left py-2 px-4 font-medium">Directory</th>
                <th className="text-left py-2 px-3 font-medium">Status</th>
                <th className="text-left py-2 px-3 font-medium hidden sm:table-cell">Fields</th>
                <th className="text-right py-2 px-4 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <>
                  <tr
                    key={r.key}
                    className="border-b last:border-0 hover:bg-gray-50/50 cursor-pointer"
                    onClick={() => setExpanded(expanded === r.key ? null : r.key)}
                  >
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon status={r.status} />
                        <span className="text-sm">{r.displayName}</span>
                        <span className="text-xs text-gray-400 capitalize hidden sm:inline">
                          · {r.importance}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <StatusLabel status={r.status} />
                    </td>
                    <td className="py-2 px-3 hidden sm:table-cell">
                      <div className="flex gap-2">
                        <FieldCheck ok={r.nameMatch} label="Name" />
                        <FieldCheck ok={r.addressMatch} label="Addr" />
                        <FieldCheck ok={r.phoneMatch} label="Phone" />
                      </div>
                    </td>
                    <td className="py-2 px-4 text-right text-xs text-gray-500">
                      {r.confidence}%
                    </td>
                  </tr>
                  {expanded === r.key && (
                    <tr key={`${r.key}-detail`} className="bg-gray-50 border-b">
                      <td colSpan={4} className="px-4 py-3">
                        <div className="text-xs space-y-1">
                          {r.foundName && <p><span className="text-gray-500">Found name:</span> {r.foundName}</p>}
                          {r.foundAddress && <p><span className="text-gray-500">Found address:</span> {r.foundAddress}</p>}
                          {r.foundPhone && <p><span className="text-gray-500">Found phone:</span> {r.foundPhone}</p>}
                          {r.details.map((d, i) => (
                            <p key={i} className="text-status-warning">⚠ {d}</p>
                          ))}
                          {r.status === "missing" && (
                            <p className="text-gray-500 italic">Business not found in this directory.</p>
                          )}
                          {r.listingUrl && (
                            <a
                              href={r.listingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View listing →
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Degraded notice */}
      {data?.degradedDirectories.length ? (
        <div className="border border-status-warning-border rounded-lg p-3 bg-status-warning-bg text-xs text-status-warning">
          <strong>Temporarily excluded:</strong> {data.degradedDirectories.join(", ")} — these adapters failed recent health checks and are excluded from your score to prevent false negatives. They'll be re-included automatically when they recover.
        </div>
      ) : null}
    </div>
  );
}
