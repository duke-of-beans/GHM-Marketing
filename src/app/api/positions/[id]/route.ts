import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["sales", "management", "operations", "contractor"]).optional(),
  compensationType: z.enum(["commission_residual", "management_fee", "flat_monthly", "per_deliverable", "manual"]).optional(),
  defaultAmount: z.number().nullable().optional(),
  defaultFrequency: z.enum(["monthly", "per_close", "per_deliverable", "manual"]).nullable().optional(),
  dashboardAccessLevel: z.enum(["admin", "master", "sales", "readonly"]).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

// PATCH /api/positions/[id] — update position (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await withPermission(req, "manage_team");
  if (permissionError) return permissionError;

  const { id } = await params;
  const positionId = parseInt(id, 10);
  if (isNaN(positionId)) {
    return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.name) {
    const conflict = await prisma.position.findFirst({ where: { name: parsed.data.name, id: { not: positionId } } });
    if (conflict) {
      return NextResponse.json({ success: false, error: "A position with this name already exists" }, { status: 409 });
    }
  }

  const position = await prisma.position.update({ where: { id: positionId }, data: parsed.data });
  return NextResponse.json({ success: true, data: position });
}

// DELETE /api/positions/[id] — delete position (admin only, only if no users assigned)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await withPermission(req, "manage_team");
  if (permissionError) return permissionError;

  const { id } = await params;
  const positionId = parseInt(id, 10);
  if (isNaN(positionId)) {
    return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
  }

  const userCount = await prisma.user.count({ where: { positionId } });
  if (userCount > 0) {
    return NextResponse.json(
      { success: false, error: `Cannot delete — ${userCount} user(s) assigned to this position. Reassign them first.` },
      { status: 409 }
    );
  }

  await prisma.position.delete({ where: { id: positionId } });
  return NextResponse.json({ success: true });
}
