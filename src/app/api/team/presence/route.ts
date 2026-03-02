/**
 * GET /api/team/presence
 * Returns all active users with their most recent DashboardEvent timestamp.
 * Used by TeamFeed people strip to show presence dots.
 * Admin-gated (session required — any logged-in user can call it).
 * Cache-Control: 30s on the CDN edge.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      role: true,
      dashboardEvents: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const presence = users.map((u) => ({
    userId: u.id,
    name: u.name,
    role: u.role,
    lastSeen: u.dashboardEvents[0]?.createdAt ?? null,
  }));

  return NextResponse.json(presence, {
    headers: {
      "Cache-Control": "s-maxage=30, stale-while-revalidate=30",
    },
  });
}
