"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";

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

type CompensationConfig = {
  commissionEnabled: boolean;
  commissionAmount: number;
  residualEnabled: boolean;
  residualAmount: number;
  residualStartMonth: number;
  masterFeeEnabled: boolean;
  masterFeeAmount: number;
  notes: string | null;
};

const emptyForm: UserForm = {
  name: "",
  email: "",
  password: "",
  role: "sales",
  territoryId: null,
};

const defaultCompensation: CompensationConfig = {
  commissionEnabled: true,
  commissionAmount: 1000,
  residualEnabled: true,
  residualAmount: 200,
  residualStartMonth: 2,
  masterFeeEnabled: true,
  masterFeeAmount: 240,
  notes: null,
};

export default function TeamPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [compensation, setCompensation] = useState<CompensationConfig>(defaultCompensation);
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
        const userId = editingId || data.data.id;
        
        // Save compensation config
        try {
          await fetch(`/api/users/${userId}/compensation`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(compensation),
          });
        } catch (compError) {
          console.error("Failed to save compensation:", compError);
          toast.error("User saved but compensation failed to update");
        }
        
        toast.success(editingId ? "User updated" : "User created");
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        setCompensation(defaultCompensation);
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

  const handleEdit = async (user: UserRecord) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      territoryId: user.territoryId,
    });
    setShowForm(true);
    
    // Load compensation config
    try {
      const res = await fetch(`/api/users/${user.id}/compensation`);
      const json = await res.json();
      if (res.ok && json.data) {
        setCompensation(json.data);
      }
    } catch (error) {
      console.error("Failed to load compensation:", error);
      setCompensation(defaultCompensation);
    }
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
            setCompensation(defaultCompensation);
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

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="compensation">Compensation</TabsTrigger>
            </TabsList>

            {/* BASIC INFO TAB */}
            <TabsContent value="basic" className="space-y-4">
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
            </TabsContent>

            {/* COMPENSATION TAB */}
            <TabsContent value="compensation" className="space-y-4">
              {/* Commission Settings */}
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="commission-enabled">Commission at Close</Label>
                    <p className="text-xs text-muted-foreground">One-time payment when deal closes</p>
                  </div>
                  <Switch
                    id="commission-enabled"
                    checked={compensation.commissionEnabled}
                    onCheckedChange={(checked) =>
                      setCompensation({ ...compensation, commissionEnabled: checked })
                    }
                  />
                </div>
                {compensation.commissionEnabled && (
                  <div>
                    <Label htmlFor="commission-amount">Amount ($)</Label>
                    <Input
                      id="commission-amount"
                      type="number"
                      min="0"
                      step="100"
                      value={compensation.commissionAmount}
                      onChange={(e) =>
                        setCompensation({
                          ...compensation,
                          commissionAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                )}
              </div>

              {/* Residual Settings */}
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="residual-enabled">Monthly Residual</Label>
                    <p className="text-xs text-muted-foreground">Recurring payment each month</p>
                  </div>
                  <Switch
                    id="residual-enabled"
                    checked={compensation.residualEnabled}
                    onCheckedChange={(checked) =>
                      setCompensation({ ...compensation, residualEnabled: checked })
                    }
                  />
                </div>
                {compensation.residualEnabled && (
                  <>
                    <div>
                      <Label htmlFor="residual-amount">Monthly Amount ($)</Label>
                      <Input
                        id="residual-amount"
                        type="number"
                        min="0"
                        step="50"
                        value={compensation.residualAmount}
                        onChange={(e) =>
                          setCompensation({
                            ...compensation,
                            residualAmount: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="residual-start">Start Month</Label>
                      <Input
                        id="residual-start"
                        type="number"
                        min="1"
                        max="12"
                        value={compensation.residualStartMonth}
                        onChange={(e) =>
                          setCompensation({
                            ...compensation,
                            residualStartMonth: parseInt(e.target.value) || 2,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Month 1 = onboarding month
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Master Fee Settings */}
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="master-fee-enabled">Master Management Fee</Label>
                    <p className="text-xs text-muted-foreground">Monthly fee for managing accounts</p>
                  </div>
                  <Switch
                    id="master-fee-enabled"
                    checked={compensation.masterFeeEnabled}
                    onCheckedChange={(checked) =>
                      setCompensation({ ...compensation, masterFeeEnabled: checked })
                    }
                  />
                </div>
                {compensation.masterFeeEnabled && (
                  <div>
                    <Label htmlFor="master-fee-amount">Monthly Fee ($)</Label>
                    <Input
                      id="master-fee-amount"
                      type="number"
                      min="0"
                      step="10"
                      value={compensation.masterFeeAmount}
                      onChange={(e) =>
                        setCompensation({
                          ...compensation,
                          masterFeeAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="comp-notes">Notes</Label>
                <Textarea
                  id="comp-notes"
                  placeholder="Special compensation arrangements, exceptions, etc."
                  value={compensation.notes || ""}
                  onChange={(e) =>
                    setCompensation({ ...compensation, notes: e.target.value || null })
                  }
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          <Button onClick={handleSave} disabled={saving} className="w-full">
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
    </div>
  );
}
