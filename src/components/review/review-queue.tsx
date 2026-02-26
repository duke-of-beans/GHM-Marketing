"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReviewTaskModal } from "./review-task-modal";
import { CheckCircle, FileText, Share2, Tag } from "lucide-react";

// ── Task items (human-written deliverables via ClientTask pipeline) ─────────

type Task = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  draftContent: string | null;
  contentBrief: any;
  createdAt: Date;
  client: {
    id: number;
    businessName: string;
  };
};

// ── Content items (AI-generated content via ClientContent / Content Studio) ──

type ContentItem = {
  id: number;
  contentType: string;
  title: string | null;
  status: string;
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: number;
    businessName: string;
  };
};

// ── Props ──────────────────────────────────────────────────────────────────

interface ReviewQueueProps {
  tasks: Task[];
  contentItems: ContentItem[];
}

// ── Content type display helpers ───────────────────────────────────────────

const CONTENT_TYPE_META: Record<string, { label: string; icon: React.ElementType }> = {
  blog: { label: "Blog Post", icon: FileText },
  social: { label: "Social Media", icon: Share2 },
  meta: { label: "Meta Description", icon: Tag },
};

// ── Main component ─────────────────────────────────────────────────────────

export function ReviewQueue({ tasks, contentItems }: ReviewQueueProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const totalItems = tasks.length + contentItems.length;

  if (totalItems === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p className="font-medium mb-2">No items in review queue</p>
          <p className="text-sm">
            Items appear here when task drafts or Content Studio pieces are submitted for review.
          </p>
        </CardContent>
      </Card>
    );
  }

  async function handleQuickApproveTask(taskId: number) {
    const key = `task-${taskId}`;
    setApprovingId(key);
    try {
      const res = await fetch(`/api/tasks/${taskId}/approve`, { method: "POST" });
      if (res.ok) window.location.reload();
    } catch (error) {
      console.error("Failed to approve task:", error);
    } finally {
      setApprovingId(null);
    }
  }

  async function handleApproveContent(contentId: number) {
    const key = `content-${contentId}`;
    setApprovingId(key);
    try {
      const res = await fetch("/api/content/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, action: "approve" }),
      });
      if (res.ok) window.location.reload();
    } catch (error) {
      console.error("Failed to approve content:", error);
    } finally {
      setApprovingId(null);
    }
  }

  async function handleRejectContent(contentId: number) {
    const key = `content-reject-${contentId}`;
    setApprovingId(key);
    try {
      const res = await fetch("/api/content/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, action: "reject" }),
      });
      if (res.ok) window.location.reload();
    } catch (error) {
      console.error("Failed to reject content:", error);
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <>
      <div className="grid gap-4">

        {/* ── Task-based review items ───────────────────────────────────── */}
        {tasks.length > 0 && (
          <div className="space-y-3">
            {tasks.length > 0 && contentItems.length > 0 && (
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                Task Deliverables
              </p>
            )}
            {tasks.map((task) => (
              <Card key={`task-${task.id}`} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <Badge
                          variant={
                            task.priority === "P1" ? "destructive" :
                            task.priority === "P2" ? "default" : "secondary"
                          }
                        >
                          {task.priority}
                        </Badge>
                        <Badge variant="outline">{task.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {task.client.businessName}
                      </p>
                      {task.description && (
                        <p className="text-sm">{task.description}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Submitted: {new Date(task.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTask(task)}
                      >
                        Review
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-status-success-bg hover:bg-status-success-bg"
                        disabled={approvingId === `task-${task.id}`}
                        onClick={() => handleQuickApproveTask(task.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {approvingId === `task-${task.id}` ? "Approving…" : "Quick Approve"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Content Studio review items ───────────────────────────────── */}
        {contentItems.length > 0 && (
          <div className="space-y-3">
            {tasks.length > 0 && contentItems.length > 0 && (
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                Content Studio
              </p>
            )}
            {contentItems.map((item) => {
              const meta = CONTENT_TYPE_META[item.contentType] ?? { label: item.contentType, icon: FileText };
              const Icon = meta.icon;
              return (
                <Card key={`content-${item.id}`} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <CardTitle className="text-lg">
                            {item.title || `Untitled ${meta.label}`}
                          </CardTitle>
                          <Badge variant="outline">{meta.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.client.businessName}
                        </p>
                        {item.keywords.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {item.keywords.slice(0, 4).map((kw, i) => (
                              <Badge key={i} variant="secondary" className="text-[10px]">
                                {kw}
                              </Badge>
                            ))}
                            {item.keywords.length > 4 && (
                              <Badge variant="secondary" className="text-[10px]">
                                +{item.keywords.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Submitted: {new Date(item.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={approvingId === `content-reject-${item.id}`}
                          onClick={() => handleRejectContent(item.id)}
                        >
                          Send Back
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-status-success-bg hover:bg-status-success-bg"
                          disabled={approvingId === `content-${item.id}`}
                          onClick={() => handleApproveContent(item.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {approvingId === `content-${item.id}` ? "Approving…" : "Approve"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {selectedTask && (
        <ReviewTaskModal
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}
