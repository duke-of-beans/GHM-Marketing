import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { getAssetGroup, deleteAssetGroup } from "@/lib/intel";

type RouteContext = { params: { id: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const permissionError = await withPermission(request, "view_all_clients");
  if (permissionError) return permissionError;

  try {
    const tenantId = Number(request.nextUrl.searchParams.get("tenantId"));
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "tenantId query param is required" },
        { status: 400 }
      );
    }

    const group = await getAssetGroup(tenantId, Number(params.id));
    if (!group) {
      return NextResponse.json(
        { success: false, error: "Asset group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: group });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const tenantId = Number(request.nextUrl.searchParams.get("tenantId"));
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "tenantId query param is required" },
        { status: 400 }
      );
    }

    await deleteAssetGroup(tenantId, Number(params.id));
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") || message.includes("Cannot delete") ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
