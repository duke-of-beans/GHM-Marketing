// src/app/api/intel/insights/route.ts
// Intelligence Engine — Sprint IE-06
// GET /api/intel/insights
// Tenant-level cross-client intelligence summary.
// SEC-004-FOLLOWUP: tenantId is now derived from the authenticated session context
// (x-tenant-slug header set by middleware) — NOT from a query parameter.
// This prevents a cross-tenant read where an authenticated user on tenant A
// could pass tenantId=B to read another tenant's intelligence summary.

import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { generateCrossClientInsights } from "@/lib/intel/patterns/cross-client";
import { prisma } from "@/lib/prisma";
import { TENANT_HEADER } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const permissionError = await withPermission(req, "view_all_clients");
  if (permissionError) return permissionError;

  // SEC-004-FOLLOWUP: derive tenantId from the request context, not from a query param.
  const tenantSlug = req.headers.get(TENANT_HEADER);
  if (!tenantSlug) {
    return NextResponse.json({ error: "Tenant context not found" }, { status: 400 });
  }

  const tenantRecord = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });
  if (!tenantRecord) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const tenantId = tenantRecord.id;
  const summary = await generateCrossClientInsights(tenantId);

  return NextResponse.json(
    { success: true, data: summary },
    { headers: { "Cache-Control": "private, max-age=3600, stale-while-revalidate=300" } }
  );
}
