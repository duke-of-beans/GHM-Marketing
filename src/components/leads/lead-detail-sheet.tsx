"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Search, FileText, Mail, ClipboardList } from "lucide-react";
import { LEAD_STATUS_CONFIG } from "@/types";
import { toast } from "sonner";
import type { LeadStatus } from "@prisma/client";
import { OnboardingPanel } from "@/components/leads/onboarding-panel";

// ============================================================================
// Add Product Form - inline component for attaching products to a deal
// ============================================================================

type ProductOption = {
  id: number;
  name: string;
  sku: string;
  price: number;
  pricingModel: string;
};

function AddProductForm({
  leadId,
  onAdded,
}: {
  leadId: number;
  onAdded: () => void;
}) {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [adding, setAdding] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setProducts(
            data.data.map((p: { id: number; name: string; sku: string; price: string | number; pricingModel: string }) => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              price: Number(p.price),
              pricingModel: p.pricingModel,
            }))
          );
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [loaded]);

  const handleAdd = async () => {
    if (!selectedId) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedId,
          quantity,
          discountPercent: discount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Product added to deal");
        setSelectedId("");
        setQuantity(1);
        setDiscount(0);
        onAdded();
      } else {
        toast.error(data.error || "Failed to add product");
      }
    } catch {
      toast.error("Failed to add product");
    } finally {
      setAdding(false);
    }
  };

  const selected = products.find((p) => p.id === selectedId);
  const finalPrice = selected
    ? selected.price * quantity * (1 - discount / 100)
    : 0;

  return (
    <div className="space-y-2 p-2 border rounded-lg bg-muted/30">
      <select
        className="w-full h-9 px-2 text-sm border rounded bg-background"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : "")}
      >
        <option value="">Select a product...</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} — ${p.price}/{p.pricingModel}
          </option>
        ))}
      </select>
      {selectedId && (
        <>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Qty</label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="h-8"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Discount %</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="h-8"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Total</label>
              <p className="h-8 flex items-center text-sm font-semibold">
                ${finalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={handleAdd} disabled={adding} className="w-full">
            {adding ? "Adding..." : "Add to Deal"}
          </Button>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Assign Rep Dropdown - reassign lead to a different rep
// ============================================================================

function AssignRepDropdown({
  leadId,
  currentUserId,
  currentUserName,
  onAssigned,
}: {
  leadId: number;
  currentUserId: number | null;
  currentUserName: string;
  onAssigned: () => void;
}) {
  const [reps, setReps] = useState<{ id: number; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setReps(data.data.map((u: { id: number; name: string }) => ({ id: u.id, name: u.name })));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [open, loaded]);

  const handleAssign = async (userId: number | null) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: userId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(userId ? "Rep assigned" : "Rep unassigned");
        onAssigned();
        setOpen(false);
      } else {
        toast.error(data.error || "Failed to assign");
      }
    } catch {
      toast.error("Failed to assign rep");
    }
  };

  if (!open) {
    return (
      <button
        className="font-medium text-sm text-left hover:underline cursor-pointer"
        onClick={() => setOpen(true)}
      >
        {currentUserName}
      </button>
    );
  }

  return (
    <select
      className="h-8 px-1 text-sm border rounded bg-background w-full"
      value={currentUserId ?? ""}
      onChange={(e) => {
        const val = e.target.value;
        handleAssign(val ? Number(val) : null);
      }}
      onBlur={() => setOpen(false)}
      autoFocus
    >
      <option value="">Unassigned</option>
      {reps.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name}
        </option>
      ))}
    </select>
  );
}

// ============================================================================
// Editable Field - click to edit phone, email, contact name
// ============================================================================

