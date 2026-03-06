import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { createAsset, listAssets } from "@/lib/intel";

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

    const assets = await listAssets(tenantId, {
      type: params.type,
      assetGroupId: params.assetGroupId ? Number(params.assetGroupId) : undefined,
      ownershipModel: params.ownershipModel,
    });

    return NextResponse.json({ success: true, data: assets });
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
    const { tenantId, domain, name, type, assetGroupId, ownershipModel, clientDomainId, siteId, verticalMeta } = body;

    if (!tenantId || !domain || !name || !type) {
      return NextResponse.json(
        { success: false, error: "tenantId, domain, name, and type are required" },
        { status: 400 }
      );
    }

    const asset = await createAsset(Number(tenantId), {
      domain,
      name,
      type,
      assetGroupId: assetGroupId ? Number(assetGroupId) : undefined,
      ownershipModel,
      clientDomainId: clientDomainId ? Number(clientDomainId) : undefined,
      siteId: siteId ? Number(siteId) : undefined,
      verticalMeta,
    });

    return NextResponse.json({ success: true, data: asset }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
