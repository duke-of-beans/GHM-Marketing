"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

type Task = {
  id: number;
  title: string;
  category: string;
  draftContent: string | null;
  contentBrief: any;
  client: {
    businessName: string;
  };
};

export function ReviewTaskModal({
  task,
  open,
  onClose,
}: {
  task: Task;
  open: boolean;
  onClose: () => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvedContent: task.draftContent,
        }),
      });

      if (response.ok) {
        onClose();
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to approve:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!feedback.trim()) {
      alert("Please provide feedback for the writer");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/request-changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });

      if (response.ok) {
        onClose();
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to request changes:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Are you sure you want to reject this task? This cannot be undone.")) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/reject`, {
        method: "POST",
      });

      if (response.ok) {
        onClose();
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to reject:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {task.client.businessName} • {task.category}
          </p>
        </DialogHeader>

        <Tabs defaultValue="side-by-side" className="mt-4">
          <TabsList>
            <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
            <TabsTrigger value="brief">Content Brief Only</TabsTrigger>
            <TabsTrigger value="draft">Draft Only</TabsTrigger>
          </TabsList>

          <TabsContent value="side-by-side" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Content Brief</Label>
                <div className="border rounded-lg p-4 bg-muted/30 mt-2 max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(task.contentBrief, null, 2)}
                  </pre>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Draft Content</Label>
                <div className="border rounded-lg p-4 mt-2 max-h-96 overflow-y-auto">
                  <div className="prose prose-sm max-w-none">
                    {task.draftContent || <em className="text-muted-foreground">No draft submitted</em>}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="brief">
            <div className="border rounded-lg p-4 bg-muted/30">
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(task.contentBrief, null, 2)}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="draft">
            <div className="border rounded-lg p-4">
              <div className="prose prose-sm max-w-none">
                {task.draftContent || <em className="text-muted-foreground">No draft submitted</em>}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="feedback">Feedback (for Request Changes)</Label>
            <Textarea
              id="feedback"
              placeholder="Provide specific feedback for the writer..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              variant="outline"
              onClick={handleRequestChanges}
              disabled={isSubmitting}
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              Request Changes
            </Button>
            <Button
              variant="default"
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
