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
  Building2,
  RotateCcw,
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

type AppRole = "admin" | "manager" | "sales";

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
  repOnboardingCompletedAt?: string | null;
  contractorVendorId?: string | null;
  contractorEntityName?: string | null;
  contractorEmail?: string | null;
  positionId?: number | null;
  position?: { id: number; name: string; type: string } | null;
}

interface UserPermissionCardProps {
  user: User;
  currentUserRole: AppRole;
  onUpdate: (updates: {
    permissionPreset?: string;
    permissions?: Record<string, boolean>;
    contractorVendorId?: string | null;
    contractorEntityName?: string | null;
    contractorEmail?: string | null;
    positionId?: number | null;
  }) => void;
  onRoleChange: (role: AppRole) => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onHardDelete: () => void;
  onResetOnboarding?: () => void;
}

export function UserPermissionCard({
  user,
  currentUserRole,
  onUpdate,
  onRoleChange,
  onDeactivate,
  onReactivate,
  onHardDelete,
  onResetOnboarding,
}: UserPermissionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // Contractor entity fields
  const [contractorVendorId, setContractorVendorId] = useState(user.contractorVendorId ?? "");
  const [contractorEntityName, setContractorEntityName] = useState(user.contractorEntityName ?? "");
  const [contractorEmail, setContractorEmail] = useState(user.contractorEmail ?? "");
  const [savingContractor, setSavingContractor] = useState(false);

  async function saveContractorFields() {
    setSavingContractor(true);
    try {
      await onUpdate({
        contractorVendorId: contractorVendorId.trim() || null,
        contractorEntityName: contractorEntityName.trim() || null,
        contractorEmail: contractorEmail.trim() || null,
      });
    } finally {
      setSavingContractor(false);
    }
  }

  const viewerIsElevated = isElevated(currentUserRole);
  const viewerIsAdmin = currentUserRole === "admin";
  const hasActiveRecords =
    (user._count?.assignedLeads ?? 0) > 0 || (user._count?.salesRepClients ?? 0) > 0;

  const roleColors: Record<AppRole, string> = {
    admin: "bg-status-danger-bg text-status-danger",
    manager: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    sales: "bg-status-info-bg text-status-info",
  };

  // Roles the current viewer is allowed to assign
  const assignableRoles: AppRole[] = viewerIsAdmin
    ? ["admin", "manager", "sales"]
    : ["manager", "sales"];

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
                    : "bg-muted-foreground"
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
                  {user.role === "sales" && !user.repOnboardingCompletedAt && user.isActive && (
                    <Badge variant="outline" className="text-xs text-status-warning border-status-warning-border">
                      Setup pending
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

              {/* Reset onboarding — admin only, active users with completed onboarding */}
              {viewerIsAdmin && user.isActive && user.repOnboardingCompletedAt && onResetOnboarding && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary"
                  onClick={onResetOnboarding}
                  title="Reset onboarding — user will go through setup wizard again on next login"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}

              {/* Deactivate / Reactivate */}
              {user.isActive ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-status-warning"
                  onClick={() => setDeactivateDialogOpen(true)}
                  title="Deactivate user"
                >
                  <UserX className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-status-success"
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
          <CardContent className="pt-0 border-t space-y-6">
            <PermissionEditor
              permissions={user.permissions}
              onChange={(permissions) => onUpdate({ permissions })}
            />

            {/* Contractor Entity Section */}
            {viewerIsAdmin && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold">Contractor Entity</h4>
                  {user.contractorVendorId && (
                    <span className="text-xs text-status-success font-medium">✓ Wave configured</span>
                  )}
                  {!user.contractorVendorId && (
                    <span className="text-xs text-status-warning font-medium">⚠ Wave vendor ID missing — payments blocked</span>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Entity Name</Label>
                    <Input
                      className="h-8 text-sm"
                      placeholder="e.g. Apex North"
                      value={contractorEntityName}
                      onChange={(e) => setContractorEntityName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Wave Vendor ID</Label>
                    <Input
                      className="h-8 text-sm font-mono"
                      placeholder="Wave vendor ID"
                      value={contractorVendorId}
                      onChange={(e) => setContractorVendorId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Billing Email</Label>
                    <Input
                      className="h-8 text-sm"
                      type="email"
                      placeholder="billing@entity.com"
                      value={contractorEmail}
                      onChange={(e) => setContractorEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={saveContractorFields} disabled={savingContractor}>
                  {savingContractor ? "Saving..." : "Save Contractor Info"}
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Deactivate Confirmation */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Permanently Delete {user.name}?</DialogTitle>
            <DialogDescription>
              {hasActiveRecords ? (
                <>
                  <span className="font-semibold text-status-warning">Cannot delete yet.</span>{" "}
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

