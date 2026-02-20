/**
 * GET  /api/clients/[id]/keywords — list all keyword trackers + latest snapshot
 * POST /api/clients/[id]/keywords — add one or more keywords
 */

import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await withPermission(request, "view_all_clients");
  if (permissionError) return permissionError;

  const { id } = await params;
  const clientId = parseInt(id);
  if (isNaN(clientId)) return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });

  const keywords = await prisma.keywordTracker.findMany({
    where: { clientId },
    orderBy: [{ category: "asc" }, { keyword: "asc" }],
    include: {
      snapshots: {
        orderBy: { scanDate: "desc" },
        take: 1,
        select: {
          organicPosition: true,
          localPackPosition: true,
          previousOrganic: true,
          previousLocalPack: true,
          scanDate: true,
          serpFeatures: true,
          localPackBusiness: true,
        },
      },
    },
  });

  const latestSnapshot = await prisma.rankSnapshot.findFirst({
    where: { clientId },
    orderBy: { scanDate: "desc" },
    select: { scanDate: true },
  });

  const active = keywords.filter((k) => k.isActive);
  const withSnapshots = active.filter((k) => k.snapshots.length > 0);
  const inTop3 = withSnapshots.filter(
    (k) => (k.snapshots[0]?.organicPosition ?? 99) <= 3
  ).length;
  const inLocalPack = withSnapshots.filter(
    (k) => k.snapshots[0]?.localPackPosition !== null
  ).length;
  const avgPosition =
    withSnapshots.length > 0
      ? withSnapshots.reduce(
          (sum, k) => sum + (k.snapshots[0]?.organicPosition ?? 100),
          0
        ) / withSnapshots.length
      : null;

  return NextResponse.json({
    keywords,
    summary: {
      total: active.length,
      inTop3,
      inLocalPack,
      avgPosition: avgPosition ? Math.round(avgPosition * 10) / 10 : null,
      lastScanDate: latestSnapshot?.scanDate ?? null,
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  const { id } = await params;
  const clientId = parseInt(id);
  if (isNaN(clientId)) return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });

  const body = await request.json();
  const keywords: Array<{
    keyword: string;
    category?: string;
    searchVolume?: number;
    difficulty?: number;
    targetUrl?: string;
  }> = Array.isArray(body) ? body : [body];

  if (keywords.length === 0) {
    return NextResponse.json({ error: "No keywords provided" }, { status: 400 });
  }

  const created = await prisma.keywordTracker.createMany({
    data: keywords.map((kw) => ({
      clientId,
      keyword: kw.keyword.toLowerCase().trim(),
      category: kw.category ?? null,
      searchVolume: kw.searchVolume ?? null,
      difficulty: kw.difficulty ?? null,
      targetUrl: kw.targetUrl ?? null,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ created: created.count }, { status: 201 });
}
