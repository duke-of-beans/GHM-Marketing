"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ChurnRiskLevel = "low" | "medium" | "high" | "critical";

type Props = {
  level: ChurnRiskLevel;
  score: number;
  factors: string[];
};

const CONFIG: Record<ChurnRiskLevel, { label: string; className: string; dot: string }> = {
  low:      { label: "Low Risk",      className: "bg-green-100 text-green-800 border-green-200",   dot: "bg-green-500" },
  medium:   { label: "Watch",         className: "bg-yellow-100 text-yellow-800 border-yellow-200", dot: "bg-yellow-500" },
  high:     { label: "At Risk",       className: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-500" },
  critical: { label: "Churn Risk",    className: "bg-red-100 text-red-800 border-red-200",          dot: "bg-red-500" },
};

const FACTOR_LABELS: Record<string, string> = {
  overdue_scan:       "No scan in 30+ days",
  payment_not_current: "Payment not current",
  declining_health:   "Health score declining",
  no_recent_tasks:    "No task activity in 30 days",
};

export function ChurnRiskBadge({ level, score, factors }: Props) {
  if (level === "low") return null; // Low risk is the baseline — don't clutter the card

  const cfg = CONFIG[level];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border cursor-help ${cfg.className}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px]">
        <p className="text-xs font-semibold mb-1">Churn Risk Score: {score}/100</p>
        <ul className="text-xs space-y-0.5 text-muted-foreground">
          {factors.map((f) => (
            <li key={f}>· {FACTOR_LABELS[f] ?? f}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Compute churn risk client-side from data already on the ClientItem.
 * Mirrors the server lib logic — no extra fetch needed for portfolio display.
 */
export function computeClientChurnRisk(client: {
  lastScanAt: string | null;
  paymentStatus: string | null;
  healthScore: number;
  tasks: { id: number }[];
}): { level: ChurnRiskLevel; score: number; factors: string[] } {
  const now = Date.now();
  const factors: string[] = [];
  let score = 0;

  const daysSinceScan = client.lastScanAt
    ? (now - new Date(client.lastScanAt).getTime()) / 86400000
    : 999;
  if (daysSinceScan > 30) { score += 25; factors.push("overdue_scan"); }

  if (client.paymentStatus && client.paymentStatus !== "current") {
    score += 30;
    factors.push("payment_not_current");
  }

  // We don't have per-client scan history here so skip declining_health on cards
  // (it's computed properly server-side in /api/clients/churn-risk)

  if (client.tasks.length === 0) {
    score += 20;
    factors.push("no_recent_tasks");
  }

  score = Math.min(100, score);

  const level: ChurnRiskLevel =
    score >= 75 ? "critical"
    : score >= 50 ? "high"
    : score >= 25 ? "medium"
    : "low";

  return { level, score, factors };
}
