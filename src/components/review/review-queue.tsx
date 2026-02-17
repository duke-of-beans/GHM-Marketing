"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReviewTaskModal } from "./review-task-modal";
import { CheckCircle } from "lucide-react";

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

export function ReviewQueue({ tasks }: { tasks: Task[] }) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p className="font-medium mb-2">No tasks in review queue</p>
          <p className="text-sm">
            Tasks appear here when content drafts are submitted by writers. You'll review the brief, check the draft, and either approve or request changes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {tasks.map((task) => (
          <Card key={task.id} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <Badge variant={task.priority === "P1" ? "destructive" : task.priority === "P2" ? "default" : "secondary"}>
                      {task.priority}
                    </Badge>
                    <Badge variant="outline">{task.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Client: {task.client.businessName}
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
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleQuickApprove(task.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Quick Approve
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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

async function handleQuickApprove(taskId: number) {
  try {
    const response = await fetch(`/api/tasks/${taskId}/approve`, {
      method: "POST",
    });
    
    if (response.ok) {
      window.location.reload(); // Refresh to update queue
    }
  } catch (error) {
    console.error("Failed to approve task:", error);
  }
}
