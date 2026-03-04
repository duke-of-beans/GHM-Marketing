// src/app/api/affiliate/acquisitions/route.ts
// Affiliate Vertical — AcquisitionTarget list and create
// Sprint 38-40

import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { requireTenant } from "@/lib/tenant/server";
import { prisma } from "@/lib/db";

async function getTenantId(slug: string): Promise<number | null> {
  const row = await prisma.tenant.findUnique({ where: { slug } });
  return row?.id ?? null;
}

export async function GET(request: NextRequest) {
  const permError = await withPermission(request, "view_all_clients");
  if (permError) return permError;

  try {
    const tenant = await requireTenant();
    const tenantId = await getTenantId(tenant.slug);
    if (!tenantId) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    const targets = await prisma.acquisitionTarget.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: targets });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch targets";
    console.error("[GET /api/affiliate/acquisitions]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const permError = await withPermission(request, "manage_clients");
  if (permError) return permError;

  try {
    const tenant = await requireTenant();
    const tenantId = await getTenantId(tenant.slug);
    if (!tenantId) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    const body = await request.json();
    const { domain, ...rest } = body;

    if (!domain) {
      return NextResponse.json({ success: false, error: "domain is required" }, { status: 400 });
    }

    const target = await prisma.acquisitionTarget.create({
      data: { tenantId, domain, ...rest },
    });

    return NextResponse.json({ success: true, data: target }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create target";
    console.error("[POST /api/affiliate/acquisitions]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}