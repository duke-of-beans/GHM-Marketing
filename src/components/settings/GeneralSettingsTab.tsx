/**
 * General Settings Tab
 * Contains all non-team settings (appearance, commissions, features, etc.)
 */

"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Save } from "lucide-react";
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

      {/* Save Button - positioned at the bottom */}
      <div className="flex justify-end pt-4">
        <Button onClick={saveSettings} disabled={saving} size="lg">
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
