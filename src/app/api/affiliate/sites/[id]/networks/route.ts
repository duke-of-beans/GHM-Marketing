// src/app/api/affiliate/sites/[id]/networks/route.ts
// Affiliate Vertical — DisplayAdNetwork list and create per site
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

    const networks = await prisma.displayAdNetwork.findMany({
      where: { siteId, tenantId },
      orderBy: { networkName: "asc" },
    });

    // Add virtual qualificationProgress field
    const networksWithProgress = networks.map((network) => {
      let qualificationProgress: number | null = null;
      if (
        network.currentMonthlySessions != null &&
        network.monthlySessionsRequired != null &&
        network.monthlySessionsRequired > 0
      ) {
        qualificationProgress = Math.round(
          (network.currentMonthlySessions / network.monthlySessionsRequired) * 100
        );
      }
      return { ...network, qualificationProgress };
    });

    return NextResponse.json({ success: true, data: networksWithProgress });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch networks";
    console.error("[GET /api/affiliate/sites/[id]/networks]", error);
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

    const site = await prisma.site.findFirst({ where: { id: siteId, tenantId } });
    if (!site) {
      return NextResponse.json({ success: false, error: "Site not found" }, { status: 404 });
    }

    const body = await request.json();
    const { networkName, ...rest } = body;

    if (!networkName) {
      return NextResponse.json(
        { success: false, error: "networkName is required" },
        { status: 400 }
      );
    }

    const network = await prisma.displayAdNetwork.create({
      data: {
        tenantId,
        siteId,
        networkName,
        ...rest,
      },
    });

    return NextResponse.json({ success: true, data: network }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create network";
    console.error("[POST /api/affiliate/sites/[id]/networks]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}