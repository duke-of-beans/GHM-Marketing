import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withPermission } from "@/lib/auth/api-permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const permissionError = await withPermission(req, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const taskId = parseInt(params.id);

    const task = await prisma.clientTask.update({
      where: { id: taskId },
      data: {
        status: "rejected",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Failed to reject task:", error);
    return NextResponse.json(
      { error: "Failed to reject task" },
      { status: 500 }
    );
  }
}
