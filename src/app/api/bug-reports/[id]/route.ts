import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/ops/notification-service";

const STATUS_LABELS: Record<string, string> = {
  acknowledged: "Acknowledged",
  "in-progress": "In Progress",
  resolved: "Resolved",
  "wont-fix": "Won't Fix",
  new: "New",
};

/**
 * PATCH /api/bug-reports/[id]
 * Update a bug report (status, assignment, resolution). Admin only.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const reportId = parseInt(id);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    const body = await req.json();
    const { status, priority, assignedTo, resolutionNotes } = body;

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (assignedTo !== undefined) data.assignedTo = assignedTo;
    if (resolutionNotes !== undefined) data.resolutionNotes = resolutionNotes;

    // Auto-set resolution fields
    if (status === "resolved" || status === "wont-fix") {
      data.resolvedAt = new Date();
      data.resolvedBy = parseInt(session.user.id);
    }
    if (status && status !== "resolved" && status !== "wont-fix") {
      data.resolvedAt = null;
      data.resolvedBy = null;
    }

    const updated = await prisma.bugReport.update({
      where: { id: reportId },
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true } },
        resolver: { select: { id: true, name: true } },
      },
    });

    // Notify submitter when status changes
    if (status !== undefined && updated.userId) {
      const label = STATUS_LABELS[status] ?? status;
      await createNotification({
        type: "system",
        userIds: [updated.userId],
        title: `Your report was updated: ${label}`,
        body: updated.title,
        href: "/settings/bugs",
        channel: "in_app",
      }).catch(() => {}); // non-blocking
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Bug report update error:", error);
    return NextResponse.json(
      { error: "Failed to update bug report" },
      { status: 500 }
    );
  }
}
