import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isElevated } from "@/lib/auth/roles";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = Number(user.id);
    const elevated = isElevated(user.role);

    // Build where clause based on role
    const where: any = {
      status: { in: ["queued", "in_progress"] },
    };

    if (!elevated) {
      // Sales reps: tasks for clients whose leads are assigned to them
      const myClientIds = await prisma.clientProfile.findMany({
        where: {
          lead: { assignedTo: userId },
        },
        select: { id: true },
      });
      where.clientId = { in: myClientIds.map((c) => c.id) };
    }

    // Fetch tasks with client name
    const tasks = await prisma.clientTask.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        priority: true,
        status: true,
        dueDate: true,
        clientId: true,
        client: { select: { businessName: true } },
      },
      orderBy: [
        { priority: "asc" }, // P1 first
        { dueDate: "asc" },  // Soonest due first
      ],
      take: 8,
    });

    // Count stats
    const now = new Date();
    const allTasks = await prisma.clientTask.findMany({
      where,
      select: { status: true, dueDate: true },
    });

    const stats = {
      queued: allTasks.filter((t) => t.status === "queued").length,
      in_progress: allTasks.filter((t) => t.status === "in_progress").length,
      overdue: allTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          category: t.category,
          priority: t.priority,
          status: t.status,
          dueDate: t.dueDate?.toISOString() ?? null,
          clientName: t.client.businessName,
          clientId: t.clientId,
        })),
        stats,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message ?? "Failed to load tasks" },
      { status: 500 }
    );
  }
}
