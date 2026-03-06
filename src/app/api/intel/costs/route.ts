// src/app/api/intel/costs/route.ts
// Intelligence Engine — Sprint IE-06
// GET /api/intel/costs?tenantId=X&days=30&groupId=Y
// Per-sensor, per-scan, and per-asset-group API cost breakdown.

import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/prisma";

interface SensorCostBreakdown {
  sensorId: string;
  totalCost: number;
  scanCount: number;
  avgCostPerScan: number;
}

interface ScanCostEntry {
  scanId: number;
  assetGroupId: number | null;
  assetGroupName: string | null;
  completedAt: Date | null;
  status: string;
  totalCost: number;
  sensorBreakdown: Record<string, number>;
}

interface GroupCostBreakdown {
  assetGroupId: number;
  assetGroupName: string;
  totalCost: number;
  scanCount: number;
}

interface CostReport {
  tenantId: number;
  windowDays: number;
  windowStart: Date;
  totalCost: number;
  scanCount: number;
  bySensor: SensorCostBreakdown[];
  byScan: ScanCostEntry[];
  byGroup: GroupCostBreakdown[];
}

export async function GET(req: NextRequest) {
  const permissionError = await withPermission(req, "view_all_clients");
  if (permissionError) return permissionError;

  const { searchParams } = new URL(req.url);
  const tenantId = Number(searchParams.get("tenantId"));
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }

  const daysParam = parseInt(searchParams.get("days") ?? "30", 10);
  const days = Math.min(Math.max(daysParam, 1), 90);
  const groupIdParam = searchParams.get("groupId");
  const groupId = groupIdParam ? parseInt(groupIdParam, 10) : null;

  const windowStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const scans = await prisma.intelScan.findMany({
    where: {
      tenantId,
      createdAt: { gte: windowStart },
      ...(groupId ? { assetGroupId: groupId } : {}),
    },
    select: {
      id: true,
      assetGroupId: true,
      completedAt: true,
      status: true,
      apiCosts: true,
      assetGroup: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const sensorTotals = new Map<string, { cost: number; count: number }>();
  const groupTotals = new Map<number, { name: string; cost: number; count: number }>();
  const scanEntries: ScanCostEntry[] = [];
  let totalCost = 0;

  for (const scan of scans) {
    const costs = (scan.apiCosts ?? {}) as Record<string, number>;
    const scanTotal = Object.values(costs).reduce((a, b) => a + b, 0);
    totalCost += scanTotal;

    scanEntries.push({
      scanId: scan.id,
      assetGroupId: scan.assetGroupId,
      assetGroupName: scan.assetGroup?.name ?? null,
      completedAt: scan.completedAt,
      status: scan.status,
      totalCost: Math.round(scanTotal * 100) / 100,
      sensorBreakdown: costs,
    });

    for (const [sensorId, cost] of Object.entries(costs)) {
      const e = sensorTotals.get(sensorId) ?? { cost: 0, count: 0 };
      sensorTotals.set(sensorId, { cost: e.cost + cost, count: e.count + 1 });
    }

    if (scan.assetGroupId) {
      const e = groupTotals.get(scan.assetGroupId) ?? {
        name: scan.assetGroup?.name ?? `Group ${scan.assetGroupId}`,
        cost: 0,
        count: 0,
      };
      groupTotals.set(scan.assetGroupId, {
        ...e,
        cost: e.cost + scanTotal,
        count: e.count + 1,
      });
    }
  }

  const bySensor: SensorCostBreakdown[] = Array.from(sensorTotals.entries())
    .map(([sensorId, { cost, count }]) => ({
      sensorId,
      totalCost: Math.round(cost * 100) / 100,
      scanCount: count,
      avgCostPerScan: count > 0 ? Math.round((cost / count) * 100) / 100 : 0,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);

  const byGroup: GroupCostBreakdown[] = Array.from(groupTotals.entries())
    .map(([assetGroupId, { name, cost, count }]) => ({
      assetGroupId,
      assetGroupName: name,
      totalCost: Math.round(cost * 100) / 100,
      scanCount: count,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);

  const report: CostReport = {
    tenantId,
    windowDays: days,
    windowStart,
    totalCost: Math.round(totalCost * 100) / 100,
    scanCount: scans.length,
    bySensor,
    byScan: scanEntries.slice(0, 100),
    byGroup,
  };

  return NextResponse.json({ success: true, data: report });
}
