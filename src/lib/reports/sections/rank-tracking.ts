import { prisma } from "@/lib/db";

export interface RankTrackingSection {
  hasData: boolean;
  summary: {
    totalKeywords: number;
    inTop3: number;
    inLocalPack: number;
    avgPosition: number | null;
    lastScanDate: Date | null;
  };
  movers: {
    gainers: Array<{ keyword: string; category: string | null; organicPosition: number | null; delta: number }>;
    losers: Array<{ keyword: string; category: string | null; organicPosition: number | null; delta: number }>;
  };
  localPack: Array<{ keyword: string; localPackPosition: number | null }>;
  newKeywords: Array<{ keyword: string; organicPosition: number | null; localPackPosition: number | null }>;
}

export async function generateRankTrackingSection(
  clientId: number,
  _periodStart: Date,
  periodEnd: Date
): Promise<RankTrackingSection> {
  const empty: RankTrackingSection = {
    hasData: false,
    summary: { totalKeywords: 0, inTop3: 0, inLocalPack: 0, avgPosition: null, lastScanDate: null },
    movers: { gainers: [], losers: [] },
    localPack: [],
    newKeywords: [],
  };

  const keywords = await prisma.keywordTracker.findMany({
    where: { clientId, isActive: true },
    select: { id: true, keyword: true, category: true },
  });

  if (keywords.length === 0) return empty;

  const keywordIds = keywords.map((k) => k.id);
  const keywordMeta = new Map(keywords.map((k) => [k.id, k]));

  // Most recent snapshot per keyword at or before period end
  const latestSnapshots = await prisma.rankSnapshot.findMany({
    where: { keywordId: { in: keywordIds }, scanDate: { lte: periodEnd } },
    orderBy: { scanDate: "desc" },
    distinct: ["keywordId"],
  });

  if (latestSnapshots.length === 0) return empty;

  // Previous snapshot per keyword (using previousOrganic stored on snapshot)
  const inTop3 = latestSnapshots.filter((s) => s.organicPosition !== null && s.organicPosition <= 3).length;
  const inLocalPack = latestSnapshots.filter((s) => s.localPackPosition !== null).length;
  const positions = latestSnapshots.map((s) => s.organicPosition).filter((p): p is number => p !== null);
  const avgPosition = positions.length > 0
    ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length)
    : null;

  const movers: RankTrackingSection["movers"] = { gainers: [], losers: [] };
  const newKeywords: RankTrackingSection["newKeywords"] = [];

  for (const s of latestSnapshots) {
    const meta = keywordMeta.get(s.keywordId);
    if (!meta) continue;

    if (s.previousOrganic === null) {
      newKeywords.push({ keyword: meta.keyword, organicPosition: s.organicPosition, localPackPosition: s.localPackPosition });
      continue;
    }

    if (s.organicPosition !== null && s.previousOrganic !== null) {
      const delta = s.previousOrganic - s.organicPosition; // positive = moved up = better
      if (delta >= 3) movers.gainers.push({ keyword: meta.keyword, category: meta.category, organicPosition: s.organicPosition, delta });
      else if (delta <= -3) movers.losers.push({ keyword: meta.keyword, category: meta.category, organicPosition: s.organicPosition, delta: Math.abs(delta) });
    }
  }

  movers.gainers.sort((a, b) => b.delta - a.delta);
  movers.losers.sort((a, b) => b.delta - a.delta);

  const localPack = latestSnapshots
    .filter((s) => s.localPackPosition !== null)
    .map((s) => ({ keyword: keywordMeta.get(s.keywordId)?.keyword ?? "", localPackPosition: s.localPackPosition }))
    .sort((a, b) => (a.localPackPosition ?? 99) - (b.localPackPosition ?? 99));

  return {
    hasData: true,
    summary: { totalKeywords: keywords.length, inTop3, inLocalPack, avgPosition, lastScanDate: latestSnapshots[0]?.scanDate ?? null },
    movers: { gainers: movers.gainers.slice(0, 5), losers: movers.losers.slice(0, 5) },
    localPack: localPack.slice(0, 10),
    newKeywords: newKeywords.slice(0, 5),
  };
}
