/**
 * PATCH /api/tasks/[id]/transition
 *
 * Move a task to a new status. Validates against the status machine,
 * records a TaskTransition for audit history, and updates timestamps.
 *
 * Body: { toStatus: string, comment?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions, withPermission } from "@/lib/auth/api-permissions";
import { isElevated as checkElevated } from "@/lib/auth/roles";
import { canTransition, DONE_STATUSES } from "@/lib/tasks/status-machine";
import type { TaskStatus } from "@/lib/tasks/status-machine";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithPermissions();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const body = await req.json();
    const { toStatus, comment } = body;

    if (!toStatus) {
      return NextResponse.json({ error: "toStatus is required" }, { status: 400 });
    }

    // Fetch current task
    const task = await prisma.clientTask.findUnique({
      where: { id: taskId },
      select: { id: true, status: true, clientId: true, assignedToUserId: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Validate transition
    const elevated = checkElevated(user.role);
    const result = canTransition(task.status, toStatus, elevated);

    if (!result.allowed) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    if (result.requiresComment && !comment?.trim()) {
      return NextResponse.json(
        { error: "A comment is required for this transition" },
        { status: 400 }
      );
    }

    // Build update data
    const now = new Date();
    const updateData: any = {
      status: toStatus,
      statusChangedAt: now,
    };

    // Set timestamps based on transition
    if (toStatus === "in_progress" && task.status === "queued") {
      updateData.startedAt = now;
    }
    if (DONE_STATUSES.includes(toStatus as TaskStatus)) {
      updateData.completedAt = now;
    }
    if (toStatus === "deployed") {
      updateData.deployedAt = now;
    }
    // Reopening clears completion
    if (toStatus === "in_progress" && DONE_STATUSES.includes(task.status as TaskStatus)) {
      updateData.completedAt = null;
    }

    // Execute transition + record history in a transaction
    const [updatedTask, transition] = await prisma.$transaction([
      prisma.clientTask.update({
        where: { id: taskId },
        data: updateData,
        select: {
          id: true,
          status: true,
          statusChangedAt: true,
          startedAt: true,
          completedAt: true,
          client: { select: { businessName: true } },
        },
      }),
      prisma.taskTransition.create({
        data: {
          taskId,
          fromStatus: task.status,
          toStatus,
          userId: Number(user.id),
          comment: comment?.trim() || null,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        task: {
          id: updatedTask.id,
          status: updatedTask.status,
          statusChangedAt: updatedTask.statusChangedAt.toISOString(),
          startedAt: updatedTask.startedAt?.toISOString() ?? null,
          completedAt: updatedTask.completedAt?.toISOString() ?? null,
          clientName: updatedTask.client.businessName,
        },
        transition: {
          id: transition.id,
          from: transition.fromStatus,
          to: transition.toStatus,
          comment: transition.comment,
        },
      },
    });
  } catch (error: any) {
    console.error("Task transition error:", error);
    return NextResponse.json(
      { success: false, error: error.message ?? "Failed to transition task" },
      { status: 500 }
    );
  }
}
