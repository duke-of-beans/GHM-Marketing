"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { ArrowLeft, Dna, RefreshCw, Lock, Unlock, Loader2, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  DnaCapture,
  DnaTokenBlob,
  DnaToken,
  DnaTokenConfidence,
  DnaTokenSource,
} from "@/types/website-studio";

interface Props {
  clientId: number;
  propertyId: number;
  propertySlug: string;
  onBack: () => void;
}

export function DnaLab({ clientId, propertyId, propertySlug, onBack }: Props) {
  const [capture, setCapture] = useState<DnaCapture | null>(null);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [captureUrl, setCaptureUrl] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/website-studio/${clientId}/dna?propertyId=${propertyId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setCapture(json.data);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load DNA");
    } finally {
      setLoading(false);
    }
  }, [clientId, propertyId]);

  useEffect(() => { load(); }, [load]);

  async function handleCapture() {
    if (!captureUrl.trim()) { toast.error("Enter a URL to capture from."); return; }
    setCapturing(true);
    try {
      const res = await fetch(`/api/website-studio/${clientId}/dna`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, sourceUrl: captureUrl, tokenBlob: buildPlaceholderBlob() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success("DNA captured!");
      setCapture(json.data);
      setCaptureUrl("");
    } catch (err: any) {
      toast.error(err.message ?? "Capture failed");
    } finally {
      setCapturing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading DNA Lab...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-7 px-2 -ml-2">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
          </Button>
          <Dna className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">DNA Lab — {propertySlug}</span>
        </div>
      </div>

      {/* Capture bar */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2">
            <Input
              value={captureUrl}
              onChange={(e) => setCaptureUrl(e.target.value)}
              placeholder="Enter source URL to capture DNA from..."
              className="flex-1 h-8 text-sm"
            />
            <Button size="sm" onClick={handleCapture} disabled={capturing} className="h-8 text-xs">
              {capturing ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Capturing...</> : <><RefreshCw className="h-3 w-3 mr-1" /> Capture DNA</>}
            </Button>
          </div>
          {capture && (
            <p className="text-xs text-muted-foreground mt-2">
              Last captured from <span className="font-mono">{capture.sourceUrl}</span> on{" "}
              {new Date(capture.capturedAt).toLocaleDateString()} · {capture.overrideCount} override(s)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Token panels */}
      {capture ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TokenGroup
            title="Colors"
            tokens={flattenTokens(capture.tokenBlob.colors)}
            captureId={capture.id}
            clientId={clientId}
            onRefresh={load}
          />
          <TokenGroup
            title="Typography"
            tokens={flattenTokens(capture.tokenBlob.typography)}
            captureId={capture.id}
            clientId={clientId}
            onRefresh={load}
          />
          <TokenGroup
            title="Spacing"
            tokens={flattenTokens(capture.tokenBlob.spacing)}
            captureId={capture.id}
            clientId={clientId}
            onRefresh={load}
          />
          <TokenGroup
            title="Components"
            tokens={flattenTokens(capture.tokenBlob.components)}
            captureId={capture.id}
            clientId={clientId}
            onRefresh={load}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-10 text-center space-y-3">
          <Dna className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="font-medium">No DNA captured yet</p>
          <p className="text-sm text-muted-foreground">Enter the source website URL above to extract design tokens.</p>
        </div>
      )}
    </div>
  );
}

// ── Token Group ────────────────────────────────────────────────────────────

function TokenGroup({
  title,
  tokens,
  captureId,
  clientId,
  onRefresh,
}: {
  title: string;
  tokens: { key: string; token: DnaToken<any> }[];
  captureId: number;
  clientId: number;
  onRefresh: () => void;
}) {
  return (
    <Card>
      <CardHeader className="py-2.5 px-4">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-1">
        {tokens.map(({ key, token }) => (
          <TokenRow
            key={key}
            tokenKey={key}
            token={token}
            captureId={captureId}
            clientId={clientId}
            onRefresh={onRefresh}
          />
        ))}
        {tokens.length === 0 && <p className="text-xs text-muted-foreground">No tokens captured.</p>}
      </CardContent>
    </Card>
  );
}

function TokenRow({
  tokenKey,
  token,
  captureId,
  clientId,
  onRefresh,
}: {
  tokenKey: string;
  token: DnaToken<any>;
  captureId: number;
  clientId: number;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(token.value ?? ""));
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);

  const displayValue = String(token.value ?? "—");
  const isColor = tokenKey.startsWith("colors.") && typeof token.value === "string" && /^#[0-9a-f]{3,8}$/i.test(token.value);

  async function handleSave() {
    if (!editNote.trim()) { toast.error("Override note is required."); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/website-studio/${clientId}/dna`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          captureId,
          tokenKey,
          originalValue: token.value,
          overrideValue: editValue,
          note: editNote,
          operatorName: "admin",
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success(`${tokenKey} overridden.`);
      setEditing(false);
      setEditNote("");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2 py-1 text-sm group">
      <span className="text-xs font-mono text-muted-foreground w-36 truncate shrink-0" title={tokenKey}>
        {tokenKey.split(".").pop()}
      </span>

      {editing ? (
        <div className="flex-1 flex items-center gap-1.5">
          <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-6 text-xs flex-1" />
          <Input value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Note (required)" className="h-6 text-xs w-32" />
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleSave} disabled={saving}>
            <Check className="h-3 w-3 text-green-600" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditing(false)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            {isColor && (
              <span className="w-4 h-4 rounded border shrink-0" style={{ backgroundColor: token.value }} />
            )}
            <span className="text-xs font-mono truncate">{displayValue}</span>
          </div>
          <ConfidenceBadge confidence={token.confidence} />
          <SourceBadge source={token.source} />
          {token.isLocked ? (
            <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
          ) : (
            <button
              onClick={() => { setEditValue(displayValue); setEditing(true); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <Edit2 className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Badges ─────────────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: DnaTokenConfidence }) {
  const cfg: Record<DnaTokenConfidence, string> = {
    high: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    low: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${cfg[confidence]}`}>{confidence}</span>;
}

function SourceBadge({ source }: { source: DnaTokenSource }) {
  const cfg: Record<DnaTokenSource, string> = {
    machine: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    human: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    machine_overridden: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  };
  const labels: Record<DnaTokenSource, string> = { machine: "M", human: "H", machine_overridden: "M→H" };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 font-mono ${cfg[source]}`}>{labels[source]}</span>;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function flattenTokens(group: Record<string, any>): { key: string; token: DnaToken<any> }[] {
  return Object.entries(group)
    .filter(([, val]) => val && typeof val === "object" && "value" in val)
    .map(([key, token]) => ({ key, token: token as DnaToken<any> }));
}

function makeToken<T>(value: T): DnaToken<T> {
  return { key: "", value, source: "machine", confidence: "low", isLocked: false, overrideCount: 0, lastOverridedAt: null };
}

function buildPlaceholderBlob(): DnaTokenBlob {
  return {
    colors: {
      primary: makeToken("#000000"),
      secondary: makeToken("#666666"),
      accent: makeToken("#0066cc"),
      background: makeToken("#ffffff"),
      text: makeToken("#333333"),
    },
    typography: {
      headingFamily: makeToken("Inter"),
      headingWeight: makeToken("700"),
      bodyFamily: makeToken("Inter"),
      bodyWeight: makeToken("400"),
      headingCdnUrl: makeToken(null),
      bodyCdnUrl: makeToken(null),
    },
    spacing: {
      basePadding: makeToken("1rem"),
      sectionPadding: makeToken("4rem"),
      containerMaxWidth: makeToken("1200px"),
    },
    components: {
      headerHtml: makeToken(""),
      footerHtml: makeToken(""),
      primaryButtonStyle: makeToken(""),
      secondaryButtonStyle: makeToken(null),
    },
    captureVersion: "placeholder-v1",
  };
}
