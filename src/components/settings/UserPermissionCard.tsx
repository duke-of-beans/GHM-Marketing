/**
 * User Permission Card
 * Displays user info and permission controls
 */

"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Mail, MapPin, Users as UsersIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PermissionEditor } from "./PermissionEditor";
import { PresetSelector } from "./PresetSelector";

interface User {
  id: number;
  name: string;
  email: string;
  role: "master" | "sales";
  permissions: Record<string, boolean>;
  permissionPreset: string;
  territory?: { id: number; name: string } | null;
  _count?: { assignedLeads: number };
}

interface UserPermissionCardProps {
  user: User;
  onUpdate: (updates: {
    permissionPreset?: string;
    permissions?: Record<string, boolean>;
  }) => void;
}

export function UserPermissionCard({ user, onUpdate }: UserPermissionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  function handlePresetChange(preset: string) {
    onUpdate({ permissionPreset: preset });
  }

  function handlePermissionsChange(permissions: Record<string, boolean>) {
    onUpdate({ permissions });
  }

  const roleColor = user.role === "master" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg">{user.name}</h3>
                <Badge className={roleColor}>
                  {user.role === "master" ? "Master" : "Sales Rep"}
                </Badge>
              </div>
              <div className="flex flex-col gap-1 mt-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </div>
                {user.territory && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {user.territory.name}
                  </div>
                )}
                {user._count && (
                  <div className="flex items-center gap-1.5">
                    <UsersIcon className="h-3.5 w-3.5" />
                    {user._count.assignedLeads} assigned leads
                  </div>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Preset Selector (Always Visible) */}
        <div className="mt-4">
          <PresetSelector
            currentPreset={user.permissionPreset}
            onChange={handlePresetChange}
          />
        </div>
      </CardHeader>

      {/* Expanded Permission Editor */}
      {isExpanded && (
        <CardContent className="pt-0 border-t">
          <PermissionEditor
            permissions={user.permissions}
            onChange={handlePermissionsChange}
          />
        </CardContent>
      )}
    </Card>
  );
}
