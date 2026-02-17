"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CompensationConfigSection } from "@/components/team/compensation-config";

type Territory = { id: number; name: string };

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: string;
  territoryId: number | null;
  territory: Territory | null;
  lastLogin: string | null;
  isActive: boolean;
  _count: { assignedLeads: number };
};

type UserForm = {
  name: string;
  email: string;
  password: string;
  role: string;
  territoryId: number | null;
};

const emptyForm: UserForm = {
  name: "",
  email: "",
  password: "",
  role: "sales",
  territoryId: null,
};

export default function TeamPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, terrRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/territories"),
      ]);
      const usersData = await usersRes.json();
      const terrData = await terrRes.json();

      if (usersData.success) setUsers(usersData.data);
      if (terrData.success) setTerritories(terrData.data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!form.name || (!editingId && (!form.email || !form.password))) {
      toast.error("Name, email, and password are required for new users");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/users/${editingId}` : "/api/users";
      const method = editingId ? "PATCH" : "POST";

      const payload: Record<string, unknown> = {
        name: form.name,
        role: form.role,
        territoryId: form.territoryId,
      };

      if (!editingId) {
        payload.email = form.email;
        payload.password = form.password;
      } else {
        payload.email = form.email;
        if (form.password) {
          payload.password = form.password;
        }
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? "User updated" : "User created");
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        fetchData();
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: UserRecord) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      territoryId: user.territoryId,
    });
    setShowForm(true);
  };

  const handleDeactivate = async (id: number) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("User deactivated");
        fetchData();
      } else {
        toast.error(data.error || "Failed to deactivate");
      }
    } catch {
      toast.error("Failed to deactivate");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Team</h1>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm(emptyForm);
          }}
        >
          {showForm ? "Cancel" : "+ Add Rep"}
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 space-y-4 bg-card">
          <h2 className="font-semibold">
            {editingId ? "Edit User" : "New User"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            {!editingId && (
              <div>
                <label className="text-sm text-muted-foreground">Email *</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@ghmmarketing.com"
                />
              </div>
            )}
            {editingId && (
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            )}
            <div>
              <label className="text-sm text-muted-foreground">
                {editingId ? "New Password (leave blank to keep)" : "Password *"}
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingId ? "••••••••" : "Min 8 characters"}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Role</label>
              <select
                className="w-full h-9 px-2 text-sm border rounded bg-background"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="sales">Sales Rep</option>
                <option value="master">Master</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Territory</label>
              <select
                className="w-full h-9 px-2 text-sm border rounded bg-background"
                value={form.territoryId ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    territoryId: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              >
                <option value="">No territory</option>
                {territories.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving
              ? "Saving..."
              : editingId
              ? "Update User"
              : "Create User"}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {users.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No team members yet.
          </p>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-card"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.name}</p>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      user.role === "master"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {user.email}
                  {user.territory && ` · ${user.territory.name}`}
                  {` · ${user._count.assignedLeads} leads`}
                  {user.lastLogin &&
                    ` · Last login ${new Date(user.lastLogin).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(user)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => handleDeactivate(user.id)}
                >
                  Deactivate
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Compensation Configuration */}
      <CompensationConfigSection users={users} />
    </div>
  );
}
