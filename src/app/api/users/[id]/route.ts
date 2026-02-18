import { NextRequest, NextResponse } from "next/server";
import { withPermission, getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).max(100).optional(),
  role: z.enum(["master", "sales"]).optional(),
  territoryId: z.number().int().positive().nullable().optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check permission
  const permissionError = await withPermission(req, "manage_team");
  if (permissionError) return permissionError;

  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.email !== undefined) updateData.email = parsed.data.email;

  // Check for email conflict
  if (updateData.email) {
    const existing = await prisma.user.findFirst({
      where: { email: updateData.email as string, id: { not: userId } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email already in use" },
        { status: 409 }
      );
    }
  }

  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
  if (parsed.data.territoryId !== undefined) updateData.territoryId = parsed.data.territoryId;
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;
  if (parsed.data.password) {
    updateData.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      territoryId: true,
      territory: { select: { id: true, name: true } },
      isActive: true,
    },
  });

  return NextResponse.json({ success: true, data: user });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check permission
  const permissionError = await withPermission(req, "manage_team");
  if (permissionError) return permissionError;

  const currentUser = await getCurrentUserWithPermissions();
  if (!currentUser) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
  }

  // Don't let user deactivate themselves
  if (userId === Number(currentUser.id)) {
    return NextResponse.json(
      { success: false, error: "Cannot deactivate your own account" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
