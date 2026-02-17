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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

export default function SettingsPage() {
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure global defaults and preferences
        </p>
      </div>

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
              <Label htmlFor="defaultCommission">Default Commission (%)</Label>
              <Input
                id="defaultCommission"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={(settings.defaultCommission * 100).toFixed(0)}
                onChange={(e) =>
                  updateSetting(
                    "defaultCommission",
                    parseFloat(e.target.value) / 100
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Percentage of MRR (0-100)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultResidual">Default Residual (%)</Label>
              <Input
                id="defaultResidual"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={(settings.defaultResidual * 100).toFixed(0)}
                onChange={(e) =>
                  updateSetting(
                    "defaultResidual",
                    parseFloat(e.target.value) / 100
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Ongoing monthly commission (0-100)
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

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>
            Enable or disable platform features globally
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Content Studio</Label>
              <p className="text-sm text-muted-foreground">
                AI-powered content generation tools
              </p>
            </div>
            <Switch
              checked={settings.contentStudioEnabled}
              onCheckedChange={(checked) =>
                updateSetting("contentStudioEnabled", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Competitive Scanning</Label>
              <p className="text-sm text-muted-foreground">
                Automated competitor analysis scans
              </p>
            </div>
            <Switch
              checked={settings.scanningEnabled}
              onCheckedChange={(checked) =>
                updateSetting("scanningEnabled", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Voice Capture</Label>
              <p className="text-sm text-muted-foreground">
                SCRVNR brand voice analysis
              </p>
            </div>
            <Switch
              checked={settings.voiceCaptureEnabled}
              onCheckedChange={(checked) =>
                updateSetting("voiceCaptureEnabled", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Bug Reporting</Label>
              <p className="text-sm text-muted-foreground">
                User bug reporting system
              </p>
            </div>
            <Switch
              checked={settings.bugReportingEnabled}
              onCheckedChange={(checked) =>
                updateSetting("bugReportingEnabled", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Scan Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Scanning Configuration</CardTitle>
          <CardDescription>
            Control automated competitive analysis behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scanFrequency">Scan Frequency (days)</Label>
              <Input
                id="scanFrequency"
                type="number"
                min="1"
                max="365"
                value={settings.scanFrequencyDays}
                onChange={(e) =>
                  updateSetting("scanFrequencyDays", parseInt(e.target.value))
                }
              />
              <p className="text-xs text-muted-foreground">
                How often to run automated scans (1-365 days)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scanCostLimit">Monthly Cost Limit ($)</Label>
              <Input
                id="scanCostLimit"
                type="number"
                min="0"
                step="10"
                value={settings.scanCostLimit}
                onChange={(e) =>
                  updateSetting("scanCostLimit", parseFloat(e.target.value))
                }
              />
              <p className="text-xs text-muted-foreground">
                Maximum monthly spend on API costs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure email alerts and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email alerts for platform activity
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) =>
                updateSetting("emailNotifications", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Task Assignment Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when tasks are assigned to you
              </p>
            </div>
            <Switch
              checked={settings.taskAssignmentAlerts}
              onCheckedChange={(checked) =>
                updateSetting("taskAssignmentAlerts", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Scan Complete Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Alerts when competitive scans finish
              </p>
            </div>
            <Switch
              checked={settings.scanCompleteAlerts}
              onCheckedChange={(checked) =>
                updateSetting("scanCompleteAlerts", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage API keys for external services (encrypted and secure)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
            <Input
              id="openaiApiKey"
              type="password"
              placeholder="sk-..."
              value={settings.openaiApiKey || ""}
              onChange={(e) => updateSetting("openaiApiKey", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              For AI content generation and analysis
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="googleApiKey">Google API Key</Label>
            <Input
              id="googleApiKey"
              type="password"
              placeholder="AIza..."
              value={settings.googleApiKey || ""}
              onChange={(e) => updateSetting("googleApiKey", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              For Maps, Places, and Search Console integration
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="semrushApiKey">SEMrush API Key</Label>
            <Input
              id="semrushApiKey"
              type="password"
              placeholder="Enter SEMrush key..."
              value={settings.semrushApiKey || ""}
              onChange={(e) => updateSetting("semrushApiKey", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              For keyword research and competitor analysis
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ahrefsApiKey">Ahrefs API Key</Label>
            <Input
              id="ahrefsApiKey"
              type="password"
              placeholder="Enter Ahrefs key..."
              value={settings.ahrefsApiKey || ""}
              onChange={(e) => updateSetting("ahrefsApiKey", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              For backlink analysis and domain rating
            </p>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              🔒 <strong>Security:</strong> API keys are encrypted in the database and only visible to master users. Never share your keys publicly.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
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
