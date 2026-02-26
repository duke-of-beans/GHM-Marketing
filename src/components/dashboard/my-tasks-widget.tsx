"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckSquare, AlertTriangle, Clock } from "lucide-react";

type TaskSummary = {
  id: number;
  title: string;
  category: string;
  priority: string;
  status: string;
  dueDate: string | null;
  clientName: string;
  clientId: number;
};

type TaskStats = {
  queued: number;
  in_progress: number;
  overdue: number;
};

const PRIORITY_COLORS: Record<string, string> = {
  P1: "bg-status-danger-bg text-status-danger",
  P2: "bg-status-warning-bg text-status-warning",
  P3: "bg-blue-100 text-blue-700 dark:bg-blue-900/70 dark:text-blue-200",
  P4: "bg-muted text-muted-foreground dark:bg-card dark:text-muted-foreground",
};

export function MyTasksWidget() {
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [stats, setStats] = useState<TaskStats>({ queued: 0, in_progress: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);

  const fetchTasks = () => {
    fetch("/api/tasks/dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setTasks(json.data.tasks);
          setStats(json.data.stats);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();

    // Refetch when tab regains focus so data stays fresh after pipeline changes
    const onFocus = () => fetchTasks();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckSquare className="h-4 w-4" /> My Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const total = stats.queued + stats.in_progress;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckSquare className="h-4 w-4" /> My Tasks
          </CardTitle>
          <Link href="/tasks">
            <Button variant="ghost" size="sm" className="text-xs h-7">
              View all →
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stats row */}
        {total > 0 && (
          <div className="flex gap-3 text-xs">
            {stats.overdue > 0 && (
              <span className="flex items-center gap-1 text-status-danger font-medium">
                <AlertTriangle className="h-4 w-4" /> {stats.overdue} overdue
              </span>
            )}
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" /> {stats.queued} queued
            </span>
            {stats.in_progress > 0 && (
              <span className="text-muted-foreground">{stats.in_progress} in progress</span>
            )}
          </div>
        )}

        {/* Task list */}
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active tasks — all clear.
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
              return (
                <Link
                  key={task.id}
                  href={`/clients/${task.clientId}`}
                  className="flex items-start justify-between gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.clientName}
                      {task.dueDate && (
                        <span className={isOverdue ? " text-status-danger font-medium" : ""}>
                          {" · "}
                          {isOverdue ? "Overdue" : `Due ${new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                        </span>
                      )}
                    </p>
                  </div>
                  <Badge className={`text-[10px] flex-shrink-0 ${PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.P3}`}>
                    {task.priority}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
