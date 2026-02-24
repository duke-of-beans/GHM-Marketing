import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  const fullUser = await prisma.user.findUnique({
    where: { id: parseInt(user.id) },
    select: { role: true },
  });

  if (fullUser?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Pull all users with basic info
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      position: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  // Aggregate audit log stats per user
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const auditStats = await prisma.auditLog.groupBy({
    by: ["userId"],
    _count: { id: true },
    _max: { timestamp: true },
    where: { timestamp: { gte: thirtyDaysAgo } },
  });

  const statsByUser = new Map(
    auditStats.map((s) => [s.userId, { eventCount: s._count.id, lastActivity: s._max.timestamp }])
  );

  // Count unique pages visited per user in last 30 days
  const pageVisits = await prisma.auditLog.findMany({
    where: {
      action: "page_access",
      timestamp: { gte: thirtyDaysAgo },
    },
    select: { userId: true, resource: true },
    distinct: ["userId", "resource"],
  });

  const pagesByUser = new Map<number, number>();
  for (const pv of pageVisits) {
    pagesByUser.set(pv.userId, (pagesByUser.get(pv.userId) ?? 0) + 1);
  }

  const result = users.map((u) => {
    const stats = statsByUser.get(u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      position: u.position?.name ?? null,
      isActive: u.isActive,
      lastLogin: u.lastLogin?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
      // Activity in last 30 days
      eventCount30d: stats?.eventCount ?? 0,
      lastActivity: stats?.lastActivity?.toISOString() ?? null,
      pagesVisited30d: pagesByUser.get(u.id) ?? 0,
    };
  });

  return NextResponse.json({ users: result });
}
