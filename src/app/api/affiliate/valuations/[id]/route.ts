// src/app/api/affiliate/valuations/[id]/route.ts
// Affiliate Vertical — SiteValuation update
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
    const valuationId = parseInt(id, 10);
    if (isNaN(valuationId)) {
      return NextResponse.json({ success: false, error: "Invalid valuation ID" }, { status: 400 });
    }

    const existing = await prisma.siteValuation.findFirst({ where: { id: valuationId, tenantId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Valuation not found" }, { status: 404 });
    }

    const body = await request.json();
    const { tenantId: _t, id: _i, siteId: _s, ...updateData } = body;

    const monthlyNetProfit = updateData.monthlyNetProfit ?? existing.monthlyNetProfit;
    const multipleUsed = updateData.multipleUsed ?? existing.multipleUsed;
    const mnp = typeof monthlyNetProfit === "object" && "toNumber" in monthlyNetProfit ? monthlyNetProfit.toNumber() : Number(monthlyNetProfit);
    const mu = typeof multipleUsed === "object" && "toNumber" in multipleUsed ? multipleUsed.toNumber() : Number(multipleUsed);
    updateData.estimatedValue = mnp * mu;

    const valuation = await prisma.siteValuation.update({
      where: { id: valuationId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: valuation });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update valuation";
    console.error("[PUT /api/affiliate/valuations/[id]]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}