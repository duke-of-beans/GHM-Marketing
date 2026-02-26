"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";

type ClientDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function AddClientDialog({ open, onOpenChange, onSuccess }: ClientDialogProps) {
  const [formData, setFormData] = useState({
    businessName: "",
    phone: "",
    email: "",
    website: "",
    city: "",
    state: "",
    zipCode: "",
    retainerAmount: "",
    scanFrequency: "weekly",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.businessName.trim()) {
      toast.error('Business name is required');
      return;
    }
    
    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    
    if (!formData.city.trim() || !formData.state.trim()) {
      toast.error('City and state are required');
      return;
    }
    
    if (!formData.retainerAmount || parseFloat(formData.retainerAmount) <= 0) {
      toast.error('Valid retainer amount is required');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          retainerAmount: parseFloat(formData.retainerAmount),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`${formData.businessName} added to client portfolio!`, {
          description: 'Client profile created successfully'
        });
        onSuccess();
        onOpenChange(false);
        // Reset form
        setFormData({
          businessName: "",
          phone: "",
          email: "",
          website: "",
          city: "",
          state: "",
          zipCode: "",
          retainerAmount: "",
          scanFrequency: "weekly",
        });
      } else {
        const error = await response.json();
        toast.error('Failed to add client', {
          description: error.error || 'Please try again'
        });
      }
    } catch (error) {
      console.error("Failed to add client:", error);
      toast.error('Failed to add client', {
        description: 'An unexpected error occurred'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Existing Client</DialogTitle>
          <DialogDescription>
            Add an existing customer to your client portfolio. Perfect for importing your current customer base.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Business Info */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-sm">Business Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="Acme Plumbing & Heating"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@acmeplumbing.com"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://acmeplumbing.com"
                />
                <p className="text-xs text-muted-foreground">Include https://</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-sm">Location</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Austin"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="TX"
                  maxLength={2}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="78701"
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-sm">Service Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retainerAmount">Monthly Retainer *</Label>
                <Input
                  id="retainerAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.retainerAmount}
                  onChange={(e) => setFormData({ ...formData, retainerAmount: e.target.value })}
                  placeholder="500.00"
                  required
                />
                <p className="text-xs text-muted-foreground">Monthly recurring revenue from this client</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scanFrequency">Competitive Scan Frequency</Label>
                <Select
                  value={formData.scanFrequency}
                  onValueChange={(value) => setFormData({ ...formData, scanFrequency: value })}
                >
                  <SelectTrigger id="scanFrequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">How often to check competitor rankings</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Adding Client..." : "Add Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
