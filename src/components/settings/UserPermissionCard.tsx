/**
 * User Permission Card
 * Displays user info, permission controls, and delete actions
 */

"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Mail,
  MapPin,
  Users as UsersIcon,
  UserX,
  Trash2,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PermissionEditor } from "./PermissionEditor";
import { PresetSelector } from "./PresetSelector";
import { ROLE_LABELS, isElevated } from "@/lib/auth/roles";

type AppRole = "admin" | "master" | "sales";

interface User {
  id: number;
  name: string;
  email: string;
  role: AppRole;
  isActive: boolean;
  permissions: Record<string, boolean>;
  permissionPreset: string;
  territory?: { id: number; name: string } | null;
  _count?: { assignedLeads: number; salesRepClients?: number };
}

interface UserPermissionCardProps {
  user: User;
  currentUserRole: AppRole;
  onUpdate: (updates: {
    permissionPreset?: string;
    permissions?: Record<string, boolean>;
  }) => void;
  onRoleChange: (role: AppRole) => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onHardDelete: () => void;
}

export function UserPermissionCard({
  user,
  currentUserRole,
  onUpdate,
  onRoleChange,
  onDeactivate,
  onReactivate,
  onHardDelete,
}: UserPermissionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const viewerIsElevated = isElevated(currentUserRole);
  const viewerIsAdmin = currentUserRole === "admin";
  const hasActiveRecords =
    (user._count?.assignedLeads ?? 0) > 0 || (user._count?.salesRepClients ?? 0) > 0;

  const roleColors: Record<AppRole, string> = {
    admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    master: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    sales: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };

  // Roles the current viewer is allowed to assign
  const assignableRoles: AppRole[] = viewerIsAdmin
    ? ["admin", "master", "sales"]
    : ["master", "sales"];

  return (
    <>
      <Card className={!user.isActive ? "opacity-60 border-dashed" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${
                  user.isActive
                    ? "bg-gradient-to-br from-blue-500 to-purple-600"
                    : "bg-gray-400"
                }`}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg">{user.name}</h3>
                  <Badge className={roleColors[user.role]}>
                    {ROLE_LABELS[user.role]}
                  </Badge>
                  {!user.isActive && (
                    <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">
                      Inactive
                    </Badge>
                  )}
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
                      {user._count.assignedLeads} leads
                      {user._count.salesRepClients !== undefined &&
                        `, ${user._count.salesRepClients} clients`}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 ml-2 shrink-0">
              {/* Role selector — elevated viewers only */}
              {viewerIsElevated && user.isActive && (
                <Select
                  value={user.role}
                  onValueChange={(v) => onRoleChange(v as AppRole)}
                >
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Deactivate / Reactivate */}
              {user.isActive ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-orange-600"
                  onClick={() => setDeactivateDialogOpen(true)}
                  title="Deactivate user"
                >
                  <UserX className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-green-600"
                  onClick={onReactivate}
                  title="Reactivate user"
                >
                  <UserCheck className="h-4 w-4" />
                </Button>
              )}

              {/* Hard delete — elevated users only, only on inactive */}
              {viewerIsElevated && !user.isActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    setConfirmText("");
                    setHardDeleteDialogOpen(true);
                  }}
                  title="Permanently delete user"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}

              {/* Expand permissions */}
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
          </div>

          {/* Preset Selector (always visible) */}
          <div className="mt-4">
            <PresetSelector
              currentPreset={user.permissionPreset}
              onChange={(preset) => onUpdate({ permissionPreset: preset })}
            />
          </div>
        </CardHeader>

        {/* Expanded Permission Editor */}
        {isExpanded && (
          <CardContent className="pt-0 border-t">
            <PermissionEditor
              permissions={user.permissions}
              onChange={(permissions) => onUpdate({ permissions })}
            />
          </CardContent>
        )}
      </Card>

      {/* Deactivate Confirmation */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate {user.name}?</DialogTitle>
            <DialogDescription>
              This will prevent {user.name} from logging in. Their data, leads, and client history
              are preserved. You can reactivate them at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeactivateDialogOpen(false);
                onDeactivate();
              }}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hard Delete Confirmation */}
      <Dialog open={hardDeleteDialogOpen} onOpenChange={setHardDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Permanently Delete {user.name}?</DialogTitle>
            <DialogDescription>
              {hasActiveRecords ? (
                <>
                  <span className="font-semibold text-orange-600">Cannot delete yet.</span>{" "}
                  {user.name} still has {user._count?.assignedLeads ?? 0} lead(s) and{" "}
                  {user._count?.salesRepClients ?? 0} client(s) assigned. Reassign or remove them
                  first, then try again.
                </>
              ) : (
                <>
                  This will <span className="font-semibold">permanently remove</span> {user.name}{" "}
                  and cannot be undone. Type{" "}
                  <span className="font-mono font-bold">DELETE</span> to confirm.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {!hasActiveRecords && (
            <div className="space-y-2">
              <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setHardDeleteDialogOpen(false)}>
              Cancel
            </Button>
            {!hasActiveRecords && (
              <Button
                variant="destructive"
                disabled={confirmText !== "DELETE"}
                onClick={() => {
                  setHardDeleteDialogOpen(false);
                  onHardDelete();
                }}
              >
                Permanently Delete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
