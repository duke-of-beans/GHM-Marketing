import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import { getUserPermissions } from "@/lib/auth/permissions";

/**
 * GET /api/users
 * Get all users with their permissions
 * Requires manage_team permission
 */
export async function GET(req: NextRequest) {
  // Check permission
  const permissionError = await withPermission(req, "manage_team");
  if (permissionError) return permissionError;

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        territoryId: true,
        permissionPreset: true,
        permissions: true,
        territory: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            assignedLeads: true,
            salesRepClients: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Add effective permissions to each user
    const usersWithPermissions = users.map((user) => ({
      ...user,
      effectivePermissions: getUserPermissions({
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        territoryId: user.territoryId,
        territoryName: user.territory?.name || null,
        permissions: user.permissions,
        permissionPreset: user.permissionPreset,
      }),
    }));

    return NextResponse.json({
      success: true,
      data: usersWithPermissions,
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
