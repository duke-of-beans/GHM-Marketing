/**
 * processCompetitiveIntel
 *
 * Takes the most recent CompetitiveScan and produces a PanelIntel object
 * for each Content Studio panel. Pure function — no side effects.
 *
 * Panel mapping:
 *   strategy  → total critical + warning alert count
 *   blog      → lost + declined keyword rankings (need new/refreshed content)
 *   social    → worst review gap across all competitors
 *   meta      → declined keyword count (pages with slipping on-page signals)
 *   ppc       → domain rating gap to top competitor (authority backdrop for paid)
 */

import type { PanelIntel, IntelLevel } from "@/components/content/CompetitiveIntelBadge";

// ---- Scan shape we receive from /api/clients/[id]/scans ----
interface ScanAlert {
  message: string;
  metric: string;
  competitor?: string;
  keyword?: string;
  actionable: boolean;
}

interface ScanAlerts {
  critical: ScanAlert[];
  warning: ScanAlert[];
  info: ScanAlert[];
}

interface CompetitorGap {
  client: number;
  competitor: number;
  gap: number;
}

interface ScanDeltas {
  vs_previous?: {
    domainRating?: { old: number; new: number; delta: number; percentChange: number };
    reviewCount?: { old: number; new: number; delta: number; percentChange: number };
    [key: string]: unknown;
  } | null;
  vs_competitors: Record<string, {
    domainRating: CompetitorGap;
    reviewCount: CompetitorGap;
    reviewAvg: CompetitorGap;
    backlinks: CompetitorGap;
    [key: string]: CompetitorGap | unknown;
  }>;
  position_changes?: {
    improved: string[];
    declined: string[];
    new_rankings: string[];
    lost_rankings: string[];
  };
}

export interface LatestScan {
  id: number;
  scanDate: string;
  healthScore: number;
  alerts: ScanAlerts;
  deltas: ScanDeltas;
}

export interface PanelIntelMap {
  strategy: PanelIntel;
  blog: PanelIntel;
  social: PanelIntel;
  meta: PanelIntel;
  ppc: PanelIntel;
}

// ---- Helpers ----

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

/** Convert a 0-1 urgency ratio to filled segments (0–5) */
function urgencyToSegments(urgencyRatio: number): number {
  return clamp(Math.round(urgencyRatio * 5), 0, 5);
}

function levelFromRatio(ratio: number): IntelLevel {
  if (ratio >= 0.7) return "urgent";
  if (ratio >= 0.35) return "moderate";
  if (ratio > 0) return "good";
  return "none";
}

// ---- Panel processors ----

function strategyIntel(alerts: ScanAlerts): PanelIntel {
  const critical = alerts.critical.length;
  const warning = alerts.warning.length;
  const total = critical + warning;

  if (total === 0) {
    return {
      level: "good",
      label: "No gaps",
      filledSegments: 0,
      details: [
        "✓ No critical or warning competitive gaps detected.",
        "You're in a strong position across all tracked metrics.",
      ],
    };
  }

  const urgency = clamp(total / 10, 0, 1); // 10+ issues = max urgency
  return {
    level: levelFromRatio(urgency),
    label: total === 1 ? "1 gap" : `${total} gaps`,
    filledSegments: urgencyToSegments(urgency),
    details: [
      `${critical} critical issue${critical !== 1 ? "s" : ""}, ${warning} warning${warning !== 1 ? "s" : ""}`,
      critical > 0
        ? `🔴 Most urgent: ${alerts.critical[0]?.message ?? "see scan details"}`
        : `⚠️ Biggest concern: ${alerts.warning[0]?.message ?? "see scan details"}`,
      "Use Content Strategy to build a plan that addresses these gaps first.",
    ],
  };
}

function blogIntel(deltas: ScanDeltas): PanelIntel {
  const pos = deltas.position_changes;
  const lost = pos?.lost_rankings?.length ?? 0;
  const declined = pos?.declined?.length ?? 0;
  const total = lost + declined;

  if (total === 0) {
    return {
      level: "good",
      label: "Rankings solid",
      filledSegments: 0,
      details: [
        "✓ No lost or declining keyword rankings.",
        "Consider creating new content to expand into untargeted terms.",
      ],
    };
  }

  const urgency = clamp(total / 15, 0, 1); // 15+ = max urgency
  const parts: string[] = [];
  if (lost > 0) parts.push(`${lost} lost`);
  if (declined > 0) parts.push(`${declined} slipping`);

  return {
    level: levelFromRatio(urgency),
    label: `${total} keyword${total !== 1 ? "s" : ""} to recover`,
    filledSegments: urgencyToSegments(urgency),
    details: [
      `${lost} keyword${lost !== 1 ? "s" : ""} lost entirely, ${declined} declining in position.`,
      lost > 0
        ? `Recently lost: ${pos!.lost_rankings.slice(0, 3).join(", ")}${lost > 3 ? ` +${lost - 3} more` : ""}`
        : `Slipping: ${pos!.declined.slice(0, 3).join(", ")}${declined > 3 ? ` +${declined - 3} more` : ""}`,
      "Write or refresh blog content targeting these keywords to reclaim positions.",
    ],
  };
}

