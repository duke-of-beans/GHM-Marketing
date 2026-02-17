import { NextResponse } from "next/server";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";

/**
 * GET /api/auth/permissions
 * Returns the current user's permissions
 */
export async function GET() {
  try {
    const user = await getCurrentUserWithPermissions();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      permissions: user.permissions,
      role: user.role,
    });
  } catch (error) {
    console.error("Failed to fetch permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}
