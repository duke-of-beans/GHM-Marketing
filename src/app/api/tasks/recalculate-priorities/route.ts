import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMaster } from "@/lib/auth/session";
import { calculateTaskPriority } from "@/lib/ai/task-intelligence";

export async function POST(req: NextRequest) {
  try {
    await requireMaster();

    const { clientId } = await req.json();

    // Get tasks to prioritize
    const tasks = await prisma.clientTask.findMany({
      where: clientId ? { clientId } : {},
      include: {
        client: {
          select: {
            healthScore: true,
          },
        },
        scan: {
          select: {
            alerts: true,
          },
        },
      },
    });

    let updated = 0;

    for (const task of tasks) {
      // Extract severity from scan alerts if available
      const alerts = task.scan?.alerts as any;
      let severity: string | undefined;

      if (alerts) {
        // Check if task relates to critical alert
        if (alerts.critical?.some((a: any) => a.title === task.title)) {
          severity = "critical";
        } else if (alerts.warning?.some((a: any) => a.title === task.title)) {
          severity = "warning";
        }
      }

      // Calculate priority
      const priority = calculateTaskPriority({
        category: task.category,
        severity,
        createdAt: task.createdAt,
        clientHealthScore: task.client.healthScore || undefined,
      });

      // Update task
      await prisma.clientTask.update({
        where: { id: task.id },
        data: {
          priority: priority.priority,
          // Store priority score in a note or metadata field
          // For now, we'll just update the priority enum
        },
      });

      updated++;
    }

    return NextResponse.json({
      success: true,
      updated,
      message: `Recalculated priorities for ${updated} tasks`,
    });
  } catch (error) {
    console.error("Failed to recalculate priorities:", error);
    return NextResponse.json(
      { error: "Failed to recalculate priorities" },
      { status: 500 }
    );
  }
}
