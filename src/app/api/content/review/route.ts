/**
 * POST /api/content/review
 * Approve or reject a ClientContent item from the Review Queue.
 *
 * This is the canonical write path for Content Studio items surfaced in the
 * review queue. It writes directly to ClientContent.status so both the Review
 * Queue and the Content Studio tab read from the same record after the action.
 *
 * BUG-007: Previously, approving a task in the Review Queue wrote only to
 * ClientTask.status, leaving ClientContent untouched. Now content items in
 * review go through this route, which updates the authoritative record.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/auth/api-permissions";

export async function POST(req: NextRequest) {
  const permissionError = await withPermission(req, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const body = await req.json();
    const { contentId, action } = body as {
      contentId: number;
      action: "approve" | "reject" | "request_changes";
    };

    if (!contentId || !action) {
      return NextResponse.json(
        { error: "Missing required fields: contentId, action" },
        { status: 400 }
      );
    }

    const content = await prisma.clientContent.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      return NextResponse.json({ error: "Content item not found" }, { status: 404 });
    }

    if (content.status !== "review") {
      return NextResponse.json(
        { error: `Content is in "${content.status}" status — only items in "review" can be actioned` },
        { status: 409 }
      );
    }

    const newStatus =
      action === "approve" ? "approved" :
      action === "reject" ? "draft" :       // reject sends back to draft
      "draft";                              // request_changes also returns to draft

    const updated = await prisma.clientContent.update({
      where: { id: contentId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, content: updated });
  } catch (error) {
    console.error("Failed to action content review:", error);
    return NextResponse.json(
      { error: "Failed to update content status" },
      { status: 500 }
    );
  }
}
