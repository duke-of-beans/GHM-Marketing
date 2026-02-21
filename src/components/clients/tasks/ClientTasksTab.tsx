"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

type TaskNote = {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; name: string };
};

export type ClientTask = {
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

// ── Helpers ─────────────────────────────────────────────────────────────────

function priorityColor(p: string) {
  if (p === "Critical" || p === "P1") return "bg-red-100 text-red-800";
  if (p === "High" || p === "P2") return "bg-orange-100 text-orange-800";
  if (p === "Standard" || p === "P3") return "bg-blue-100 text-blue-800";
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

// ── Add Task Dialog ─────────────────────────────────────────────────────────

function AddTaskDialog({
  clientId,
  onAdded,
}: {
  clientId: number;
  onAdded: (task: ClientTask) => void;
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
        <Button size="sm" variant="outline" className="text-xs">+ Add Task</Button>
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
              <SelectTrigger><SelectValue /></SelectTrigger>
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
              <SelectTrigger><SelectValue /></SelectTrigger>
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

// ── Main export ─────────────────────────────────────────────────────────────

type Props = {
  clientId: number;
  initialTasks: ClientTask[];
};

export function ClientTasksTab({ clientId, initialTasks }: Props) {
  const [tasks, setTasks] = useState<ClientTask[]>(initialTasks);

  async function updateTask(taskId: number, status: string) {
    try {
      const res = await fetch(`/api/clients/${clientId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
      toast.success("Task updated");
    } catch {
      toast.error("Failed to update task");
    }
  }

  const openTasks = tasks.filter(
    (t) => !["deployed", "measured", "dismissed"].includes(t.status)
  );
  const completedCount = tasks.filter(
    (t) => t.status === "deployed" || t.status === "measured"
  ).length;
  const tasksByStatus = openTasks.reduce((acc, t) => {
    (acc[t.status] = acc[t.status] || []).push(t);
    return acc;
  }, {} as Record<string, ClientTask[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {openTasks.length} open · {completedCount} completed
        </p>
        <AddTaskDialog clientId={clientId} onAdded={(task) => setTasks((prev) => [task, ...prev])} />
      </div>

      {openTasks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No open tasks. Tasks are auto-generated from competitive scans, or create one manually.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {["queued", "in-progress", "in-review", "approved"].map((status) => {
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
                              <span className="font-medium text-sm">{task.title}</span>
                              <Badge variant="outline" className={`text-[10px] ${priorityColor(task.priority)}`}>
                                {task.priority}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {categoryLabel(task.category)}
                              </Badge>
                              {task.source !== "manual" && (
                                <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700">
                                  {task.source}
                                </Badge>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            {task.targetKeywords && (task.targetKeywords as string[]).length > 0 && (
                              <div className="flex gap-1 mt-1.5 flex-wrap">
                                {(task.targetKeywords as string[]).map((kw, i) => (
                                  <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{kw}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {task.status === "queued" && (
                              <>
                                <Button size="sm" variant="outline" className="text-xs h-7"
                                  onClick={() => updateTask(task.id, "in-progress")}>Start</Button>
                                <Button size="sm" variant="ghost" className="text-xs h-7 text-muted-foreground"
                                  onClick={() => updateTask(task.id, "dismissed")}>Dismiss</Button>
                              </>
                            )}
                            {task.status === "in-progress" && (
                              <Button size="sm" variant="outline" className="text-xs h-7"
                                onClick={() => updateTask(task.id, "in-review")}>Submit for Review</Button>
                            )}
                            {task.status === "in-review" && (
                              <>
                                <Button size="sm" className="text-xs h-7"
                                  onClick={() => updateTask(task.id, "approved")}>Approve</Button>
                                <Button size="sm" variant="outline" className="text-xs h-7"
                                  onClick={() => updateTask(task.id, "in-progress")}>Revise</Button>
                              </>
                            )}
                            {task.status === "approved" && (
                              <Button size="sm" className="text-xs h-7"
                                onClick={() => updateTask(task.id, "deployed")}>Mark Deployed</Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
