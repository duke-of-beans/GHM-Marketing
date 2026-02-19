/**
 * POST /api/tasks
 *
 * Create a new task. Any authenticated user can create tasks.
 * Elevated users can assign to anyone; sales reps auto-assign to self.
 *
 * Body: {
 *   clientId: number,
 *   title: string,
 *   description?: string,
 *   category: string,
 *   priority?: string,        // default P3
 *   dueDate?: string,         // ISO date
 *   estimatedMinutes?: number,
 *   assignToUserId?: number,  // elevated only; sales auto-assigns self
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";
import { isElevated as checkElevated } from "@/lib/auth/roles";

const VALID_CATEGORIES = [
  "content", "technical_seo", "local_seo", "backlinks",
  "reviews", "speed", "competitor", "website", "general",
];

const VALID_PRIORITIES = ["P1", "P2", "P3", "P4"];

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserWithPermissions();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { clientId, title, description, category, priority, dueDate, estimatedMinutes, assignToUserId } = body;

    // Validation
    if (!clientId || !title?.trim() || !category) {
      return NextResponse.json(
        { error: "clientId, title, and category are required" },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    const taskPriority = priority && VALID_PRIORITIES.includes(priority) ? priority : "P3";

    // Verify client exists
    const client = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      select: { id: true },
    });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Determine assignment
    const currentUserId = Number(user.id);
    const elevated = checkElevated(user.role);
    let assignedToUserId: number | null = null;

    if (assignToUserId) {
      if (!elevated && assignToUserId !== currentUserId) {
        return NextResponse.json(
          { error: "Only managers can assign tasks to other users" },
          { status: 403 }
        );
      }
      assignedToUserId = assignToUserId;
    } else {
      // Auto-assign to creator
      assignedToUserId = currentUserId;
    }

    const now = new Date();

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.clientTask.create({
        data: {
          clientId,
          title: title.trim(),
          description: description?.trim() || null,
          category,
          priority: taskPriority,
          status: "queued",
          source: "manual",
          dueDate: dueDate ? new Date(dueDate) : null,
          estimatedMinutes: estimatedMinutes || null,
          assignedToUserId,
          assignedByUserId: currentUserId,
          statusChangedAt: now,
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          category: true,
          client: { select: { businessName: true } },
          assignedToUser: { select: { id: true, name: true } },
        },
      });

      // Record initial transition
      await tx.taskTransition.create({
        data: {
          taskId: created.id,
          fromStatus: null,
          toStatus: "queued",
          userId: currentUserId,
          comment: "Task created",
        },
      });

      return created;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        category: task.category,
        clientName: task.client.businessName,
        assignedTo: task.assignedToUser
          ? { id: task.assignedToUser.id, name: task.assignedToUser.name }
          : null,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("Task creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message ?? "Failed to create task" },
      { status: 500 }
    );
  }
}
