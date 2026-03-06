// src/app/api/intel/scans/[scanId]/route.ts
// GET /api/intel/scans/[scanId] — full scan detail with snapshots

import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ scanId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const permissionError = await withPermission(request, "view_all_clients");
  if (permissionError) return permissionError;

  try {
    const { scanId: scanIdStr } = await params;
    const scanId = Number(scanIdStr);
    if (!scanId || isNaN(scanId)) {
      return NextResponse.json(
        { success: false, error: "Invalid scanId" },
        { status: 400 }
      );
    }

    const scan = await prisma.intelScan.findUnique({
      where: { id: scanId },
      include: {
        assetGroup: { select: { id: true, name: true, type: true, tenantId: true } },
        snapshots: {
          orderBy: { createdAt: "asc" },
          include: {
            asset: { select: { id: true, domain: true, name: true, type: true } },
            competitor: { select: { id: true, domain: true, name: true } },
          },
        },
      },
    });

    if (!scan) {
      return NextResponse.json(
        { success: false, error: "Scan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: scan });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
