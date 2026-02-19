import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withPermission } from "@/lib/auth/api-permissions";
import { calculateTaskPriority } from "@/lib/ai/task-intelligence";

export async function POST(req: NextRequest) {
  const permissionError = await withPermission(req, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const { clientId } = await req.json();

    const tasks = await prisma.clientTask.findMany({
      where: clientId ? { clientId } : {},
      include: {
        client: {
          select: {
            healthScore: true,
          },
        },
      },
    });

    let updated = 0;

    for (const task of tasks) {
      const severity: string | undefined = undefined;

      const priority = calculateTaskPriority({
        category: task.category,
        severity,
        createdAt: task.createdAt,
        clientHealthScore: task.client.healthScore || undefined,
      });

      await prisma.clientTask.update({
        where: { id: task.id },
        data: {
          priority: priority.priority,
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