function socialIntel(deltas: ScanDeltas): PanelIntel {
  const competitors = Object.entries(deltas.vs_competitors);
  if (competitors.length === 0) {
    return {
      level: "none",
      label: "No data yet",
      filledSegments: 0,
      details: ["Run a competitive scan to see review gap data."],
    };
  }

  // Find worst review gap (highest positive gap = most behind)
  const worstReviewGap = Math.max(
    ...competitors.map(([, c]) => c.reviewCount.gap)
  );
  const worstCompetitor = competitors.find(
    ([, c]) => c.reviewCount.gap === worstReviewGap
  );
  const competitorName = worstCompetitor?.[0] ?? "top competitor";

  if (worstReviewGap <= 0) {
    return {
      level: "good",
      label: "Ahead on reviews",
      filledSegments: 0,
      details: [
        "✓ Client leads all tracked competitors in review count.",
        "Keep the review generation program running to maintain the lead.",
      ],
    };
  }

  const urgency = clamp(worstReviewGap / 300, 0, 1); // 300+ reviews behind = max urgency
  return {
    level: levelFromRatio(urgency),
    label: `${worstReviewGap} reviews behind`,
    filledSegments: urgencyToSegments(urgency),
    details: [
      `${worstReviewGap} reviews behind ${competitorName}.`,
      worstCompetitor
        ? `Client: ${worstCompetitor[1].reviewCount.client} reviews · ${competitorName}: ${worstCompetitor[1].reviewCount.competitor}`
        : "",
      "Use social content and post-service automations to close the review gap.",
    ].filter(Boolean) as string[],
  };
}

function metaIntel(deltas: ScanDeltas): PanelIntel {
  const declined = deltas.position_changes?.declined?.length ?? 0;
  const lost = deltas.position_changes?.lost_rankings?.length ?? 0;
  // Meta work = pages where keywords are slipping (indicates stale on-page copy)
  const affected = declined + Math.ceil(lost / 2); // lost rankings partially attributed to meta

  if (affected === 0) {
    return {
      level: "good",
      label: "Metas healthy",
      filledSegments: 0,
      details: [
        "✓ No declining keywords indicate on-page copy issues.",
        "Review meta descriptions periodically even when rankings are stable.",
      ],
    };
  }

  const urgency = clamp(affected / 12, 0, 1);
  return {
    level: levelFromRatio(urgency),
    label: `${affected} page${affected !== 1 ? "s" : ""} need attention`,
    filledSegments: urgencyToSegments(urgency),
    details: [
      `${declined} keyword${declined !== 1 ? "s" : ""} declining — stale meta descriptions may be contributing.`,
      "Refresh meta titles and descriptions for pages with slipping rankings.",
      "Focus on pages that dropped 3–10 positions first — easiest wins.",
    ],
  };
}

function ppcIntel(deltas: ScanDeltas): PanelIntel {
  const competitors = Object.entries(deltas.vs_competitors);
  if (competitors.length === 0) {
    return {
      level: "none",
      label: "No data yet",
      filledSegments: 0,
      details: ["Run a competitive scan to see domain authority gap data."],
    };
  }

  const worstDRGap = Math.max(...competitors.map(([, c]) => c.domainRating.gap));
  const worstCompetitor = competitors.find(
    ([, c]) => c.domainRating.gap === worstDRGap
  );
  const competitorName = worstCompetitor?.[0] ?? "top competitor";
  const clientDR = worstCompetitor?.[1].domainRating.client ?? 0;
  const competitorDR = worstCompetitor?.[1].domainRating.competitor ?? 0;

  if (worstDRGap <= 0) {
    return {
      level: "good",
      label: "Authority advantage",
      filledSegments: 0,
      details: [
        "✓ Client has equal or higher domain authority than all tracked competitors.",
        "Strong authority position improves Quality Score and lowers CPC.",
      ],
    };
  }

  const urgency = clamp(worstDRGap / 40, 0, 1); // DR 40+ gap = max urgency
  return {
    level: levelFromRatio(urgency),
    label: `DR gap +${worstDRGap} to ${competitorName}`,
    filledSegments: urgencyToSegments(urgency),
    details: [
      `Client DR: ${clientDR} · ${competitorName} DR: ${competitorDR} (gap: ${worstDRGap})`,
      "Lower domain authority means higher CPCs and lower Quality Scores in paid search.",
      "Run ads targeting branded + long-tail terms while DR gap closes.",
    ],
  };
}

// ---- Main export ----

export function processCompetitiveIntel(scan: LatestScan): PanelIntelMap {
  return {
    strategy: strategyIntel(scan.alerts),
    blog: blogIntel(scan.deltas),
    social: socialIntel(scan.deltas),
    meta: metaIntel(scan.deltas),
    ppc: ppcIntel(scan.deltas),
  };
}
