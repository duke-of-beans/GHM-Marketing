import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { approveAllClearedPages } from "@/lib/ops/cluster-approval";

// POST /api/website-studio/[clientId]/approve-all
// Body: { jobId: number, note?: string }
// Bulk-approves all SCRVNR-cleared pages for a build job in one shot.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  const { clientId } = await params;
  const cid = parseInt(clientId);
  if (isNaN(cid)) {
    return NextResponse.json({ success: false, error: "Invalid clientId" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const jobId = body.jobId ? parseInt(body.jobId) : NaN;
  if (isNaN(jobId)) {
    return NextResponse.json({ success: false, error: "jobId is required" }, { status: 400 });
  }

  try {
    const { approvedPageIds, approvalResult } = await approveAllClearedPages(jobId, body.note);
    return NextResponse.json({
      success: true,
      data: { approvedPageIds, approvalResult },
    });
  } catch (err: any) {
    console.error("[approve-all] failed", err);
    return NextResponse.json({ success: false, error: err.message ?? "Approval failed" }, { status: 500 });
  }
}
