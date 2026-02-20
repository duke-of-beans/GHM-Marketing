/**
 * POST /api/clients/[id]/citations/scan — trigger on-demand NAP scan
 */

import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { runCitationScan } from "@/lib/enrichment/providers/nap-scraper/scanner";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  const { id } = await params;
  const clientId = parseInt(id);
  if (isNaN(clientId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const result = await runCitationScan(clientId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
