// src/app/api/affiliate/revenue/[id]/route.ts
// Affiliate Vertical — RevenueEntry update
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
    const entryId = parseInt(id, 10);
    if (isNaN(entryId)) {
      return NextResponse.json({ success: false, error: "Invalid entry ID" }, { status: 400 });
    }

    const existing = await prisma.revenueEntry.findFirst({ where: { id: entryId, tenantId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Entry not found" }, { status: 404 });
    }

    const body = await request.json();
    const { tenantId: _t, id: _i, siteId: _s, ...updateData } = body;

    const revenue = updateData.revenue ?? existing.revenue;
    const sessions = updateData.sessions ?? existing.sessions;
    const clicks = updateData.clicks ?? existing.clicks;
    const revNum = typeof revenue === "object" && "toNumber" in revenue ? revenue.toNumber() : Number(revenue);
    updateData.rpm = sessions > 0 ? (revNum / sessions) * 1000 : null;
    updateData.epc = clicks > 0 ? revNum / clicks : null;

    const entry = await prisma.revenueEntry.update({
      where: { id: entryId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: entry });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update entry";
    console.error("[PUT /api/affiliate/revenue/[id]]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}