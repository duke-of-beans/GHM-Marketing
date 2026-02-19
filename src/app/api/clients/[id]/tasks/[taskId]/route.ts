import { NextRequest, NextResponse } from "next/server";
import { updateTaskStatus } from "@/lib/db/clients";
import { withPermission } from "@/lib/auth/api-permissions";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

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
