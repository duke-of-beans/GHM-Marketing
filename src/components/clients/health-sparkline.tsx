"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { HealthPoint } from "@/lib/analytics/intelligence";

type SparklineProps = {
  points?: HealthPoint[];
  sparklinePath: string | null;
  delta?: number | null;
  width?: number;
  height?: number;
};

/**
 * Inline SVG sparkline for health score trajectory.
 * Used on client portfolio cards (small, no axes).
 */
export function HealthSparkline({
  points,
  sparklinePath,
  delta: deltaProp,
  width = 80,
  height = 24,
}: SparklineProps) {
  if (!sparklinePath) return null;
  if (points && points.length < 2 && deltaProp == null) return null;

  const first = points?.[0];
  const last = points?.[points.length - 1];
  const delta = deltaProp ?? (first && last ? last.score - first.score : 0);
  const color = delta >= 0 ? "#10b981" : "#ef4444";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 cursor-help">
          <svg width={width} height={height} className="overflow-visible">
            <path
              d={sparklinePath}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={`text-[10px] font-medium ${delta >= 0 ? "text-green-600" : "text-red-600"}`}>
            {delta >= 0 ? "+" : ""}{delta}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[180px]">
        <p className="text-xs font-semibold mb-1">Health Trajectory</p>
        <p className="text-xs text-muted-foreground">
          {points && first && last
            ? `${points.length} scans · ${first.score} → ${last.score}${delta !== 0 ? ` (${delta >= 0 ? "+" : ""}${delta} pts)` : ""}`
            : `${delta >= 0 ? "+" : ""}${delta} pts over recent scans`}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Full recharts LineChart for the client detail page health trajectory.
 */
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
} from "recharts";

type FullChartProps = {
  points: HealthPoint[];
  className?: string;
};

export function HealthTrajectoryChart({ points, className }: FullChartProps) {
  if (points.length === 0) {
    return (
      <div className={`flex items-center justify-center text-muted-foreground text-sm py-8 ${className ?? ""}`}>
        No scan history yet — health scores appear after the first competitive scan runs.
      </div>
    );
  }

  const data = points.map((p) => ({
    date: new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: p.score,
  }));

  return (
    <ResponsiveContainer width="100%" height={200} className={className}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <RechartTooltip
          formatter={(v: number | undefined) => [`${v ?? "—"}/100`, "Health Score"]}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Health Score"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
