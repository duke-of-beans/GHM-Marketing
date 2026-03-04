// src/app/api/affiliate/programs/[id]/route.ts
// Affiliate Vertical — AffiliateProgram update and delete
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
    const programId = parseInt(id, 10);
    if (isNaN(programId)) {
      return NextResponse.json({ success: false, error: "Invalid program ID" }, { status: 400 });
    }

    const existing = await prisma.affiliateProgram.findFirst({ where: { id: programId, tenantId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Program not found" }, { status: 404 });
    }

    const body = await request.json();
    const { tenantId: _t, id: _i, siteId: _s, ...updateData } = body;

    const program = await prisma.affiliateProgram.update({
      where: { id: programId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: program });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update program";
    console.error("[PUT /api/affiliate/programs/[id]]", error);
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
    const programId = parseInt(id, 10);
    if (isNaN(programId)) {
      return NextResponse.json({ success: false, error: "Invalid program ID" }, { status: 400 });
    }

    const existing = await prisma.affiliateProgram.findFirst({ where: { id: programId, tenantId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Program not found" }, { status: 404 });
    }

    await prisma.affiliateProgram.delete({ where: { id: programId } });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete program";
    console.error("[DELETE /api/affiliate/programs/[id]]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}