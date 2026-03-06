// src/app/api/intel/summary/route.ts
// Intelligence Engine — Sprint IE-06
// GET /api/intel/summary?tenantId=X
// Dashboard widget: scan count (30d), tasks generated, fleet health, next scan.

import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/prisma";

export interface IntelSummaryWidget {
  scansLast30d: number;
  tasksGeneratedLast30d: number;
  fleetHealthScore: number | null;
  nextScheduledScanAt: Date | null;
  activeAssetGroups: number;
  activeAssets: number;
  deadLetterCount: number;
  recentScanStatus: { complete: number; partial: number; failed: number };
  topSensorsByUsage: Array<{ sensorId: string; runCount: number }>;
}

export async function GET(req: NextRequest) {
  const permissionError = await withPermission(req, "view_all_clients");
  if (permissionError) return permissionError;

  const { searchParams } = new URL(req.url);
  const tenantId = Number(searchParams.get("tenantId"));
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [recentScans, activeGroups, activeAssets, nextScan, deadLetterCount] =
    await Promise.all([
      prisma.intelScan.findMany({
        where: { tenantId, createdAt: { gte: since30d } },
        select: { status: true, tasksGenerated: true, sensorsRun: true },
      }),
      prisma.intelAssetGroup.count({
        where: { tenantId, status: { not: "churned" } },
      }),
      prisma.intelAsset.count({ where: { tenantId, status: "active" } }),
      prisma.intelAsset.findFirst({
        where: { tenantId, status: "active", nextScanAt: { gte: new Date() } },
        orderBy: { nextScanAt: "asc" },
        select: { nextScanAt: true },
      }),
      prisma.intelScanDeadLetter.count({
        where: { tenantId, resolvedAt: null },
      }),
    ]);

  let scansComplete = 0, scansPartial = 0, scansFailed = 0, totalTasks = 0;
  const sensorUsage = new Map<string, number>();

  for (const scan of recentScans) {
    if (scan.status === "complete") scansComplete++;
    else if (scan.status === "partial") scansPartial++;
    else if (scan.status === "failed") scansFailed++;
    totalTasks += scan.tasksGenerated ?? 0;
    const sensors = scan.sensorsRun as string[] | null;
    if (Array.isArray(sensors)) {
      for (const s of sensors) sensorUsage.set(s, (sensorUsage.get(s) ?? 0) + 1);
    }
  }

  const groupHealthScores = await prisma.intelAssetGroup.findMany({
    where: { tenantId, status: { not: "churned" } },
    select: { healthScore: true },
  });
  const healthValues = groupHealthScores.map((g) => g.healthScore);
  const fleetHealthScore =
    healthValues.length > 0
      ? Math.round(healthValues.reduce((a, b) => a + b, 0) / healthValues.length)
      : null;

  const topSensorsByUsage = Array.from(sensorUsage.entries())
    .map(([sensorId, runCount]) => ({ sensorId, runCount }))
    .sort((a, b) => b.runCount - a.runCount)
    .slice(0, 5);

  const summary: IntelSummaryWidget = {
    scansLast30d: recentScans.length,
    tasksGeneratedLast30d: totalTasks,
    fleetHealthScore,
    nextScheduledScanAt: nextScan?.nextScanAt ?? null,
    activeAssetGroups: activeGroups,
    activeAssets,
    deadLetterCount,
    recentScanStatus: { complete: scansComplete, partial: scansPartial, failed: scansFailed },
    topSensorsByUsage,
  };

  return NextResponse.json({ success: true, data: summary });
}
