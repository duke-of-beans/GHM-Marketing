import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isElevated } from "@/lib/auth/session";

/**
 * ADMIN ENDPOINT - Get all users with IDs
 * Use this to verify owner user IDs for commission system
 * 
 * Call: GET /api/admin/verify-users
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !isElevated(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
      message: "Use these IDs to update OWNER_USER_IDS in src/lib/payments/calculations.ts",
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
