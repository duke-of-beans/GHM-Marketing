// src/app/api/affiliate/networks/[id]/route.ts
// Affiliate Vertical — DisplayAdNetwork update
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
    const networkId = parseInt(id, 10);
    if (isNaN(networkId)) {
      return NextResponse.json({ success: false, error: "Invalid network ID" }, { status: 400 });
    }

    const existing = await prisma.displayAdNetwork.findFirst({ where: { id: networkId, tenantId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Network not found" }, { status: 404 });
    }

    const body = await request.json();
    const { tenantId: _t, id: _i, siteId: _s, ...updateData } = body;

    const network = await prisma.displayAdNetwork.update({
      where: { id: networkId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: network });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update network";
    console.error("[PUT /api/affiliate/networks/[id]]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}