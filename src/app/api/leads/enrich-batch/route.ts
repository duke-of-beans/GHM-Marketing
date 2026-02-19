import { NextRequest, NextResponse } from "next/server";
import { enrichLeadsBatch } from "@/lib/enrichment";
import { withPermission } from "@/lib/auth/api-permissions";

export async function POST(request: NextRequest) {
  const permissionError = await withPermission(request, "manage_leads");
  if (permissionError) return permissionError;

  const body = await request.json();
  const { leadIds, force = false } = body;

  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return NextResponse.json({ success: false, error: "leadIds array required" }, { status: 400 });
  }

  if (leadIds.length > 50) {
    return NextResponse.json(
      { success: false, error: "Maximum 50 leads per batch" },
      { status: 400 }
    );
  }

  try {
    const { summary } = await enrichLeadsBatch(leadIds, force);
    return NextResponse.json({ success: true, data: { summary } });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Batch enrichment failed: ${err}` },
      { status: 500 }
    );
  }
}
