// src/app/api/intel/assets/[id]/snapshots/route.ts
// GET /api/intel/assets/[id]/snapshots — snapshot history for charting

import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const permissionError = await withPermission(request, "view_all_clients");
  if (permissionError) return permissionError;

  try {
    const { id: idStr } = await params;
    const assetId = Number(idStr);
    if (!assetId || isNaN(assetId)) {
      return NextResponse.json(
        { success: false, error: "Invalid asset id" },
        { status: 400 }
      );
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const limit = Math.min(Number(searchParams.limit ?? 90), 365);
    const metricKeys = searchParams.metrics
      ? (searchParams.metrics as string).split(",")
      : null;

    const snapshots = await prisma.intelSnapshot.findMany({
      where: { assetId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        scan: { select: { id: true, status: true, completedAt: true } },
      },
    });

    // If caller requested specific metric keys, project the metrics JSON
    const data = snapshots.map((s) => ({
      id: s.id,
      scanId: s.scanId,
      createdAt: s.createdAt,
      scan: s.scan,
      metrics: metricKeys
        ? Object.fromEntries(
            metricKeys
              .filter((k) => k in (s.metrics as Record<string, unknown>))
              .map((k) => [k, (s.metrics as Record<string, unknown>)[k]])
          )
        : s.metrics,
      deltas: s.deltas,
      velocity: s.velocity,
      alerts: s.alerts,
    }));

    return NextResponse.json({
      success: true,
      data: data.reverse(), // Chronological order for charting
      meta: { assetId, count: data.length },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
