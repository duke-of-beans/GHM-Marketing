import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";
import { z } from "zod";

const updateTerritorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  cities: z.array(z.string()).optional(),
  zipCodes: z.array(z.string()).optional(),
  states: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check permission
  const permissionError = await withPermission(req, "manage_territories");
  if (permissionError) return permissionError;

  const { id } = await params;
  const territoryId = parseInt(id, 10);
  if (isNaN(territoryId)) {
    return NextResponse.json({ success: false, error: "Invalid territory ID" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = updateTerritorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const territory = await prisma.territory.update({
    where: { id: territoryId },
    data: parsed.data,
  });

  return NextResponse.json({ success: true, data: territory });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check permission
  const permissionError = await withPermission(req, "manage_territories");
  if (permissionError) return permissionError;

  const { id } = await params;
  const territoryId = parseInt(id, 10);
  if (isNaN(territoryId)) {
    return NextResponse.json({ success: false, error: "Invalid territory ID" }, { status: 400 });
  }

  // Soft delete
  await prisma.territory.update({
    where: { id: territoryId },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
