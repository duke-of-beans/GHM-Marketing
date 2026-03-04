// src/app/api/affiliate/acquisitions/[id]/route.ts
// Affiliate Vertical — AcquisitionTarget detail, update, delete
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
    const targetId = parseInt(id, 10);
    if (isNaN(targetId)) {
      return NextResponse.json({ success: false, error: "Invalid target ID" }, { status: 400 });
    }

    const target = await prisma.acquisitionTarget.findFirst({ where: { id: targetId, tenantId } });
    if (!target) {
      return NextResponse.json({ success: false, error: "Target not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: target });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch target";
    console.error("[GET /api/affiliate/acquisitions/[id]]", error);
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
    const targetId = parseInt(id, 10);
    if (isNaN(targetId)) {
      return NextResponse.json({ success: false, error: "Invalid target ID" }, { status: 400 });
    }

    const existing = await prisma.acquisitionTarget.findFirst({ where: { id: targetId, tenantId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Target not found" }, { status: 404 });
    }

    const body = await request.json();
    const { tenantId: _t, id: _i, ...updateData } = body;

    const target = await prisma.acquisitionTarget.update({
      where: { id: targetId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: target });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update target";
    console.error("[PUT /api/affiliate/acquisitions/[id]]", error);
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
    const targetId = parseInt(id, 10);
    if (isNaN(targetId)) {
      return NextResponse.json({ success: false, error: "Invalid target ID" }, { status: 400 });
    }

    const existing = await prisma.acquisitionTarget.findFirst({ where: { id: targetId, tenantId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Target not found" }, { status: 404 });
    }

    await prisma.acquisitionTarget.delete({ where: { id: targetId } });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete target";
    console.error("[DELETE /api/affiliate/acquisitions/[id]]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}