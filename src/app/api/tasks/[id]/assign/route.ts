/**
 * PATCH /api/tasks/[id]/assign
 *
 * Assign or reassign a task to a user.
 * Elevated users can assign to anyone; sales reps can only self-assign unassigned tasks.
 *
 * Body: { userId: number | null }
 *   - number: assign to that user
 *   - null: unassign (return to pool)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";
import { isElevated as checkElevated } from "@/lib/auth/roles";

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
    const { userId: targetUserId } = body;
    const elevated = checkElevated(user.role);
    const currentUserId = Number(user.id);

    // Fetch current task
    const task = await prisma.clientTask.findUnique({
      where: { id: taskId },
      select: { id: true, assignedToUserId: true, status: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Permission checks
    if (targetUserId !== null && targetUserId !== currentUserId && !elevated) {
      return NextResponse.json(
        { error: "Only managers can assign tasks to other users" },
        { status: 403 }
      );
    }

    if (targetUserId === null && !elevated) {
      return NextResponse.json(
        { error: "Only managers can unassign tasks" },
        { status: 403 }
      );
    }

    // Self-assign: sales reps can pick up unassigned tasks
    if (targetUserId === currentUserId && !elevated && task.assignedToUserId !== null) {
      return NextResponse.json(
        { error: "This task is already assigned. Ask a manager to reassign it." },
        { status: 403 }
      );
    }

    // Validate target user exists (if assigning)
    if (targetUserId !== null) {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, isActive: true },
      });
      if (!targetUser || !targetUser.isActive) {
        return NextResponse.json({ error: "Target user not found or inactive" }, { status: 400 });
      }
    }

    // Update assignment
    const updatedTask = await prisma.clientTask.update({
      where: { id: taskId },
      data: {
        assignedToUserId: targetUserId,
        assignedByUserId: currentUserId,
      },
      select: {
        id: true,
        status: true,
        assignedToUser: { select: { id: true, name: true, role: true } },
        assignedByUser: { select: { id: true, name: true } },
        client: { select: { businessName: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        taskId: updatedTask.id,
        assignedTo: updatedTask.assignedToUser
          ? { id: updatedTask.assignedToUser.id, name: updatedTask.assignedToUser.name }
          : null,
        assignedBy: { id: updatedTask.assignedByUser!.id, name: updatedTask.assignedByUser!.name },
        clientName: updatedTask.client.businessName,
      },
    });
  } catch (error: any) {
    console.error("Task assign error:", error);
    return NextResponse.json(
      { success: false, error: error.message ?? "Failed to assign task" },
      { status: 500 }
    );
  }
}
