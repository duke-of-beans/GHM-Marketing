/**
 * Team Management Page - User Permissions
 * Allows masters to view and manage team member permissions
 */

"use client";

import { useState, useEffect } from "react";
import { Loader2, Users, Plus, Search, SlidersHorizontal } from "lucide-react";
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

export function TeamManagementTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "master" | "sales">("all");
  const [sortBy, setSortBy] = useState<"name" | "role" | "leads">("name");

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
    } catch (error) {
      console.error(error);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  }

  async function handlePermissionUpdate(userId: number, updates: {
    permissionPreset?: string;
    permissions?: Record<string, boolean>;
  }) {
    try {
      const res = await fetch(`/api/users/${userId}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update permissions");
      }

      toast.success("Permissions updated successfully");
      loadUsers(); // Reload to reflect changes
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to update permissions");
    }
  }

  const filteredUsers = users
    .filter(user => {
      // Search filter
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Role filter
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      // Sort logic
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "role") {
        // Master before Sales
        if (a.role === b.role) return a.name.localeCompare(b.name);
        return a.role === "master" ? -1 : 1;
      } else if (sortBy === "leads") {
        // Most leads first
        const aLeads = a._count?.assignedLeads || 0;
        const bLeads = b._count?.assignedLeads || 0;
        return bLeads - aLeads;
      }
      return 0;
    });

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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="master">Master Only</SelectItem>
            <SelectItem value="sales">Sales Only</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="role">Sort by Role</SelectItem>
            <SelectItem value="leads">Sort by Leads</SelectItem>
          </SelectContent>
        </Select>
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
              onUpdate={(updates) => handlePermissionUpdate(user.id, updates)}
            />
          ))
        )}
      </div>
    </div>
  );
}
