// src/app/api/affiliate/sites/[id]/route.ts
// Affiliate Vertical — Site detail, update, delete
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
    const siteId = parseInt(id, 10);
    if (isNaN(siteId)) {
      return NextResponse.json({ success: false, error: "Invalid site ID" }, { status: 400 });
    }

    const site = await prisma.site.findFirst({
      where: { id: siteId, tenantId },
      include: {
        affiliatePrograms: { orderBy: { merchantName: "asc" } },
        adNetworks: { orderBy: { networkName: "asc" } },
        revenueEntries: { orderBy: [{ year: "desc" }, { month: "desc" }] },
        contentBriefs: { orderBy: { createdAt: "desc" } },
        valuations: { orderBy: { valuationDate: "desc" } },
      },
    });

    if (!site) {
      return NextResponse.json({ success: false, error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: site });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch site";
    console.error("[GET /api/affiliate/sites/[id]]", error);
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
    const siteId = parseInt(id, 10);
    if (isNaN(siteId)) {
      return NextResponse.json({ success: false, error: "Invalid site ID" }, { status: 400 });
    }

    const body = await request.json();
    const { tenantId: _t, id: _i, ...updateData } = body;

    const existing = await prisma.site.findFirst({ where: { id: siteId, tenantId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Site not found" }, { status: 404 });
    }

    const site = await prisma.site.update({
      where: { id: siteId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: site });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update site";
    console.error("[PUT /api/affiliate/sites/[id]]", error);
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
    const siteId = parseInt(id, 10);
    if (isNaN(siteId)) {
      return NextResponse.json({ success: false, error: "Invalid site ID" }, { status: 400 });
    }

    const existing = await prisma.site.findFirst({ where: { id: siteId, tenantId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Site not found" }, { status: 404 });
    }

    await prisma.site.delete({ where: { id: siteId } });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete site";
    console.error("[DELETE /api/affiliate/sites/[id]]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}