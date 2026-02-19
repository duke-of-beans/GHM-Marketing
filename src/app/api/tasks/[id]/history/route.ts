/**
 * GET /api/tasks/[id]/history
 *
 * Returns the transition history for a task, newest first.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getCurrentUser();

    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const transitions = await prisma.taskTransition.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Batch-fetch user names
    const userIds = Array.from(new Set(transitions.filter((t) => t.userId).map((t) => t.userId!)));
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    return NextResponse.json({
      success: true,
      data: transitions.map((t) => ({
        id: t.id,
        fromStatus: t.fromStatus,
        toStatus: t.toStatus,
        userName: t.userId ? userMap.get(t.userId) ?? "Unknown" : "System",
        comment: t.comment,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message ?? "Failed to load history" },
      { status: 500 }
    );
  }
}
