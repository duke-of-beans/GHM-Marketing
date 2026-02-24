/**
 * Compensation Settings Tab
 * Commission defaults and monthly goals — split from General Settings (UX-AUDIT-020)
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export function CompensationTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function update(key: string, value: any) {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return <div className="text-center py-12 text-muted-foreground">Failed to load settings</div>;
  }

  return (
    <div className="space-y-6">
      {/* Commission Defaults */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Defaults</CardTitle>
          <CardDescription>
            Global commission rates applied to new sales reps. Override per-rep in Settings → Team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="defaultCommission">Default Commission ($)</Label>
              <Input
                id="defaultCommission"
                type="number"
                step="1"
                min="0"
                value={settings.defaultCommission}
                onChange={(e) => update("defaultCommission", parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Dollar amount per sale</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultResidual">Default Residual ($)</Label>
              <Input
                id="defaultResidual"
                type="number"
                step="1"
                min="0"
                value={settings.defaultResidual}
                onChange={(e) => update("defaultResidual", parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Ongoing monthly dollar amount</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="masterManagerFee">Master Manager Fee ($)</Label>
              <Input
                id="masterManagerFee"
                type="number"
                step="1"
                min="0"
                value={settings.masterManagerFee}
                onChange={(e) => update("masterManagerFee", parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Monthly fee per master manager</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Goals</CardTitle>
          <CardDescription>
            Deal and revenue targets shown on the master dashboard. Disable to hide the goals widget until you&apos;re ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="goalsEnabled">Enable Goals Widget</Label>
              <p className="text-sm text-muted-foreground">Show progress bars on the dashboard</p>
            </div>
            <Switch
              id="goalsEnabled"
              checked={!!settings.goalsEnabled}
              onCheckedChange={(checked) => update("goalsEnabled", checked)}
            />
          </div>
          {settings.goalsEnabled && (
            <div className="grid gap-4 md:grid-cols-2 pt-2">
              <div className="space-y-2">
                <Label htmlFor="monthlyDealTarget">Monthly Deal Target</Label>
                <Input
                  id="monthlyDealTarget"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 20"
                  value={settings.monthlyDealTarget ?? ""}
                  onChange={(e) => update("monthlyDealTarget", e.target.value ? parseInt(e.target.value) : null)}
                />
                <p className="text-xs text-muted-foreground">Number of deals to close this month</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyRevenueTarget">Monthly Revenue Target ($)</Label>
                <Input
                  id="monthlyRevenueTarget"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="e.g. 50000"
                  value={settings.monthlyRevenueTarget ?? ""}
                  onChange={(e) => update("monthlyRevenueTarget", e.target.value ? parseFloat(e.target.value) : null)}
                />
                <p className="text-xs text-muted-foreground">MRR target for the month</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button onClick={saveSettings} disabled={saving} size="lg">
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" />Save Settings</>
          )}
        </Button>
      </div>
    </div>
  );
}
