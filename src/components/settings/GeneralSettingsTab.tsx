/**
 * General Settings Tab
 * Contains all non-team settings (appearance, commissions, features, etc.)
 */

"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Bell } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

export function GeneralSettingsTab() {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error(error);
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

      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function updateSetting(key: string, value: any) {
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
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load settings
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how the dashboard looks and feels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">
                Select light or dark mode
              </p>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Commission Defaults */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Defaults</CardTitle>
          <CardDescription>
            Global commission rates applied to new sales reps
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
                onChange={(e) =>
                  updateSetting(
                    "defaultCommission",
                    parseFloat(e.target.value)
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Dollar amount per sale
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultResidual">Default Residual ($)</Label>
              <Input
                id="defaultResidual"
                type="number"
                step="1"
                min="0"
                value={settings.defaultResidual}
                onChange={(e) =>
                  updateSetting(
                    "defaultResidual",
                    parseFloat(e.target.value)
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Ongoing monthly dollar amount
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="masterManagerFee">Master Manager Fee ($)</Label>
              <Input
                id="masterManagerFee"
                type="number"
                step="1"
                min="0"
                value={settings.masterManagerFee}
                onChange={(e) =>
                  updateSetting("masterManagerFee", parseFloat(e.target.value))
                }
              />
              <p className="text-xs text-muted-foreground">
                Monthly fee per master manager
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Goals</CardTitle>
          <CardDescription>
            Set deal and revenue targets shown on the master dashboard. Disable to hide the goals widget until you&apos;re ready.
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
              onCheckedChange={(checked) => updateSetting("goalsEnabled", checked)}
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
                  onChange={(e) => updateSetting("monthlyDealTarget", e.target.value ? parseInt(e.target.value) : null)}
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
                  onChange={(e) => updateSetting("monthlyRevenueTarget", e.target.value ? parseFloat(e.target.value) : null)}
                />
                <p className="text-xs text-muted-foreground">MRR target for the month</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Control which events trigger browser push notifications for the entire team. Individual users can
            enable or disable notifications in their browser at any time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="pushMessagesEnabled">Team Messages</Label>
              <p className="text-sm text-muted-foreground">Notify team when new messages are sent in TeamFeed</p>
            </div>
            <Switch
              id="pushMessagesEnabled"
              checked={!!settings.pushMessagesEnabled}
              onCheckedChange={(checked) => updateSetting("pushMessagesEnabled", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="pushTasksEnabled">Task Assignments</Label>
              <p className="text-sm text-muted-foreground">Notify users when a client task is assigned to them</p>
            </div>
            <Switch
              id="pushTasksEnabled"
              checked={!!settings.pushTasksEnabled}
              onCheckedChange={(checked) => updateSetting("pushTasksEnabled", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button - positioned at the bottom */}
      <div className="flex justify-end pt-4">        <Button onClick={saveSettings} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
