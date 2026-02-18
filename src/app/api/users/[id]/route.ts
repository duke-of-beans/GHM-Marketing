import { NextRequest, NextResponse } from "next/server";
import { withPermission, getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createAuditLog } from "@/lib/audit-log";

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

  // Cannot act on yourself
  if (userId === Number(currentUser.id)) {
    return NextResponse.json(
      { success: false, error: "Cannot delete your own account" },
      { status: 400 }
    );
  }

  const permanent = req.nextUrl.searchParams.get("permanent") === "true";

  // Hard delete: masters only
  if (permanent && currentUser.role !== "master") {
    return NextResponse.json(
      { success: false, error: "Only master users can permanently delete accounts" },
      { status: 403 }
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: {
          assignedLeads: true,
          salesRepClients: true,
        },
      },
    },
  });

  if (!targetUser) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  if (permanent) {
    // Block hard delete if user has active leads or clients — caller must reassign first
    if (targetUser._count.assignedLeads > 0 || targetUser._count.salesRepClients > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot permanently delete a user with active leads or clients. Reassign them first.",
          details: {
            assignedLeads: targetUser._count.assignedLeads,
            activeClients: targetUser._count.salesRepClients,
          },
        },
        { status: 409 }
      );
    }

    await prisma.user.delete({ where: { id: userId } });

    await createAuditLog({
      userId: parseInt(currentUser.id),
      userName: currentUser.name ?? "",
      userEmail: currentUser.email ?? "",
      userRole: currentUser.role,
      action: "user_delete",
      resource: `user:${userId}`,
      permission: "manage_team",
      status: "success",
      metadata: {
        deletedUser: targetUser.name,
        deletedEmail: targetUser.email,
        permanent: true,
      },
    });

    return NextResponse.json({ success: true, permanent: true });
  }

  // Soft delete (deactivate)
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  await createAuditLog({
    userId: parseInt(currentUser.id),
    userName: currentUser.name ?? "",
    userEmail: currentUser.email ?? "",
    userRole: currentUser.role,
    action: "user_update",
    resource: `user:${userId}`,
    permission: "manage_team",
    status: "success",
    metadata: {
      updatedFields: ["isActive"],
      newValue: false,
      targetUser: targetUser.name,
    },
  });

  return NextResponse.json({ success: true, permanent: false });
}
