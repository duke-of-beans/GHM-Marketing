"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DollarSign, User, UserCheck, X } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface CompensationOverride {
  userId: number;
  commissionAmount: number | null;
  residualAmount: number | null;
  feeAmount: number | null;
  reason: string | null;
  user: User;
}

interface ClientCompensationData {
  id: number;
  salesRepId: number | null;
  masterManagerId: number | null;
  onboardedMonth: Date | null;
  salesRep: User | null;
  masterManager: User | null;
  compensationOverrides: CompensationOverride[];
}

interface Props {
  clientId: number;
  users: User[];
}

export function ClientCompensationSection({ clientId, users }: Props) {
  const [data, setData] = useState<ClientCompensationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showOverrides, setShowOverrides] = useState(false);
  
  // Override form state
  const [overrideUserId, setOverrideUserId] = useState<number | null>(null);
  const [overrideCommission, setOverrideCommission] = useState<string>("");
  const [overrideResidual, setOverrideResidual] = useState<string>("");
  const [overrideFee, setOverrideFee] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState("");

  useEffect(() => {
    loadData();
  }, [clientId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/compensation`);
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error);
      
      setData(json.data);
      setShowOverrides(json.data.compensationOverrides.length > 0);
    } catch (error) {
      toast.error("Failed to load compensation data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!data) return;

    setSaving(true);
    try {
      const overrides = [];
      
      // Include existing overrides
      for (const override of data.compensationOverrides) {
        overrides.push({
          userId: override.userId,
          commissionAmount: override.commissionAmount,
          residualAmount: override.residualAmount,
          feeAmount: override.feeAmount,
          reason: override.reason,
        });
      }
      
      // Add new override if form filled
      if (overrideUserId && (overrideCommission || overrideResidual || overrideFee)) {
        overrides.push({
          userId: overrideUserId,
          commissionAmount: overrideCommission ? parseFloat(overrideCommission) : null,
          residualAmount: overrideResidual ? parseFloat(overrideResidual) : null,
          feeAmount: overrideFee ? parseFloat(overrideFee) : null,
          reason: overrideReason || null,
        });
      }

      const res = await fetch(`/api/clients/${clientId}/compensation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salesRepId: data.salesRepId,
          masterManagerId: data.masterManagerId,
          onboardedMonth: data.onboardedMonth
            ? new Date(data.onboardedMonth).toISOString()
            : null,
          overrides: overrides.length > 0 ? overrides : undefined,
        }),
      });

      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error);
      
      toast.success("Compensation updated");
      setData(json.data);
      
      // Reset override form
      setOverrideUserId(null);
      setOverrideCommission("");
      setOverrideResidual("");
      setOverrideFee("");
      setOverrideReason("");
    } catch (error) {
      toast.error("Failed to save compensation");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveOverride = async (userId: number) => {
    if (!data) return;
    
    setSaving(true);
    try {
      // Remove the override from the list
      const overrides = data.compensationOverrides
        .filter(o => o.userId !== userId)
        .map(override => ({
          userId: override.userId,
          commissionAmount: override.commissionAmount,
          residualAmount: override.residualAmount,
          feeAmount: override.feeAmount,
          reason: override.reason,
        }));

      const res = await fetch(`/api/clients/${clientId}/compensation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salesRepId: data.salesRepId,
          masterManagerId: data.masterManagerId,
          onboardedMonth: data.onboardedMonth
            ? new Date(data.onboardedMonth).toISOString()
            : null,
          overrides: overrides.length > 0 ? overrides : undefined,
        }),
      });

      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error);
      
      toast.success("Override removed");
      setData(json.data);
    } catch (error) {
      toast.error("Failed to remove override");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Helper to get the effective fee amount for a user (override or default)
  const getEffectiveFee = (userId: number): number | null => {
    const override = data?.compensationOverrides.find(o => o.userId === userId);
    if (override && override.feeAmount !== null) {
      return override.feeAmount;
    }
    // Default master manager fee logic
    if (userId === 1) return 0; // David (admin/owner) — no fee, profit goes direct
    return 240; // Default
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!data) {
    return <div className="text-sm text-destructive">Failed to load data</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Sales & Management
        </CardTitle>
        <CardDescription>
          Configure sales rep, master manager, and compensation overrides
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sales Rep Assignment */}
        <div className="space-y-2">
          <Label htmlFor="sales-rep" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Sales Rep
          </Label>
          <Select
            value={data.salesRepId?.toString() || "none"}
            onValueChange={(value) =>
              setData({
                ...data,
                salesRepId: value === "none" ? null : parseInt(value),
              })
            }
          >
            <SelectTrigger id="sales-rep">
              <SelectValue placeholder="No sales rep assigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name} ({user.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {data.salesRep && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">
                Commission: $1000 + $200/mo residual
              </Badge>
            </div>
          )}
        </div>

        {/* Master Manager Assignment */}
        <div className="space-y-2">
          <Label htmlFor="master-manager" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Master Manager
          </Label>
          <Select
            value={data.masterManagerId?.toString() || "none"}
            onValueChange={(value) =>
              setData({
                ...data,
                masterManagerId: value === "none" ? null : parseInt(value),
              })
            }
          >
            <SelectTrigger id="master-manager">
              <SelectValue placeholder="No master manager assigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {users
                .filter((u) => u.role === "master" || u.role === "admin")
                .map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {data.masterManager && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">
                {getEffectiveFee(data.masterManager.id) === 0
                  ? "Owner (no payment)"
                  : `Fee: $${getEffectiveFee(data.masterManager.id)}/mo`}
              </Badge>
            </div>
          )}
        </div>

        {/* Onboarded Month */}
        <div className="space-y-2">
          <Label htmlFor="onboarded-month">Onboarded Month</Label>
          <Input
            id="onboarded-month"
            type="month"
            value={
              data.onboardedMonth
                ? new Date(data.onboardedMonth).toISOString().slice(0, 7)
                : ""
            }
            onChange={(e) =>
              setData({
                ...data,
                onboardedMonth: e.target.value
                  ? new Date(e.target.value + "-01")
                  : null,
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Controls when residuals start. Auto-set on first activation — correct
            here if the date is wrong.
          </p>
        </div>

        {/* Compensation Overrides */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <h4 className="text-sm font-medium">Compensation Overrides</h4>
                <p className="text-sm text-muted-foreground">
                  Custom amounts for this specific client
                </p>
              </div>
              {data.compensationOverrides.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {data.compensationOverrides.length} active
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOverrides(!showOverrides)}
            >
              {showOverrides ? "Hide" : "Show"}
            </Button>
          </div>

          {showOverrides && (
            <div className="space-y-4">
              {/* Existing Overrides */}
              {data.compensationOverrides.map((override) => (
                <div
                  key={override.userId}
                  className="p-3 border rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{override.user.name}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveOverride(override.userId)}
                      disabled={saving}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {override.commissionAmount !== null && (
                      <div>
                        <span className="text-muted-foreground">Commission: </span>
                        ${override.commissionAmount}
                      </div>
                    )}
                    {override.residualAmount !== null && (
                      <div>
                        <span className="text-muted-foreground">Residual: </span>
                        ${override.residualAmount}/mo
                      </div>
                    )}
                    {override.feeAmount !== null && (
                      <div>
                        <span className="text-muted-foreground">Fee: </span>
                        ${override.feeAmount}/mo
                      </div>
                    )}
                  </div>
                  {override.reason && (
                    <div className="text-sm text-muted-foreground">
                      Reason: {override.reason}
                    </div>
                  )}
                </div>
              ))}

              {/* Add New Override Form */}
              <div className="space-y-4 p-4 border-2 border-dashed rounded-lg">
                <h5 className="text-sm font-medium">Add Override</h5>
                
                <div className="space-y-2">
                  <Label htmlFor="override-user">User</Label>
                  <Select
                    value={overrideUserId?.toString() || "none"}
                    onValueChange={(value) =>
                      setOverrideUserId(value === "none" ? null : parseInt(value))
                    }
                  >
                    <SelectTrigger id="override-user">
                      <SelectValue placeholder="Select user..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="override-commission">Commission Override</Label>
                    <div className="flex items-center gap-2">
                      <span>$</span>
                      <Input
                        id="override-commission"
                        type="number"
                        min="0"
                        step="100"
                        placeholder="Leave empty for default"
                        value={overrideCommission}
                        onChange={(e) => setOverrideCommission(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="override-residual">Residual Override</Label>
                    <div className="flex items-center gap-2">
                      <span>$</span>
                      <Input
                        id="override-residual"
                        type="number"
                        min="0"
                        step="50"
                        placeholder="Leave empty for default"
                        value={overrideResidual}
                        onChange={(e) => setOverrideResidual(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="override-fee">Fee Override</Label>
                    <div className="flex items-center gap-2">
                      <span>$</span>
                      <Input
                        id="override-fee"
                        type="number"
                        min="0"
                        step="50"
                        placeholder="Leave empty for default"
                        value={overrideFee}
                        onChange={(e) => setOverrideFee(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="override-reason">Reason</Label>
                  <Textarea
                    id="override-reason"
                    placeholder="Why this client has custom amounts..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
