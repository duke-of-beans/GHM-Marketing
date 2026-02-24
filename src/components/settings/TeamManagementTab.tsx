/**
 * Team Management Page - User Permissions
 * Allows masters to view and manage team member permissions
 */

"use client";

import { useState, useEffect } from "react";
import {
  Loader2, Users, Plus, Search, SlidersHorizontal, Eye, EyeOff, Upload,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserImportDialog } from "@/components/bulk/import-dialogs";
import { useBulkSelect } from "@/hooks/use-bulk-select";
import { BulkActionBar } from "@/components/bulk/bulk-action-bar";
import { UserPermissionCard } from "./UserPermissionCard";
import { CompensationConfigSection } from "@/components/team/compensation-config";
import { Separator } from "@/components/ui/separator";
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
}

interface TeamManagementTabProps {
  currentUserRole?: AppRole;
}

export function TeamManagementTab({ currentUserRole = "manager" }: TeamManagementTabProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AppRole>("all");
  const [sortBy, setSortBy] = useState<"name" | "role" | "leads">("name");
  const [showInactive, setShowInactive] = useState(false);

  // Add User dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("sales");
  const [newPassword, setNewPassword] = useState("");
  const [addingSaving, setAddingSaving] = useState(false);
  const [positions, setPositions] = useState<{ id: number; name: string }[]>([]);
  const [newPositionId, setNewPositionId] = useState<string>("");

  useEffect(() => {
    loadUsers();
    loadPositions();
  }, []);

  async function loadPositions() {
    try {
      const res = await fetch("/api/positions");
      if (res.ok) {
        const data = await res.json();
        setPositions(data.data ?? []);
      }
    } catch { /* non-fatal */ }
  }

  async function handleAddUser() {
    if (!newName.trim() || !newEmail.trim()) { toast.error("Name and email are required"); return; }
    setAddingSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          role: newRole,
          positionId: newPositionId ? parseInt(newPositionId) : null,
          password: newPassword.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      toast.success(`User created${data.data?.tempPassword ? ` — temp password: ${data.data.tempPassword}` : ""}`);
      setAddDialogOpen(false);
      setNewName(""); setNewEmail(""); setNewPassword(""); setNewPositionId("");
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setAddingSaving(false);
    }
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data || []);
      } else {
        toast.error("Failed to load team members");
      }
    } catch {
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  }

  async function handlePermissionUpdate(
    userId: number,
    updates: {
      permissionPreset?: string;
      permissions?: Record<string, boolean>;
      contractorVendorId?: string | null;
      contractorEntityName?: string | null;
      contractorEmail?: string | null;
      positionId?: number | null;
    }
  ) {
    try {
      // Contractor/position fields go to the user PATCH route directly
      const contractorKeys = ["contractorVendorId", "contractorEntityName", "contractorEmail", "positionId"] as const;
      const hasContractorFields = contractorKeys.some((k) => k in updates);
      
      if (hasContractorFields) {
        const userUpdatePayload: Record<string, unknown> = {};
        contractorKeys.forEach((k) => { if (k in updates) userUpdatePayload[k] = updates[k]; });
        const res = await fetch(`/api/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userUpdatePayload),
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to update user");
        }
        if (!updates.permissionPreset && !updates.permissions) {
          toast.success("Contractor info updated");
          loadUsers();
          return;
        }
      }

      if (updates.permissionPreset || updates.permissions) {
        const res = await fetch(`/api/users/${userId}/permissions`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissionPreset: updates.permissionPreset, permissions: updates.permissions }),
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to update permissions");
        }
        toast.success("Permissions updated");
      }
      
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function handleRoleChange(userId: number, role: AppRole) {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update role");
      }
      toast.success(`Role updated to ${ROLE_LABELS[role]}`);
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  async function handleDeactivate(userId: number) {
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to deactivate user");
      toast.success("User deactivated — showing inactive users so you can permanently delete if needed.");
      setShowInactive(true);
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to deactivate user");
    }
  }

  async function handleReactivate(userId: number) {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reactivate user");
      toast.success("User reactivated");
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reactivate user");
    }
  }

  async function handleHardDelete(userId: number) {
    try {
      const res = await fetch(`/api/users/${userId}?permanent=true`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to permanently delete user");
      toast.success("User permanently deleted");
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to permanently delete user");
    }
  }

  async function handleResetOnboarding(userId: number) {
    try {
      const res = await fetch(`/api/users/${userId}/onboarding-reset`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset onboarding");
      toast.success("Onboarding reset — user will go through setup on next login");
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset onboarding");
    }
  }

  const filteredUsers = users
    .filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === (roleFilter as string);
      const matchesActive = showInactive ? true : user.isActive;
      return matchesSearch && matchesRole && matchesActive;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "role") {
        if (a.role === b.role) return a.name.localeCompare(b.name);
        const order: Record<string, number> = { admin: 0, master: 1, sales: 2 };
        return (order[a.role] ?? 9) - (order[b.role] ?? 9);
      }
      if (sortBy === "leads") {
        return (b._count?.assignedLeads ?? 0) - (a._count?.assignedLeads ?? 0);
      }
      return 0;
    });

  const inactiveCount = users.filter((u) => !u.isActive).length;

  const bulk = useBulkSelect(filteredUsers);

  const bulkUserActions = [
    {
      label: "Deactivate",
      variant: "destructive" as const,
      confirm: "Deactivate {count} users? They will lose access immediately.",
      run: async (ids: number[]) => {
        const res = await fetch("/api/bulk/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, operation: "deactivate" }) });
        return res.json();
      },
    },
    {
      label: "Activate",
      run: async (ids: number[]) => {
        const res = await fetch("/api/bulk/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, operation: "activate" }) });
        await loadUsers();
        return res.json();
      },
    },
    {
      label: "Reset Onboarding",
      run: async (ids: number[]) => {
        const res = await fetch("/api/bulk/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, operation: "reset_onboarding" }) });
        return res.json();
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Team Members
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage user permissions and access levels
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={roleFilter} onValueChange={(v: "all" | AppRole) => setRoleFilter(v)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {currentUserRole === "admin" && (
                <SelectItem value="admin">{ROLE_LABELS.admin} Only</SelectItem>
              )}
              <SelectItem value="manager">{ROLE_LABELS.manager} Only</SelectItem>
              <SelectItem value="sales">{ROLE_LABELS.sales} Only</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v: "name" | "role" | "leads") => setSortBy(v)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="role">Sort by Role</SelectItem>
              <SelectItem value="leads">Sort by Leads</SelectItem>
            </SelectContent>
          </Select>

          {/* Inactive toggle — only shown when there are inactive users */}
          {inactiveCount > 0 && (
            <Button
              variant={showInactive ? "secondary" : "outline"}
              onClick={() => setShowInactive(!showInactive)}
              className="shrink-0"
              title={showInactive ? "Hide inactive users" : "Show inactive users"}
            >
              {showInactive ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Inactive ({inactiveCount})
            </Button>
          )}
        </div>
      </div>

      {/* User List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No team members found
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className={`relative group ${bulk.isSelected(user.id) ? "ring-2 ring-primary/40 rounded-lg" : ""}`}>
              {/* Checkbox overlay — top-left of card */}
              <div className="absolute left-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={bulk.isSelected(user.id)}
                  onChange={() => bulk.toggle(user.id)}
                  className="rounded h-4 w-4 cursor-pointer"
                />
              </div>
              <UserPermissionCard
                user={user}
                currentUserRole={currentUserRole}
                onUpdate={(updates) => handlePermissionUpdate(user.id, updates)}
                onRoleChange={(role) => handleRoleChange(user.id, role)}
                onDeactivate={() => handleDeactivate(user.id)}
                onReactivate={() => handleReactivate(user.id)}
                onHardDelete={() => handleHardDelete(user.id)}
                onResetOnboarding={() => handleResetOnboarding(user.id)}
              />
            </div>
          ))
        )}
      </div>

      {/* Compensation Configuration — elevated users only */}
      {isElevated(currentUserRole) && users.filter((u) => u.isActive).length > 0 && (
        <>
          <Separator />
          <CompensationConfigSection
            users={users
              .filter((u) => u.isActive)
              .map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role }))}
          />
        </>
      )}

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Creates the account and generates an onboarding checklist task. An email invite is not sent automatically — share credentials manually.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Jane Smith" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="jane@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Dashboard Role</Label>
                <Select value={newRole} onValueChange={(v: AppRole) => setNewRole(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currentUserRole === "admin" && <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>}
                    <SelectItem value="manager">{ROLE_LABELS.manager}</SelectItem>
                    <SelectItem value="sales">{ROLE_LABELS.sales}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Position</Label>
                <Select value={newPositionId} onValueChange={setNewPositionId}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {positions.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Temporary Password <span className="text-muted-foreground text-xs">(leave blank to auto-generate)</span></Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUser} disabled={addingSaving}>
              {addingSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Import Dialog */}
      <UserImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => { setImportOpen(false); loadUsers(); }}
      />

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedIds={bulk.selectedIds}
        onClear={bulk.clear}
        actions={bulkUserActions}
        entityLabel="user"
      />
    </div>
  );
}

