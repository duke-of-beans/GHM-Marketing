"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatCurrency } from "@/components/dashboard/metric-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScanHistory } from "./scan-history";
import { ClientReportsTab } from "./reports/client-reports-tab";
import { UpsellOpportunities } from "@/components/upsell/upsell-opportunities";
import { EditClientDialog } from "./edit-client-dialog";
import { ClientCompensationSection } from "./client-compensation";
import { ContentStudioTab } from "../content/ContentStudioTab";
import { WebsiteStudioTab } from "./website-studio/WebsiteStudioTab";
import { VoiceProfileDialog } from "./voice/VoiceProfileDialog";
import { BillingTab } from "./billing/BillingTab";
import { Mic, Sparkles } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

type Competitor = {
  id: number;
  businessName: string;
  domain: string | null;
  googlePlaceId: string | null;
};

type Domain = {
  id: number;
  domain: string;
  type: string;
  hosting: string;
  ownershipType: string;
  dnsVerified: boolean;
  sslActive: boolean;
  contentCount: number;
  lastDeployedAt: string | null;
};

type TaskNote = {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; name: string };
};

type Task = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  source: string;
  assignedTo: string | null;
  targetKeywords: string[] | null;
  competitorRef: string | null;
  draftContent: string | null;
  deployedUrl: string | null;
  createdAt: string;
  updatedAt: string;
  notes: TaskNote[];
};

type ClientNote = {
  id: number;
  content: string;
  type: string;
  isPinned: boolean;
  tags: string[] | null;
  createdAt: string;
  author: { id: number; name: string };
  task: { id: number; title: string } | null;
};

type Scan = {
  id: number;
  scanDate: string;
  clientData: Record<string, unknown>;
  competitors: Record<string, unknown>[];
  deltas: Record<string, unknown>;
  alerts: Record<string, unknown>[];
  healthScore: number;
};

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
  masterManager: {
    id: number;
    name: string;
    email: string;
  } | null;
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
    assignedUser: {
      id: number;
      name: string;
      email: string;
    } | null;
  };
  competitors: Competitor[];
  domains: Domain[];
  tasks: Task[];
  notes: ClientNote[];
  scans: Scan[];
  reports: { 
    id: number; 
    type: string; 
    periodStart: string; 
    periodEnd: string; 
    createdAt: string;
    sentToClient: boolean;
    content: unknown;
  }[];
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

// ============================================================================
// HELPERS
// ============================================================================

