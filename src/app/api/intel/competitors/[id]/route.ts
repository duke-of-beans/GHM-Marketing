import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { deleteCompetitor } from "@/lib/intel";

type RouteContext = { params: { id: string } };

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

    await deleteCompetitor(tenantId, Number(params.id));
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
