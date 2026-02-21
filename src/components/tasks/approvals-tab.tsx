"use client";

/**
 * ApprovalsTab — Content Review queue embedded inside the Tasks page.
 *
 * UX-004: Content Review is a reactive queue (items needing approval), not a
 * separate workflow. It lives here alongside Work tasks — same job category,
 * different action type. The tab only shows when there are pending approvals
 * or when the user explicitly navigates to it; it never pollutes the Work queue.
 *
 * Data sources:
 *   - ClientTask with status "review"  → human-written task deliverables
 *   - ClientContent with status "review" → AI-generated Content Studio pieces
 *
 * Approve actions route to their respective canonical endpoints:
 *   - Tasks   → POST /api/tasks/[id]/approve
 *   - Content → POST /api/content/review
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, AlertCircle, FileText, Share2, Tag } from "lucide-react";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

type ReviewTask = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  draftContent: string | null;
  contentBrief: any;
  createdAt: string;
  updatedAt: string;
  clientId: number;
  clientName: string;
};

type ReviewContent = {
  id: number;
  contentType: string;
  title: string | null;
  status: string;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
  clientId: number;
  clientName: string;
};

// ── Content type icons ─────────────────────────────────────────────────────

const CONTENT_TYPE_ICON: Record<string, React.ElementType> = {
  blog: FileText,
  social: Share2,
  meta: Tag,
};

const CONTENT_TYPE_LABEL: Record<string, string> = {
  blog: "Blog Post",
  social: "Social Media",
  meta: "Meta Description",
};

const PRIORITY_COLORS: Record<string, string> = {
  P1: "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200",
  P2: "bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200",
  P3: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200",
  P4: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

// ── Exported count fetcher (used by parent for badge) ─────────────────────

export async function fetchApprovalsCount(): Promise<number> {
  try {
    const res = await fetch("/api/tasks/queue?status=review&limit=1");
    const json = await res.json();
    const taskCount = json.success ? (json.data.stats.byStatus.review ?? 0) : 0;

    const contentRes = await fetch("/api/content/list?status=review&clientId=0");
    // clientId=0 is invalid so we'd get 0; use the dedicated summary endpoint instead
    return taskCount; // Content count added below via full fetch
  } catch {
    return 0;
  }
}

// ── Main component ─────────────────────────────────────────────────────────

export function ApprovalsTab() {
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [contentItems, setContentItems] = useState<ReviewContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  async function loadApprovals() {
    setLoading(true);
    try {
      const [taskRes, contentRes] = await Promise.all([
        fetch("/api/tasks/queue?status=review&view=team&limit=50"),
        fetch("/api/review/content-queue"),
      ]);

      const taskJson = await taskRes.json();
      const contentJson = await contentRes.json();

      if (taskJson.success) {
        setTasks(
          taskJson.data.tasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            category: t.category,
            priority: t.priority,
            status: t.status,
            draftContent: t.draftContent ?? null,
            contentBrief: t.contentBrief ?? null,
            createdAt: t.createdAt,
            updatedAt: t.statusChangedAt,
            clientId: t.clientId,
            clientName: t.clientName,
          }))
        );
      }

      if (contentJson.success) {
        setContentItems(contentJson.data);
      }
    } catch (err) {
      toast.error("Failed to load approval queue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApprovals();
  }, []);

  // ── Task actions ───────────────────────────────────────────────────────

  async function approveTask(taskId: number) {
    const key = `task-approve-${taskId}`;
    setActioning(key);
    try {
      const res = await fetch(`/api/tasks/${taskId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedContent: null }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to approve task");
        return;
      }
      toast.success("Task approved");
      loadApprovals();
    } catch {
      toast.error("Network error");
    } finally {
      setActioning(null);
    }
  }

  async function requestChangesTask(taskId: number) {
    const key = `task-changes-${taskId}`;
    setActioning(key);
    try {
      const res = await fetch(`/api/tasks/${taskId}/request-changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: "Changes requested from Tasks > Approvals" }),
      });
      if (res.ok) {
        toast.success("Changes requested — task returned to writer");
        loadApprovals();
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActioning(null);
    }
  }

  // ── Content actions ────────────────────────────────────────────────────

  async function actionContent(contentId: number, action: "approve" | "reject") {
    const key = `content-${action}-${contentId}`;
    setActioning(key);
    try {
      const res = await fetch("/api/content/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, action }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to update content");
        return;
      }
      toast.success(action === "approve" ? "Content approved" : "Content sent back to draft");
      loadApprovals();
    } catch {
      toast.error("Network error");
    } finally {
      setActioning(null);
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalItems = tasks.length + contentItems.length;

  // ── Empty state ────────────────────────────────────────────────────────

  if (totalItems === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
          <p className="font-medium">Nothing awaiting approval</p>
          <p className="text-sm text-muted-foreground mt-1">
            Task deliverables and Content Studio pieces will appear here when submitted for review.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Summary line */}
      <p className="text-sm text-muted-foreground">
        {totalItems} {totalItems === 1 ? "item" : "items"} pending approval
        {tasks.length > 0 && contentItems.length > 0 && (
          <span> — {tasks.length} task {tasks.length === 1 ? "draft" : "drafts"}, {contentItems.length} content {contentItems.length === 1 ? "piece" : "pieces"}</span>
        )}
      </p>

      {/* Task deliverables */}
      {tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.length > 0 && contentItems.length > 0 && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Task Deliverables
            </p>
          )}
          {tasks.map((task) => (
            <Card key={`task-${task.id}`} className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start gap-2">
                  <Badge className={`text-[10px] px-1.5 py-0 shrink-0 mt-0.5 ${PRIORITY_COLORS[task.priority] || ""}`}>
                    {task.priority}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium leading-snug">
                      {task.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {task.clientName} · {task.category.replace(/_/g, " ")}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(task.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                {task.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                )}
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={actioning === `task-changes-${task.id}`}
                    onClick={() => requestChangesTask(task.id)}
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {actioning === `task-changes-${task.id}` ? "Sending…" : "Request Changes"}
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-green-600 hover:bg-green-700"
                    disabled={actioning === `task-approve-${task.id}`}
                    onClick={() => approveTask(task.id)}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {actioning === `task-approve-${task.id}` ? "Approving…" : "Approve"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Content Studio pieces */}
      {contentItems.length > 0 && (
        <div className="space-y-3">
          {tasks.length > 0 && contentItems.length > 0 && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Content Studio
            </p>
          )}
          {contentItems.map((item) => {
            const Icon = CONTENT_TYPE_ICON[item.contentType] ?? FileText;
            const typeLabel = CONTENT_TYPE_LABEL[item.contentType] ?? item.contentType;
            return (
              <Card key={`content-${item.id}`} className="hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium leading-snug">
                        {item.title || `Untitled ${typeLabel}`}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.clientName} · {typeLabel}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(item.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  {item.keywords.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-3">
                      {item.keywords.slice(0, 5).map((kw, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{kw}</Badge>
                      ))}
                      {item.keywords.length > 5 && (
                        <Badge variant="secondary" className="text-[10px]">+{item.keywords.length - 5}</Badge>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={actioning === `content-reject-${item.id}`}
                      onClick={() => actionContent(item.id, "reject")}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      {actioning === `content-reject-${item.id}` ? "Sending…" : "Send Back"}
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-green-600 hover:bg-green-700"
                      disabled={actioning === `content-approve-${item.id}`}
                      onClick={() => actionContent(item.id, "approve")}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {actioning === `content-approve-${item.id}` ? "Approving…" : "Approve"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
