import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { getAsset, updateAsset, deleteAsset } from "@/lib/intel";

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

    const asset = await getAsset(tenantId, Number(params.id));
    if (!asset) {
      return NextResponse.json(
        { success: false, error: "Asset not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: asset });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const body = await request.json();
    const { tenantId, ...updateData } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "tenantId is required in body" },
        { status: 400 }
      );
    }

    const updated = await updateAsset(Number(tenantId), Number(params.id), updateData);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
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

    await deleteAsset(tenantId, Number(params.id));
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
