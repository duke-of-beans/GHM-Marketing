// src/app/api/affiliate/briefs/[id]/route.ts
// Affiliate Vertical — AffiliateContentBrief detail, update, delete
// Sprint 38-40

import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { requireTenant } from "@/lib/tenant/server";
import { prisma } from "@/lib/db";

async function getTenantId(slug: string): Promise<number | null> {
  const row = await prisma.tenant.findUnique({ where: { slug } });
  return row?.id ?? null;
}

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const permError = await withPermission(request, "view_all_clients");
  if (permError) return permError;

  try {
    const tenant = await requireTenant();
    const tenantId = await getTenantId(tenant.slug);
    if (!tenantId) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    const { id } = await params;
    const briefId = parseInt(id, 10);
    if (isNaN(briefId)) {
      return NextResponse.json({ success: false, error: "Invalid brief ID" }, { status: 400 });
    }

    const brief = await prisma.affiliateContentBrief.findFirst({ where: { id: briefId, tenantId } });
    if (!brief) {
      return NextResponse.json({ success: false, error: "Brief not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: brief });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch brief";
    console.error("[GET /api/affiliate/briefs/[id]]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const permError = await withPermission(request, "manage_clients");
  if (permError) return permError;

  try {
    const tenant = await requireTenant();
    const tenantId = await getTenantId(tenant.slug);
    if (!tenantId) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    const { id } = await params;
    const briefId = parseInt(id, 10);
    if (isNaN(briefId)) {
      return NextResponse.json({ success: false, error: "Invalid brief ID" }, { status: 400 });
    }

    const existing = await prisma.affiliateContentBrief.findFirst({ where: { id: briefId, tenantId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Brief not found" }, { status: 404 });
    }

    const body = await request.json();
    const { tenantId: _t, id: _i, siteId: _s, ...updateData } = body;

    // Ranking logic per Brief D spec
    if (updateData.currentRankingPosition != null) {
      const current = updateData.currentRankingPosition;
      const peak = existing.peakRankingPosition;
      if (peak == null || current < peak) {
        updateData.peakRankingPosition = current;
      }
      if (peak != null && (current - peak) > 5) {
        updateData.refreshDue = true;
      }
    }

    const brief = await prisma.affiliateContentBrief.update({
      where: { id: briefId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: brief });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update brief";
    console.error("[PUT /api/affiliate/briefs/[id]]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const permError = await withPermission(request, "manage_clients");
  if (permError) return permError;

  try {
    const tenant = await requireTenant();
    const tenantId = await getTenantId(tenant.slug);
    if (!tenantId) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    const { id } = await params;
    const briefId = parseInt(id, 10);
    if (isNaN(briefId)) {
      return NextResponse.json({ success: false, error: "Invalid brief ID" }, { status: 400 });
    }

    const existing = await prisma.affiliateContentBrief.findFirst({ where: { id: briefId, tenantId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Brief not found" }, { status: 404 });
    }

    await prisma.affiliateContentBrief.delete({ where: { id: briefId } });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete brief";
    console.error("[DELETE /api/affiliate/briefs/[id]]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}