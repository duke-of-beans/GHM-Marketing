"use client";

/**
 * SiteDetail — 6-tab affiliate site detail view
 * Tabs: Overview | Programs | Ad Networks | Revenue | Content | Valuation
 * URL-synced via ?tab= query parameter
 * Sprint 38-40
 */

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Globe, DollarSign, BarChart3, FileText, TrendingUp,
  Plus, Pencil, Trash2, ExternalLink, AlertTriangle,
} from "lucide-react";
// ── Types ──────────────────────────────────────────────────────────────────

type SiteData = {
  id: number;
  domain: string;
  displayName: string | null;
  slug: string;
  niche: string | null;
  category: string | null;
  status: string;
  launchDate: string | null;
  acquisitionDate: string | null;
  acquisitionCost: number | null;
  monthlyRevenueCurrent: number | null;
  monthlyTrafficCurrent: number | null;
  domainAuthority: number | null;
  domainRating: number | null;
  cms: string | null;
  hostingProvider: string | null;
  hostingCostMonthly: number | null;
  monetizationMix: string | null;
  gscPropertyId: string | null;
  ga4PropertyId: string | null;
  gscConnectedAt: string | null;
  ga4ConnectedAt: string | null;
  notes: string | null;
  affiliatePrograms: AffiliateProgram[];
  adNetworks: AdNetwork[];
  revenueEntries: RevenueEntry[];
  contentBriefs: ContentBrief[];
  valuations: SiteValuation[];
};

type AffiliateProgram = {
  id: number; networkName: string; merchantName: string;
  commissionRate: number | null; cookieWindowDays: number | null;
  status: string; lifetimeEarnings: number | null; lastPayoutDate: string | null;
};

type AdNetwork = {
  id: number; networkName: string; status: string;
  currentRpm: number | null; monthlyRevenue: number | null;
  currentMonthlySessions: number | null; monthlySessionsRequired: number | null;
  qualificationProgress?: number | null;
};

type RevenueEntry = {
  id: number; month: number; year: number;
  sourceType: string; sourceName: string;
  revenue: number; sessions: number | null;
  clicks: number | null; pageviews: number | null;
  rpm: number | null; epc: number | null;
};

type ContentBrief = {
  id: number; targetKeyword: string; contentType: string;
  assignedWriterName: string | null; status: string;
  dueDate: string | null; publishedUrl: string | null;
  currentRankingPosition: number | null; monthlyTraffic: number | null;
  attributedRevenue: number | null; refreshDue: boolean;
};

type SiteValuation = {
  id: number; valuationDate: string;
  monthlyNetProfit: number; multipleUsed: number;
  estimatedValue: number; listingStatus: string | null;
  listedPrice: number | null; salePrice: number | null;
  saleDate: string | null; broker: string | null; notes: string | null;
};
// ── Helpers ─────────────────────────────────────────────────────────────────

const SITE_STATUS_VARIANT: Record<string, StatusVariant> = {
  ACTIVE: "success", BUILDING: "info", MONETIZING: "success",
  PARKED: "neutral", FOR_SALE: "warning", SOLD: "neutral", ARCHIVED: "neutral",
};

const PROGRAM_STATUS_VARIANT: Record<string, StatusVariant> = {
  APPROVED: "success", PENDING: "warning", REJECTED: "danger", NOT_APPLIED: "neutral",
};

const NETWORK_STATUS_VARIANT: Record<string, StatusVariant> = {
  APPROVED: "success", PENDING: "warning", NOT_QUALIFIED: "danger", REJECTED: "danger",
};

const BRIEF_STATUS_VARIANT: Record<string, StatusVariant> = {
  BRIEFED: "info", IN_PROGRESS: "warning", REVIEW: "warning",
  PUBLISHED: "success", NEEDS_REFRESH: "danger",
};

const VALUATION_STATUS_VARIANT: Record<string, StatusVariant> = {
  NOT_LISTED: "neutral", LISTED: "info", UNDER_OFFER: "warning", SOLD: "success", WITHDRAWN: "neutral",
};

function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US").format(n);
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const VALID_TABS = ["overview", "programs", "networks", "revenue", "content", "valuation"] as const;
type TabId = (typeof VALID_TABS)[number];
// ── Main Component ──────────────────────────────────────────────────────────

