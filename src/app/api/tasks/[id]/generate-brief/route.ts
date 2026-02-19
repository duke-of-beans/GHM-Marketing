import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withPermission } from "@/lib/auth/api-permissions";
import { generateContentBrief } from "@/lib/ai/task-intelligence";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const permissionError = await withPermission(req, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const taskId = parseInt(params.id);

    const task = await prisma.clientTask.findUnique({
      where: { id: taskId },
      include: {
        client: {
          select: {
            businessName: true,
            healthScore: true,
            competitors: {
              select: {
                businessName: true,
                domain: true,
              },
              take: 3,
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const competitorInfo = task.client.competitors
      .map((c) => `${c.businessName}${c.domain ? ` (${c.domain})` : ""}`)
      .join(", ");

    const brief = await generateContentBrief({
      title: task.title,
      description: task.description || "",
      clientName: task.client.businessName,
      category: task.category,
      competitorInfo: competitorInfo || undefined,
    });

    const updated = await prisma.clientTask.update({
      where: { id: taskId },
      data: {
        contentBrief: brief,
      },
    });

    return NextResponse.json({
      success: true,
      brief,
      taskId: updated.id,
    });
  } catch (error) {
    console.error("Failed to generate AI brief:", error);
    return NextResponse.json(
      { error: "Failed to generate brief", details: (error as Error).message },
      { status: 500 }
    );
  }
}
