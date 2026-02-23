/**
 * GET /api/notifications        — List user notifications
 * PUT /api/notifications/read   — Mark as read (handled in /read/route.ts)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserWithPermissions();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 100);

    const notifications = await prisma.notificationEvent.findMany({
      where: {
        userId: parseInt(user.id),
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await prisma.notificationEvent.count({
      where: { userId: parseInt(user.id), read: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error("[GET /api/notifications]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
