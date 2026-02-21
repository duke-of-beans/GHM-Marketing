/**
 * POST /api/tasks/[id]/approve
 *
 * Approve a task that is currently in "review" status.
 * Validates the task is in review, records a TaskTransition audit entry,
 * sets completedAt timestamp, and optionally stores approvedContent.
 *
 * BUG-008 FIX: Previously set status to "approved" with a raw update and no
 * transition log. Now validates current status is "review" and records the
 * transition properly so the review queue filter (status: "review") correctly
 * excludes it after approval.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions, withPermission } from "@/lib/auth/api-permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const permissionError = await withPermission(req, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const user = await getCurrentUserWithPermissions();
    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    // Verify task exists and is in reviewable state
    const task = await prisma.clientTask.findUnique({
      where: { id: taskId },
      select: { id: true, status: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.status !== "review") {
      return NextResponse.json(
        { error: `Task is not in review status (current: ${task.status})` },
        { status: 400 }
      );
    }

    const now = new Date();

    // Update task status + record transition in a transaction
    const [updatedTask] = await prisma.$transaction([
      prisma.clientTask.update({
        where: { id: taskId },
        data: {
          status: "approved",
          statusChangedAt: now,
          completedAt: now,
          ...(body.approvedContent && { approvedContent: body.approvedContent }),
          updatedAt: now,
        },
      }),
      prisma.taskTransition.create({
        data: {
          taskId,
          fromStatus: "review",
          toStatus: "approved",
          userId: user?.id ? parseInt(user.id) : null,
          comment: "Approved via review queue",
        },
      }),
    ]);

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error("Failed to approve task:", error);
    return NextResponse.json({ error: "Failed to approve task" }, { status: 500 });
  }
}
