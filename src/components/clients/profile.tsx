"use client";

/**
 * ClientProfile — UX-001 refactor (Feb 21, 2026)
 *
 * Before: 1057-line monolith with all tab content inline.
 * After:  Thin orchestrator. Header + stats pinned at top.
 *         Tab content fully delegated to standalone components.
 *         URL-synced active tab (?tab=scorecard) for deep links.
 *
 * Tab map:
 *   scorecard    → UpsellOpportunities + ScanHistory
 *   tasks        → ClientTasksTab
 *   rankings     → RankingsTab
 *   citations    → CitationsTab
 *   local        → LocalPresenceTab
 *   content      → ContentStudioTab
 *   websites     → WebsiteStudioTab
 *   reports      → ClientReportsTab
 *   domains      → ClientDomainsTab
 *   compensation → ClientCompensationSection
 *   billing      → BillingTab
 *   integrations → ClientIntegrationsTab
 *   notes        → ClientNotesTab
 */

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { isElevated } from "@/lib/auth/roles";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Mic, Sparkles, ChevronDown, Circle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/components/dashboard/metric-card";
import { useTour, CLIENT_DETAIL_TOUR } from "@/lib/tutorials";
import { TourButton } from "@/components/tutorials/TourButton";

import { ScanHistory } from "./scan-history";
import { ClientReportsTab } from "./reports/client-reports-tab";
import { UpsellOpportunities } from "@/components/upsell/upsell-opportunities";
import { EditClientDialog } from "./edit-client-dialog";
import { ClientCompensationSection } from "./client-compensation";
import { ContentStudioTab } from "../content/ContentStudioTab";
import { WebsiteAuditPanel } from "./website-audit/WebsiteAuditPanel";
import { CompetitorsTab } from "./competitors/CompetitorsTab";
import { WebsiteStudioTab } from "./website-studio/WebsiteStudioTab";
import { VoiceProfileDialog } from "./voice/VoiceProfileDialog";
import { BillingTab } from "./billing/BillingTab";
import { RankingsTab } from "./rankings/RankingsTab";
import { CitationsTab } from "./citations/CitationsTab";
import { LocalPresenceTab } from "./local-presence/LocalPresenceTab";
import { ClientIntegrationsTab } from "./integrations/ClientIntegrationsTab";
import { CampaignsTab } from "./CampaignsTab";
import { ClientTasksTab, type ClientTask } from "./tasks/ClientTasksTab";
import { ClientNotesTab, type ClientNote } from "./notes/ClientNotesTab";
import { ClientDomainsTab, type ClientDomain } from "./domains/ClientDomainsTab";
import { SiteHealthTab } from "./site-health/SiteHealthTab";

// ── Types ──────────────────────────────────────────────────────────────────

