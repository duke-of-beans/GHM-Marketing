"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LEAD_STATUS_CONFIG, ACTIVE_STATUSES } from "@/types";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "@prisma/client";

type FunnelStat = {
  status: LeadStatus;
  count: number;
  totalValue: number;
  totalMRR: number;
};

type PipelineFunnelProps = {
  stats: FunnelStat[];
};

export function PipelineFunnel({ stats }: PipelineFunnelProps) {
  const maxCount = Math.max(...stats.map((s) => s.count), 1);

  const activeStats = ACTIVE_STATUSES.map((status) => {
    const stat = stats.find((s) => s.status === status);
    return {
      status,
      config: LEAD_STATUS_CONFIG[status],
      count: stat?.count ?? 0,
      totalValue: stat?.totalValue ?? 0,
      totalMRR: stat?.totalMRR ?? 0,
    };
  });

  const wonStat = stats.find((s) => s.status === "won");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Pipeline</CardTitle>
          {wonStat && wonStat.count > 0 && (
            <span className="text-sm font-semibold text-status-success">
              {wonStat.count} Won · ${wonStat.totalValue.toLocaleString()}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeStats.map((stage) => (
          <div key={stage.status} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className={cn("font-medium", stage.config.color)}>
                {stage.config.label}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {stage.count} leads
                {stage.totalValue > 0 && (
                  <span className="ml-2 font-medium text-foreground">
                    ${stage.totalValue.toLocaleString()}
                  </span>
                )}
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", stage.config.bgColor)}
                style={{
                  width: `${Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 4 : 0)}%`,
                  backgroundColor:
                    stage.status === "available" ? "#3b82f6" :
                    stage.status === "scheduled" ? "#eab308" :
                    stage.status === "contacted" ? "#8b5cf6" :
                    stage.status === "follow_up" ? "#f97316" :
                    "#6366f1",
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
