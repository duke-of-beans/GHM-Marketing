"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Bug,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  ExternalLink,
  Monitor,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BugReport {
  id: number;
  type: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  priority: string;
  pageUrl: string;
  userAgent: string;
  userEmail: string | null;
  userName: string | null;
  screenResolution: string;
  browserInfo: any;
  consoleErrors: any[];
  networkErrors: any[];
  recentActions: any[];
  sessionData: any;
  assignedTo: number | null;
  resolvedAt: string | null;
  resolvedBy: number | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: number; name: string; email: string } | null;
  assignee: { id: number; name: string } | null;
  resolver: { id: number; name: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "new", label: "New", icon: AlertTriangle, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "acknowledged", label: "Acknowledged", icon: Eye, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "in-progress", label: "In Progress", icon: Clock, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { value: "resolved", label: "Resolved", icon: CheckCircle2, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "wont-fix", label: "Won't Fix", icon: XCircle, color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

const CATEGORY_LABELS: Record<string, string> = {
  content: "Content",
  compensation: "Compensation",
  scans: "Scans",
  clients: "Clients",
  leads: "Leads",
  ui: "UI/Display",
  performance: "Performance",
  integration: "Integration",
  reporting: "Reporting",
  other: "Other",
};

function statusBadge(status: string) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status);
  if (!opt) return <Badge variant="outline">{status}</Badge>;
  return (
    <Badge className={`${opt.color} text-xs py-0`}>
      <opt.icon className="h-3 w-3 mr-1" />
      {opt.label}
    </Badge>
  );
}

// ─── Report Row ──────────────────────────────────────────────────────────────

function ReportRow({ report, onUpdate }: { report: BugReport; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState(report.resolutionNotes ?? "");

  async function patchReport(data: Record<string, any>) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/bug-reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Report updated");
      onUpdate();
    } catch {
      toast.error("Failed to update report");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-lg mb-2 overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors">
            {open ? <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
            {report.type === "bug" ? (
              <Bug className="h-4 w-4 flex-shrink-0 text-orange-600" />
            ) : (
              <Lightbulb className="h-4 w-4 flex-shrink-0 text-blue-600" />
            )}
            <span className="font-medium text-sm flex-1 min-w-0 truncate">{report.title}</span>
            <Badge className={`${SEVERITY_COLORS[report.severity] ?? ""} text-[10px] py-0`}>
              {report.severity}
            </Badge>
            {statusBadge(report.status)}
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
            </span>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t px-4 py-3 space-y-4 bg-muted/20">
            {/* Meta row */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span>By: <strong className="text-foreground">{report.user?.name ?? report.userEmail ?? "Unknown"}</strong></span>
              <span>Category: <strong className="text-foreground">{CATEGORY_LABELS[report.category] ?? report.category}</strong></span>
              <span>Filed: {format(new Date(report.createdAt), "MMM d, yyyy h:mm a")}</span>
              {report.pageUrl && (
                <a href={report.pageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                  <ExternalLink className="h-3 w-3" /> Page URL
                </a>
              )}
              {report.screenResolution && (
                <span className="flex items-center gap-1"><Monitor className="h-3 w-3" /> {report.screenResolution}</span>
              )}
            </div>

            {/* Description */}
            <div className="text-sm whitespace-pre-wrap">{report.description}</div>

            {/* Console errors */}
            {report.consoleErrors?.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer font-medium text-orange-600">
                  Console Errors ({report.consoleErrors.length})
                </summary>
                <pre className="mt-1 p-2 bg-muted rounded text-[11px] overflow-x-auto max-h-40 overflow-y-auto">
                  {JSON.stringify(report.consoleErrors, null, 2)}
                </pre>
              </details>
            )}

            {/* Network errors */}
            {report.networkErrors?.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer font-medium text-red-600">
                  Network Errors ({report.networkErrors.length})
                </summary>
                <pre className="mt-1 p-2 bg-muted rounded text-[11px] overflow-x-auto max-h-40 overflow-y-auto">
                  {JSON.stringify(report.networkErrors, null, 2)}
                </pre>
              </details>
            )}

            {/* Session data */}
            {report.sessionData && (
              <details className="text-xs">
                <summary className="cursor-pointer font-medium text-muted-foreground">
                  Session Data
                </summary>
                <pre className="mt-1 p-2 bg-muted rounded text-[11px] overflow-x-auto max-h-40 overflow-y-auto">
                  {JSON.stringify(report.sessionData, null, 2)}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-end gap-3 pt-2 border-t">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select
                  value={report.status}
                  onValueChange={(v) => patchReport({ status: v })}
                  disabled={updating}
                >
                  <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <Select
                  value={report.priority}
                  onValueChange={(v) => patchReport({ priority: v })}
                  disabled={updating}
                >
                  <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="top">Top</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px] space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Resolution Notes</label>
                <div className="flex gap-2">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={1}
                    className="text-xs resize-none flex-1"
                    placeholder="Notes on fix or reason for closing..."
                    disabled={updating}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    disabled={updating || notes === (report.resolutionNotes ?? "")}
                    onClick={() => patchReport({ resolutionNotes: notes })}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>

            {report.resolvedAt && report.resolver && (
              <p className="text-xs text-muted-foreground">
                Resolved by {report.resolver.name} on {format(new Date(report.resolvedAt), "MMM d, yyyy")}
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function BugReportsTab() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterType !== "all") params.set("type", filterType);
      const res = await fetch(`/api/bug-reports?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setReports(data.data);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const bugs = reports.filter((r) => r.type === "bug");
  const features = reports.filter((r) => r.type === "feature");
  const openCount = reports.filter((r) => !["resolved", "wont-fix"].includes(r.status)).length;
  const criticalCount = reports.filter((r) => r.severity === "critical" && r.status !== "resolved").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Bug Reports & Feature Requests
            </CardTitle>
            <CardDescription>
              {reports.length} total — {openCount} open{criticalCount > 0 ? `, ${criticalCount} critical` : ""}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadReports} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Summary badges */}
        <div className="flex gap-3 text-xs pt-1">
          <span className="flex items-center gap-1"><Bug className="h-3.5 w-3.5 text-orange-600" /> {bugs.length} bugs</span>
          <span className="flex items-center gap-1"><Lightbulb className="h-3.5 w-3.5 text-blue-600" /> {features.length} features</span>
        </div>

        {/* Filters */}
        <div className="flex gap-2 pt-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="bug">Bugs</SelectItem>
              <SelectItem value="feature">Features</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : reports.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground text-sm">
            {filterStatus !== "all" || filterType !== "all"
              ? "No reports match the current filters."
              : "No bug reports or feature requests yet."}
          </p>
        ) : (
          <div className="space-y-1">
            {reports.map((report) => (
              <ReportRow key={report.id} report={report} onUpdate={loadReports} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
