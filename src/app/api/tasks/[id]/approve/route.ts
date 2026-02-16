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
    const body = await req.json();

    // Update task status to approved
    const task = await prisma.clientTask.update({
      where: { id: taskId },
      data: {
        status: "approved",
        approvedContent: body.approvedContent,
        updatedAt: new Date(),
      },
    });

    // TODO: Create notification for client manager (future enhancement)

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Failed to approve task:", error);
    return NextResponse.json(
      { error: "Failed to approve task" },
      { status: 500 }
    );
  }
}
