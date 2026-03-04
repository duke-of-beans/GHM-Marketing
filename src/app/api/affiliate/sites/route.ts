// src/app/api/affiliate/sites/route.ts
// Affiliate Vertical — Site list and create
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

    const sites = await prisma.site.findMany({
      where: { tenantId },
      orderBy: { domain: "asc" },
    });

    return NextResponse.json({ success: true, data: sites });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch sites";
    console.error("[GET /api/affiliate/sites]", error);
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
    const { domain, displayName, slug, ...rest } = body;

    if (!domain) {
      return NextResponse.json({ success: false, error: "domain is required" }, { status: 400 });
    }

    const siteSlug = slug || domain.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

    const site = await prisma.site.create({
      data: {
        tenantId,
        domain,
        displayName: displayName || domain,
        slug: siteSlug,
        ...rest,
      },
    });

    return NextResponse.json({ success: true, data: site }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create site";
    console.error("[POST /api/affiliate/sites]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}