export function SiteDetail({ site }: { site: SiteData }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get("tab") as TabId | null;
  const activeTab: TabId = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "overview";

  function setActiveTab(tab: TabId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const [siteData, setSiteData] = useState(site);
  const [programs, setPrograms] = useState(site.affiliatePrograms);
  const [networks, setNetworks] = useState(site.adNetworks);
  const [revenue, setRevenue] = useState(site.revenueEntries);
  const [briefs, setBriefs] = useState(site.contentBriefs);
  const [valuations, setValuations] = useState(site.valuations);

  const refreshSite = useCallback(async () => {
    const res = await fetch(`/api/affiliate/sites/${site.id}`);
    const data = await res.json();
    if (data.success) {
      setSiteData(data.data);
      setPrograms(data.data.affiliatePrograms ?? []);
      setNetworks(data.data.adNetworks ?? []);
      setRevenue(data.data.revenueEntries ?? []);
      setBriefs(data.data.contentBriefs ?? []);
      setValuations(data.data.valuations ?? []);
    }
  }, [site.id]);
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{siteData.domain}</h1>
            <StatusBadge variant={SITE_STATUS_VARIANT[siteData.status] ?? "neutral"} dot size="md">
              {siteData.status.replace(/_/g, " ")}
            </StatusBadge>
          </div>
          {siteData.displayName && (
            <p className="text-muted-foreground mt-1">{siteData.displayName}</p>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Monthly Revenue</p>
          <p className="text-lg font-bold">{formatCurrency(siteData.monthlyRevenueCurrent)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Monthly Traffic</p>
          <p className="text-lg font-bold">{formatNumber(siteData.monthlyTrafficCurrent)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">DA / DR</p>
          <p className="text-lg font-bold">{siteData.domainAuthority ?? "—"} / {siteData.domainRating ?? "—"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Programs</p>
          <p className="text-lg font-bold">{programs.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Briefs</p>
          <p className="text-lg font-bold">{briefs.length}</p>
        </CardContent></Card>
      </div>
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="networks">Ad Networks</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab site={siteData} onUpdate={refreshSite} />
        </TabsContent>
        <TabsContent value="programs">
          <ProgramsTab siteId={site.id} programs={programs} onUpdate={refreshSite} />
        </TabsContent>
        <TabsContent value="networks">
          <NetworksTab siteId={site.id} networks={networks} onUpdate={refreshSite} />
        </TabsContent>
        <TabsContent value="revenue">
          <RevenueTab siteId={site.id} entries={revenue} onUpdate={refreshSite} />
        </TabsContent>
        <TabsContent value="content">
          <ContentTab siteId={site.id} briefs={briefs} onUpdate={refreshSite} />
        </TabsContent>
        <TabsContent value="valuation">
          <ValuationTab siteId={site.id} valuations={valuations} onUpdate={refreshSite} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
// ── TAB 1: Overview ─────────────────────────────────────────────────────────

function OverviewTab({ site, onUpdate }: { site: SiteData; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...site });
  const [saving, setSaving] = useState(false);

  function update(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      const fields = ["displayName", "niche", "category", "status", "cms", "hostingProvider",
        "monetizationMix", "gscPropertyId", "ga4PropertyId", "notes"] as const;
      for (const f of fields) if (form[f] !== site[f]) body[f] = form[f];
      const numFields = ["monthlyRevenueCurrent", "monthlyTrafficCurrent", "domainAuthority",
        "domainRating", "hostingCostMonthly", "acquisitionCost"] as const;
      for (const f of numFields) {
        const v = form[f as keyof typeof form];
        if (v !== site[f as keyof typeof site]) body[f] = v != null ? Number(v) : null;
      }
      if (form.launchDate !== site.launchDate) body.launchDate = form.launchDate ? new Date(form.launchDate as string).toISOString() : null;
      if (form.acquisitionDate !== site.acquisitionDate) body.acquisitionDate = form.acquisitionDate ? new Date(form.acquisitionDate as string).toISOString() : null;

      await fetch(`/api/affiliate/sites/${site.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setEditing(false);
      onUpdate();
    } finally { setSaving(false); }
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Site Details</CardTitle>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setEditing(false); setForm({ ...site }); }}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-muted-foreground block">Domain</span><span className="font-medium">{site.domain}</span></div>
          <div><span className="text-muted-foreground block">Display Name</span>
            {editing ? <Input value={form.displayName ?? ""} onChange={(e) => update("displayName", e.target.value)} className="mt-1" />
              : <span className="font-medium">{site.displayName ?? "—"}</span>}</div>
          <div><span className="text-muted-foreground block">Niche</span>
            {editing ? <Input value={form.niche ?? ""} onChange={(e) => update("niche", e.target.value)} className="mt-1" />
              : <span className="font-medium">{site.niche ?? "—"}</span>}</div>
          <div><span className="text-muted-foreground block">Category</span>
            {editing ? <Input value={form.category ?? ""} onChange={(e) => update("category", e.target.value)} className="mt-1" />
              : <span className="font-medium">{site.category ?? "—"}</span>}</div>
          <div><span className="text-muted-foreground block">CMS</span>
            {editing ? <Input value={form.cms ?? ""} onChange={(e) => update("cms", e.target.value)} className="mt-1" />
              : <span className="font-medium">{site.cms ?? "—"}</span>}</div>
          <div><span className="text-muted-foreground block">Hosting</span>
            {editing ? <Input value={form.hostingProvider ?? ""} onChange={(e) => update("hostingProvider", e.target.value)} className="mt-1" />
              : <span className="font-medium">{site.hostingProvider ?? "—"}</span>}</div>
          <div><span className="text-muted-foreground block">Hosting Cost</span><span className="font-medium">{formatCurrency(site.hostingCostMonthly)}/mo</span></div>
          <div><span className="text-muted-foreground block">Monetization</span><span className="font-medium capitalize">{site.monetizationMix ?? "—"}</span></div>
          <div><span className="text-muted-foreground block">Launch Date</span><span className="font-medium">{formatDate(site.launchDate)}</span></div>
          <div><span className="text-muted-foreground block">Acquisition Date</span><span className="font-medium">{formatDate(site.acquisitionDate)}</span></div>
          <div><span className="text-muted-foreground block">Acquisition Cost</span><span className="font-medium">{formatCurrency(site.acquisitionCost)}</span></div>

          {/* GSC / GA4 Connection */}
          <div><span className="text-muted-foreground block">GSC Property</span>
            {editing ? <Input value={(form as any).gscPropertyId ?? ""} onChange={(e) => update("gscPropertyId", e.target.value || null)} className="mt-1" placeholder="sc-domain:example.com" />
              : <span className="font-medium">{site.gscPropertyId ? <>{site.gscPropertyId} <Badge variant="outline" className="ml-1 text-xs">Connected</Badge></> : "Not connected"}</span>}</div>
          <div><span className="text-muted-foreground block">GA4 Property</span>
            {editing ? <Input value={(form as any).ga4PropertyId ?? ""} onChange={(e) => update("ga4PropertyId", e.target.value || null)} className="mt-1" placeholder="properties/123456789" />
              : <span className="font-medium">{site.ga4PropertyId ? <>{site.ga4PropertyId} <Badge variant="outline" className="ml-1 text-xs">Connected</Badge></> : "Not connected"}</span>}</div>
          <div><span className="text-muted-foreground block">Last GSC Sync</span><span className="font-medium">{site.gscConnectedAt ? new Date(site.gscConnectedAt).toLocaleDateString() : "Never"}</span></div>

          <div className="col-span-2 md:col-span-3"><span className="text-muted-foreground block">Notes</span>
            {editing ? <Textarea value={form.notes ?? ""} onChange={(e) => update("notes", e.target.value)} className="mt-1" rows={3} />
              : <span className="font-medium whitespace-pre-wrap">{site.notes ?? "—"}</span>}</div>
        </div>
      </CardContent>
    </Card>
  );
}
// ── TAB 2: Programs ─────────────────────────────────────────────────────────

function ProgramsTab({ siteId, programs, onUpdate }: { siteId: number; programs: AffiliateProgram[]; onUpdate: () => void }) {
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ networkName: "", merchantName: "", commissionRate: "", cookieWindowDays: "", status: "NOT_APPLIED" });

  async function addProgram() {
    const body: Record<string, unknown> = { networkName: form.networkName, merchantName: form.merchantName, status: form.status };
    if (form.commissionRate) body.commissionRate = parseFloat(form.commissionRate);
    if (form.cookieWindowDays) body.cookieWindowDays = parseInt(form.cookieWindowDays, 10);
    await fetch(`/api/affiliate/sites/${siteId}/programs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setAddOpen(false);
    setForm({ networkName: "", merchantName: "", commissionRate: "", cookieWindowDays: "", status: "NOT_APPLIED" });
    onUpdate();
  }

  async function deleteProgram(id: number) {
    await fetch(`/api/affiliate/programs/${id}`, { method: "DELETE" });
    onUpdate();
  }

  if (programs.length === 0 && !addOpen) {
    return (
      <>
        <EmptyState icon={DollarSign} title="No affiliate programs" description="Add your first affiliate program to start tracking commissions."
          action={{ label: "Add Program", onClick: () => setAddOpen(true) }} />
        {addOpen && renderAddDialog()}
      </>
    );
  }

  function renderAddDialog() {
    return (
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Affiliate Program</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Network *</Label><Input value={form.networkName} onChange={(e) => setForm(p => ({ ...p, networkName: e.target.value }))} placeholder="ShareASale" /></div>
            <div><Label>Merchant *</Label><Input value={form.merchantName} onChange={(e) => setForm(p => ({ ...p, merchantName: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Commission Rate (%)</Label><Input type="number" value={form.commissionRate} onChange={(e) => setForm(p => ({ ...p, commissionRate: e.target.value }))} /></div>
              <div><Label>Cookie Window (days)</Label><Input type="number" value={form.cookieWindowDays} onChange={(e) => setForm(p => ({ ...p, cookieWindowDays: e.target.value }))} /></div>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["NOT_APPLIED", "PENDING", "APPROVED", "REJECTED"].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addProgram} disabled={!form.networkName || !form.merchantName}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Program</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Network</th>
              <th className="text-left p-3 font-medium">Merchant</th>
              <th className="text-right p-3 font-medium">Commission %</th>
              <th className="text-right p-3 font-medium">Cookie (days)</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Lifetime Earnings</th>
              <th className="text-right p-3 font-medium">Last Payout</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {programs.map((p) => (
                <tr key={p.id} className="border-b hover:bg-muted/30">
                  <td className="p-3">{p.networkName}</td>
                  <td className="p-3 font-medium">{p.merchantName}</td>
                  <td className="p-3 text-right font-mono">{p.commissionRate != null ? `${p.commissionRate}%` : "—"}</td>
                  <td className="p-3 text-right font-mono">{p.cookieWindowDays ?? "—"}</td>
                  <td className="p-3"><StatusBadge variant={PROGRAM_STATUS_VARIANT[p.status] ?? "neutral"} dot>{p.status.replace(/_/g, " ")}</StatusBadge></td>
                  <td className="p-3 text-right font-mono">{formatCurrency(p.lifetimeEarnings)}</td>
                  <td className="p-3 text-right">{formatDate(p.lastPayoutDate)}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteProgram(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      {renderAddDialog()}
    </div>
  );
}
// ── TAB 3: Ad Networks ──────────────────────────────────────────────────────

function NetworksTab({ siteId, networks, onUpdate }: { siteId: number; networks: AdNetwork[]; onUpdate: () => void }) {
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ networkName: "", status: "NOT_QUALIFIED", monthlySessionsRequired: "" });

  async function addNetwork() {
    const body: Record<string, unknown> = { networkName: form.networkName, status: form.status };
    if (form.monthlySessionsRequired) body.monthlySessionsRequired = parseInt(form.monthlySessionsRequired, 10);
    await fetch(`/api/affiliate/sites/${siteId}/networks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setAddOpen(false);
    setForm({ networkName: "", status: "NOT_QUALIFIED", monthlySessionsRequired: "" });
    onUpdate();
  }

  function qualColor(progress: number | null | undefined): string {
    if (progress == null) return "bg-muted";
    if (progress >= 100) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-500";
  }

  if (networks.length === 0 && !addOpen) {
    return (
      <EmptyState icon={BarChart3} title="No ad networks" description="Add your first display ad network to track qualification and RPM."
        action={{ label: "Add Network", onClick: () => setAddOpen(true) }} />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Network</Button>
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium">Network</th>
            <th className="text-left p-3 font-medium">Status</th>
            <th className="text-right p-3 font-medium">Current RPM</th>
            <th className="text-right p-3 font-medium">Monthly Revenue</th>
            <th className="text-right p-3 font-medium">Sessions</th>
            <th className="text-left p-3 font-medium w-48">Qualification</th>
          </tr></thead>
          <tbody>
            {networks.map((n) => {
              const sessionsNeeded = n.monthlySessionsRequired && n.currentMonthlySessions
                ? Math.max(0, n.monthlySessionsRequired - n.currentMonthlySessions) : null;
              return (
                <tr key={n.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{n.networkName}</td>
                  <td className="p-3"><StatusBadge variant={NETWORK_STATUS_VARIANT[n.status] ?? "neutral"} dot>{n.status.replace(/_/g, " ")}</StatusBadge></td>
                  <td className="p-3 text-right font-mono">{n.currentRpm != null ? `$${n.currentRpm.toFixed(2)}` : "—"}</td>
                  <td className="p-3 text-right font-mono">{formatCurrency(n.monthlyRevenue)}</td>
                  <td className="p-3 text-right font-mono">{formatNumber(n.currentMonthlySessions)}</td>
                  <td className="p-3">
                    {n.qualificationProgress != null ? (
                      <div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${qualColor(n.qualificationProgress)}`} style={{ width: `${Math.min(n.qualificationProgress, 100)}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {n.qualificationProgress >= 100 ? "Qualified" : sessionsNeeded != null ? `${formatNumber(sessionsNeeded)} more sessions needed` : `${n.qualificationProgress}%`}
                        </p>
                      </div>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent></Card>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Ad Network</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Network Name *</Label><Input value={form.networkName} onChange={(e) => setForm(p => ({ ...p, networkName: e.target.value }))} placeholder="Mediavine" /></div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["NOT_QUALIFIED", "PENDING", "APPROVED", "REJECTED"].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Sessions Required</Label><Input type="number" value={form.monthlySessionsRequired} onChange={(e) => setForm(p => ({ ...p, monthlySessionsRequired: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addNetwork} disabled={!form.networkName}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
// ── TAB 4: Revenue ──────────────────────────────────────────────────────────

function RevenueTab({ siteId, entries, onUpdate }: { siteId: number; entries: RevenueEntry[]; onUpdate: () => void }) {
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ month: "", year: "", sourceType: "AFFILIATE", sourceName: "", revenue: "", sessions: "", pageviews: "", clicks: "" });

  const currentYear = new Date().getFullYear();
  const ytdRevenue = entries.filter(e => e.year === currentYear).reduce((sum, e) => sum + (e.revenue ?? 0), 0);
  const allTimeRevenue = entries.reduce((sum, e) => sum + (e.revenue ?? 0), 0);

  // Live RPM preview
  const liveRpm = form.revenue && form.sessions && parseInt(form.sessions, 10) > 0
    ? ((parseFloat(form.revenue) / parseInt(form.sessions, 10)) * 1000).toFixed(2) : null;

  async function addEntry() {
    const body: Record<string, unknown> = {
      month: parseInt(form.month, 10), year: parseInt(form.year, 10),
      sourceType: form.sourceType, sourceName: form.sourceName,
      revenue: parseFloat(form.revenue),
    };
    if (form.sessions) body.sessions = parseInt(form.sessions, 10);
    if (form.pageviews) body.pageviews = parseInt(form.pageviews, 10);
    if (form.clicks) body.clicks = parseInt(form.clicks, 10);
    await fetch(`/api/affiliate/sites/${siteId}/revenue`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setAddOpen(false);
    setForm({ month: "", year: "", sourceType: "AFFILIATE", sourceName: "", revenue: "", sessions: "", pageviews: "", clicks: "" });
    onUpdate();
  }

  if (entries.length === 0 && !addOpen) {
    return <EmptyState icon={DollarSign} title="No revenue entries" description="Add revenue data to start tracking performance."
      action={{ label: "Add Revenue Entry", onClick: () => setAddOpen(true) }} />;
  }
  return (
    <div className="space-y-4">
      {/* Totals strip */}
      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">YTD Revenue ({currentYear})</p><p className="text-xl font-bold">{formatCurrency(ytdRevenue)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">All-time Revenue</p><p className="text-xl font-bold">{formatCurrency(allTimeRevenue)}</p></CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Revenue Entry</Button>
      </div>

      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium">Period</th>
            <th className="text-left p-3 font-medium">Source Type</th>
            <th className="text-left p-3 font-medium">Source</th>
            <th className="text-right p-3 font-medium">Revenue</th>
            <th className="text-right p-3 font-medium">Sessions</th>
            <th className="text-right p-3 font-medium">RPM</th>
            <th className="text-right p-3 font-medium">EPC</th>
          </tr></thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-mono">{e.month}/{e.year}</td>
                <td className="p-3">{e.sourceType}</td>
                <td className="p-3">{e.sourceName}</td>
                <td className="p-3 text-right font-mono">{formatCurrency(e.revenue)}</td>
                <td className="p-3 text-right font-mono">{formatNumber(e.sessions)}</td>
                <td className="p-3 text-right font-mono">{e.rpm != null ? `$${e.rpm.toFixed(2)}` : "—"}</td>
                <td className="p-3 text-right font-mono">{e.epc != null ? `$${e.epc.toFixed(2)}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Revenue Entry</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Month (1-12) *</Label><Input type="number" min={1} max={12} value={form.month} onChange={(e) => setForm(p => ({ ...p, month: e.target.value }))} /></div>
            <div><Label>Year *</Label><Input type="number" value={form.year} onChange={(e) => setForm(p => ({ ...p, year: e.target.value }))} placeholder={String(currentYear)} /></div>
            <div><Label>Source Type *</Label>
              <Select value={form.sourceType} onValueChange={(v) => setForm(p => ({ ...p, sourceType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["AFFILIATE", "DISPLAY", "SPONSORED", "DIRECT", "OTHER"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Source Name *</Label><Input value={form.sourceName} onChange={(e) => setForm(p => ({ ...p, sourceName: e.target.value }))} /></div>
            <div><Label>Revenue ($) *</Label><Input type="number" step="0.01" value={form.revenue} onChange={(e) => setForm(p => ({ ...p, revenue: e.target.value }))} /></div>
            <div><Label>Sessions</Label><Input type="number" value={form.sessions} onChange={(e) => setForm(p => ({ ...p, sessions: e.target.value }))} /></div>
            <div><Label>Pageviews</Label><Input type="number" value={form.pageviews} onChange={(e) => setForm(p => ({ ...p, pageviews: e.target.value }))} /></div>
            <div><Label>Clicks</Label><Input type="number" value={form.clicks} onChange={(e) => setForm(p => ({ ...p, clicks: e.target.value }))} /></div>
          </div>
          {liveRpm && <p className="text-sm text-muted-foreground">Live RPM preview: <span className="font-mono font-medium">${liveRpm}</span></p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addEntry} disabled={!form.month || !form.year || !form.sourceName || !form.revenue}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
// ── TAB 5: Content ──────────────────────────────────────────────────────────

const BRIEF_FILTERS = ["ALL", "BRIEFED", "IN_PROGRESS", "REVIEW", "PUBLISHED", "NEEDS_REFRESH"] as const;

function ContentTab({ siteId, briefs, onUpdate }: { siteId: number; briefs: ContentBrief[]; onUpdate: () => void }) {
  const [addOpen, setAddOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkWriter, setBulkWriter] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [form, setForm] = useState({ targetKeyword: "", contentType: "BLOG_POST", assignedWriterName: "", dueDate: "" });

  const filtered = statusFilter === "ALL" ? briefs
    : statusFilter === "NEEDS_REFRESH" ? briefs.filter(b => b.refreshDue)
    : briefs.filter(b => b.status === statusFilter);

  function toggleSelect(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function addBrief() {
    const body: Record<string, unknown> = { targetKeyword: form.targetKeyword, contentType: form.contentType };
    if (form.assignedWriterName) body.assignedWriterName = form.assignedWriterName;
    if (form.dueDate) body.dueDate = new Date(form.dueDate).toISOString();
    await fetch(`/api/affiliate/sites/${siteId}/briefs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setAddOpen(false);
    setForm({ targetKeyword: "", contentType: "BLOG_POST", assignedWriterName: "", dueDate: "" });
    onUpdate();
  }

  async function bulkAssign() {
    if (!bulkWriter.trim()) return;
    for (const id of Array.from(selected)) {
      await fetch(`/api/affiliate/briefs/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignedWriterName: bulkWriter }) });
    }
    setSelected(new Set());
    setBulkWriter("");
    setShowBulk(false);
    onUpdate();
  }

  async function deleteBrief(id: number) {
    await fetch(`/api/affiliate/briefs/${id}`, { method: "DELETE" });
    onUpdate();
  }

  if (briefs.length === 0 && !addOpen) {
    return <EmptyState icon={FileText} title="No content briefs" description="Add your first content brief to plan and track affiliate content."
      action={{ label: "Add Brief", onClick: () => setAddOpen(true) }} />;
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {BRIEF_FILTERS.map(f => (
            <Button key={f} variant={statusFilter === f ? "default" : "outline"} size="sm"
              onClick={() => setStatusFilter(f)}>{f.replace(/_/g, " ")}</Button>
          ))}
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowBulk(true)}>Assign Writer ({selected.size})</Button>
          )}
          <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Brief</Button>
        </div>
      </div>

      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/50">
            <th className="p-3 w-8"><input type="checkbox" onChange={(e) => {
              if (e.target.checked) setSelected(new Set(filtered.map(b => b.id)));
              else setSelected(new Set());
            }} /></th>
            <th className="text-left p-3 font-medium">Keyword</th>
            <th className="text-left p-3 font-medium">Type</th>
            <th className="text-left p-3 font-medium">Writer</th>
            <th className="text-left p-3 font-medium">Status</th>
            <th className="text-left p-3 font-medium">Due Date</th>
            <th className="text-right p-3 font-medium">Position</th>
            <th className="text-right p-3 font-medium">Traffic</th>
            <th className="text-right p-3 font-medium">Revenue</th>
            <th className="text-right p-3 font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className={`border-b hover:bg-muted/30 ${b.refreshDue ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}`}>
                <td className="p-3"><input type="checkbox" checked={selected.has(b.id)} onChange={() => toggleSelect(b.id)} /></td>
                <td className="p-3 font-medium">{b.targetKeyword}</td>
                <td className="p-3"><Badge variant="outline">{b.contentType.replace(/_/g, " ")}</Badge></td>
                <td className="p-3 text-muted-foreground">{b.assignedWriterName ?? "—"}</td>
                <td className="p-3">
                  <StatusBadge variant={BRIEF_STATUS_VARIANT[b.status] ?? "neutral"} dot>{b.status.replace(/_/g, " ")}</StatusBadge>
                  {b.refreshDue && <StatusBadge variant="warning" className="ml-1">Needs Refresh</StatusBadge>}
                </td>
                <td className="p-3">{formatDate(b.dueDate)}</td>
                <td className="p-3 text-right font-mono">{b.currentRankingPosition ?? "—"}</td>
                <td className="p-3 text-right font-mono">{formatNumber(b.monthlyTraffic)}</td>
                <td className="p-3 text-right font-mono">{formatCurrency(b.attributedRevenue)}</td>
                <td className="p-3 text-right">
                  {b.publishedUrl && <Button variant="ghost" size="icon" className="h-7 w-7" asChild><a href={b.publishedUrl} target="_blank" rel="noopener"><ExternalLink className="h-3.5 w-3.5" /></a></Button>}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteBrief(b.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
      {/* Add Brief Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Content Brief</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Target Keyword *</Label><Input value={form.targetKeyword} onChange={(e) => setForm(p => ({ ...p, targetKeyword: e.target.value }))} /></div>
            <div><Label>Content Type *</Label>
              <Select value={form.contentType} onValueChange={(v) => setForm(p => ({ ...p, contentType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["BLOG_POST", "REVIEW", "COMPARISON", "GUIDE", "LANDING_PAGE", "OTHER"].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Writer</Label><Input value={form.assignedWriterName} onChange={(e) => setForm(p => ({ ...p, assignedWriterName: e.target.value }))} placeholder="Freelancer name" /></div>
            <div><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm(p => ({ ...p, dueDate: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addBrief} disabled={!form.targetKeyword}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={showBulk} onOpenChange={setShowBulk}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Writer to {selected.size} Briefs</DialogTitle></DialogHeader>
          <div><Label>Writer Name</Label><Input value={bulkWriter} onChange={(e) => setBulkWriter(e.target.value)} placeholder="Writer name" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulk(false)}>Cancel</Button>
            <Button onClick={bulkAssign} disabled={!bulkWriter.trim()}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
// ── TAB 6: Valuation ────────────────────────────────────────────────────────

const LISTING_STATUSES = ["NOT_LISTED", "LISTED", "UNDER_OFFER", "SOLD", "WITHDRAWN"];

function ValuationTab({ siteId, valuations, onUpdate }: { siteId: number; valuations: SiteValuation[]; onUpdate: () => void }) {
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    monthlyNetProfit: "", multipleUsed: "36", listingStatus: "NOT_LISTED",
    listedPrice: "", salePrice: "", saleDate: "", broker: "", notes: "",
  });

  const latest = valuations[0] ?? null;
  const liveEstimate = form.monthlyNetProfit && form.multipleUsed
    ? (parseFloat(form.monthlyNetProfit) * parseFloat(form.multipleUsed)).toFixed(0) : null;

  async function addValuation() {
    const body: Record<string, unknown> = {
      monthlyNetProfit: parseFloat(form.monthlyNetProfit),
      multipleUsed: parseFloat(form.multipleUsed),
      listingStatus: form.listingStatus,
    };
    if (form.listedPrice) body.listedPrice = parseFloat(form.listedPrice);
    if (form.salePrice) body.salePrice = parseFloat(form.salePrice);
    if (form.saleDate) body.saleDate = new Date(form.saleDate).toISOString();
    if (form.broker) body.broker = form.broker;
    if (form.notes) body.notes = form.notes;
    await fetch(`/api/affiliate/sites/${siteId}/valuations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setAddOpen(false);
    setForm({ monthlyNetProfit: "", multipleUsed: "36", listingStatus: "NOT_LISTED", listedPrice: "", salePrice: "", saleDate: "", broker: "", notes: "" });
    onUpdate();
  }
  return (
    <div className="space-y-4">
      {/* Current Valuation Card */}
      {latest && (
        <Card className="border-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Current Valuation</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-xs text-muted-foreground">Monthly Net Profit</p><p className="text-lg font-bold">{formatCurrency(latest.monthlyNetProfit)}</p></div>
              <div><p className="text-xs text-muted-foreground">Multiple</p><p className="text-lg font-bold">{latest.multipleUsed}x</p></div>
              <div><p className="text-xs text-muted-foreground">Estimated Value</p><p className="text-2xl font-bold text-primary">{formatCurrency(latest.estimatedValue)}</p></div>
              <div><p className="text-xs text-muted-foreground">Listing Status</p>
                <StatusBadge variant={VALUATION_STATUS_VARIANT[latest.listingStatus ?? "NOT_LISTED"] ?? "neutral"} dot size="md">
                  {(latest.listingStatus ?? "NOT_LISTED").replace(/_/g, " ")}
                </StatusBadge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Valuation</Button>
      </div>

      {valuations.length > 0 ? (
        <Card><CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-right p-3 font-medium">Net Profit</th>
              <th className="text-right p-3 font-medium">Multiple</th>
              <th className="text-right p-3 font-medium">Estimated Value</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Broker</th>
            </tr></thead>
            <tbody>
              {valuations.map((v) => (
                <tr key={v.id} className="border-b hover:bg-muted/30">
                  <td className="p-3">{formatDate(v.valuationDate)}</td>
                  <td className="p-3 text-right font-mono">{formatCurrency(v.monthlyNetProfit)}</td>
                  <td className="p-3 text-right font-mono">{v.multipleUsed}x</td>
                  <td className="p-3 text-right font-mono font-medium">{formatCurrency(v.estimatedValue)}</td>
                  <td className="p-3"><StatusBadge variant={VALUATION_STATUS_VARIANT[v.listingStatus ?? "NOT_LISTED"] ?? "neutral"}>{(v.listingStatus ?? "NOT_LISTED").replace(/_/g, " ")}</StatusBadge></td>
                  <td className="p-3 text-muted-foreground">{v.broker ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent></Card>
      ) : !addOpen ? (
        <EmptyState icon={TrendingUp} title="No valuations yet" description="Add your first valuation to track site value over time."
          action={{ label: "Add Valuation", onClick: () => setAddOpen(true) }} />
      ) : null}
      {/* Add Valuation Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Valuation</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Monthly Net Profit ($) *</Label><Input type="number" step="0.01" value={form.monthlyNetProfit} onChange={(e) => setForm(p => ({ ...p, monthlyNetProfit: e.target.value }))} /></div>
              <div><Label>Multiple *</Label><Input type="number" step="0.1" value={form.multipleUsed} onChange={(e) => setForm(p => ({ ...p, multipleUsed: e.target.value }))} /></div>
            </div>
            {liveEstimate && (
              <div className="bg-muted p-3 rounded text-center">
                <p className="text-xs text-muted-foreground">Estimated Value</p>
                <p className="text-2xl font-bold">{formatCurrency(parseFloat(liveEstimate))}</p>
              </div>
            )}
            <div><Label>Listing Status</Label>
              <Select value={form.listingStatus} onValueChange={(v) => setForm(p => ({ ...p, listingStatus: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LISTING_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {["LISTED", "UNDER_OFFER"].includes(form.listingStatus) && (
              <div><Label>Listed Price ($)</Label><Input type="number" value={form.listedPrice} onChange={(e) => setForm(p => ({ ...p, listedPrice: e.target.value }))} /></div>
            )}
            {["SOLD", "UNDER_OFFER"].includes(form.listingStatus) && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Sale Price ($)</Label><Input type="number" value={form.salePrice} onChange={(e) => setForm(p => ({ ...p, salePrice: e.target.value }))} /></div>
                <div><Label>Sale Date</Label><Input type="date" value={form.saleDate} onChange={(e) => setForm(p => ({ ...p, saleDate: e.target.value }))} /></div>
              </div>
            )}
            <div><Label>Broker</Label><Input value={form.broker} onChange={(e) => setForm(p => ({ ...p, broker: e.target.value }))} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addValuation} disabled={!form.monthlyNetProfit || !form.multipleUsed}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}