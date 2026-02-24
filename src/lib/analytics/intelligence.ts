/**
 * Intelligence Layer — Sprint 4
 * Server-side computation helpers for MoM/YoY trends, churn risk scoring,
 * and health trajectory data. All functions are pure — no Prisma calls.
 * DB reads happen in server components / route handlers.
 */

// ─── Trend Chart Types ────────────────────────────────────────────────────────

export type MonthlyTrendPoint = {
  month: string;       // "Jan '25"
  monthKey: string;    // "2025-01" — for sorting / keying
  mrr: number;
  activeClients: number;
  newClients: number;
  churnedClients: number;
  avgHealthScore: number | null;
};

// ─── MoM Trend Computation ────────────────────────────────────────────────────

type ClientRow = {
  id: number;
  retainerAmount: number;
  status: string;
  onboardedAt: Date;
  churnedAt: Date | null;
  healthScore: number;
};

type ScanRow = {
  clientId: number;
  scanDate: Date;
  healthScore: number;
};

/**
 * Builds a monthly trend series covering the last `months` months.
 * Each point reflects the state *at the end of that month*.
 */
export function buildMonthlyTrend(
  clients: ClientRow[],
  scans: ScanRow[],
  months = 12
): MonthlyTrendPoint[] {
  const now = new Date();
  const points: MonthlyTrendPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    const monthLabel = monthStart.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });

    // Active clients at end of month
    const activeThisMonth = clients.filter((c) => {
      const onboarded = new Date(c.onboardedAt);
      if (onboarded > monthEnd) return false;
      if (c.churnedAt) {
        const churned = new Date(c.churnedAt);
        if (churned <= monthEnd) return false;
      }
      return true;
    });

    // New clients: onboarded within this month
    const newThisMonth = clients.filter((c) => {
      const onboarded = new Date(c.onboardedAt);
      return onboarded >= monthStart && onboarded <= monthEnd;
    });

    // Churned clients: churnedAt within this month
    const churnedThisMonth = clients.filter((c) => {
      if (!c.churnedAt) return false;
      const churned = new Date(c.churnedAt);
      return churned >= monthStart && churned <= monthEnd;
    });

    const mrr = activeThisMonth.reduce((sum, c) => sum + c.retainerAmount, 0);

    // Avg health score from scans in this month
    const monthScans = scans.filter((s) => {
      const d = new Date(s.scanDate);
      return d >= monthStart && d <= monthEnd;
    });
    const avgHealthScore =
      monthScans.length > 0
        ? monthScans.reduce((sum, s) => sum + s.healthScore, 0) / monthScans.length
        : null;

    points.push({
      month: monthLabel,
      monthKey,
      mrr,
      activeClients: activeThisMonth.length,
      newClients: newThisMonth.length,
      churnedClients: churnedThisMonth.length,
      avgHealthScore: avgHealthScore !== null ? Math.round(avgHealthScore) : null,
    });
  }

  return points;
}

// ─── Churn Risk Scoring ───────────────────────────────────────────────────────

export type ChurnRiskFactor =
  | "overdue_scan"
  | "payment_not_current"
  | "declining_health"
  | "no_recent_tasks";

export type ChurnRiskResult = {
  clientId: number;
  score: number;            // 0–100
  label: "low" | "medium" | "high" | "critical";
  factors: ChurnRiskFactor[];
};

export type ChurnInputClient = {
  id: number;
  lastScanAt: Date | null;
  paymentStatus: string;
  healthScore: number;
};

export type ChurnInputScan = {
  clientId: number;
  scanDate: Date;
  healthScore: number;
};

export type ChurnInputTask = {
  clientId: number;
  updatedAt: Date;
};

/**
 * Computes a 0–100 churn risk score for a single client.
 */
export function computeChurnRisk(
  client: ChurnInputClient,
  recentScans: ChurnInputScan[],
  recentTasks: ChurnInputTask[]
): ChurnRiskResult {
  const now = new Date();
  const factors: ChurnRiskFactor[] = [];
  let score = 0;

  // Factor 1: No scan in 30+ days (+25)
  const daysSinceScan = client.lastScanAt
    ? (now.getTime() - new Date(client.lastScanAt).getTime()) / 86400000
    : 999;
  if (daysSinceScan > 30) {
    score += 25;
    factors.push("overdue_scan");
  }

  // Factor 2: Payment not current (+30)
  if (client.paymentStatus !== "current") {
    score += 30;
    factors.push("payment_not_current");
  }

  // Factor 3: Declining health score trend (+25)
  const last2 = recentScans.slice(0, 2);
  const prev3 = recentScans.slice(2, 5);
  if (last2.length >= 2 && prev3.length >= 1) {
    const recentAvg = last2.reduce((s, r) => s + r.healthScore, 0) / last2.length;
    const prevAvg = prev3.reduce((s, r) => s + r.healthScore, 0) / prev3.length;
    if (prevAvg - recentAvg > 10) {
      score += 25;
      factors.push("declining_health");
    }
  }

  // Factor 4: No tasks updated in 30 days (+20)
  const hasRecentTask = recentTasks.some((t) => {
    const daysSince = (now.getTime() - new Date(t.updatedAt).getTime()) / 86400000;
    return daysSince <= 30;
  });
  if (!hasRecentTask) {
    score += 20;
    factors.push("no_recent_tasks");
  }

  score = Math.min(100, score);

  const label: ChurnRiskResult["label"] =
    score >= 75
      ? "critical"
      : score >= 50
      ? "high"
      : score >= 25
      ? "medium"
      : "low";

  return { clientId: client.id, score, label, factors };
}

// ─── Health Trajectory ────────────────────────────────────────────────────────

export type HealthPoint = {
  date: string;
  score: number;
};

/**
 * Returns the last `limit` health score points for a client, oldest-first.
 */
export function buildHealthTrajectory(
  scans: { scanDate: Date; healthScore: number }[],
  limit = 10
): HealthPoint[] {
  return scans
    .slice(0, limit)
    .reverse()
    .map((s) => ({
      date: new Date(s.scanDate).toISOString(),
      score: s.healthScore,
    }));
}

/**
 * Converts a HealthPoint array into a compact SVG path string for sparklines.
 * Returns null if fewer than 2 points.
 */
export function buildSparklinePath(
  points: HealthPoint[],
  width = 80,
  height = 24
): string | null {
  if (points.length < 2) return null;

  const scores = points.map((p) => p.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = maxScore - minScore || 1;

  const toX = (i: number) => (i / (points.length - 1)) * width;
  const toY = (score: number) =>
    height - ((score - minScore) / range) * (height - 4) - 2;

  const coords = points.map((p, i) => `${toX(i).toFixed(1)},${toY(p.score).toFixed(1)}`);
  return `M ${coords.join(" L ")}`;
}
