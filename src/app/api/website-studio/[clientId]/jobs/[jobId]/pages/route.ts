import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withPermission } from "@/lib/auth/api-permissions";

// GET /api/website-studio/[clientId]/jobs/[jobId]/pages
// Returns all ComposerPages for a BuildJob with full review + SCRVNR data.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; jobId: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  const { clientId, jobId } = await params;
  const cid = parseInt(clientId);
  const jid = parseInt(jobId);
  if (isNaN(cid) || isNaN(jid)) {
    return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
  }

  // Verify job belongs to this client
  const job = await prisma.buildJob.findFirst({
    where: { id: jid, property: { clientId: cid } },
    select: { id: true },
  });
  if (!job) {
    return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
  }

  const pages = await prisma.composerPage.findMany({
    where:   { jobId: jid },
    orderBy: { pageOrder: "asc" },
  });

  return NextResponse.json({ success: true, data: pages });
}
