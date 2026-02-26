/**
 * Permission Editor
 * Toggle switches for individual permissions
 */

"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const PERMISSION_CATEGORIES = {
  "Client Management": [
    { key: "canViewAllClients", label: "View All Clients", description: "See all clients (not just own deals)" },
    { key: "canEditClients", label: "Edit Clients", description: "Edit client profiles" },
    { key: "canManageTasks", label: "Manage Tasks", description: "Create and assign tasks for clients" },
    { key: "canAccessContentStudio", label: "Access Content Studio", description: "Generate content for clients" },
  ],
  "Sales & Discovery": [
    { key: "canAccessDiscovery", label: "Access Discovery", description: "Use lead discovery tools" },
    { key: "canClaimAnyLead", label: "Claim Any Lead", description: "Claim leads outside assigned territory" },
    { key: "canReassignLeads", label: "Reassign Leads", description: "Move leads between reps" },
  ],
  "Intelligence": [
    { key: "canViewCompetitiveScans", label: "View Competitive Scans", description: "See competitive intel data" },
    { key: "canTriggerScans", label: "Trigger Scans", description: "Manually trigger competitive scans" },
    { key: "canAccessVoiceCapture", label: "Voice Capture", description: "Use SCRVNR voice capture system" },
  ],
  "Analytics": [
    { key: "canViewTeamAnalytics", label: "View Team Analytics", description: "See company-wide metrics" },
    { key: "canViewOthersEarnings", label: "View Others' Earnings", description: "See other reps' commissions" },
    { key: "canGenerateReports", label: "Generate Reports", description: "Create client reports" },
  ],
  "System": [
    { key: "canReportBugs", label: "Report Bugs", description: "Bug reporting system" },
    { key: "canAccessOwnDashboard", label: "Access Own Dashboard", description: "Personal metrics" },
  ],
  "Payments & Wave": [
    { key: "view_payments", label: "View Payments", description: "See the Payments page and client billing status" },
    { key: "manage_payments", label: "Manage Payments", description: "Generate invoices, run partner payouts, and access Wave integration" },
  ],
};

interface PermissionEditorProps {
  permissions: Record<string, boolean>;
  onChange: (permissions: Record<string, boolean>) => void;
}

export function PermissionEditor({ permissions, onChange }: PermissionEditorProps) {
  function togglePermission(key: string) {
    onChange({
      ...permissions,
      [key]: !permissions[key],
    });
  }

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Custom Permissions</h4>
        <p className="text-xs text-muted-foreground">
          Toggle individual permissions. Changes set preset to &ldquo;Custom&rdquo;.
        </p>
      </div>

      {Object.entries(PERMISSION_CATEGORIES).map(([category, perms], idx) => (
        <div key={category}>
          {idx > 0 && <Separator className="my-4" />}
          <div className="space-y-4">
            <h5 className="font-medium text-sm text-muted-foreground">{category}</h5>
            {perms.map((perm) => (
              <div
                key={perm.key}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-0.5 flex-1">
                  <Label className="text-sm font-normal cursor-pointer">
                    {perm.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {perm.description}
                  </p>
                </div>
                <Switch
                  checked={permissions[perm.key] || false}
                  onCheckedChange={() => togglePermission(perm.key)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="p-3 bg-status-warning-bg rounded-lg border border-status-warning-border">
        <p className="text-xs text-status-warning">
          <strong>Note:</strong> Settings, User Management, and Territories are restricted to Master role and above. Payments permissions default to off — grant explicitly per user.
        </p>
      </div>
    </div>
  );
}
