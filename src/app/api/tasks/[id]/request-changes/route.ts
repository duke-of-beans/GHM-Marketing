import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMaster } from "@/lib/auth/session";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireMaster();
    const taskId = parseInt(params.id);
    const body = await req.json();

    // Update task status back to in-progress
    const task = await prisma.clientTask.update({
      where: { id: taskId },
      data: {
        status: "in-progress",
        updatedAt: new Date(),
      },
    });

    // Add feedback as a note
    await prisma.clientNote.create({
      data: {
        clientId: task.clientId,
        taskId: task.id,
        authorId: user.id,
        type: "task-note",
        content: `Editor feedback: ${body.feedback}`,
      },
    });

    // TODO: Create notification for writer (future enhancement)

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Failed to request changes:", error);
    return NextResponse.json(
      { error: "Failed to request changes" },
      { status: 500 }
    );
  }
}
