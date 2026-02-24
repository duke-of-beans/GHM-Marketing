import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import {
  computeChurnRisk,
  type ChurnRiskResult,
} from "@/lib/analytics/intelligence";

/**
 * GET /api/clients/churn-risk
 * Returns churn risk scores for all active clients.
 * Admin/master only.
 */
export async function GET(req: NextRequest) {
  const permError = await withPermission(req, "view_analytics");
  if (permError) return permError;

  const [clients, scans, tasks] = await Promise.all([
    prisma.clientProfile.findMany({
      where: { status: "active" },
      select: {
        id: true,
        lastScanAt: true,
        paymentStatus: true,
        healthScore: true,
      },
    }),
    prisma.competitiveScan.findMany({
      select: { clientId: true, scanDate: true, healthScore: true },
      orderBy: { scanDate: "desc" },
      take: 5000,
    }),
    prisma.clientTask.findMany({
      where: { status: { not: "done" } },
      select: { clientId: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const scansByClient = new Map<number, typeof scans>();
  for (const scan of scans) {
    const arr = scansByClient.get(scan.clientId) ?? [];
    arr.push(scan);
    scansByClient.set(scan.clientId, arr);
  }

  const tasksByClient = new Map<number, typeof tasks>();
  for (const task of tasks) {
    const arr = tasksByClient.get(task.clientId) ?? [];
    arr.push(task);
    tasksByClient.set(task.clientId, arr);
  }

  const results: ChurnRiskResult[] = clients.map((c) => {
    const clientScans = scansByClient.get(c.id) ?? [];
    const clientTasks = tasksByClient.get(c.id) ?? [];
    return computeChurnRisk(
      { id: c.id, lastScanAt: c.lastScanAt, paymentStatus: c.paymentStatus, healthScore: c.healthScore },
      clientScans,
      clientTasks
    );
  });

  return NextResponse.json({ success: true, data: results });
}
