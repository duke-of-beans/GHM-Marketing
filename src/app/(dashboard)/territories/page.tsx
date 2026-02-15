"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Territory = {
  id: number;
  name: string;
  cities: string[];
  zipCodes: string[];
  states: string[];
  isActive: boolean;
  _count: { users: number; leads: number };
};

type TerritoryForm = {
  name: string;
  cities: string;
  zipCodes: string;
  states: string;
};

const emptyForm: TerritoryForm = {
  name: "",
  cities: "",
  zipCodes: "",
  states: "",
};

export default function TerritoriesPage() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TerritoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchTerritories = useCallback(async () => {
    try {
      const res = await fetch("/api/territories");
      const data = await res.json();
      if (data.success) {
        setTerritories(data.data);
      }
    } catch {
      toast.error("Failed to load territories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTerritories(); }, [fetchTerritories]);

  const parseArray = (str: string): string[] =>
    str.split(",").map((s) => s.trim()).filter(Boolean);

  const handleSave = async () => {
    if (!form.name) {
      toast.error("Territory name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        cities: parseArray(form.cities),
        zipCodes: parseArray(form.zipCodes),
        states: parseArray(form.states),
      };

      const url = editingId ? `/api/territories/${editingId}` : "/api/territories";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? "Territory updated" : "Territory created");
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        fetchTerritories();
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save territory");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (territory: Territory) => {
    setEditingId(territory.id);
    setForm({
      name: territory.name,
      cities: territory.cities.join(", "),
      zipCodes: territory.zipCodes.join(", "),
      states: territory.states.join(", "),
    });
    setShowForm(true);
  };

  const handleDeactivate = async (id: number) => {
    try {
      await fetch(`/api/territories/${id}`, { method: "DELETE" });
      toast.success("Territory deactivated");
      fetchTerritories();
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
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Territory Management</h1>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm(emptyForm);
          }}
        >
          {showForm ? "Cancel" : "+ New Territory"}
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 space-y-4 bg-card">
          <h2 className="font-semibold">
            {editingId ? "Edit Territory" : "New Territory"}
          </h2>

          <div>
            <label className="text-sm text-muted-foreground">Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Downtown LA"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">
              Cities <span className="text-xs">(comma-separated)</span>
            </label>
            <Input
              value={form.cities}
              onChange={(e) => setForm({ ...form, cities: e.target.value })}
              placeholder="Los Angeles, Santa Monica, Beverly Hills"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">
              Zip Codes <span className="text-xs">(comma-separated)</span>
            </label>
            <Input
              value={form.zipCodes}
              onChange={(e) => setForm({ ...form, zipCodes: e.target.value })}
              placeholder="90001, 90002, 90003"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">
              States <span className="text-xs">(comma-separated)</span>
            </label>
            <Input
              value={form.states}
              onChange={(e) => setForm({ ...form, states: e.target.value })}
              placeholder="CA, NV"
            />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update Territory" : "Create Territory"}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {territories.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No territories yet. Create your first one above.</p>
        ) : (
          territories.map((territory) => (
            <div
              key={territory.id}
              className="border rounded-lg p-4 bg-card space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg">{territory.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {territory._count.users} reps
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {territory._count.leads} leads
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(territory)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDeactivate(territory.id)}
                  >
                    Deactivate
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Cities: </span>
                  <span>{territory.cities.length > 0 ? territory.cities.join(", ") : "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Zips: </span>
                  <span>
                    {territory.zipCodes.length > 0
                      ? territory.zipCodes.length > 5
                        ? `${territory.zipCodes.slice(0, 5).join(", ")} +${territory.zipCodes.length - 5} more`
                        : territory.zipCodes.join(", ")
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">States: </span>
                  <span>{territory.states.length > 0 ? territory.states.join(", ") : "—"}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
