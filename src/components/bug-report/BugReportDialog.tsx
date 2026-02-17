"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Bug, CheckCircle2, Lightbulb } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: string;
  contextInfo?: Record<string, any>;
}

export function BugReportDialog({ 
  open, 
  onOpenChange,
  defaultCategory,
  contextInfo,
}: Props) {
  const [type, setType] = useState<"bug" | "feature">("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(defaultCategory || "");
  const [severity, setSeverity] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Capture metadata on mount
  const [metadata, setMetadata] = useState<any>({});

  useEffect(() => {
    if (open) {
      captureMetadata();
    }
  }, [open]);

  function captureMetadata() {
    const meta: any = {
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timestamp: new Date().toISOString(),
      
      browserInfo: {
        language: navigator.language,
        platform: navigator.platform,
        cookiesEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        vendor: navigator.vendor,
      },
    };

    // Capture console errors (if available)
    try {
      const consoleErrors = (window as any).__consoleErrors || [];
      meta.consoleErrors = consoleErrors.slice(-10); // Last 10 errors
    } catch (e) {
      meta.consoleErrors = [];
    }

    // Capture network errors (if available)
    try {
      const networkErrors = (window as any).__networkErrors || [];
      meta.networkErrors = networkErrors.slice(-5); // Last 5 failed requests
    } catch (e) {
      meta.networkErrors = [];
    }

    // Capture recent actions (if available)
    try {
      const recentActions = (window as any).__recentActions || [];
      meta.recentActions = recentActions.slice(-5); // Last 5 actions
    } catch (e) {
      meta.recentActions = [];
    }

    // Include any context info passed in
    if (contextInfo) {
      meta.sessionData = contextInfo;
    }

    setMetadata(meta);
  }

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) {
      toast.error("Please provide a title and description");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/bug-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          description,
          category,
          severity,
          ...metadata,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit bug report");
      }

      setSubmitted(true);
      toast.success(type === "bug" ? "Bug report submitted successfully!" : "Feature request submitted successfully!");

      // Reset form after delay
      setTimeout(() => {
        setType("bug");
        setTitle("");
        setDescription("");
        setCategory("");
        setSeverity("medium");
        setSubmitted(false);
        onOpenChange(false);
      }, 2000);

    } catch (error) {
      console.error(error);
      toast.error("Failed to submit bug report");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "bug" ? (
              <>
                <Bug className="h-5 w-5 text-orange-600" />
                Report a Bug
              </>
            ) : (
              <>
                <Lightbulb className="h-5 w-5 text-blue-600" />
                Request a Feature
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {type === "bug" 
              ? "Help us improve by reporting issues you encounter. We capture technical details automatically to help us fix problems faster."
              : "Share your ideas to help us build a better product. Describe what you'd like to see and how it would help your workflow."
            }
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
            <h3 className="font-medium text-lg">Thank you!</h3>
            <p className="text-sm text-muted-foreground">
              Your bug report has been submitted and will be reviewed shortly.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={type === "bug" ? "default" : "outline"}
                  onClick={() => setType("bug")}
                  disabled={submitting}
                  className="flex-1"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Bug Report
                </Button>
                <Button
                  type="button"
                  variant={type === "feature" ? "default" : "outline"}
                  onClick={() => setType("feature")}
                  disabled={submitting}
                  className="flex-1"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Feature Request
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">{type === "bug" ? "What went wrong?" : "What would you like?"} *</Label>
              <Input
                id="title"
                placeholder={type === "bug" ? "Brief description of the issue" : "Brief description of the feature"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Tell us more *</Label>
              <Textarea
                id="description"
                placeholder={
                  type === "bug"
                    ? "What were you trying to do? What happened instead? What did you expect?"
                    : "How would this feature help you? What problem does it solve? How should it work?"
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                disabled={submitting}
              />
              {type === "bug" && (
                <p className="text-xs text-muted-foreground">
                  Technical details like browser info and console errors are captured automatically
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={category} 
                  onValueChange={setCategory}
                  disabled={submitting}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="content">Content Generation</SelectItem>
                    <SelectItem value="compensation">Compensation</SelectItem>
                    <SelectItem value="scans">Competitive Scans</SelectItem>
                    <SelectItem value="clients">Client Management</SelectItem>
                    <SelectItem value="leads">Lead Management</SelectItem>
                    <SelectItem value="ui">UI/Display</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="reporting">Reporting</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {type === "bug" && (
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select 
                    value={severity} 
                    onValueChange={setSeverity}
                    disabled={submitting}
                  >
                    <SelectTrigger id="severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Minor inconvenience</SelectItem>
                      <SelectItem value="medium">Medium - Affects work</SelectItem>
                      <SelectItem value="high">High - Blocks progress</SelectItem>
                      <SelectItem value="critical">Critical - System down</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !title.trim() || !description.trim()}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  type === "bug" ? "Submit Report" : "Submit Request"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
