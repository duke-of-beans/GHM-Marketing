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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RotateCcw, Clock } from "lucide-react";
import { toast } from "sonner";

interface Version {
  id: number;
  versionNumber: number;
  title: string | null;
  content: string;
  keywords: string[];
  changeNote: string | null;
  createdAt: string;
  createdBy: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: number;
  currentVersion: number;
  onRestore?: () => void;
}

export function VersionHistoryDialog({
  open,
  onOpenChange,
  contentId,
  currentVersion,
  onRestore,
}: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      loadVersions();
    }
  }, [open, contentId]);

  async function loadVersions() {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/${contentId}/versions`);
      if (!res.ok) throw new Error("Failed to load versions");
      const data = await res.json();
      setVersions(data.versions);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load version history");
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(versionId: number, versionNumber: number) {
    if (!confirm(`Restore to version ${versionNumber}? Current content will be saved as a new version.`)) {
      return;
    }

    setRestoring(versionId);
    try {
      const res = await fetch(`/api/content/${contentId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });

      if (!res.ok) throw new Error("Failed to restore version");

      toast.success(`Restored to version ${versionNumber}`);
      onRestore?.();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to restore version");
    } finally {
      setRestoring(null);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Version History
          </DialogTitle>
          <DialogDescription>
            View and restore previous versions of this content
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {versions.map((version) => {
                const isCurrent = version.versionNumber === currentVersion;
                
                return (
                  <div
                    key={version.id}
                    className={`border rounded-lg p-4 space-y-2 ${
                      isCurrent ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant={isCurrent ? "default" : "outline"}>
                            Version {version.versionNumber}
                          </Badge>
                          {isCurrent && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        {version.title && (
                          <h4 className="font-medium text-sm mt-2">{version.title}</h4>
                        )}
                        {version.changeNote && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {version.changeNote}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(version.createdAt)}
                        </p>
                      </div>
                      {!isCurrent && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(version.id, version.versionNumber)}
                          disabled={restoring !== null}
                          className="shrink-0"
                        >
                          {restoring === version.id ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Restoring...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Restore
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Content preview */}
                    <div className="mt-3 p-3 bg-muted/50 rounded text-xs">
                      <p className="line-clamp-3 text-muted-foreground">
                        {version.content.substring(0, 200)}
                        {version.content.length > 200 && "..."}
                      </p>
                    </div>

                    {/* Keywords */}
                    {version.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {version.keywords.slice(0, 5).map((kw, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {kw}
                          </Badge>
                        ))}
                        {version.keywords.length > 5 && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            +{version.keywords.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {versions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No version history yet</p>
                  <p className="text-xs mt-1">
                    Versions are created automatically when you edit content
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
