"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface CompensationConfig {
  userId: number;
  commissionEnabled: boolean;
  commissionAmount: number;
  residualEnabled: boolean;
  residualAmount: number;
  residualStartMonth: number;
  masterFeeEnabled: boolean;
  masterFeeAmount: number;
  notes: string | null;
}

interface Props {
  users: User[];
}

export function CompensationConfigSection({ users }: Props) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [config, setConfig] = useState<CompensationConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const loadConfig = async (userId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/compensation`);
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error);
      
      setConfig(json.data);
    } catch (error) {
      toast.error("Failed to load compensation config");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (userId: string) => {
    const id = parseInt(userId);
    setSelectedUserId(id);
    loadConfig(id);
  };

  const handleSave = async () => {
    if (!config || !selectedUserId) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/users/${selectedUserId}/compensation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error);
      
      toast.success("Compensation config saved");
      setConfig(json.data);
    } catch (error) {
      toast.error("Failed to save config");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (selectedUserId) {
      loadConfig(selectedUserId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compensation Configuration</CardTitle>
        <CardDescription>
          Configure commission, residual, and master fee settings per user
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Select User</Label>
          <Select
            value={selectedUserId?.toString() || ""}
            onValueChange={handleUserChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a user..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name} ({user.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
        
        {config && selectedUser && !loading && (
          <div className="space-y-6">
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="commission-enabled">Commission</Label>
                  <p className="text-sm text-muted-foreground">
                    One-time payment at client close
                  </p>
                </div>
                <Switch
                  id="commission-enabled"
                  checked={config.commissionEnabled}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, commissionEnabled: checked })
                  }
                />
              </div>
              {config.commissionEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="commission-amount">Amount</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">$</span>
                    <Input
                      id="commission-amount"
                      type="number"
                      min="0"
                      step="100"
                      value={config.commissionAmount}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          commissionAmount: parseFloat(e.target.value),
                        })
                      }
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      / close
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="residual-enabled">Residual</Label>
                  <p className="text-sm text-muted-foreground">
                    Recurring monthly payment
                  </p>
                </div>
                <Switch
                  id="residual-enabled"
                  checked={config.residualEnabled}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, residualEnabled: checked })
                  }
                />
              </div>
              {config.residualEnabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="residual-amount">Amount</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">$</span>
                      <Input
                        id="residual-amount"
                        type="number"
                        min="0"
                        step="50"
                        value={config.residualAmount}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            residualAmount: parseFloat(e.target.value),
                          })
                        }
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        / month
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="residual-start">Starting</Label>
                    <Select
                      value={config.residualStartMonth.toString()}
                      onValueChange={(value) =>
                        setConfig({
                          ...config,
                          residualStartMonth: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger id="residual-start">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Month 1</SelectItem>
                        <SelectItem value="2">Month 2</SelectItem>
                        <SelectItem value="3">Month 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {selectedUser.role === "master" && (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="master-fee-enabled">Master Manager Fee</Label>
                    <p className="text-sm text-muted-foreground">
                      For clients they manage
                    </p>
                  </div>
                  <Switch
                    id="master-fee-enabled"
                    checked={config.masterFeeEnabled}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, masterFeeEnabled: checked })
                    }
                  />
                </div>
                {config.masterFeeEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="master-fee-amount">Amount</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">$</span>
                      <Input
                        id="master-fee-amount"
                        type="number"
                        min="0"
                        step="50"
                        value={config.masterFeeAmount}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            masterFeeAmount: parseFloat(e.target.value),
                          })
                        }
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        / month
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Special deal structure, legacy agreement, etc..."
                value={config.notes || ""}
                onChange={(e) => setConfig({ ...config, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={saving}>
                Reset to Defaults
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
