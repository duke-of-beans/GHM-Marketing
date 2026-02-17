/**
 * User Permission Card Component
 * Expandable card for managing a single user's permissions
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Save, X } from "lucide-react";
import { PermissionPresetSelector } from "./PermissionPresetSelector";
import { PermissionEditor } from "./PermissionEditor";
import {
  UserPermissions,
  PermissionPreset,
  getPreset,
  detectPreset,
} from "@/lib/permissions";
import { toast } from "sonner";

interface UserPermissionCardProps {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    permissions: UserPermissions;
    permissionPreset: PermissionPreset;
  };
  onUpdate: () => void;
}

export function UserPermissionCard({ user, onUpdate }: UserPermissionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preset, setPreset] = useState<PermissionPreset>(user.permissionPreset);
  const [permissions, setPermissions] = useState<UserPermissions>(user.permissions);
  const [hasChanges, setHasChanges] = useState(false);

  function handlePresetChange(newPreset: PermissionPreset) {
    setPreset(newPreset);
    setHasChanges(true);
    
    if (newPreset !== 'custom') {
      const presetPermissions = getPreset(newPreset);
      if (presetPermissions) {
        setPermissions(presetPermissions);
      }
    }
  }

  function handlePermissionChange(newPermissions: UserPermissions) {
    setPermissions(newPermissions);
    setHasChanges(true);
    
    // Auto-detect if permissions match a preset
    const detectedPreset = detectPreset(newPermissions);
    if (detectedPreset !== preset) {
      setPreset(detectedPreset);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch(`/api/users/${user.id}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissionPreset: preset,
          permissions: permissions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update permissions');
      }

      toast.success('Permissions updated successfully');
      setHasChanges(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Failed to update permissions');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setPreset(user.permissionPreset);
    setPermissions(user.permissions);
    setHasChanges(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{user.name}</h3>
                <Badge variant={user.role === 'master' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Permission Preset
            </label>
            <PermissionPresetSelector
              value={preset}
              onChange={handlePresetChange}
              disabled={saving}
            />
          </div>

          {preset === 'custom' && (
            <div>
              <label className="text-sm font-medium mb-3 block">
                Custom Permissions
              </label>
              <PermissionEditor
                permissions={permissions}
                onChange={handlePermissionChange}
                disabled={saving}
              />
            </div>
          )}

          {hasChanges && (
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