function healthColor(score: number) {
  if (score >= 75) return "bg-green-100 text-green-800 border-green-200";
  if (score >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-red-100 text-red-800 border-red-200";
}

function priorityColor(p: string) {
  if (p === "Critical") return "bg-red-100 text-red-800";
  if (p === "High") return "bg-orange-100 text-orange-800";
  if (p === "Standard") return "bg-blue-100 text-blue-800";
  if (p === "Low") return "bg-gray-100 text-gray-800";
  // Legacy support
  if (p === "P1") return "bg-red-100 text-red-800";
  if (p === "P2") return "bg-orange-100 text-orange-800";
  if (p === "P3") return "bg-blue-100 text-blue-800";
  return "bg-gray-100 text-gray-800";
}

function categoryLabel(c: string) {
  const map: Record<string, string> = {
    "site-build": "🏗️ Site Build",
    content: "📝 Content",
    "technical-seo": "⚙️ Technical SEO",
    "link-building": "🔗 Link Building",
    "review-mgmt": "⭐ Reviews",
    "competitive-response": "🎯 Competitive",
  };
  return map[c] || c;
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ClientProfile({
  client,
}: {
  client: ClientData;
}) {
  const [activeTab, setActiveTab] = useState("scorecard");
  const [tasks, setTasks] = useState<Task[]>(client.tasks);
  const [notes, setNotes] = useState<ClientNote[]>(client.notes);
  const [refreshKey, setRefreshKey] = useState(0);
  const handleUpdate = () => setRefreshKey(prev => prev + 1);
  const [users, setUsers] = useState<Array<{id: number; name: string; email: string; role: string}>>([]);
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);
  const [voiceProfile, setVoiceProfile] = useState<any>(null);
  const [localHasVoice, setLocalHasVoice] = useState(!!client.voiceProfileId);

  // Load users for compensation dropdown
  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers(data.data);
        }
      })
      .catch(console.error);
  }, []);

  // Load voice profile if exists
  useEffect(() => {
    if (client.voiceProfileId || refreshKey > 0) {
      fetch(`/api/clients/${client.id}/voice-profile`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.profile) {
            setVoiceProfile(data.profile);
            setLocalHasVoice(true);
          } else {
            setVoiceProfile(null);
            setLocalHasVoice(false);
          }
        })
        .catch(console.error);
    }
  }, [client.id, client.voiceProfileId, refreshKey]);

  // ---- Task status update ----
  async function updateTask(taskId: number, status: string) {
    try {
      const res = await fetch(`/api/clients/${client.id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update task");
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status } : t))
      );
      toast.success("Task updated");
    } catch {
      toast.error("Failed to update task");
    }
  }

  // ---- Add note ----
  async function addNote(content: string, type: string, isPinned = false) {
    try {
      const res = await fetch(`/api/clients/${client.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type, isPinned }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      const { data } = await res.json();
      setNotes((prev) => [data, ...prev]);
      toast.success("Note added");
    } catch {
      toast.error("Failed to add note");
    }
  }

  // ---- Active / open tasks ----
  const openTasks = tasks.filter(
    (t) => !["deployed", "measured", "dismissed"].includes(t.status)
  );
  const tasksByStatus = openTasks.reduce(
    (acc, t) => {
      (acc[t.status] = acc[t.status] || []).push(t);
      return acc;
    },
    {} as Record<string, Task[]>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold">{client.businessName}</h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className={`${healthColor(client.healthScore)} text-sm px-3 py-1 cursor-help`}>
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
                        <p><span className="text-green-600 font-medium">75–100</span> — Healthy. Leading or competitive across all metrics.</p>
                        <p><span className="text-yellow-600 font-medium">50–74</span> — Competitive. Gaps exist but within striking range.</p>
                        <p><span className="text-red-600 font-medium">0–49</span> — Needs attention. At least one metric is significantly behind.</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <EditClientDialog client={client} onUpdate={handleUpdate} />
              <div className="relative inline-flex">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVoiceDialogOpen(true)}
                  className={`gap-2 ${localHasVoice ? "border-green-500/60 text-green-700 dark:text-green-400 hover:border-green-500" : ""}`}
                >
                  {localHasVoice ? (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Voice Captured
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Capture Voice
                    </>
                  )}
                </Button>
                {localHasVoice && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-white shadow-sm">
                    <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2,6 5,9 10,3" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-base text-muted-foreground">
                {client.lead?.city && client.lead?.state && (
                  <>
                    <span className="font-medium">Location:</span> {client.lead.city}, {client.lead.state}
                  </>
                )}
              </p>
              {client.lead?.website && (
                <p className="text-base text-muted-foreground">
                  <span className="font-medium">Website:</span>{" "}
                  <a
                    href={
                      client.lead.website.startsWith("http")
                        ? client.lead.website
                        : `https://${client.lead.website}`
                    }
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
              {formatCurrency(Number(client.retainerAmount))}<span className="text-lg text-muted-foreground">/mo</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><span className="font-medium">Client since:</span> {formatDate(client.onboardedAt)}</p>
              <p><span className="font-medium">Last scan:</span> {timeAgo(client.lastScanAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold">{openTasks.length}</p>
            <p className="text-xs text-muted-foreground">Open Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold">{client.domains.length}</p>
            <p className="text-xs text-muted-foreground">Domains</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold">{client.competitors.length}</p>
            <p className="text-xs text-muted-foreground">Tracked Competitors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold">{client.scans.length}</p>
            <p className="text-xs text-muted-foreground">Scans</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold">{notes.filter((n) => n.isPinned).length}</p>
            <p className="text-xs text-muted-foreground">Client Standards</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks{" "}
            {openTasks.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {openTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="content">Content Studio</TabsTrigger>
          <TabsTrigger value="websites">Website Studio</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="compensation">Compensation</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* TAB 1: COMPETITIVE SCORECARD */}
        <TabsContent value="scorecard" className="space-y-4">
          <UpsellOpportunities
            clientId={client.id}
            opportunities={(client.upsellOpportunities || []).map((opp: any) => ({
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

        {/* TAB 2: TASK BOARD */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {openTasks.length} open · {tasks.filter((t) => t.status === "deployed" || t.status === "measured").length} completed
            </p>
            <AddTaskDialog clientId={client.id} onAdded={(task) => setTasks((prev) => [task, ...prev])} />
          </div>

          {openTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No open tasks. Tasks are auto-generated from competitive scans,
                  or create one manually.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {["queued", "in-progress", "in-review", "approved"].map(
                (status) => {
                  const statusTasks = tasksByStatus[status];
                  if (!statusTasks?.length) return null;
                  return (
                    <div key={status}>
                      <h3 className="text-sm font-medium capitalize mb-2">
                        {status.replace("-", " ")} ({statusTasks.length})
                      </h3>
                      <div className="space-y-2">
                        {statusTasks.map((task) => (
                          <Card key={task.id}>
                            <CardContent className="py-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm">
                                      {task.title}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] ${priorityColor(task.priority)}`}
                                    >
                                      {task.priority}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="text-[10px]"
                                    >
                                      {categoryLabel(task.category)}
                                    </Badge>
                                    {task.source !== "manual" && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] bg-blue-50 text-blue-700"
                                      >
                                        {task.source}
                                      </Badge>
                                    )}
                                  </div>
                                  {task.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}
                                  {task.targetKeywords &&
                                    (task.targetKeywords as string[]).length > 0 && (
                                      <div className="flex gap-1 mt-1.5 flex-wrap">
                                        {(task.targetKeywords as string[]).map(
                                          (kw, i) => (
                                            <span
                                              key={i}
                                              className="text-[10px] bg-muted px-1.5 py-0.5 rounded"
                                            >
                                              {kw}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    )}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  {task.status === "queued" && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs h-7"
                                        onClick={() =>
                                          updateTask(task.id, "in-progress")
                                        }
                                      >
                                        Start
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs h-7 text-muted-foreground"
                                        onClick={() =>
                                          updateTask(task.id, "dismissed")
                                        }
                                      >
                                        Dismiss
                                      </Button>
                                    </>
                                  )}
                                  {task.status === "in-progress" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-7"
                                      onClick={() =>
                                        updateTask(task.id, "in-review")
                                      }
                                    >
                                      Submit for Review
                                    </Button>
                                  )}
                                  {task.status === "in-review" && (
                                    <>
                                      <Button
                                        size="sm"
                                        className="text-xs h-7"
                                        onClick={() =>
                                          updateTask(task.id, "approved")
                                        }
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs h-7"
                                        onClick={() =>
                                          updateTask(task.id, "in-progress")
                                        }
                                      >
                                        Revise
                                      </Button>
                                    </>
                                  )}
                                  {task.status === "approved" && (
                                    <Button
                                      size="sm"
                                      className="text-xs h-7"
                                      onClick={() =>
                                        updateTask(task.id, "deployed")
                                      }
                                    >
                                      Mark Deployed
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </TabsContent>

        {/* TAB 3: DOMAINS */}
        <TabsContent value="domains" className="space-y-4">
          {client.domains.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No domains registered yet. Add the client&apos;s main site and any
                  satellite domains during onboarding.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {client.domains.map((domain) => (
                <Card key={domain.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {domain.domain}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {domain.type}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {domain.hosting}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${domain.ownershipType === "ghm" ? "bg-blue-50 text-blue-700" : "bg-gray-50"}`}
                          >
                            {domain.ownershipType === "ghm"
                              ? "GHM Owned"
                              : "Client Owned"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {domain.contentCount} pages ·{" "}
                          {domain.dnsVerified ? "✅ DNS" : "⏳ DNS pending"} ·{" "}
                          {domain.sslActive ? "✅ SSL" : "⏳ SSL pending"} ·{" "}
                          Last deployed: {timeAgo(domain.lastDeployedAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB: BILLING */}
        <TabsContent value="billing" className="space-y-4">
          <BillingTab clientId={client.id} businessName={client.businessName} />
        </TabsContent>

        {/* TAB 4: NOTES & MEMORY */}
        <TabsContent value="notes" className="space-y-4">
          <AddNoteForm onSubmit={addNote} />

          {/* Pinned standards first */}
          {notes.filter((n) => n.isPinned).length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-0.5">
                📌 Client Standards
              </h3>
              <p className="text-xs text-muted-foreground mb-2">Pinned instructions that always apply to this account</p>
              <div className="space-y-2">
                {notes
                  .filter((n) => n.isPinned)
                  .map((note) => (
                    <Card key={note.id} className="border-amber-200 bg-amber-50/50">
                      <CardContent className="py-3">
                        <p className="text-sm">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {note.author.name} · {formatDate(note.createdAt)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* All other notes */}
          <div>
            <h3 className="text-sm font-medium mb-2">Notes</h3>
            {notes.filter((n) => !n.isPinned).length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet. Add contact logs, task updates, or pin a Client Standard above to keep standing instructions visible at all times.</p>
            ) : (
              <div className="space-y-2">
                {notes
                  .filter((n) => !n.isPinned)
                  .map((note) => (
                    <Card key={note.id}>
                      <CardContent className="py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm">{note.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {note.author.name} · {formatDate(note.createdAt)}
                              {note.task && (
                                <> · Re: {note.task.title}</>
                              )}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {note.type}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 5: CONTENT STUDIO */}
        <TabsContent value="content" className="space-y-4">
          <ContentStudioTab clientId={client.id} />
        </TabsContent>

        {/* TAB 6: WEBSITE STUDIO */}
        <TabsContent value="websites" className="space-y-4">
          <WebsiteStudioTab clientId={client.id} businessName={client.businessName} />
        </TabsContent>

        {/* TAB 7: REPORTS */}
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

        {/* TAB 7: COMPENSATION */}
        <TabsContent value="compensation" className="space-y-4">
          <ClientCompensationSection clientId={client.id} users={users} />
        </TabsContent>
      </Tabs>

      {/* Voice Profile Dialog */}
      <VoiceProfileDialog
        open={voiceDialogOpen}
        onOpenChange={setVoiceDialogOpen}
        clientId={client.id}
        websiteUrl={client.lead?.website || undefined}
        existingProfile={voiceProfile}
        onSuccess={() => {
          handleUpdate();
          // Immediately sync local badge state — fetch will confirm truth
          // but dialog already has the real state after capture/remove
        }}
        onRemoved={() => {
          setLocalHasVoice(false);
          setVoiceProfile(null);
          handleUpdate();
        }}
        onCaptured={() => {
          setLocalHasVoice(true);
          handleUpdate();
        }}
      />
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function AddTaskDialog({
  clientId,
  onAdded,
}: {
  clientId: number;
  onAdded: (task: Task) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("content");
  const [priority, setPriority] = useState("Standard");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, priority, description: description || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      const { data } = await res.json();
      onAdded({ ...data, notes: [] });
      setTitle("");
      setDescription("");
      setOpen(false);
      toast.success("Task created");
    } catch {
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs">
          + Add Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="content">📝 Content</SelectItem>
                <SelectItem value="site-build">🏗️ Site Build</SelectItem>
                <SelectItem value="technical-seo">⚙️ Technical SEO</SelectItem>
                <SelectItem value="link-building">🔗 Link Building</SelectItem>
                <SelectItem value="review-mgmt">⭐ Reviews</SelectItem>
                <SelectItem value="competitive-response">🎯 Competitive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Critical">🔴 Critical</SelectItem>
                <SelectItem value="High">🟠 High</SelectItem>
                <SelectItem value="Standard">🔵 Standard</SelectItem>
                <SelectItem value="Low">⚪ Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <Button onClick={handleSubmit} disabled={!title.trim() || loading} className="w-full">
            {loading ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddNoteForm({
  onSubmit,
}: {
  onSubmit: (content: string, type: string, isPinned: boolean) => void;
}) {
  const [content, setContent] = useState("");
  const [type, setType] = useState("contact-log");
  const [isPinned, setIsPinned] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    // "Client Standard" type is always pinned, regardless of checkbox state
    onSubmit(content, type, isPinned || type === "standard");
    setContent("");
    setIsPinned(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        placeholder="Add a note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
      />
      <div className="flex items-center gap-3">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contact-log">📞 Contact Log</SelectItem>
            <SelectItem value="standard">📌 Client Standard</SelectItem>
            <SelectItem value="task-note">📝 Task Note</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={isPinned || type === "standard"}
            onChange={(e) => setIsPinned(e.target.checked)}
            disabled={type === "standard"}
            className="rounded"
          />
          Pin as standard
        </label>
        <Button type="submit" size="sm" disabled={!content.trim()} className="ml-auto">
          Add Note
        </Button>
      </div>
    </form>
  );
}
