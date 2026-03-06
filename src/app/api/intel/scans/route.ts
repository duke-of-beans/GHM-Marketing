// src/app/api/intel/scans/route.ts
// POST /api/intel/scans — trigger a manual scan (admin only)
// GET  /api/intel/scans — list scans for tenant

import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/prisma";
import { executeScan } from "@/lib/intel/scan-orchestrator";

// ── POST — trigger manual scan ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const body = await request.json() as {
      tenantId?: number;
      assetGroupId?: number;
    };
    const { tenantId, assetGroupId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "tenantId is required" },
        { status: 400 }
      );
    }

    // Fire the scan — orchestrator never throws
    const summary = await executeScan(Number(tenantId), assetGroupId ? Number(assetGroupId) : undefined);

    return NextResponse.json({ success: true, data: summary }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ── GET — list scans for tenant ───────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const permissionError = await withPermission(request, "view_all_clients");
  if (permissionError) return permissionError;

  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const tenantId = Number(params.tenantId);
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "tenantId is required" },
        { status: 400 }
      );
    }

    const limit = Math.min(Number(params.limit ?? 50), 200);
    const offset = Number(params.offset ?? 0);
    const status = params.status as string | undefined;
    const assetGroupId = params.assetGroupId ? Number(params.assetGroupId) : undefined;

    const where = {
      tenantId,
      ...(status ? { status } : {}),
      ...(assetGroupId ? { assetGroupId } : {}),
    };

    const [scans, total] = await Promise.all([
      prisma.intelScan.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          assetGroup: { select: { id: true, name: true, type: true } },
        },
      }),
      prisma.intelScan.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: scans,
      pagination: { total, limit, offset },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
