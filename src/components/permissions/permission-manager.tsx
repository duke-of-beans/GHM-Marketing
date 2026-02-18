"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Users, Shield, Search, Edit } from "lucide-react";
import { toast } from "sonner";
import { type UserPermissions, PERMISSION_PRESETS } from "@/lib/auth/permissions";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  territoryId: number | null;
  territory: { name: string } | null;
  permissionPreset: string | null;
  permissions: Record<string, boolean>;
  effectivePermissions: UserPermissions;
  _count: {
    leads: number;
    clients: number;
  };
};

// Dropdown options for the preset selector
const PRESET_OPTIONS = [
  { value: "none", label: "None (Custom Only)" },
  { value: "sales_basic", label: "Sales Basic" },
  { value: "sales_advanced", label: "Sales Advanced" },
  { value: "master_lite", label: "Master Lite" },
  { value: "master_full", label: "Master Full" },
];

const PERMISSION_DEFINITIONS = [
  { key: "view_all_leads", label: "View All Leads", category: "Leads" },
  { key: "manage_leads", label: "Manage Leads", category: "Leads" },
  { key: "view_all_clients", label: "View All Clients", category: "Clients" },
  { key: "manage_clients", label: "Manage Clients", category: "Clients" },
  { key: "view_analytics", label: "View Analytics", category: "Analytics" },
  { key: "manage_team", label: "Manage Team", category: "Admin" },
  { key: "manage_territories", label: "Manage Territories", category: "Admin" },
  { key: "manage_products", label: "Manage Products", category: "Admin" },
  { key: "view_payments", label: "View Payments", category: "Finance" },
  { key: "manage_payments", label: "Manage Payments", category: "Finance" },
  { key: "manage_settings", label: "Manage Settings", category: "Admin" },
];

export function PermissionManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editPreset, setEditPreset] = useState<string | null>(null);
  const [editPermissions, setEditPermissions] = useState<Record<string, boolean>>({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditPreset(user.permissionPreset);
    setEditPermissions(user.permissions || {});
    setEditDialogOpen(true);
  };

  // Effective permissions = preset base merged with custom overrides.
  // This is what the toggles should display — not raw custom overrides.
  const presetBase: Record<string, boolean> =
    editPreset && PERMISSION_PRESETS[editPreset]
      ? (PERMISSION_PRESETS[editPreset] as Record<string, boolean>)
      : {};
  const effectiveEditPermissions: Record<string, boolean> = {
    ...presetBase,
    ...editPermissions,
  };

  const handlePresetChange = (val: string) => {
    const presetKey = val === "none" ? null : val;
    setEditPreset(presetKey);
    // Clear custom overrides so the new preset takes clean control.
    // Individual toggles can still be flipped afterward to create targeted overrides.
    setEditPermissions({});
  };

  const togglePermission = (key: string) => {
    const currentEffective = effectiveEditPermissions[key] === true;
    const newValue = !currentEffective;
    const presetValue = editPreset
      ? ((PERMISSION_PRESETS[editPreset] as Record<string, boolean>)?.[key] === true)
      : false;

    if (newValue === presetValue) {
      // Toggling back to what the preset provides — remove the override
      const { [key]: _removed, ...rest } = editPermissions;
      setEditPermissions(rest);
    } else {
      // Store a custom override that differs from the preset
      setEditPermissions((prev) => ({ ...prev, [key]: newValue }));
    }
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissionPreset: editPreset,
          customPermissions: editPermissions,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Permissions updated successfully");
        setEditDialogOpen(false);
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to update permissions");
      }
    } catch {
      toast.error("Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.isActive !== false &&
      (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group permissions by category
  const permissionsByCategory = PERMISSION_DEFINITIONS.reduce(
    (acc, perm) => {
      if (!acc[perm.category]) acc[perm.category] = [];
      acc[perm.category].push(perm);
      return acc;
    },
    {} as Record<string, typeof PERMISSION_DEFINITIONS>
  );

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{user.name}</span>
                      <Badge variant={user.role === "master" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                      {user.permissionPreset && (
                        <Badge variant="outline" className="text-xs">
                          {user.permissionPreset.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                      {user.territory && ` • ${user.territory.name}`}
                      {` • ${user._count.leads} leads, ${user._count.clients} clients`}
                    </div>

                    {/* Show active permissions */}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {Object.entries(user.effectivePermissions)
                        .filter(([, value]) => value === true)
                        .slice(0, 5)
                        .map(([key]) => (
                          <Badge key={key} variant="secondary" className="text-xs">
                            {key.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      {Object.values(user.effectivePermissions).filter((v) => v === true).length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{Object.values(user.effectivePermissions).filter((v) => v === true).length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Edit Permissions: {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>
              Configure permission preset and custom overrides for this user
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Permission Preset */}
            <div className="space-y-2">
              <Label>Permission Preset</Label>
              <Select value={editPreset ?? "none"} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preset" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecting a preset updates all toggles below. You can then flip individual
                toggles to override specific permissions.
              </p>
            </div>

            {/* Permission Toggles */}
            <div className="space-y-4">
              <Label>Permissions</Label>
              {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                <div key={category} className="space-y-2">
                  <div className="font-medium text-sm">{category}</div>
                  <div className="space-y-2 ml-4">
                    {permissions.map((perm) => (
                      <div key={perm.key} className="flex items-center justify-between">
                        <Label htmlFor={perm.key} className="text-sm font-normal cursor-pointer">
                          {perm.label}
                        </Label>
                        <Switch
                          id={perm.key}
                          checked={effectiveEditPermissions[perm.key] === true}
                          onCheckedChange={() => togglePermission(perm.key)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
