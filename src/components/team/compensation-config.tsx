/**
 * CompensationConfigSection
 * C5: Admin-editable tier thresholds + per-user compensation config
 *
 * Panel 1 — Global Tier Config (admin only)
 *   Edit residual tier amounts and retainer thresholds that determine locked rates at close.
 *
 * Panel 2 — Per-user Commission Config
 *   Edit commission amount, residual fallback, residual start month, master fee.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings2, DollarSign, ChevronDown, ChevronUp, Loader2, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GlobalTierConfig {
  residualTier1Amount: number;
  residualTier2Amount: number;
  residualTier3Amount: number;
  residualTier2Threshold: number;
  residualTier3Threshold: number;
  upsellCommissionRate: number;
}

interface UserCompConfig {
  id: number;
  name: string;
  email: string;
  role: string;
  commissionEnabled: boolean;
  commissionAmount: number;
  residualEnabled: boolean;
  residualAmount: number;
  residualStartMonth: number;
  masterFeeEnabled: boolean;
  masterFeeAmount: number;
}

interface CompensationConfigSectionProps {
  users: Array<{ id: number; name: string; email: string; role: string }>;
}

// ─── Global Tier Config Panel ──────────────────────────────────────────────

function GlobalTierPanel() {
  const [config, setConfig] = useState<GlobalTierConfig | null>(null);
  const [draft, setDraft] = useState<GlobalTierConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const res = await window.fetch("/api/settings");
      const json = await res.json();
      const s = json.settings;
      const c: GlobalTierConfig = {
        residualTier1Amount: s.residualTier1Amount ?? 200,
        residualTier2Amount: s.residualTier2Amount ?? 250,
        residualTier3Amount: s.residualTier3Amount ?? 300,
        residualTier2Threshold: s.residualTier2Threshold ?? 3000,
        residualTier3Threshold: s.residualTier3Threshold ?? 4000,
        upsellCommissionRate: (s.upsellCommissionRate ?? 0.10) * 100,
      };
      setConfig(c);
      setDraft(c);
    } catch {
      toast.error("Failed to load tier config");
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await window.fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residualTier1Amount: draft.residualTier1Amount,
          residualTier2Amount: draft.residualTier2Amount,
          residualTier3Amount: draft.residualTier3Amount,
          residualTier2Threshold: draft.residualTier2Threshold,
          residualTier3Threshold: draft.residualTier3Threshold,
          upsellCommissionRate: draft.upsellCommissionRate / 100,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setConfig(draft);
        toast.success("Tier config saved");
      } else {
        toast.error("Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  const changed = draft && config && JSON.stringify(draft) !== JSON.stringify(config);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-sm font-medium hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          Global Tier Configuration
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && draft && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            These thresholds determine the residual rate locked at close for all new clients.
            Existing locked rates are not affected.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Tier 1 Residual (base)</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  className="pl-6"
                  value={draft.residualTier1Amount}
                  onChange={(e) => setDraft({ ...draft, residualTier1Amount: Number(e.target.value) })}
                />
              </div>
              <p className="text-xs text-muted-foreground">Retainer &lt; ${draft.residualTier2Threshold.toLocaleString()}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tier 2 Residual</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  className="pl-6"
                  value={draft.residualTier2Amount}
                  onChange={(e) => setDraft({ ...draft, residualTier2Amount: Number(e.target.value) })}
                />
              </div>
              <p className="text-xs text-muted-foreground">Retainer ≥ ${draft.residualTier2Threshold.toLocaleString()}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tier 3 Residual</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  className="pl-6"
                  value={draft.residualTier3Amount}
                  onChange={(e) => setDraft({ ...draft, residualTier3Amount: Number(e.target.value) })}
                />
              </div>
              <p className="text-xs text-muted-foreground">Retainer ≥ ${draft.residualTier3Threshold.toLocaleString()}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Upsell Commission Rate</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  className="pr-6"
                  value={draft.upsellCommissionRate}
                  onChange={(e) => setDraft({ ...draft, upsellCommissionRate: Number(e.target.value) })}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
              <p className="text-xs text-muted-foreground">% of product sale price</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tier Thresholds (monthly retainer)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Tier 2 starts at</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    className="pl-6"
                    value={draft.residualTier2Threshold}
                    onChange={(e) => setDraft({ ...draft, residualTier2Threshold: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tier 3 starts at</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    className="pl-6"
                    value={draft.residualTier3Threshold}
                    onChange={(e) => setDraft({ ...draft, residualTier3Threshold: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          {changed && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Save Tier Config
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDraft(config)}>
                Reset
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Per-user Comp Config Row ───────────────────────────────────────────────

function UserCompRow({ user }: { user: { id: number; name: string; email: string; role: string } }) {
  const [config, setConfig] = useState<UserCompConfig | null>(null);
  const [draft, setDraft] = useState<UserCompConfig | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await window.fetch(`/api/users/${user.id}/compensation`);
      const json = await res.json();
      if (json.success) {
        setConfig(json.data);
        setDraft(json.data);
      }
    } catch {
      // silent — not all users have config
    }
  }, [user.id]);

  useEffect(() => {
    if (open && !config) fetchConfig();
  }, [open, config, fetchConfig]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await window.fetch(`/api/users/${user.id}/compensation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commissionEnabled: draft.commissionEnabled,
          commissionAmount: draft.commissionAmount,
          residualEnabled: draft.residualEnabled,
          residualAmount: draft.residualAmount,
          residualStartMonth: draft.residualStartMonth,
          masterFeeEnabled: draft.masterFeeEnabled,
          masterFeeAmount: draft.masterFeeAmount,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setConfig(draft);
        toast.success(`Saved for ${user.name}`);
      } else {
        toast.error("Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  const changed = draft && config && JSON.stringify(draft) !== JSON.stringify(config);
  const roleBadge = user.role === "admin" ? "destructive" : user.role === "master" ? "default" : "secondary";

  return (
    <div className="border rounded-lg p-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Badge variant={roleBadge as "destructive" | "default" | "secondary"} className="shrink-0 capitalize text-xs">
            {user.role}
          </Badge>
          <div className="min-w-0 text-left">
            <p className="text-sm font-medium leading-none truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-2 shrink-0">
          {config && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              ${config.commissionAmount.toLocaleString()} close · ${config.residualAmount}/mo
            </span>
          )}
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {!draft ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                {/* Commission */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Close Commission</Label>
                    <Switch
                      checked={draft.commissionEnabled}
                      onCheckedChange={(v) => setDraft({ ...draft, commissionEnabled: v })}
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      className="pl-6"
                      disabled={!draft.commissionEnabled}
                      value={draft.commissionAmount}
                      onChange={(e) => setDraft({ ...draft, commissionAmount: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Residual fallback */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs">Residual Fallback</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          Used only for clients without a locked rate (pre-Phase A or manually overridden).
                          New closes use tier-based locking.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={draft.residualEnabled}
                      onCheckedChange={(v) => setDraft({ ...draft, residualEnabled: v })}
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      className="pl-6"
                      disabled={!draft.residualEnabled}
                      value={draft.residualAmount}
                      onChange={(e) => setDraft({ ...draft, residualAmount: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Residual start month */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Residual Start Month</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={draft.residualStartMonth}
                    onChange={(e) => setDraft({ ...draft, residualStartMonth: Number(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">Residuals begin month {draft.residualStartMonth} after close</p>
                </div>

                {/* Master fee */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Master Fee</Label>
                    <Switch
                      checked={draft.masterFeeEnabled}
                      onCheckedChange={(v) => setDraft({ ...draft, masterFeeEnabled: v })}
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      className="pl-6"
                      disabled={!draft.masterFeeEnabled}
                      value={draft.masterFeeAmount}
                      onChange={(e) => setDraft({ ...draft, masterFeeAmount: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {changed && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={save} disabled={saving}>
                    {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDraft(config)}>
                    Reset
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Export ────────────────────────────────────────────────────────────

export function CompensationConfigSection({ users }: CompensationConfigSectionProps) {
  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Compensation Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Panel 1: Global Tier Config */}
          <GlobalTierPanel />

          <Separator />

          {/* Panel 2: Per-user configs */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Per-User Settings</p>
              <Badge variant="outline" className="text-xs">{users.length} team members</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Commission and fallback residual amounts per rep. Tier-based locking at close
              is controlled by Global Tier Configuration above.
            </p>
            <div className="space-y-2">
              {users.map((u) => (
                <UserCompRow key={u.id} user={u} />
              ))}
              {users.length === 0 && (
                <p className="text-sm text-muted-foreground">No team members yet.</p>
              )}
            </div>
          </div>

        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
