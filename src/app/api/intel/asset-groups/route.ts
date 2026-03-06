import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { createAssetGroup, listAssetGroups } from "@/lib/intel";

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

    const groups = await listAssetGroups(tenantId, {
      type: params.type,
      clientProfileId: params.clientProfileId ? Number(params.clientProfileId) : undefined,
    });

    return NextResponse.json({ success: true, data: groups });
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
    const { tenantId, name, type, clientProfileId, verticalMeta } = body;

    if (!tenantId || !name || !type) {
      return NextResponse.json(
        { success: false, error: "tenantId, name, and type are required" },
        { status: 400 }
      );
    }

    const group = await createAssetGroup(Number(tenantId), {
      name,
      type,
      clientProfileId: clientProfileId ? Number(clientProfileId) : undefined,
      verticalMeta,
    });

    return NextResponse.json({ success: true, data: group }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
