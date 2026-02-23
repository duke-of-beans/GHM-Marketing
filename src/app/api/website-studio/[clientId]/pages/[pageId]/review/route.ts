import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withPermission } from "@/lib/auth/api-permissions";
import { updatePageReviewStatus } from "@/lib/db/website-studio";
import { evaluateBuildJobApproval } from "@/lib/ops/cluster-approval";

// PATCH /api/website-studio/[clientId]/pages/[pageId]/review
// Body: { status: "approved" | "changes_requested", note?: string, overrideNote?: string }
// Handles single-page approval, rejection, or SCRVNR-fail override.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; pageId: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  const { clientId, pageId } = await params;
  const cid = parseInt(clientId);
  const pid = parseInt(pageId);
  if (isNaN(cid) || isNaN(pid)) {
    return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const { status, note, overrideNote } = body as {
    status?:       string;
    note?:         string;
    overrideNote?: string;
  };

  if (!status || !["approved", "changes_requested"].includes(status)) {
    return NextResponse.json(
      { success: false, error: "status must be 'approved' or 'changes_requested'" },
      { status: 400 }
    );
  }

  // Validate page belongs to this client
  const page = await prisma.composerPage.findFirst({
    where:   { id: pid, job: { property: { clientId: cid } } },
    include: { job: { select: { id: true, stage: true } } },
  });

  if (!page) {
    return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 });
  }

  // Allow override of failed SCRVNR with required note
  if (
    status === "approved" &&
    page.scrvnrStatus === "failed" &&
    !overrideNote?.trim()
  ) {
    return NextResponse.json(
      { success: false, error: "overrideNote is required to approve a page that failed SCRVNR" },
      { status: 422 }
    );
  }

  // If SCRVNR override, update gate result record and page scrvnr status
  if (status === "approved" && page.scrvnrStatus === "failed" && overrideNote) {
    await prisma.composerPage.update({
      where: { id: pid },
      data:  { scrvnrStatus: "override", updatedAt: new Date() },
    });
    // Record override on latest gate result
    await prisma.scrvnrGateResult.updateMany({
      where: { pageId: pid },
      data:  {
        overrideApplied: true,
        overrideNote:    overrideNote.trim(),
        gateStatus:      "override",
        gateOpen:        true,
      },
    });
  }

  // Apply review status
  await updatePageReviewStatus(pid, status, note);

  // Update BuildJob counts
  await prisma.buildJob.update({
    where: { id: page.job.id },
    data: {
      pagesApproved: await prisma.composerPage
        .count({ where: { jobId: page.job.id, reviewStatus: "approved" } }),
      updatedAt: new Date(),
    },
  });

  // Evaluate job-level transition (may auto-approve and create deploy task)
  const approvalResult = await evaluateBuildJobApproval(page.job.id);

  return NextResponse.json({ success: true, data: { page: pid, status, approvalResult } });
}
