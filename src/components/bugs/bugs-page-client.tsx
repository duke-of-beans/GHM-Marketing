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
import { Loader2, Bug, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

export function BugsPageClient() {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadBugs();
  }, [filter]);

  async function loadBugs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
      const res = await fetch(`/api/bug-reports?${params}`);
      if (res.ok) {
        const json = await res.json();
        // API returns { data: BugReport[] }
        setBugs(Array.isArray(json.data) ? json.data : []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function severityVariant(severity: string) {
    switch (severity) {
      case "critical": return "destructive" as const;
      case "high": return "default" as const;
      case "medium": return "secondary" as const;
      default: return "outline" as const;
    }
  }

  function statusIcon(status: string) {
    switch (status) {
      case "resolved":   return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "in-progress": return <Clock className="h-4 w-4 text-blue-600" />;
      case "new":        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:           return <Bug className="h-4 w-4" />;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bug Reports</h1>
        <p className="text-muted-foreground mt-1">Track and manage reported issues</p>
      </div>

      <div className="flex gap-2">
        {["all", "new", "in-progress", "resolved"].map((f) => (
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
            <p className="text-muted-foreground">No bug reports found</p>
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
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
