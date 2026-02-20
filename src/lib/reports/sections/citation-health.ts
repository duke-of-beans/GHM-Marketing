import { prisma } from "@/lib/db";

export interface CitationHealthSection {
  hasData: boolean;
  score: number | null;
  scoreDelta: number | null;
  summary: {
    totalChecked: number;
    matches: number;
    mismatches: number;
    missing: number;
  };
  criticalIssues: Array<{
    directory: string;
    status: string;
    issues: string[];
  }>;
  scanDate: Date | null;
}

export async function generateCitationHealthSection(
  clientId: number,
  _periodStart: Date,
  periodEnd: Date
): Promise<CitationHealthSection> {
  const empty: CitationHealthSection = {
    hasData: false,
    score: null,
    scoreDelta: null,
    summary: { totalChecked: 0, matches: 0, mismatches: 0, missing: 0 },
    criticalIssues: [],
    scanDate: null,
  };

  // Most recent scan in or before the period
  const latest = await prisma.citationScan.findFirst({
    where: { clientId, scanDate: { lte: periodEnd } },
    orderBy: { scanDate: "desc" },
  });

  if (!latest) return empty;

  // Previous scan for delta
  const previous = await prisma.citationScan.findFirst({
    where: { clientId, scanDate: { lt: latest.scanDate } },
    orderBy: { scanDate: "desc" },
  });

  const scoreDelta = previous ? latest.healthScore - previous.healthScore : null;

  // Extract critical issues from results JSON
  const results = (latest.results as any[]) ?? [];
  const criticalIssues = results
    .filter((r) => r.status === "mismatch" && (r.importance === "critical" || r.importance === "high"))
    .map((r) => ({
      directory: r.directoryKey ?? r.displayName ?? "Unknown",
      status: r.status,
      issues: (r.details ?? []) as string[],
    }))
    .slice(0, 5);

  return {
    hasData: true,
    score: latest.healthScore,
    scoreDelta,
    summary: {
      totalChecked: latest.totalChecked,
      matches: latest.matches,
      mismatches: latest.mismatches,
      missing: latest.missing,
    },
    criticalIssues,
    scanDate: latest.scanDate,
  };
}
