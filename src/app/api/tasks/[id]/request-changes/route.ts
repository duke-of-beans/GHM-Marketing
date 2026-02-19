import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withPermission, getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const permissionError = await withPermission(req, "manage_clients");
  if (permissionError) return permissionError;

  const user = await getCurrentUserWithPermissions();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const taskId = parseInt(params.id);
    const body = await req.json();

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
        authorId: parseInt(user.id),
        type: "task-note",
        content: `Editor feedback: ${body.feedback}`,
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Failed to request changes:", error);
    return NextResponse.json(
      { error: "Failed to request changes" },
      { status: 500 }
    );
  }
}
