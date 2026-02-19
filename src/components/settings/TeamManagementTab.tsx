/**
 * Team Management Page - User Permissions
 * Allows masters to view and manage team member permissions
 */

"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Users,
  Plus,
  Search,
  SlidersHorizontal,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserPermissionCard } from "./UserPermissionCard";
import { CompensationConfigSection } from "@/components/team/compensation-config";
import { Separator } from "@/components/ui/separator";
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

interface TeamManagementTabProps {
  currentUserRole?: AppRole;
}

export function TeamManagementTab({ currentUserRole = "master" }: TeamManagementTabProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AppRole>("all");
  const [sortBy, setSortBy] = useState<"name" | "role" | "leads">("name");
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

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
    updates: { permissionPreset?: string; permissions?: Record<string, boolean> }
  ) {
    try {
      const res = await fetch(`/api/users/${userId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update permissions");
      }
      toast.success("Permissions updated");
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update permissions");
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
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add User
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
              <SelectItem value="master">{ROLE_LABELS.master} Only</SelectItem>
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
            <UserPermissionCard
              key={user.id}
              user={user}
              currentUserRole={currentUserRole}
              onUpdate={(updates) => handlePermissionUpdate(user.id, updates)}
              onRoleChange={(role) => handleRoleChange(user.id, role)}
              onDeactivate={() => handleDeactivate(user.id)}
              onReactivate={() => handleReactivate(user.id)}
              onHardDelete={() => handleHardDelete(user.id)}
            />
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
    </div>
  );
}
