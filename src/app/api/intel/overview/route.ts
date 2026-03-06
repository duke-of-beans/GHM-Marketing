import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { getIntelOverviewForClient, getAssetsForClientDomain } from "@/lib/intel";

/**
 * GET /api/intel/overview
 *
 * Bridge endpoint: returns the full intel picture for a client or domain.
 * Query params:
 *   - tenantId (required)
 *   - clientProfileId — get all groups + ungrouped assets for a client
 *   - clientDomainId  — get all assets linked to a specific domain
 */
export async function GET(request: NextRequest) {
  const permissionError = await withPermission(request, "view_all_clients");
  if (permissionError) return permissionError;

  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const tenantId = Number(params.tenantId);
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "tenantId is required" },
        { status: 400 }
      );
    }

    if (params.clientProfileId) {
      const overview = await getIntelOverviewForClient(
        tenantId,
        Number(params.clientProfileId)
      );
      return NextResponse.json({ success: true, data: overview });
    }

    if (params.clientDomainId) {
      const assets = await getAssetsForClientDomain(
        tenantId,
        Number(params.clientDomainId)
      );
      return NextResponse.json({ success: true, data: { assets } });
    }

    return NextResponse.json(
      { success: false, error: "Provide either clientProfileId or clientDomainId" },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
