// src/app/api/affiliate/sites/[id]/valuations/route.ts
// Affiliate Vertical — SiteValuation list and create per site
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

    const valuations = await prisma.siteValuation.findMany({
      where: { siteId, tenantId },
      orderBy: { valuationDate: "desc" },
    });

    return NextResponse.json({ success: true, data: valuations });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch valuations";
    console.error("[GET /api/affiliate/sites/[id]/valuations]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { monthlyNetProfit, multipleUsed, ...rest } = body;

    if (monthlyNetProfit == null || multipleUsed == null) {
      return NextResponse.json({ success: false, error: "monthlyNetProfit and multipleUsed are required" }, { status: 400 });
    }

    const estimatedValue = monthlyNetProfit * multipleUsed;

    const valuation = await prisma.siteValuation.create({
      data: {
        tenantId,
        siteId,
        monthlyNetProfit,
        multipleUsed,
        estimatedValue,
        ...rest,
      },
    });

    return NextResponse.json({ success: true, data: valuation }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create valuation";
    console.error("[POST /api/affiliate/sites/[id]/valuations]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}