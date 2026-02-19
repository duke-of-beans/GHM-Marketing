import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateTaskStatus } from "@/lib/db/clients";
import type { SessionUser } from "@/lib/auth/session";
import { isElevated } from "@/lib/auth/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser;
  if (!isElevated(user.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { taskId } = await params;
  const body = await request.json();

  if (!body.status) {
    return NextResponse.json(
      { success: false, error: "status is required" },
      { status: 400 }
    );
  }

  const validStatuses = [
    "queued",
    "in-progress",
    "in-review",
    "approved",
    "deployed",
    "measured",
    "dismissed",
  ];

  if (!validStatuses.includes(body.status)) {
    return NextResponse.json(
      { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const task = await updateTaskStatus(parseInt(taskId), body.status, {
    approvedContent: body.approvedContent,
    deployedUrl: body.deployedUrl,
    outcomeMetrics: body.outcomeMetrics,
  });

  return NextResponse.json({ success: true, data: task });
}
