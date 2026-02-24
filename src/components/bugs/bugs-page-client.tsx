"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Bug, AlertCircle, CheckCircle2, Clock, Eye, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface BugReport {
  id: number;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  priority: string;
  pageUrl: string;
  userEmail: string | null;
  userName: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
}

const STATUS_OPTIONS = [
  { value: "new",         label: "New" },
  { value: "acknowledged",label: "Acknowledged" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved",    label: "Resolved" },
  { value: "wont-fix",   label: "Won't Fix" },
];

const PRIORITY_OPTIONS = [
  { value: "low",      label: "Low" },
  { value: "medium",   label: "Medium" },
  { value: "high",     label: "High" },
  { value: "critical", label: "Critical" },
];

export function BugsPageClient({ isAdmin = false }: { isAdmin?: boolean }) {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    loadBugs();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadBugs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
      // Non-admins see only their own submissions
      if (!isAdmin) params.append("mine", "true");
      const res = await fetch(`/api/bug-reports?${params}`);
      if (res.ok) {
        const json = await res.json();
        setBugs(Array.isArray(json.data) ? json.data : []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function updateBug(id: number, field: "status" | "priority", value: string) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/bug-reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Update failed");
      setBugs((prev) =>
        prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
      );
      toast.success(`${field === "status" ? "Status" : "Priority"} updated`);
    } catch {
      toast.error("Failed to update — try again");
    } finally {
      setUpdating(null);
    }
  }

  function severityVariant(severity: string) {
    switch (severity) {
      case "critical": return "destructive" as const;
      case "high":     return "default" as const;
      case "medium":   return "secondary" as const;
      default:         return "outline" as const;
    }
  }

  function statusIcon(status: string) {
    switch (status) {
      case "resolved":     return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "in-progress":  return <Clock className="h-4 w-4 text-blue-600" />;
      case "acknowledged": return <Eye className="h-4 w-4 text-purple-600" />;
      case "wont-fix":     return <XCircle className="h-4 w-4 text-gray-400" />;
      case "new":          return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:             return <Bug className="h-4 w-4" />;
    }
  }

  function statusLabel(status: string) {
    return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {isAdmin ? "Bug Reports" : "My Submissions"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin
            ? "Track and manage reported issues"
            : "View the status of your submitted bug reports and feature requests"}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "new", "acknowledged", "in-progress", "resolved", "wont-fix"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f === "all" ? "All" : f.replace("-", " ")}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : bugs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Bug className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {filter === "all"
                ? isAdmin
                  ? "No bug reports yet"
                  : "You haven't submitted any reports yet"
                : `No reports with status "${filter.replace("-", " ")}"`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bugs.map((bug) => (
            <Card key={bug.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {statusIcon(bug.status)}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{bug.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {bug.description.substring(0, 200)}
                        {bug.description.length > 200 && "..."}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <Badge variant={severityVariant(bug.severity)}>{bug.severity}</Badge>
                    <Badge variant="outline" className="capitalize">{bug.category}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">Reported by:</span>{" "}
                    {bug.user?.name || bug.userName || bug.userEmail || "Anonymous"}
                  </div>
                  <div>
                    <span className="font-medium">Page:</span>{" "}
                    {(() => { try { return new URL(bug.pageUrl).pathname; } catch { return bug.pageUrl || "—"; } })()}
                  </div>
                  <div>
                    <span className="font-medium">Reported:</span>{" "}
                    {formatDistanceToNow(new Date(bug.createdAt), { addSuffix: true })}
                  </div>

                  {/* Non-admin: read-only status badge */}
                  {!isAdmin && (
                    <div className="flex items-center gap-1.5">
                      {statusIcon(bug.status)}
                      <span className="capitalize font-medium text-foreground">
                        {statusLabel(bug.status)}
                      </span>
                    </div>
                  )}

                  {/* Admin: editable status + priority controls */}
                  {isAdmin && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Select
                        value={bug.priority || "medium"}
                        onValueChange={(v) => updateBug(bug.id, "priority", v)}
                        disabled={updating === bug.id}
                      >
                        <SelectTrigger className="h-7 text-xs w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value} className="text-xs">
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={bug.status}
                        onValueChange={(v) => updateBug(bug.id, "status", v)}
                        disabled={updating === bug.id}
                      >
                        <SelectTrigger className="h-7 text-xs w-36">
                          {updating === bug.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value} className="text-xs">
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
