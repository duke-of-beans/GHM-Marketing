import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";
import { clearPermissionCache } from "@/lib/auth/use-permissions";

/**
 * PUT /api/users/[id]/permissions
 * Update user permissions
 * Requires manage_team permission
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check permission
  const permissionError = await withPermission(req, "manage_team");
  if (permissionError) return permissionError;

  try {
    const currentUser = await getCurrentUserWithPermissions();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = parseInt(params.id);
    const body = await req.json();
    const { permissionPreset, customPermissions } = body;

    // Validate inputs
    if (permissionPreset && !["sales_basic", "sales_advanced", "master_lite", "master_full", null].includes(permissionPreset)) {
      return NextResponse.json(
        { error: "Invalid permission preset" },
        { status: 400 }
      );
    }

    // Update user permissions
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        permissionPreset,
        permissions: customPermissions || {},
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissionPreset: true,
        permissions: true,
      },
    });

    // Log the permission change
    await createAuditLog({
      userId: currentUser.id,
      userName: currentUser.name || "",
      userEmail: currentUser.email || "",
      userRole: currentUser.role,
      action: "user_update",
      resource: `user:${userId}`,
      permission: "manage_team",
      status: "success",
      metadata: {
        updatedFields: ["permissionPreset", "permissions"],
        newPreset: permissionPreset,
        targetUser: updatedUser.name,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Failed to update permissions:", error);
    return NextResponse.json(
      { error: "Failed to update permissions" },
      { status: 500 }
    );
  }
}
