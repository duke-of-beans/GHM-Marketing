'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface EditClientDialogProps {
  client: {
    id: number;
    lead: {
      businessName: string;
      phone: string;
      email: string | null;
      website: string | null;
      address: string | null;
      city: string;
      state: string;
      zipCode: string;
    };
    retainerAmount: number;
    scanFrequency: string;
    status: string;
  };
  onUpdate: () => void;
  onDelete?: () => void;
}

export function EditClientDialog({ client, onUpdate, onDelete }: EditClientDialogProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form state
  const [businessName, setBusinessName] = useState(client.lead.businessName);
  const [phone, setPhone] = useState(client.lead.phone);
  const [email, setEmail] = useState(client.lead.email || '');
  const [website, setWebsite] = useState(client.lead.website || '');
  const [address, setAddress] = useState(client.lead.address || '');
  const [city, setCity] = useState(client.lead.city);
  const [state, setState] = useState(client.lead.state);
  const [zipCode, setZipCode] = useState(client.lead.zipCode);
  const [retainerAmount, setRetainerAmount] = useState(client.retainerAmount.toString());
  const [scanFrequency, setScanFrequency] = useState(client.scanFrequency);
  const [status, setStatus] = useState(client.status);
  const [churnReason, setChurnReason] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!businessName || businessName.length < 2) {
      newErrors.businessName = 'Business name must be at least 2 characters';
    }

    // Phone validation
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (!phone || !phoneRegex.test(phone)) {
      newErrors.phone = 'Valid phone number required (e.g., 555-123-4567)';
    }

    // Email validation (if provided)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Valid email address required';
    }

    // Website validation (if provided)
    if (website && !/^https?:\/\/.+/.test(website)) {
      newErrors.website = 'Website must start with http:// or https://';
    }

    // City
    if (!city) {
      newErrors.city = 'City is required';
    }

    // State
    if (!state || state.length !== 2) {
      newErrors.state = 'State must be 2-letter code (e.g., CA)';
    }

    // Zip code validation
    if (zipCode && !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      newErrors.zipCode = 'Valid ZIP code required (e.g., 12345 or 12345-6789)';
    }

    // Retainer amount
    const amount = parseFloat(retainerAmount);
    if (isNaN(amount) || amount < 0) {
      newErrors.retainerAmount = 'Retainer amount must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: {
            businessName,
            phone,
            email: email || null,
            website: website || null,
            address: address || null,
            city,
            state: state.toUpperCase(),
            zipCode,
          },
          clientProfile: {
            retainerAmount: parseFloat(retainerAmount),
            scanFrequency,
            status,
            ...(status === 'churned' && { churnReason: churnReason || null }),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update client');
      }

      toast.success(data.message || 'Client updated successfully');
      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update client');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmName !== client.lead.businessName) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete client');
      toast.success(data.message);
      setOpen(false);
      onDelete?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete client');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" size="sm">
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client Information</DialogTitle>
            <DialogDescription>
              Update client details. Changes will be logged in the activity history.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Business Name */}
            <div className="grid gap-2">
              <Label htmlFor="businessName">
                Business Name <span className="text-status-danger">*</span>
              </Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="The German Auto Doctor"
              />
              {errors.businessName && (
                <p className="text-sm text-status-danger">{errors.businessName}</p>
              )}
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">
                  Phone <span className="text-status-danger">*</span>
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(805) 555-1234"
                />
                {errors.phone && (
                  <p className="text-sm text-status-danger">{errors.phone}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-status-danger">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
              />
              {errors.website && (
                <p className="text-sm text-status-danger">{errors.website}</p>
              )}
            </div>

            {/* Address */}
            <div className="grid gap-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2 col-span-2">
                <Label htmlFor="city">
                  City <span className="text-status-danger">*</span>
                </Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Simi Valley"
                />
                {errors.city && (
                  <p className="text-sm text-status-danger">{errors.city}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="state">
                  State <span className="text-status-danger">*</span>
                </Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  placeholder="CA"
                  maxLength={2}
                />
                {errors.state && (
                  <p className="text-sm text-status-danger">{errors.state}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="93065"
              />
              {errors.zipCode && (
                <p className="text-sm text-status-danger">{errors.zipCode}</p>
              )}
            </div>

            {/* Service Configuration */}
            <div className="border-t pt-4 mt-2">
              <h3 className="font-medium mb-4">Service Configuration</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="retainerAmount">
                    Monthly Retainer <span className="text-status-danger">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      id="retainerAmount"
                      type="number"
                      value={retainerAmount}
                      onChange={(e) => setRetainerAmount(e.target.value)}
                      className="pl-7"
                      placeholder="2400"
                    />
                  </div>
                  {errors.retainerAmount && (
                    <p className="text-sm text-status-danger">{errors.retainerAmount}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="scanFrequency">Scan Frequency</Label>
                  <Select value={scanFrequency} onValueChange={setScanFrequency}>
                    <SelectTrigger id="scanFrequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2 mt-4">
                <Label htmlFor="status">Client Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="at_risk">At Risk</SelectItem>
                    <SelectItem value="churned">Churned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {status === 'churned' && client.status !== 'churned' && (
                <div className="grid gap-2 mt-4">
                  <Label htmlFor="churnReason">
                    Churn Reason <span className="text-muted-foreground text-xs">(optional but recommended)</span>
                  </Label>
                  <Textarea
                    id="churnReason"
                    value={churnReason}
                    onChange={(e) => setChurnReason(e.target.value)}
                    placeholder="Why did this client churn? Price, service issues, went in-house, competitor…"
                    rows={3}
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be saved to the client record and all pending payments will be cancelled automatically.
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" type="button">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Client
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Permanently delete this client?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This cannot be undone. All data — tasks, notes, scans, payment history — will be gone forever.
                      Use <strong>Churned</strong> status instead if you want to keep the record.
                      <br /><br />
                      Type <strong>{client.lead.businessName}</strong> to confirm.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder={client.lead.businessName}
                    className="mt-2"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmName('')}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleteConfirmName !== client.lead.businessName || deleteLoading}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteLoading ? 'Deleting…' : 'Delete permanently'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
