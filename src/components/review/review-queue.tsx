"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReviewTaskModal } from "./review-task-modal";
import { CheckCircle, FileText, ClipboardList } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

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

type ContentItem = {
  id: number;
  contentType: string;
  title: string | null;
  content: string;
  keywords: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: number;
    businessName: string;
  };
};

// ── Task card ──────────────────────────────────────────────────────────────

function TaskReviewCard({
  task,
  onSelect,
  onQuickApprove,
}: {
  task: Task;
  onSelect: (t: Task) => void;
  onQuickApprove: (id: number) => void;
}) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs gap-1">
                <ClipboardList className="h-3 w-3" />
                Task Draft
              </Badge>
              <CardTitle className="text-base">{task.title}</CardTitle>
              <Badge
                variant={task.priority === "P1" ? "destructive" : task.priority === "P2" ? "default" : "secondary"}
              >
                {task.priority}
              </Badge>
              <Badge variant="outline">{task.category}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Client: {task.client.businessName}</p>
            {task.description && <p className="text-sm">{task.description}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Submitted: {new Date(task.createdAt).toLocaleDateString()}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onSelect(task)}>
              Review
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => onQuickApprove(task.id)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Quick Approve
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Content item card ──────────────────────────────────────────────────────

const CONTENT_TYPE_LABELS: Record<string, string> = {
  blog: "Blog Post",
  social: "Social Posts",
  meta: "Meta Description",
  ppc: "PPC Ads",
};

function ContentReviewCard({
  item,
  onQuickApprove,
}: {
  item: ContentItem;
  onQuickApprove: (id: number) => void;
}) {
  const typeLabel = CONTENT_TYPE_LABELS[item.contentType] ?? item.contentType;

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs gap-1">
                <FileText className="h-3 w-3" />
                {typeLabel}
              </Badge>
              <CardTitle className="text-base">{item.title ?? "Untitled"}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">Client: {item.client.businessName}</p>
            {item.keywords.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {item.keywords.slice(0, 4).map((kw, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {kw}
                  </Badge>
                ))}
                {item.keywords.length > 4 && (
                  <Badge variant="outline" className="text-xs">
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
          <p className="text-sm text-muted-foreground">
            Generated: {new Date(item.createdAt).toLocaleDateString()}
          </p>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => onQuickApprove(item.id)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

export function ReviewQueue({
  tasks,
  contentItems,
}: {
  tasks: Task[];
  contentItems: ContentItem[];
}) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const totalItems = tasks.length + contentItems.length;

  if (totalItems === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p className="font-medium mb-2">No items in review queue</p>
          <p className="text-sm">
            Items appear here when content drafts are submitted for review. You&apos;ll
            review and either approve or request changes.
          </p>
        </CardContent>
      </Card>
    );
  }

  async function handleTaskQuickApprove(taskId: number) {
    try {
      const res = await fetch(`/api/tasks/${taskId}/approve`, { method: "POST" });
      if (res.ok) window.location.reload();
    } catch (error) {
      console.error("Failed to approve task:", error);
    }
  }

  // BUG-007 FIX: Approve content items via ClientContent API, not task API.
  // These are separate records — approving must write to the correct model.
  async function handleContentQuickApprove(contentId: number) {
    try {
      const res = await fetch("/api/content/list", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, status: "approved" }),
      });
      if (res.ok) window.location.reload();
    } catch (error) {
      console.error("Failed to approve content:", error);
    }
  }

  return (
    <>
      <div className="grid gap-4">
        {/* Task drafts first (human-written, higher urgency) */}
        {tasks.map((task) => (
          <TaskReviewCard
            key={`task-${task.id}`}
            task={task}
            onSelect={setSelectedTask}
            onQuickApprove={handleTaskQuickApprove}
          />
        ))}

        {/* Content Studio items */}
        {contentItems.map((item) => (
          <ContentReviewCard
            key={`content-${item.id}`}
            item={item}
            onQuickApprove={handleContentQuickApprove}
          />
        ))}
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
