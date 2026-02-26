"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { TaskChecklist } from "@/components/tasks/task-checklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  LayoutGrid,
  ChevronRight,
  User,
  ArrowRight,
  Plus,
  GripVertical,
  ArrowRightCircle,
} from "lucide-react";
import { toast } from "sonner";
import { isElevated as checkElevated } from "@/lib/auth/roles";
import type { UserRole } from "@prisma/client";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, CheckCheck, UserMinus, CheckSquare, Square } from "lucide-react";
import { useBulkSelect } from "@/hooks/use-bulk-select";
import { BulkActionBar } from "@/components/bulk/bulk-action-bar";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Types ───────────────────────────────────────────────────────────────────

type TaskTransitionOption = {
  to: string;
  label: string;
  requiresComment: boolean;
};

type QueueTask = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  source: string;
  dueDate: string | null;
  clientId: number;
  clientName: string;
  assignedTo: { id: number; name: string; role: string } | null;
  assignedBy: { id: number; name: string } | null;
  startedAt: string | null;
  completedAt: string | null;
  statusChangedAt: string;
  estimatedMinutes: number | null;
  sortOrder: number;
  isOverdue: boolean;
  isMine: boolean;
  transitions: TaskTransitionOption[];
  createdAt: string;
  sourceAlertId: number | null;
  recurringRuleId: number | null;
  checklistComplete: boolean;
};

type QueueStats = {
  byStatus: Record<string, number>;
  overdue: number;
  total: number;
};

type HistoryEntry = {
  id: number;
  fromStatus: string | null;
  toStatus: string;
  userName: string;
  comment: string | null;
  createdAt: string;
};

type Props = {
  currentUserId: number;
  currentUserRole: UserRole;
};

// ── Constants ───────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  P1: "bg-status-danger-bg text-status-danger",
  P2: "bg-status-warning-bg text-status-warning",
  P3: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200",
  P4: "bg-muted text-muted-foreground dark:bg-card",
};