type ClientData = {
  id: number;
  businessName: string;
  retainerAmount: number;
  healthScore: number;
  scanFrequency: string;
  status: string;
  voiceProfileId: string | null;
  onboardedAt: string;
  lastScanAt: string | null;
  nextScanAt: string | null;
  masterManager: { id: number; name: string; email: string } | null;
  lead: {
    id: number;
    businessName: string;
    phone: string;
    email: string | null;
    address: string | null;
    city: string;
    state: string;
    zipCode: string;
    website: string | null;
    domainRating: number | null;
    reviewCount: number | null;
    reviewAvg: string | null;
    competitiveIntel: Record<string, unknown> | null;
    assignedTo: number | null;
    assignedUser: { id: number; name: string; email: string } | null;
  };
  competitors: Array<{
    id: number;
    businessName: string;
    domain: string | null;
    googlePlaceId: string | null;
  }>;
  domains: ClientDomain[];
  tasks: ClientTask[];
  notes: ClientNote[];
  scans: Array<{
    id: number;
    scanDate: string;
    clientData: Record<string, unknown>;
    competitors: Record<string, unknown>[];
    deltas: Record<string, unknown>;
    alerts: Record<string, unknown>[];
    healthScore: number;
  }>;
  reports: Array<{
    id: number;
    type: string;
    periodStart: string;
    periodEnd: string;
    createdAt: string;
    sentToClient: boolean;
    content: unknown;
  }>;
  upsellOpportunities?: Array<{
    id: number;
    productId: number;
    product: { name: string; category: string | null };
    gapCategory: string;
    opportunityScore: number;
    reasoning: string;
    projectedMrr: string;
    projectedRoi: string | null;
    status: string;
  }>;
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function healthColor(score: number) {
  if (score >= 75) return "bg-status-success-bg text-status-success border-status-success-border";
  if (score >= 50) return "bg-status-warning-bg text-status-warning border-status-warning-border";
  return "bg-status-danger-bg text-status-danger border-status-danger-border";
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(d: string | null) {
  if (!d) return "Never";
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const VALID_TABS = [
  "scorecard", "tasks", "rankings", "citations", "local",
  "content", "websites", "audit", "health", "reports", "domains", "compensation",
  "billing", "campaigns", "integrations", "notes", "competitors",
] as const;

type TabId = (typeof VALID_TABS)[number];

// ── Main export ─────────────────────────────────────────────────────────────

export function ClientProfile({ client, currentUserRole }: { client: ClientData; currentUserRole?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get("tab") as TabId | null;
  const activeTab: TabId =
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : "scorecard";

  function setActiveTab(tab: TabId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const [refreshKey, setRefreshKey] = useState(0);
  const handleUpdate = () => setRefreshKey((prev) => prev + 1);

  const [users, setUsers] = useState<
    Array<{ id: number; name: string; email: string; role: string }>
  >([]);
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);
  const [voiceProfile, setVoiceProfile] = useState<any>(null);
  const [localHasVoice, setLocalHasVoice] = useState(!!client.voiceProfileId);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => { if (d.success) setUsers(d.data); })
      .catch(console.error);
  }, []);

  const loadVoice = useCallback(async () => {
    const res = await fetch(`/api/clients/${client.id}/voice-profile`);
    const data = await res.json();
    if (data.success && data.profile) {
      setVoiceProfile(data.profile);
      setLocalHasVoice(true);
    } else {
      setVoiceProfile(null);
      setLocalHasVoice(false);
    }
  }, [client.id]);

  useEffect(() => {
    if (client.voiceProfileId || refreshKey > 0) loadVoice().catch(console.error);
  }, [client.id, client.voiceProfileId, refreshKey, loadVoice]);

  const openTaskCount = client.tasks.filter(
    (t) => !["deployed", "measured", "dismissed"].includes(t.status)
  ).length;
  const pinnedNoteCount = client.notes.filter((n) => n.isPinned).length;
  const { startTour } = useTour(CLIENT_DETAIL_TOUR);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4" data-tour="client-header">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold">{client.businessName}</h1>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      data-tour="client-health-badge"
                      variant="outline"
                      className={`${healthColor(client.healthScore)} text-sm px-3 py-1 cursor-help`}
                    >
                      Health: {client.healthScore}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm space-y-2 p-3">
                    <p className="text-sm font-semibold">Health Score — {client.healthScore}/100</p>
                    <div className="text-xs space-y-2 text-muted-foreground">
                      <p>Composite score updated on each competitive scan. Higher = stronger market position.</p>
                      <div className="space-y-1.5 border-t pt-2">
                        <div>
                          <span className="font-medium text-foreground">Momentum (25%)</span>
                          <p>Did DR, reviews, and keyword rankings improve since the last scan?</p>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Competitive Position (20%)</span>
                          <p>Average DR and review gap vs. all tracked competitors. Smaller gap = higher score.</p>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Domain Authority (20%)</span>
                          <p>Ahrefs Domain Rating. DR 50+ scores well; below 15 scores near zero.</p>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Reviews (20%)</span>
                          <p>Combination of review count (200+ ideal) and average rating (4.5+ ideal).</p>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Site Speed (15%)</span>
                          <p>PageSpeed score (mobile weighted 60%, desktop 40%). 90+ scores full points.</p>
                        </div>
                      </div>
                      <div className="border-t pt-2 space-y-0.5">
                        <p><span className="text-status-success font-medium">75–100</span> — Healthy. Leading or competitive across all metrics.</p>
                        <p><span className="text-status-warning font-medium">50–74</span> — Competitive. Gaps exist but within striking range.</p>
                        <p><span className="text-status-danger font-medium">0–49</span> — Needs attention. At least one metric is significantly behind.</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <EditClientDialog client={client} onUpdate={handleUpdate} />
              <TourButton onStart={startTour} tooltip="Tour this client page" />

              <div className="relative inline-flex">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVoiceDialogOpen(true)}
                  className={`gap-2 ${localHasVoice ? "border-status-success-border/60 text-status-success hover:border-status-success-border" : ""}`}
                >
                  {localHasVoice ? (
                    <><Sparkles className="h-4 w-4" />Voice Captured</>
                  ) : (
                    <><Mic className="h-4 w-4" />Capture Voice</>
                  )}
                </Button>
                {localHasVoice && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-status-success-bg text-white shadow-sm">
                    <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2,6 5,9 10,3" />
                    </svg>
                  </span>
                )}
              </div>
            </div>

            <div className="mt-2 space-y-1">
              {client.lead?.city && client.lead?.state && (
                <p className="text-base text-muted-foreground">
                  <span className="font-medium">Location:</span> {client.lead.city}, {client.lead.state}
                </p>
              )}
              {client.lead?.website && (
                <p className="text-base text-muted-foreground">
                  <span className="font-medium">Website:</span>{" "}
                  <a
                    href={client.lead.website.startsWith("http") ? client.lead.website : `https://${client.lead.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    {client.lead.website}
                  </a>
                </p>
              )}
              {client.lead?.phone && (
                <p className="text-base text-muted-foreground">
                  <span className="font-medium">Phone:</span> {client.lead.phone}
                </p>
              )}
              {client.lead?.assignedUser && (
                <p className="text-base text-muted-foreground">
                  <span className="font-medium">Sales Rep:</span> {client.lead.assignedUser.name}
                </p>
              )}
              {client.masterManager && (
                <p className="text-base text-muted-foreground">
                  <span className="font-medium">Account Manager:</span> {client.masterManager.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 text-right">
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(Number(client.retainerAmount))}
              <span className="text-lg text-muted-foreground">/mo</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><span className="font-medium">Client since:</span> {formatDate(client.onboardedAt)}</p>
              <p><span className="font-medium">Last scan:</span> {timeAgo(client.lastScanAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold">{openTaskCount}</p>
          <p className="text-xs text-muted-foreground">Open Tasks</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold">{client.domains.length}</p>
          <p className="text-xs text-muted-foreground">Domains</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold">{client.competitors.length}</p>
          <p className="text-xs text-muted-foreground">Tracked Competitors</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold">{client.scans.length}</p>
          <p className="text-xs text-muted-foreground">Scans</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-2xl font-bold">{pinnedNoteCount}</p>
          <p className="text-xs text-muted-foreground">Client Standards</p>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
        {(() => {
          const PRIMARY_TABS: { value: TabId; label: React.ReactNode }[] = [
            { value: "scorecard", label: "Scorecard" },
            {
              value: "tasks",
              label: (
                <span className="flex items-center gap-1.5">
                  Tasks
                  {openTaskCount > 0 && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                      {openTaskCount}
                    </Badge>
                  )}
                </span>
              ),
            },
            { value: "rankings", label: "Rankings" },
            { value: "citations", label: "Citations" },
            { value: "local", label: "Local" },
            { value: "content", label: "Content" },
            { value: "websites", label: "Websites" },
            { value: "audit", label: "Site Audit" },
            { value: "health", label: "Site Health" },
            { value: "notes", label: "Notes" },
          ];

          const OVERFLOW_TABS: { value: TabId; label: string; group: string }[] = [
            { value: "reports",      label: "Reports",       group: "Operations" },
            { value: "domains",      label: "Domains",       group: "Operations" },
            { value: "competitors",  label: "Competitors",   group: "Operations" },
            { value: "compensation", label: "Compensation",  group: "Account" },
            { value: "billing",      label: "Billing",       group: "Account" },
            { value: "campaigns",    label: "Google Ads",    group: "Account" },
            { value: "integrations", label: "Integrations",  group: "Account" },
          ];

          const overflowValues = OVERFLOW_TABS.map((t) => t.value);
          const activeIsOverflow = overflowValues.includes(activeTab);

          return (
            <div className="flex items-center gap-0.5 border-b">
              <TabsList className="h-10 bg-transparent p-0 gap-0 border-0 rounded-none flex-shrink-0">
                {PRIMARY_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    data-tour={`client-tab-${tab.value}`}
                    className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground hover:text-foreground transition-colors"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`h-10 flex items-center gap-1 px-3 text-sm font-medium border-b-2 transition-colors hover:text-foreground flex-shrink-0 ${
                      activeIsOverflow
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground"
                    }`}
                  >
                    {activeIsOverflow ? (
                      <span className="flex items-center gap-1.5">
                        <Circle className="h-1.5 w-1.5 fill-primary text-primary" />
                        {OVERFLOW_TABS.find((t) => t.value === activeTab)?.label}
                      </span>
                    ) : (
                      "More"
                    )}
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  {["Operations", "Account"].map((group, i) => (
                    <div key={group}>
                      {i > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
                        {group}
                      </DropdownMenuLabel>
                      {OVERFLOW_TABS.filter((t) => t.group === group).map((tab) => (
                        <DropdownMenuItem
                          key={tab.value}
                          onClick={() => setActiveTab(tab.value)}
                          className={`cursor-pointer ${activeTab === tab.value ? "bg-accent font-medium" : ""}`}
                        >
                          {tab.label}
                          {activeTab === tab.value && (
                            <Circle className="ml-auto h-1.5 w-1.5 fill-primary text-primary" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })()}

        <TabsContent value="scorecard" className="space-y-4">
          <UpsellOpportunities
            clientId={client.id}
            opportunities={(client.upsellOpportunities || []).map((opp) => ({
              id: opp.id,
              productId: opp.productId,
              productName: opp.product.name,
              category: opp.product.category || "general",
              gapCategory: opp.gapCategory,
              opportunityScore: opp.opportunityScore,
              reasoning: opp.reasoning,
              projectedMrr: Number(opp.projectedMrr),
              projectedRoi: opp.projectedRoi ? Number(opp.projectedRoi) : null,
              status: opp.status,
            }))}
          />
          <ScanHistory clientId={client.id} />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <ClientTasksTab clientId={client.id} initialTasks={client.tasks} />
        </TabsContent>

        <TabsContent value="rankings">
          <RankingsTab clientId={client.id} />
        </TabsContent>

        <TabsContent value="citations">
          <CitationsTab clientId={client.id} />
        </TabsContent>

        <TabsContent value="local">
          <LocalPresenceTab clientId={client.id} />
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <ContentStudioTab clientId={client.id} isMaster={isElevated(currentUserRole ?? "")} />
        </TabsContent>

        <TabsContent value="websites" className="space-y-4">
          <WebsiteStudioTab clientId={client.id} businessName={client.businessName} />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <WebsiteAuditPanel clientId={client.id} websiteUrl={(client as any).website} />
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <SiteHealthTab clientId={client.id} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ClientReportsTab
            clientId={client.id}
            reports={client.reports.map((r) => ({
              id: r.id,
              type: r.type,
              periodStart: new Date(r.periodStart),
              periodEnd: new Date(r.periodEnd),
              createdAt: new Date(r.createdAt),
              sentToClient: r.sentToClient,
              content: r.content,
            }))}
          />
        </TabsContent>

        <TabsContent value="domains" className="space-y-4">
          <ClientDomainsTab domains={client.domains} businessName={client.businessName} />
        </TabsContent>

        <TabsContent value="compensation" className="space-y-4">
          <ClientCompensationSection clientId={client.id} users={users} />
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <BillingTab clientId={client.id} businessName={client.businessName} />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <ClientIntegrationsTab clientId={client.id} />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <CampaignsTab clientId={client.id} />
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <ClientNotesTab clientId={client.id} initialNotes={client.notes} />
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <CompetitorsTab clientId={client.id} />
        </TabsContent>
      </Tabs>

      <VoiceProfileDialog
        open={voiceDialogOpen}
        onOpenChange={setVoiceDialogOpen}
        clientId={client.id}
        websiteUrl={client.lead?.website || undefined}
        existingProfile={voiceProfile}
        onSuccess={handleUpdate}
        onRemoved={() => { setLocalHasVoice(false); setVoiceProfile(null); handleUpdate(); }}
        onCaptured={() => { setLocalHasVoice(true); handleUpdate(); }}
      />
    </div>
  );
}
