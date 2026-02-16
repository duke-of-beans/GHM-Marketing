import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMaster } from "@/lib/auth/session";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireMaster();

    const taskId = parseInt(params.id);

    // Update task status to rejected
    const task = await prisma.clientTask.update({
      where: { id: taskId },
      data: {
        status: "rejected",
        updatedAt: new Date(),
      },
    });

    // TODO: Create notification for writer (future enhancement)

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Failed to reject task:", error);
    return NextResponse.json(
      { error: "Failed to reject task" },
      { status: 500 }
    );
  }
}