const STATUS_COLORS: Record<string, string> = {
  queued: "bg-muted text-foreground dark:bg-card",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200",
  review: "bg-status-warning-bg text-status-warning",
  approved: "bg-status-success-bg text-status-success",
  deployed: "bg-status-success-bg text-status-success",
  measuring: "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-200",
  complete: "bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-200",
  rejected: "bg-status-danger-bg text-status-danger",
  cancelled: "bg-muted text-muted-foreground dark:bg-card dark:text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  queued: "Queued",
  in_progress: "In Progress",
  review: "In Review",
  approved: "Approved",
  deployed: "Deployed",
  measuring: "Measuring",
  complete: "Complete",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const CATEGORY_ICONS: Record<string, string> = {
  content: "CNT",
  technical_seo: "SEO",
  local_seo: "LOC",
  backlinks: "BKL",
  reviews: "REV",
  speed: "SPD",
  competitor: "CMP",
  website: "WEB",
  general: "GEN",
};

const VALID_CATEGORIES = [
  { value: "content", label: "Content" },
  { value: "technical_seo", label: "Technical SEO" },
  { value: "local_seo", label: "Local SEO" },
  { value: "backlinks", label: "Backlinks" },
  { value: "reviews", label: "Reviews" },
  { value: "speed", label: "Speed" },
  { value: "competitor", label: "Competitor" },
  { value: "website", label: "Website" },
  { value: "general", label: "General" },
];

// ── Sortable Task Row ───────────────────────────────────────────────────────

function SortableTaskRow({
  task,
  isActive,
  onSelect,
  onTransition,
  onSelfAssign,
}: {
  task: QueueTask;
  isActive: boolean;
  onSelect: (t: QueueTask) => void;
  onTransition: (id: number, to: string, requiresComment: boolean) => void;
  onSelfAssign: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dueStr = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-muted/40 transition-colors cursor-pointer ${
        task.isOverdue ? "bg-status-danger-bg/50" : ""
      } ${isActive ? "opacity-50 pointer-events-none" : ""}`}
      onClick={() => onSelect(task)}
    >
      {/* Drag handle */}
      <div
        className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none text-muted-foreground/50 hover:text-muted-foreground"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Priority + Category */}
      <div className="flex items-center gap-2 w-20 flex-shrink-0">
        <Badge className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.P3}`}>
          {task.priority}
        </Badge>
        <span className="text-sm" title={task.category}>
          {CATEGORY_ICONS[task.category] || "GEN"}
        </span>
      </div>

      {/* Title + Client */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{task.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {task.clientName}
          {task.assignedTo && !task.isMine && (
            <span className="ml-2 inline-flex items-center gap-1">
              <User className="h-3 w-3" />
              {task.assignedTo.name}
            </span>
          )}
        </p>
      </div>

      {/* Status badge */}
      <Badge className={`text-[10px] px-2 py-0.5 ${STATUS_COLORS[task.status] || ""}`}>
        {STATUS_LABELS[task.status] || task.status}
      </Badge>

      {/* Due date */}
      <div className="w-16 text-right flex-shrink-0 hidden sm:block">
        {dueStr && (
          <span className={`text-xs ${task.isOverdue ? "text-status-danger font-medium" : "text-muted-foreground"}`}>
            {dueStr}
          </span>
        )}
      </div>

      {/* Quick action */}
      <div className="w-28 flex-shrink-0 text-right opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
        {task.transitions[0] && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onTransition(task.id, task.transitions[0].to, task.transitions[0].requiresComment);
            }}
          >
            {task.transitions[0].label}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        )}
        {!task.assignedTo && !task.transitions[0] && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onSelfAssign(task.id);
            }}
          >
            Claim
          </Button>
        )}
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function TaskQueueClient({ currentUserId, currentUserRole }: Props) {
  const [tasks, setTasks] = useState<QueueTask[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<QueueTask | null>(null);
  const [commentText, setCommentText] = useState("");
  const [pendingTransition, setPendingTransition] = useState<{ taskId: number; to: string } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);

  // Filters
  const [view, setView] = useState<string>(checkElevated(currentUserRole) ? "team" : "mine");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [sortBy, setSortBy] = useState<string>("priority");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [selectMode, setSelectMode] = useState(false);
  const bulk = useBulkSelect(tasks);

  const bulkTaskActions = [
    {
      label: "Close Selected",
      run: async (ids: number[]) => {
        const res = await fetch("/api/bulk/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, operation: "close" }) });
        const data = await res.json();
        if (data.processed > 0) setTasks(prev => prev.filter(t => !ids.includes(t.id)));
        return data;
      },
    },
    {
      label: "Unassign",
      run: async (ids: number[]) => {
        const res = await fetch("/api/bulk/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, operation: "reassign", params: { assignedToId: null } }) });
        const data = await res.json();
        if (data.processed > 0) { /* refresh will pick up */ }
        return data;
      },
    },
  ];

  const elevated = checkElevated(currentUserRole);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchQueue = useCallback(() => {
    const statusParam = statusFilter === "active"
      ? "queued,in_progress,review,approved"
      : statusFilter === "all"
        ? "queued,in_progress,review,approved,deployed,measuring,complete,rejected,cancelled"
        : statusFilter;

    const params = new URLSearchParams({
      view,
      status: statusParam,
      sort: sortBy === "manual" ? "sort_order" : sortBy,
      limit: "50",
    });

    fetch(`/api/tasks/queue?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setTasks(json.data.tasks);
          setStats(json.data.stats);
        }
      })
      .catch(() => toast.error("Failed to load tasks"))
      .finally(() => setLoading(false));
  }, [view, statusFilter, sortBy]);

  useEffect(() => {
    setLoading(true);
    fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    const onFocus = () => fetchQueue();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchQueue]);

  // Fetch history when detail sheet opens
  useEffect(() => {
    if (!selectedTask) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    fetch(`/api/tasks/${selectedTask.id}/history`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setHistory(json.data);
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [selectedTask?.id]);

  // Fetch clients for create dialog
  useEffect(() => {
    if (!createOpen || clients.length > 0) return;
    fetch("/api/clients?limit=200&fields=id,businessName")
      .then((r) => r.json())
      .then((json) => {
        if (json.clients) {
          setClients(json.clients.map((c: any) => ({ id: c.id, name: c.businessName })));
        }
      })
      .catch(() => {});
  }, [createOpen, clients.length]);

  // ── Transition handler ──────────────────────────────────────────────────

  const handleTransition = async (taskId: number, toStatus: string, comment?: string) => {
    setTransitioning(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/transition`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus, comment }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Transition failed");
        return;
      }
      toast.success(`Task moved to ${STATUS_LABELS[toStatus] || toStatus}`);
      fetchQueue();
      setSelectedTask(null);
      setPendingTransition(null);
      setCommentText("");
    } catch {
      toast.error("Network error");
    } finally {
      setTransitioning(null);
    }
  };

  const onTransitionClick = (taskId: number, to: string, requiresComment: boolean) => {
    if (requiresComment) {
      setPendingTransition({ taskId, to });
      setCommentText("");
    } else {
      handleTransition(taskId, to);
    }
  };

  // ── Self-assign handler ─────────────────────────────────────────────────

  const handleSelfAssign = async (taskId: number) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Assign failed");
        return;
      }
      toast.success("Task assigned to you");
      fetchQueue();
    } catch {
      toast.error("Network error");
    }
  };

  // ── Drag-and-drop reorder ─────────────────────────────────────────────

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(tasks, oldIndex, newIndex);
    setTasks(reordered);

    // Send new order to server
    const items = reordered.map((t, i) => ({ id: t.id, sortOrder: i }));
    try {
      const res = await fetch("/api/tasks/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        toast.error("Reorder failed");
        fetchQueue(); // revert
      }
    } catch {
      toast.error("Network error");
      fetchQueue();
    }
  };

  // ── Create task handler ───────────────────────────────────────────────────

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    const form = new FormData(e.currentTarget);
    const body = {
      clientId: Number(form.get("clientId")),
      title: form.get("title") as string,
      description: (form.get("description") as string) || undefined,
      category: form.get("category") as string,
      priority: form.get("priority") as string,
      dueDate: (form.get("dueDate") as string) || undefined,
      estimatedMinutes: form.get("estimatedMinutes") ? Number(form.get("estimatedMinutes")) : undefined,
    };

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to create task");
        return;
      }
      toast.success(`Task "${json.data.title}" created`);
      setCreateOpen(false);
      fetchQueue();
    } catch {
      toast.error("Network error");
    } finally {
      setCreating(false);
    }
  };

  // ── Stats bar ─────────────────────────────────────────────────────────────

  const StatsBar = () => {
    if (!stats) return null;
    const s = stats.byStatus;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Queued</span>
          </div>
          <p className="text-2xl font-bold mt-1">{s.queued || 0}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">In Progress</span>
          </div>
          <p className="text-2xl font-bold mt-1">{s.in_progress || 0}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-status-warning" />
            <span className="text-sm text-muted-foreground">In Review</span>
          </div>
          <p className="text-2xl font-bold mt-1">{s.review || 0}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-status-danger" />
            <span className="text-sm text-muted-foreground">Overdue</span>
          </div>
          <p className="text-2xl font-bold text-status-danger mt-1">{stats.overdue}</p>
        </Card>
      </div>
    );
  };

  // ── Board view ────────────────────────────────────────────────────────────

  const BOARD_COLUMNS: { status: string; label: string; color: string }[] = [
    { status: "queued", label: "Queued", color: "border-border dark:border-border" },
    { status: "in_progress", label: "In Progress", color: "border-blue-400 dark:border-blue-500" },
    { status: "review", label: "In Review", color: "border-status-warning-border" },
    { status: "approved", label: "Approved", color: "border-status-success-border" },
  ];

  const BoardView = () => {
    const tasksByStatus = BOARD_COLUMNS.map((col) => ({
      ...col,
      tasks: tasks.filter((t) => t.status === col.status),
    }));

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tasksByStatus.map((col) => (
          <div key={col.status} className={`border-t-2 ${col.color} rounded-lg bg-muted/30 dark:bg-muted/10 p-3`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <Badge variant="secondary" className="text-xs">{col.tasks.length}</Badge>
            </div>
            <div className="space-y-2 min-h-[200px]">
              {col.tasks.map((task) => (
                <Card
                  key={task.id}
                  className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${
                    task.isOverdue ? "border-status-danger-border" : ""
                  } ${transitioning === task.id ? "opacity-50" : ""}`}
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Badge className={`text-[10px] px-1 py-0 ${PRIORITY_COLORS[task.priority] || ""}`}>
                      {task.priority}
                    </Badge>
                    <span className="text-xs">{CATEGORY_ICONS[task.category] || "GEN"}</span>
                    {task.isOverdue && <AlertTriangle className="h-3 w-3 text-status-danger ml-auto" />}
                  </div>
                  <p className="text-sm font-medium line-clamp-2 mb-1">{task.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground truncate">{task.clientName}</span>
                    {task.assignedTo && (
                      <span className="text-[10px] text-muted-foreground truncate ml-1">
                        {task.isMine ? "You" : task.assignedTo.name.split(" ")[0]}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
              {col.tasks.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No tasks</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ── Task detail sheet ─────────────────────────────────────────────────────

  const TaskDetailSheet = () => {
    if (!selectedTask) return null;
    const t = selectedTask;
    const timeInStatus = Math.round(
      (Date.now() - new Date(t.statusChangedAt).getTime()) / (1000 * 60 * 60)
    );

    return (
      <Sheet open={!!selectedTask} onOpenChange={() => { setSelectedTask(null); setPendingTransition(null); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Badge className={PRIORITY_COLORS[t.priority] || ""}>{t.priority}</Badge>
              <Badge className={STATUS_COLORS[t.status] || ""}>{STATUS_LABELS[t.status]}</Badge>
              {t.isOverdue && <Badge className="bg-status-danger-bg text-white text-[10px]">OVERDUE</Badge>}
            </div>
            <SheetTitle className="text-left text-lg mt-2">{t.title}</SheetTitle>
          </SheetHeader>

          <div className="space-y-5">
            {/* Meta info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Client</p>
                <Link href={`/clients/${t.clientId}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                  {t.clientName}
                </Link>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Category</p>
                <p>{CATEGORY_ICONS[t.category]} {t.category.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Assigned To</p>
                <p>{t.assignedTo ? t.assignedTo.name : "Unassigned"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Time in Status</p>
                <p>{timeInStatus < 24 ? `${timeInStatus}h` : `${Math.round(timeInStatus / 24)}d`}</p>
              </div>
              {t.dueDate && (
                <div>
                  <p className="text-muted-foreground text-xs">Due Date</p>
                  <p className={t.isOverdue ? "text-status-danger font-medium" : ""}>
                    {new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              )}
              {t.estimatedMinutes && (
                <div>
                  <p className="text-muted-foreground text-xs">Estimate</p>
                  <p>{t.estimatedMinutes < 60 ? `${t.estimatedMinutes}m` : `${Math.round(t.estimatedMinutes / 60)}h`}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {t.description && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap bg-muted/30 rounded-lg p-3">{t.description}</p>
              </div>
            )}

            {/* Origin badges */}
            {(t.sourceAlertId || t.recurringRuleId) && (
              <div className="flex flex-wrap gap-2">
                {t.sourceAlertId && (
                  <Link href={`/alerts?highlight=${t.sourceAlertId}`}>
                    <Badge variant="outline" className="text-[10px] border-status-warning-border text-status-warning hover:bg-status-warning-bg cursor-pointer">
                      From alert #{t.sourceAlertId}
                    </Badge>
                  </Link>
                )}
                {t.recurringRuleId && (
                  <Link href={`/recurring-tasks?highlight=${t.recurringRuleId}`}>
                    <Badge variant="outline" className="text-[10px] border-purple-400 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 cursor-pointer">
                      🔁 Recurring task
                    </Badge>
                  </Link>
                )}
              </div>
            )}

            {/* Checklist */}
            <TaskChecklist taskId={t.id} category={t.category} />

            {/* Self-assign */}
            {!t.assignedTo && (
              <Button variant="outline" className="w-full" onClick={() => handleSelfAssign(t.id)}>
                <User className="h-4 w-4 mr-2" />
                Claim This Task
              </Button>
            )}

            {/* Comment input for transitions that require it */}
            {pendingTransition && pendingTransition.taskId === t.id && (
              <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                <p className="text-sm font-medium">
                  Moving to: {STATUS_LABELS[pendingTransition.to]}
                </p>
                <textarea
                  className="w-full text-sm border rounded-md p-2 bg-background resize-none"
                  rows={3}
                  placeholder="Reason required..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={!commentText.trim() || transitioning === t.id}
                    onClick={() => handleTransition(t.id, pendingTransition.to, commentText)}
                  >
                    Confirm
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setPendingTransition(null); setCommentText(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Transition buttons */}
            {t.transitions.length > 0 && (!pendingTransition || pendingTransition.taskId !== t.id) && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Actions</p>
                <div className="flex flex-wrap gap-2">
                  {t.transitions.map((tr) => (
                    <Button
                      key={tr.to}
                      size="sm"
                      variant={tr.to === "rejected" || tr.to === "cancelled" ? "destructive" : "default"}
                      disabled={transitioning === t.id}
                      onClick={() => onTransitionClick(t.id, tr.to, tr.requiresComment)}
                    >
                      {tr.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Transition history */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">History</p>
              {historyLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8" />)}
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground">No transitions recorded</p>
              ) : (
                <div className="space-y-0 relative">
                  {/* Vertical line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                  {history.map((h) => {
                    const date = new Date(h.createdAt);
                    const timeStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      + " " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                    return (
                      <div key={h.id} className="flex items-start gap-3 py-1.5 relative">
                        <div className="z-10 flex-shrink-0 mt-1">
                          <ArrowRightCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs">
                            <span className="font-medium">{h.userName}</span>
                            {h.fromStatus ? (
                              <span className="text-muted-foreground">
                                {" "}moved from{" "}
                                <Badge className={`text-[9px] px-1 py-0 ${STATUS_COLORS[h.fromStatus] || ""}`}>
                                  {STATUS_LABELS[h.fromStatus] || h.fromStatus}
                                </Badge>
                                {" → "}
                                <Badge className={`text-[9px] px-1 py-0 ${STATUS_COLORS[h.toStatus] || ""}`}>
                                  {STATUS_LABELS[h.toStatus] || h.toStatus}
                                </Badge>
                              </span>
                            ) : (
                              <span className="text-muted-foreground"> created task</span>
                            )}
                          </p>
                          {h.comment && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic">&ldquo;{h.comment}&rdquo;</p>
                          )}
                          <p className="text-[10px] text-muted-foreground/70">{timeStr}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  // ── Create task dialog ────────────────────────────────────────────────────

  const CreateTaskDialog = () => (
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateTask} className="space-y-4">
          {/* ── Suggested Tasks ── */}
          {(() => {
            const suggestions: Record<string, { label: string; category: string }[]> = {
              admin: [
                { label: "Review monthly performance reports", category: "general" },
                { label: "Audit team task completion rates", category: "general" },
                { label: "Update client pricing agreements", category: "general" },
                { label: "Review and approve invoices", category: "general" },
              ],
              manager: [
                { label: "Conduct weekly client check-in", category: "general" },
                { label: "Review Google Business Profile updates", category: "local_seo" },
                { label: "Audit backlink profile for client", category: "backlinks" },
                { label: "Prepare monthly client report", category: "general" },
                { label: "Review competitor keyword gaps", category: "competitor" },
              ],
              sales: [
                { label: "Follow up on outstanding proposal", category: "general" },
                { label: "Prepare audit for prospect meeting", category: "technical_seo" },
                { label: "Request Google review from client", category: "reviews" },
                { label: "Send monthly retainer invoice reminder", category: "general" },
                { label: "Update CRM notes after client call", category: "general" },
              ],
            };
            const roleSuggestions = suggestions[currentUserRole] ?? suggestions.sales;
            return (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Quick add</p>
                <div className="flex flex-wrap gap-1.5">
                  {roleSuggestions.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      className="text-[11px] px-2 py-1 rounded-md border border-border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      onClick={() => {
                        const titleInput = document.querySelector<HTMLInputElement>('input[name="title"]');
                        const categorySelect = document.querySelector<HTMLSelectElement>('select[name="category"]');
                        if (titleInput) titleInput.value = s.label;
                        if (categorySelect) categorySelect.value = s.category;
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
          <div>
            <Label htmlFor="clientId" className="text-xs">Client</Label>
            <select
              name="clientId"
              required
              className="w-full mt-1 text-sm border rounded-md px-3 py-2 bg-background"
            >
              <option value="">Select client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="title" className="text-xs">Title</Label>
            <Input name="title" required placeholder="e.g. Write blog post about..." className="mt-1" />
          </div>
          <div>
            <Label htmlFor="description" className="text-xs">Description (optional)</Label>
            <textarea
              name="description"
              rows={3}
              className="w-full mt-1 text-sm border rounded-md p-2 bg-background resize-none"
              placeholder="Details, links, notes..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="category" className="text-xs">Category</Label>
              <select
                name="category"
                required
                className="w-full mt-1 text-sm border rounded-md px-3 py-2 bg-background"
              >
                {VALID_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{CATEGORY_ICONS[c.value]} {c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="priority" className="text-xs">Priority</Label>
              <select
                name="priority"
                className="w-full mt-1 text-sm border rounded-md px-3 py-2 bg-background"
                defaultValue="P3"
              >
                <option value="P1">🔴 P1 — Critical</option>
                <option value="P2">🟠 P2 — High</option>
                <option value="P3">🔵 P3 — Medium</option>
                <option value="P4">⚪ P4 — Low</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dueDate" className="text-xs">Due Date (optional)</Label>
              <Input name="dueDate" type="date" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="estimatedMinutes" className="text-xs">Estimate (min)</Label>
              <Input name="estimatedMinutes" type="number" min={0} placeholder="e.g. 60" className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Card>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </Card>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <>
      {/* Header + Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" className="h-8" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Task
          </Button>

          {elevated && (
            <Select value={view} onValueChange={setView}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mine">My Tasks</SelectItem>
                <SelectItem value="team">All Tasks</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="review">In Review</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="due_date">Due Date</SelectItem>
              <SelectItem value="updated">Recently Updated</SelectItem>
              <SelectItem value="sort_order">Manual Order</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md">
            <Button
              size="sm"
              variant={viewMode === "list" ? "default" : "ghost"}
              className="h-8 px-2 rounded-r-none"
              onClick={() => setViewMode("list")}
            >
              <ListTodo className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "board" ? "default" : "ghost"}
              className="h-8 px-2 rounded-l-none"
              onClick={() => setViewMode("board")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          {viewMode === "list" && tasks.length > 0 && (
            <Button
              size="sm"
              variant={selectMode ? "secondary" : "outline"}
              className="h-8 gap-1.5"
              onClick={() => { setSelectMode(p => !p); bulk.clear(); }}
            >
              <CheckSquare className="h-4 w-4" />
              {selectMode ? "Cancel" : "Select"}
            </Button>
          )}
        </div>
      </div>

      <StatsBar />

      {/* Task list or board */}
      {tasks.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-status-success mx-auto mb-3" />
          <p className="text-lg font-medium">Queue clear</p>
          <p className="text-sm text-muted-foreground mt-1">No tasks match your filters.</p>
        </Card>
      ) : viewMode === "list" ? (
        <Card className="overflow-hidden">
        {selectMode ? (
          /* Bulk select mode — no DnD, just checkboxes */
          <div>
            <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={bulk.allSelected}
                ref={el => { if (el) el.indeterminate = bulk.someSelected; }}
                onChange={bulk.toggleAll}
                className="rounded"
              />
              <span>{bulk.count > 0 ? `${bulk.count} of ${tasks.length} selected` : `${tasks.length} tasks — click to select`}</span>
            </div>
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-muted/20 ${bulk.isSelected(task.id) ? "bg-primary/5" : ""}`}
                onClick={() => bulk.toggle(task.id)}
              >
                <input
                  type="checkbox"
                  checked={bulk.isSelected(task.id)}
                  onChange={() => bulk.toggle(task.id)}
                  className="rounded shrink-0"
                  onClick={e => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.clientName} · {task.status}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {tasks.map((task) => (
                <SortableTaskRow
                  key={task.id}
                  task={task}
                  isActive={transitioning === task.id}
                  onSelect={setSelectedTask}
                  onTransition={onTransitionClick}
                  onSelfAssign={handleSelfAssign}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
        </Card>
      ) : (
        <BoardView />
      )}

      <TaskDetailSheet />
      <CreateTaskDialog />
      <BulkActionBar
        selectedIds={bulk.selectedIds}
        onClear={() => { bulk.clear(); setSelectMode(false); }}
        actions={bulkTaskActions}
        entityLabel="task"
      />
    </>
  );
}
