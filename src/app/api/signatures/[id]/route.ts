import { NextRequest, NextResponse } from "next/server";
import { withPermission, getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import { isElevated } from "@/lib/auth/roles";

/**
 * GET /api/signatures/[id]
 * Return a single SignatureEnvelope with full vaultFile and client relations.
 * Caller must own the envelope or be admin (isElevated).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const permissionError = await withPermission(req, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const user = await getCurrentUserWithPermissions();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const envelope = await prisma.signatureEnvelope.findUnique({
      where: { id },
      include: {
        vaultFile: true,
        client: true,
      },
    });

    if (!envelope) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    // Ownership check: caller must own the envelope or be admin
    if (envelope.createdById !== parseInt(user.id) && !isElevated(user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: envelope });
  } catch (error) {
    console.error("[GET /api/signatures/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch envelope" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/signatures/[id]
 * Admin only (isElevated). Update envelope status.
 * Body: { status }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const permissionError = await withPermission(req, "manage_settings");
  if (permissionError) return permissionError;

  try {
    const user = await getCurrentUserWithPermissions();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Double-gate: manage_settings is only granted to elevated roles, but enforce explicitly
    if (!isElevated(user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const body = (await req.json()) as { status: string };
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Missing required field: status" },
        { status: 400 }
      );
    }

    const updated = await prisma.signatureEnvelope.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, data: { id: updated.id, status: updated.status } });
  } catch (error) {
    console.error("[PATCH /api/signatures/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update envelope" },
      { status: 500 }
    );
  }
}