function EditableField({
  label,
  value,
  leadId,
  field,
  onSaved,
}: {
  label: string;
  value: string;
  leadId: number;
  field: string;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  const save = async () => {
    if (val === value) {
      setEditing(false);
      return;
    }
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: val || null }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${label} updated`);
        onSaved();
      } else {
        toast.error(data.error || "Failed to update");
      }
    } catch {
      toast.error("Failed to update");
    }
    setEditing(false);
  };

  return (
    <div>
      <span className="text-muted-foreground">{label}</span>
      {editing ? (
        <input
          className="w-full h-7 px-1 text-sm border rounded bg-background font-medium"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === "Enter" && save()}
          autoFocus
        />
      ) : (
        <p
          className="font-medium cursor-pointer hover:underline"
          onClick={() => {
            setVal(value);
            setEditing(true);
          }}
        >
          {value || "—"}
        </p>
      )}
    </div>
  );
}

type LeadDetail = {
  id: number;
  businessName: string;
  website: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  city: string;
  state: string;
  zipCode: string;
  status: LeadStatus;
  statusChangedAt: string;
  domainRating: number | null;
  currentRank: number | null;
  reviewCount: number | null;
  reviewAvg: number | null;
  dealValueTotal: number;
  mrr: number;
  arr: number;
  ltvEstimated: number;
  createdAt: string;
  territory: { id: number; name: string } | null;
  assignedUser: { id: number; name: string } | null;
  leadSource: { id: number; name: string } | null;
  notes: {
    id: number;
    content: string;
    createdAt: string;
    user: { id: number; name: string };
  }[];
  dealProducts: {
    id: number;
    quantity: number;
    priceAtSale: number;
    discountPercent: number;
    finalPrice: number;
    product: { id: number; name: string; sku: string; pricingModel: string };
  }[];
  leadHistory: {
    id: number;
    oldStatus: LeadStatus | null;
    newStatus: LeadStatus;
    timeInPreviousStage: number | null;
    changedAt: string;
    user: { id: number; name: string } | null;
  }[];
  competitiveIntel: {
    outscraper: unknown;
    ahrefs: unknown;
    pageSpeed: unknown;
  } | null;
};

type LeadDetailSheetProps = {
  leadId: number | null;
  open: boolean;
  onClose: () => void;
};

export function LeadDetailSheet({ leadId, open, onClose }: LeadDetailSheetProps) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  const fetchLead = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      const data = await res.json();
      if (data.success) {
        setLead(data.data);
      }
    } catch {
      toast.error("Failed to load lead details");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (open && leadId) {
      fetchLead();
    } else {
      setLead(null);
    }
  }, [open, leadId, fetchLead]);

  const [enriching, setEnriching] = useState(false);
  const [generatingWO, setGeneratingWO] = useState(false);
  const [generatingAudit, setGeneratingAudit] = useState(false);

  const handleEnrich = async (force = false) => {
    if (!leadId) return;
    setEnriching(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Lead enriched with latest data");
        fetchLead();
      } else if (data.code === "RECENTLY_ENRICHED") {
        toast.warning(data.error, {
          action: {
            label: "Force Re-enrich",
            onClick: () => handleEnrich(true),
          },
          duration: 8000,
        });
      } else {
        toast.error(data.error || "Enrichment failed");
      }
    } catch {
      toast.error("Enrichment failed");
    } finally {
      setEnriching(false);
    }
  };

  const handleGenerateWO = async () => {
    if (!leadId) return;
    setGeneratingWO(true);
    try {
      const res = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || "work-order.pdf";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Work order downloaded");
        fetchLead();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to generate work order");
      }
    } catch {
      toast.error("Failed to generate work order");
    } finally {
      setGeneratingWO(false);
    }
  };

  const handleGenerateAudit = async () => {
    if (!leadId) return;
    setGeneratingAudit(true);
    try {
      // Open audit in new tab — rep uses browser Print → Save as PDF
      const url = `/api/leads/${leadId}/audit?autoprint=1`;
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success("Audit opened — use Print → Save as PDF to download");
    } finally {
      setGeneratingAudit(false);
    }
  };

  const handleSendWO = async () => {
    if (!leadId) return;
    if (!lead?.email) {
      toast.error("Add an email address first");
      return;
    }
    try {
      const res = await fetch("/api/work-orders/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Work order sent to ${lead.email}`);
      } else {
        toast.error(data.error || "Failed to send");
      }
    } catch {
      toast.error("Failed to send work order");
    }
  };

  const handleAddNote = async () => {
    if (!leadId || !noteText.trim()) return;
    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNoteText("");
        fetchLead(); // Refresh to show new note
        toast.success("Note added");
      } else {
        toast.error(data.error || "Failed to add note");
      }
    } catch {
      toast.error("Failed to add note");
    } finally {
      setSubmittingNote(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const formatCurrency = (val: number) =>
    val > 0 ? `$${val.toLocaleString()}` : "—";

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-40">
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        )}

        {lead && (
          <>
            <SheetHeader className="pb-4">
              <div className="flex items-start justify-between gap-2">
                <SheetTitle className="text-lg leading-tight">
                  {lead.businessName}
                </SheetTitle>
                <Badge className={LEAD_STATUS_CONFIG[lead.status].bgColor + " " + LEAD_STATUS_CONFIG[lead.status].color}>
                  {LEAD_STATUS_CONFIG[lead.status].label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {lead.city}, {lead.state} {lead.zipCode}
                {lead.territory && ` · ${lead.territory.name}`}
              </p>
            </SheetHeader>

            {/* Contact info - editable */}
            <div className="grid grid-cols-2 gap-3 text-sm pb-4">
              <EditableField
                label="Phone"
                value={lead.phone}
                leadId={lead.id}
                field="phone"
                onSaved={fetchLead}
              />
              <EditableField
                label="Email"
                value={lead.email || ""}
                leadId={lead.id}
                field="email"
                onSaved={fetchLead}
              />
              <div>
                <span className="text-muted-foreground">Website</span>
                <p className="font-medium truncate">
                  {lead.website ? (
                    <a
                      href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      {lead.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Assigned</span>
                <AssignRepDropdown
                  leadId={lead.id}
                  currentUserId={lead.assignedUser?.id ?? null}
                  currentUserName={lead.assignedUser?.name ?? "Unassigned"}
                  onAssigned={fetchLead}
                />
              </div>
            </div>

            {/* Value metrics */}
            <div className="grid grid-cols-4 gap-2 text-center pb-4">
              {[
                { label: "Deal", value: formatCurrency(lead.dealValueTotal) },
                { label: "MRR", value: formatCurrency(lead.mrr) },
                { label: "ARR", value: formatCurrency(lead.arr) },
                { label: "LTV", value: formatCurrency(lead.ltvEstimated) },
              ].map((m) => (
                <div key={m.label} className="bg-muted/50 rounded px-2 py-1.5">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-sm font-semibold">{m.value}</p>
                </div>
              ))}
            </div>

            {/* SEO metrics */}
            {(lead.domainRating !== null || lead.reviewCount !== null) && (
              <TooltipProvider>
                <div className="grid grid-cols-4 gap-2 text-center pb-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-muted/50 rounded px-2 py-1.5 cursor-help">
                        <p className="text-xs text-muted-foreground">DR</p>
                        <p className="text-sm font-semibold">{lead.domainRating ?? "—"}</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">Domain Rating (0–100) — Ahrefs authority score measuring how strong this website&apos;s backlink profile is. Higher = stronger online presence and easier to rank in Google. DR 30+ is established; DR 50+ is competitive.</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-muted/50 rounded px-2 py-1.5 cursor-help">
                        <p className="text-xs text-muted-foreground">Rank</p>
                        <p className="text-sm font-semibold">{lead.currentRank ?? "—"}</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">Google Maps / Local Pack ranking position for their primary keyword in their city. #1 = top spot; lower numbers = more visibility. Businesses outside the top 3 get significantly fewer calls.</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="bg-muted/50 rounded px-2 py-1.5">
                    <p className="text-xs text-muted-foreground">Reviews</p>
                    <p className="text-sm font-semibold">{lead.reviewCount ?? "—"}</p>
                  </div>
                  <div className="bg-muted/50 rounded px-2 py-1.5">
                    <p className="text-xs text-muted-foreground">Avg ⭐</p>
                    <p className="text-sm font-semibold">
                      {lead.reviewAvg != null ? Number(lead.reviewAvg).toFixed(1) : "—"}
                    </p>
                  </div>
                </div>
              </TooltipProvider>
            )}

            <Separator />

            {/* Action buttons */}
            <TooltipProvider>
              <div className="flex flex-wrap gap-2 py-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleGenerateAudit}
                      disabled={generatingAudit}
                    >
                      <ClipboardList className="h-4 w-4 mr-1.5" />
                      {generatingAudit ? "Building..." : "Audit PDF"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">Generates a branded prospect audit report with live keyword rankings, citation health, review scores, and PageSpeed data. Opens in a new tab — use Print → Save as PDF to download.</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                    onClick={() => handleEnrich()}
                      disabled={enriching}
                    >
                      <Search className="h-4 w-4 mr-1.5" />
                      {enriching ? "Enriching..." : "Enrich Data"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">Pulls the latest Domain Rating, Google ranking, reviews, and contact info from external sources. Updates the lead with fresh intelligence.</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleGenerateWO}
                      disabled={generatingWO || lead.dealProducts.length === 0}
                    >
                      <FileText className="h-4 w-4 mr-1.5" />
                      {generatingWO ? "Generating..." : "Work Order"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">Generates a PDF service agreement listing all attached products and pricing. Downloads to your device. Add products first to enable this.</p>
                  </TooltipContent>
                </Tooltip>
                {lead.email && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSendWO}
                        disabled={lead.dealProducts.length === 0}
                      >
                        <Mail className="h-4 w-4 mr-1.5" />
                        Send WO
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">Emails the work order PDF directly to {lead.email}. The client receives a professional service agreement they can sign and return.</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>

            <Separator />

            {/* Onboarding link generation */}
            <OnboardingPanel leadId={lead.id} leadStatus={lead.status} />

            {/* Tabs: Notes, Products, History */}
            <Tabs defaultValue="notes" className="pt-4">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="notes">
                  Notes ({lead.notes.length})
                </TabsTrigger>
                <TabsTrigger value="products">
                  Products ({lead.dealProducts.length})
                </TabsTrigger>
                <TabsTrigger value="history">
                  History ({lead.leadHistory.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="space-y-3 pt-3">
                {/* Add note form */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a note..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!noteText.trim() || submittingNote}
                  >
                    {submittingNote ? "Adding..." : "Add Note"}
                  </Button>
                </div>

                <Separator />

                {lead.notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No notes yet
                  </p>
                ) : (
                  lead.notes.map((note) => (
                    <div key={note.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-medium">{note.user.name}</span>
                        <span>{formatDate(note.createdAt)}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="products" className="space-y-3 pt-3">
                {/* Add product form */}
                <AddProductForm
                  leadId={lead.id}
                  onAdded={fetchLead}
                />

                {lead.dealProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No products attached yet
                  </p>
                ) : (
                  lead.dealProducts.map((dp) => (
                    <div
                      key={dp.id}
                      className="flex items-center justify-between p-2 rounded bg-muted/50"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{dp.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {dp.product.sku} · {dp.product.pricingModel} · qty {dp.quantity}
                          {Number(dp.discountPercent) > 0 && ` · ${dp.discountPercent}% off`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">
                          ${Number(dp.finalPrice).toLocaleString()}
                        </p>
                        <button
                          className="text-xs text-destructive hover:underline"
                          onClick={async () => {
                            try {
                              await fetch(`/api/leads/${lead.id}/products`, {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ dealProductId: dp.id }),
                              });
                              toast.success("Product removed");
                              fetchLead();
                            } catch {
                              toast.error("Failed to remove product");
                            }
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-2 pt-3">
                {lead.leadHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No history yet
                  </p>
                ) : (
                  lead.leadHistory.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        <span className="text-muted-foreground">
                          {h.oldStatus
                            ? LEAD_STATUS_CONFIG[h.oldStatus].label
                            : "New"}
                        </span>
                        {" → "}
                        <span className="font-medium">
                          {LEAD_STATUS_CONFIG[h.newStatus].label}
                        </span>
                        {h.timeInPreviousStage !== null && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({formatDuration(h.timeInPreviousStage)})
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(h.changedAt)}
                      </span>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
