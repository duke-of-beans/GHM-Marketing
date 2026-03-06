// src/app/api/intel/insights/route.ts
// Intelligence Engine — Sprint IE-06
// GET /api/intel/insights?tenantId=X
// Tenant-level cross-client intelligence summary.

import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { generateCrossClientInsights } from "@/lib/intel/patterns/cross-client";

export async function GET(req: NextRequest) {
  const permissionError = await withPermission(req, "view_all_clients");
  if (permissionError) return permissionError;

  const { searchParams } = new URL(req.url);
  const tenantId = Number(searchParams.get("tenantId"));
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }

  const summary = await generateCrossClientInsights(tenantId);

  return NextResponse.json(
    { success: true, data: summary },
    { headers: { "Cache-Control": "private, max-age=3600, stale-while-revalidate=300" } }
  );
}
