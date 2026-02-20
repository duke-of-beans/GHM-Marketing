/**
 * GET /api/clients/[id]/citations — latest citation scan + directory health
 */

import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import { getHealthStatus } from "@/lib/enrichment/providers/nap-scraper/health";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await withPermission(request, "view_all_clients");
  if (permissionError) return permissionError;

  const { id } = await params;
  const clientId = parseInt(id);
  if (isNaN(clientId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const latest = await prisma.citationScan.findFirst({
    where: { clientId },
    orderBy: { scanDate: "desc" },
  });

  const previous = await prisma.citationScan.findFirst({
    where: { clientId, NOT: latest ? { id: latest.id } : undefined },
    orderBy: { scanDate: "desc" },
    select: { healthScore: true, scanDate: true },
  });

  const health = await getHealthStatus();
  const degraded = health.filter((h) => h.isDegraded).map((h) => h.displayName);

  return NextResponse.json({
    scan: latest,
    previousHealthScore: previous?.healthScore ?? null,
    previousScanDate: previous?.scanDate ?? null,
    degradedDirectories: degraded,
  });
}
