// src/app/api/affiliate/sites/[id]/briefs/route.ts
// Affiliate Vertical — AffiliateContentBrief list and create per site
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

    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status");

    const where: Record<string, unknown> = { siteId, tenantId };
    if (statusFilter) where.status = statusFilter;

    const briefs = await prisma.affiliateContentBrief.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: briefs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch briefs";
    console.error("[GET /api/affiliate/sites/[id]/briefs]", error);
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
    const { targetKeyword, ...rest } = body;

    if (!targetKeyword) {
      return NextResponse.json({ success: false, error: "targetKeyword is required" }, { status: 400 });
    }

    const brief = await prisma.affiliateContentBrief.create({
      data: { tenantId, siteId, targetKeyword, ...rest },
    });

    return NextResponse.json({ success: true, data: brief }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create brief";
    console.error("[POST /api/affiliate/sites/[id]/briefs]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}