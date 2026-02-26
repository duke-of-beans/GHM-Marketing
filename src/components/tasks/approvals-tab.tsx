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
import { CheckCircle, XCircle, AlertCircle, FileText, Share2, Tag, DollarSign, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { voice, pick } from "@/lib/voice";

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

type PaymentTx = {
  id: number;
  type: string;
  amount: string;
  month: string;
  notes: string | null;
  client: { id: number; businessName: string };
};

type PaymentGroup = {
  userId: number;
  userName: string;
  userRole: string;
  entityName: string | null;
  hasVendorId: boolean;
  totalAmount: number;
  transactions: PaymentTx[];
  month: string;
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
  P1: "bg-status-danger-bg text-status-danger",
  P2: "bg-status-warning-bg text-status-warning",
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
  const [paymentGroups, setPaymentGroups] = useState<PaymentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  async function loadApprovals() {
    setLoading(true);
    try {
      const [taskRes, contentRes, paymentRes] = await Promise.all([
        fetch("/api/tasks/queue?status=review&view=team&limit=50"),
        fetch("/api/review/content-queue"),
        fetch("/api/payments/pending"),
      ]);

      const taskJson = await taskRes.json();
      const contentJson = await contentRes.json();
      const paymentJson = await paymentRes.json();

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

      if (paymentJson.success) {
        setPaymentGroups(paymentJson.data.groups);
      }
    } catch (err) {
      toast.error(voice.approvals.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApprovals();
  }, []);

  // ── Payment approval actions ───────────────────────────────────────────

  async function approvePaymentGroup(group: PaymentGroup) {
    const key = `payment-approve-${group.userId}-${group.month}`;
    setActioning(key);
    try {
      const res = await fetch("/api/payments/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionIds: group.transactions.map((t) => t.id),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || voice.approvals.approveFailed);
        return;
      }
      const waveNote = json.waveCreated > 0
        ? "Wave bill created."
        : json.missingVendorId?.length
          ? "No Wave vendor ID set — bill not created."
          : "";
      toast.success(voice.approvals.paymentsApproved(json.approved, waveNote));
      loadApprovals();
    } catch {
      toast.error(voice.errors.network);
    } finally {
      setActioning(null);
    }
  }

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
        toast.error(json.error || voice.approvals.approveFailed);
        return;
      }
      toast.success(pick(voice.approvals.taskApproved));
      loadApprovals();
    } catch {
      toast.error(voice.errors.network);
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
        toast.success(pick(voice.approvals.changesRequested));
        loadApprovals();
      }
    } catch {
      toast.error(voice.errors.network);
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
        toast.error(json.error || voice.approvals.approveFailed);
        return;
      }
      toast.success(action === "approve" ? pick(voice.approvals.contentApproved) : pick(voice.approvals.contentSentBack));
      loadApprovals();
    } catch {
      toast.error(voice.errors.network);
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

  const totalItems = tasks.length + contentItems.length + paymentGroups.length;

  // ── Empty state ────────────────────────────────────────────────────────

  if (totalItems === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <CheckCircle className="h-10 w-10 text-status-success mx-auto mb-3" />
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
                    className="h-7 text-xs bg-status-success-bg hover:bg-status-success-bg"
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
                      className="h-7 text-xs bg-status-success-bg hover:bg-status-success-bg"
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
      {/* Pending Payments */}
      {paymentGroups.length > 0 && (
        <div className="space-y-3">
          {(tasks.length > 0 || contentItems.length > 0) && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Payment Approvals
            </p>
          )}
          {paymentGroups.map((group) => {
            const key = `payment-approve-${group.userId}-${group.month}`;
            const isActioning = actioning === key;
            return (
              <Card
                key={key}
                className={`hover:border-primary/40 transition-colors ${!group.hasVendorId ? "border-status-warning-border" : ""}`}
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium leading-snug">
                        {group.entityName ?? group.userName}
                        {group.entityName && (
                          <span className="text-muted-foreground font-normal"> ({group.userName})</span>
                        )}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {group.transactions.length} transaction{group.transactions.length !== 1 ? "s" : ""} ·{" "}
                        {new Date(`${group.month}-01`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <span className="text-sm font-semibold shrink-0">
                      ${group.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  {/* Transaction breakdown */}
                  <div className="space-y-1 mb-3">
                    {group.transactions.map((tx) => (
                      <div key={tx.id} className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {tx.type.replace(/_/g, " ")} — {tx.client.businessName}
                        </span>
                        <span>${Number(tx.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  {/* Vendor ID warning */}
                  {!group.hasVendorId && (
                    <div className="flex items-center gap-1.5 text-xs text-status-warning mb-3 bg-status-warning-bg rounded px-2 py-1.5">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      No Wave vendor ID — approval will succeed but Wave bill won&apos;t be created. Set contractor info in Team settings first.
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-status-success-bg hover:bg-status-success-bg"
                      disabled={isActioning}
                      onClick={() => approvePaymentGroup(group)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {isActioning ? "Approving…" : `Approve $${group.totalAmount.toFixed(2)}`}
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
