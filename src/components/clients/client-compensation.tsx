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
import { DollarSign, User, UserCheck } from "lucide-react";

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
          reason: override.reason,
        });
      }
      
      // Add new override if form filled
      if (overrideUserId && (overrideCommission || overrideResidual)) {
        overrides.push({
          userId: overrideUserId,
          commissionAmount: overrideCommission ? parseFloat(overrideCommission) : null,
          residualAmount: overrideResidual ? parseFloat(overrideResidual) : null,
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
      setOverrideReason("");
    } catch (error) {
      toast.error("Failed to save compensation");
      console.error(error);
    } finally {
      setSaving(false);
    }
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
            value={data.salesRepId?.toString() || ""}
            onValueChange={(value) =>
              setData({
                ...data,
                salesRepId: value ? parseInt(value) : null,
              })
            }
          >
            <SelectTrigger id="sales-rep">
              <SelectValue placeholder="No sales rep assigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
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
            value={data.masterManagerId?.toString() || ""}
            onValueChange={(value) =>
              setData({
                ...data,
                masterManagerId: value ? parseInt(value) : null,
              })
            }
          >
            <SelectTrigger id="master-manager">
              <SelectValue placeholder="No master manager assigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {users
                .filter((u) => u.role === "master")
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
                {[1, 2].includes(data.masterManager.id) // Gavin or David (owners)
                  ? "Owner (no payment)"
                  : "Fee: $240/mo"}
              </Badge>
            </div>
          )}
        </div>

        {/* Compensation Overrides */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Compensation Overrides</h4>
              <p className="text-sm text-muted-foreground">
                Custom amounts for this specific client
              </p>
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
                  <div className="font-medium">{override.user.name}</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
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
                    value={overrideUserId?.toString() || ""}
                    onValueChange={(value) =>
                      setOverrideUserId(value ? parseInt(value) : null)
                    }
                  >
                    <SelectTrigger id="override-user">
                      <SelectValue placeholder="Select user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
