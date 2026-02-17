import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserPermissions, PermissionKey } from "./permissions";
import { logPermissionCheck } from "@/lib/audit-log";

/**
 * API middleware to check permissions with audit logging
 * Use in API routes to enforce permission-based access
 */
export async function withPermission(
  req: NextRequest,
  requiredPermission: PermissionKey
): Promise<NextResponse | null> {
  const startTime = Date.now();
  
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    // Fetch user permissions
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        permissionPreset: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const permissions = getUserPermissions({
      ...session.user,
      permissions: user.permissions,
      permissionPreset: user.permissionPreset,
    });

    const granted = permissions[requiredPermission] === true;
    
    // Audit log the permission check
    await logPermissionCheck({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      permission: requiredPermission,
      resource: req.nextUrl.pathname,
      granted,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    if (!granted) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: `You don't have permission to ${requiredPermission.replace(/_/g, " ")}`,
          requiredPermission,
        },
        { status: 403 }
      );
    }

    // Permission check passed, return null to allow request to continue
    return null;
  } catch (error) {
    console.error("Permission check error:", error);
    return NextResponse.json(
      { error: "Internal server error during permission check" },
      { status: 500 }
    );
  }
}

/**
 * API middleware to check if user has ANY of the specified permissions
 */
export async function withAnyPermission(
  req: NextRequest,
  ...requiredPermissions: PermissionKey[]
): Promise<NextResponse | null> {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: {
        id: true,
        role: true,
        permissions: true,
        permissionPreset: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const permissions = getUserPermissions({
      ...session.user,
      permissions: user.permissions,
      permissionPreset: user.permissionPreset,
    });

    const hasAny = requiredPermissions.some((perm) => permissions[perm] === true);

    if (!hasAny) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "You don't have the required permissions",
          requiredPermissions,
        },
        { status: 403 }
      );
    }

    return null;
  } catch (error) {
    console.error("Permission check error:", error);
    return NextResponse.json(
      { error: "Internal server error during permission check" },
      { status: 500 }
    );
  }
}

/**
 * Get current user with permissions for API routes
 */
export async function getCurrentUserWithPermissions() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      territoryId: true,
      permissions: true,
      permissionPreset: true,
      territory: {
        select: { name: true },
      },
    },
  });

  if (!user) {
    return null;
  }

  const permissions = getUserPermissions({
    id: user.id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    territoryId: user.territoryId,
    territoryName: user.territory?.name || null,
    permissions: user.permissions,
    permissionPreset: user.permissionPreset,
  });

  return {
    id: user.id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    territoryId: user.territoryId,
    territoryName: user.territory?.name || null,
    permissions,
  };
}
