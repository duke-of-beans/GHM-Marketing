/**
 * Permission Editor Component
 * Checkbox interface for toggling individual permissions
 */

"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  UserPermissions,
  PERMISSION_CATEGORIES,
  PERMISSION_LABELS,
  PERMISSION_DESCRIPTIONS,
} from "@/lib/permissions";

interface PermissionEditorProps {
  permissions: UserPermissions;
  onChange: (permissions: UserPermissions) => void;
  disabled?: boolean;
}

export function PermissionEditor({
  permissions,
  onChange,
  disabled = false,
}: PermissionEditorProps) {
  function togglePermission(key: keyof UserPermissions, value: boolean) {
    onChange({ ...permissions, [key]: value });
  }

  return (
    <div className="space-y-6">
      {Object.entries(PERMISSION_CATEGORIES).map(([category, permissionKeys]) => (
        <div key={category} className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            {category}
          </h4>
          <div className="space-y-3 pl-4 border-l-2 border-muted">
            {permissionKeys.map((key) => (
              <div key={key} className="flex items-start space-x-3">
                <Checkbox
                  id={key}
                  checked={permissions[key as keyof UserPermissions]}
                  onCheckedChange={(checked) =>
                    togglePermission(
                      key as keyof UserPermissions,
                      checked as boolean
                    )
                  }
                  disabled={disabled}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor={key}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {PERMISSION_LABELS[key as keyof UserPermissions]}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {PERMISSION_DESCRIPTIONS[key as keyof UserPermissions]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
