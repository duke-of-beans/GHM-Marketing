"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, Edit3, Rocket, Loader2 } from "lucide-react";
import { toast } from "sonner";
// ApprovalModal is mounted in WebsiteStudioTab and driven via onOpenApproval callback

const STAGE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  scaffolded: { label: "Scaffolded",  color: "text-muted-foreground",   icon: <Clock className="h-3 w-3" /> },
  composing:  { label: "Composing",   color: "text-blue-600",   icon: <Edit3 className="h-3 w-3" /> },
  review:     { label: "In Review",   color: "text-status-warning", icon: <Clock className="h-3 w-3" /> },
  approved:   { label: "Approved",    color: "text-status-success",icon: <CheckCircle2 className="h-3 w-3" /> },
  error:      { label: "Error",       color: "text-status-danger",    icon: <AlertCircle className="h-3 w-3" /> },
};

interface Props {
  clientId: number;
  jobs: any[];
  onOpenComposer: (jobId: number, pageId?: number) => void;
  onOpenApproval: (jobId: number) => void;
  onRefresh: () => void;
}

export function BuildQueue({ clientId, jobs, onOpenComposer, onOpenApproval, onRefresh }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Active Build Queue ({jobs.length})
      </p>
      <div className="rounded-lg border divide-y">
        {jobs.map((job) => {
          const cfg = STAGE_CONFIG[job.stage] ?? STAGE_CONFIG.scaffolded;
          const pagesNeedingWork = job.pages?.filter(
            (p: any) => p.scrvnrStatus === "failed" || p.reviewStatus === "changes_requested"
          ) ?? [];
          const nextPage = job.pages?.find(
            (p: any) => p.scrvnrStatus === "unprocessed" || p.scrvnrStatus === "failed"
          );

          return (
            <div key={job.id} className="flex items-center gap-4 px-4 py-3">
              {/* Property info */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {job.property?.brandSegment} · {job.property?.tier?.replace("tier", "T")}
                  </span>
                  <TierBadge tier={job.property?.tier} />
                </div>
                <p className="text-xs text-muted-foreground truncate">{job.property?.targetUrl}</p>
              </div>

              {/* Stage */}
              <div className={`flex items-center gap-1.5 text-xs ${cfg.color}`}>
                {cfg.icon}
                {cfg.label}
              </div>

              {/* Page progress */}
              <div className="text-xs text-muted-foreground text-right tabular-nums">
                <div>{job.pagesApproved ?? 0}/{job.pageCount ?? 0} approved</div>
                {pagesNeedingWork.length > 0 && (
                  <div className="text-status-danger">{pagesNeedingWork.length} need work</div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onOpenComposer(job.id, nextPage?.id)}
                >
                  Open
                </Button>
                {job.stage === "review" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-status-warning-border text-status-warning hover:bg-status-warning-bg"
                    onClick={() => onOpenApproval(job.id)}
                  >
                    Review Pages
                  </Button>
                )}
                {(job.pagesApproved ?? 0) > 0 &&
                  (job.pagesApproved ?? 0) === (job.pageCount ?? 0) &&
                  job.stage !== "live" && (
                    <DeployButton clientId={clientId} jobId={job.id} onDeployed={onRefresh} />
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    tier1: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    tier2: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    tier3: "bg-status-warning-bg text-status-warning",
  };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colors[tier] ?? ""}`}>
      {tier?.replace("tier", "T")}
    </span>
  );
}

function DeployButton({
  clientId,
  jobId,
  onDeployed,
}: {
  clientId: number;
  jobId: number;
  onDeployed: () => void;
}) {
  const [deploying, setDeploying] = useState(false);

  async function handleDeploy() {
    if (!confirm("Deploy this build? All pages are approved — this will push to production.")) return;
    setDeploying(true);
    try {
      const res = await fetch(`/api/website-studio/${clientId}/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success(`Deployed! ${json.data.deployUrl}`);
      onDeployed();
    } catch (err: any) {
      toast.error("Deploy failed: " + err.message);
    } finally {
      setDeploying(false);
    }
  }

  return (
    <Button
      size="sm"
      className="h-7 text-xs bg-status-success-bg hover:bg-status-success-bg text-white"
      onClick={handleDeploy}
      disabled={deploying}
    >
      {deploying ? (
        <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Deploying...</>
      ) : (
        <><Rocket className="h-3 w-3 mr-1" /> Deploy</>
      )}
    </Button>
  );
}
