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
  scope: "national" | "state" | "city" | "zip";
  cities: string;
  zipCodes: string;
  states: string;
};

const emptyForm: TerritoryForm = {
  name: "",
  scope: "state",
  cities: "",
  zipCodes: "",
  states: "",
};

function detectScope(t: Territory): TerritoryForm["scope"] {
  if (t.states.includes("ALL") || t.states.length >= 50) return "national";
  if (t.zipCodes.length > 0) return "zip";
  if (t.cities.length > 0) return "city";
  return "state";
}

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
      if (data.success) setTerritories(data.data);
    } catch { toast.error("Failed to load territories"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTerritories(); }, [fetchTerritories]);

  const parseArray = (str: string): string[] =>
    str.split(",").map((s) => s.trim()).filter(Boolean);

  const handleSave = async () => {
    if (!form.name) { toast.error("Territory name is required"); return; }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = { name: form.name };

      if (form.scope === "national") {
        payload.states = ["ALL"];
        payload.cities = [];
        payload.zipCodes = [];
      } else if (form.scope === "state") {
        payload.states = parseArray(form.states);
        payload.cities = [];
        payload.zipCodes = [];
        if (!payload.states || (payload.states as string[]).length === 0) {
          toast.error("Enter at least one state"); setSaving(false); return;
        }
      } else if (form.scope === "city") {
        payload.states = parseArray(form.states);
        payload.cities = parseArray(form.cities);
        payload.zipCodes = [];
        if (!payload.cities || (payload.cities as string[]).length === 0) {
          toast.error("Enter at least one city"); setSaving(false); return;
        }
      } else {
        payload.states = parseArray(form.states);
        payload.cities = parseArray(form.cities);
        payload.zipCodes = parseArray(form.zipCodes);
      }

      const url = editingId ? `/api/territories/${editingId}` : "/api/territories";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? "Territory updated" : "Territory created");
        setShowForm(false); setEditingId(null); setForm(emptyForm);
        fetchTerritories();
      } else { toast.error(data.error || "Failed to save"); }
    } catch { toast.error("Failed to save territory"); }
    finally { setSaving(false); }
  };

  const handleEdit = (territory: Territory) => {
    const scope = detectScope(territory);
    setEditingId(territory.id);
    setForm({
      name: territory.name,
      scope,
      cities: territory.cities.join(", "),
      zipCodes: territory.zipCodes.join(", "),
      states: territory.states.filter(s => s !== "ALL").join(", "),
    });
    setShowForm(true);
  };

  const handleDeactivate = async (id: number) => {
    try {
      await fetch(`/api/territories/${id}`, { method: "DELETE" });
      toast.success("Territory deactivated"); fetchTerritories();
    } catch { toast.error("Failed to deactivate"); }
  };

  const scopeLabel = (t: Territory) => {
    if (t.states.includes("ALL")) return "National";
    if (t.zipCodes.length > 0) return "Zip Codes";
    if (t.cities.length > 0) return "Cities";
    return "State";
  };

  const scopeCoverage = (t: Territory) => {
    if (t.states.includes("ALL")) return "All USA";
    const parts: string[] = [];
    if (t.cities.length > 0) parts.push(t.cities.join(", "));
    if (t.zipCodes.length > 0) {
      const zips = t.zipCodes.length > 5
        ? `${t.zipCodes.slice(0, 5).join(", ")} +${t.zipCodes.length - 5} more`
        : t.zipCodes.join(", ");
      parts.push(zips);
    }
    if (t.states.length > 0 && !t.states.includes("ALL")) parts.push(t.states.join(", "));
    return parts.join(" · ") || "No coverage defined";
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
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); }}>
          {showForm ? "Cancel" : "+ New Territory"}
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 space-y-4 bg-card">
          <h2 className="font-semibold">{editingId ? "Edit Territory" : "New Territory"}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. All USA, Texas, Dallas Metro" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Coverage Scope</label>
              <select className="w-full h-9 px-2 text-sm border rounded bg-background"
                value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value as TerritoryForm["scope"] })}>
                <option value="national">National (All USA)</option>
                <option value="state">State(s)</option>
                <option value="city">City / Metro</option>
                <option value="zip">Zip Codes</option>
              </select>
            </div>
          </div>

          {form.scope !== "national" && (
            <div>
              <label className="text-sm text-muted-foreground">
                States <span className="text-xs">(comma-separated, e.g. TX, CA)</span>
              </label>
              <Input value={form.states} onChange={(e) => setForm({ ...form, states: e.target.value })}
                placeholder={form.scope === "state" ? "TX, OK, LA" : "TX"} />
            </div>
          )}

          {(form.scope === "city" || form.scope === "zip") && (
            <div>
              <label className="text-sm text-muted-foreground">
                Cities <span className="text-xs">(comma-separated)</span>
              </label>
              <Input value={form.cities} onChange={(e) => setForm({ ...form, cities: e.target.value })}
                placeholder="Dallas, Fort Worth, Arlington" />
            </div>
          )}

          {form.scope === "zip" && (
            <div>
              <label className="text-sm text-muted-foreground">
                Zip Codes <span className="text-xs">(comma-separated)</span>
              </label>
              <Input value={form.zipCodes} onChange={(e) => setForm({ ...form, zipCodes: e.target.value })}
                placeholder="75201, 75202, 75203" />
            </div>
          )}

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
            <div key={territory.id} className="border rounded-lg p-4 bg-card space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg">{territory.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {scopeLabel(territory)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {territory._count.users} reps · {territory._count.leads} leads
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(territory)}>Edit</Button>
                  <Button size="sm" variant="ghost" className="text-destructive dark:text-red-400 hover:text-destructive dark:hover:text-red-300"
                    onClick={() => handleDeactivate(territory.id)}>Deactivate</Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{scopeCoverage(territory)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
