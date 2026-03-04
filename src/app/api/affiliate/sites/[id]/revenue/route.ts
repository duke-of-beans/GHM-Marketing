// src/app/api/affiliate/sites/[id]/revenue/route.ts
// Affiliate Vertical — RevenueEntry list and create per site
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

    const entries = await prisma.revenueEntry.findMany({
      where: { siteId, tenantId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json({ success: true, data: entries });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch revenue";
    console.error("[GET /api/affiliate/sites/[id]/revenue]", error);
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
    const { revenue, sessions, clicks, ...rest } = body;

    const rpm = sessions > 0 ? (revenue / sessions) * 1000 : null;
    const epc = clicks > 0 ? revenue / clicks : null;

    const entry = await prisma.revenueEntry.create({
      data: {
        tenantId,
        siteId,
        revenue,
        sessions: sessions ?? null,
        clicks: clicks ?? null,
        rpm,
        epc,
        ...rest,
      },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create revenue entry";
    console.error("[POST /api/affiliate/sites/[id]/revenue]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}