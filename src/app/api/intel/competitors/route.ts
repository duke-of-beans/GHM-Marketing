import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { createCompetitor, listCompetitors } from "@/lib/intel";

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

    const competitors = await listCompetitors(tenantId, {
      assetId: params.assetId ? Number(params.assetId) : undefined,
      assetGroupId: params.assetGroupId ? Number(params.assetGroupId) : undefined,
      source: params.source,
    });

    return NextResponse.json({ success: true, data: competitors });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const body = await request.json();
    const { tenantId, name, domain, googlePlaceId, assetGroupId, assetId, source } = body;

    if (!tenantId || !name) {
      return NextResponse.json(
        { success: false, error: "tenantId and name are required" },
        { status: 400 }
      );
    }

    if (!domain && !googlePlaceId) {
      return NextResponse.json(
        { success: false, error: "At least one of domain or googlePlaceId is required" },
        { status: 400 }
      );
    }

    const competitor = await createCompetitor(Number(tenantId), {
      name,
      domain,
      googlePlaceId,
      assetGroupId: assetGroupId ? Number(assetGroupId) : undefined,
      assetId: assetId ? Number(assetId) : undefined,
      source,
    });

    return NextResponse.json({ success: true, data: competitor }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
