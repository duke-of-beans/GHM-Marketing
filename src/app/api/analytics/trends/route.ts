import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import {
  buildMonthlyTrend,
  buildHealthTrajectory,
  buildSparklinePath,
} from "@/lib/analytics/intelligence";

/**
 * GET /api/analytics/trends
 * Returns MoM trend data for the intelligence charts on /analytics.
 */
export async function GET(req: NextRequest) {
  const permError = await withPermission(req, "view_analytics");
  if (permError) return permError;

  const [clients, scans] = await Promise.all([
    prisma.clientProfile.findMany({
      select: {
        id: true,
        retainerAmount: true,
        status: true,
        onboardedAt: true,
        churnedAt: true,
        healthScore: true,
      },
    }),
    prisma.competitiveScan.findMany({
      select: { clientId: true, scanDate: true, healthScore: true },
      orderBy: { scanDate: "desc" },
      take: 2000,
    }),
  ]);

  const clientRows = clients.map((c) => ({
    id: c.id,
    retainerAmount: Number(c.retainerAmount),
    status: c.status,
    onboardedAt: c.onboardedAt,
    churnedAt: c.churnedAt,
    healthScore: c.healthScore,
  }));

  const scanRows = scans.map((s) => ({
    clientId: s.clientId,
    scanDate: s.scanDate,
    healthScore: s.healthScore,
  }));

  const trend12 = buildMonthlyTrend(clientRows, scanRows, 12);
  const trend24 = buildMonthlyTrend(clientRows, scanRows, 24);

  // Per-client health trajectories (last 10 scans each)
  const scansByClient = new Map<number, typeof scanRows>();
  for (const scan of scanRows) {
    const existing = scansByClient.get(scan.clientId) ?? [];
    if (existing.length < 10) {
      existing.push(scan);
      scansByClient.set(scan.clientId, existing);
    }
  }

  const healthTrajectories = clients.map((c) => {
    const clientScans = scansByClient.get(c.id) ?? [];
    const trajectory = buildHealthTrajectory(clientScans, 10);
    const sparklinePath = buildSparklinePath(trajectory);
    return { clientId: c.id, trajectory, sparklinePath };
  });

  return NextResponse.json({
    success: true,
    data: { trend12, trend24, healthTrajectories },
  });
}
