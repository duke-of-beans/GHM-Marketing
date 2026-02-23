import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withPermission } from "@/lib/auth/api-permissions";

// GET /api/website-studio/[clientId]/pages?jobId=123
// Returns all ComposerPages for a build job (with latest SCRVNR result inline).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  const { clientId } = await params;
  const cid   = parseInt(clientId);
  const jobId = parseInt(request.nextUrl.searchParams.get("jobId") ?? "");

  if (isNaN(cid) || isNaN(jobId)) {
    return NextResponse.json({ success: false, error: "clientId and jobId are required" }, { status: 400 });
  }

  // Verify job belongs to this client
  const job = await prisma.buildJob.findFirst({
    where: { id: jobId, property: { clientId: cid } },
    select: { id: true },
  });

  if (!job) {
    return NextResponse.json({ success: false, error: "Build job not found" }, { status: 404 });
  }

  const pages = await prisma.composerPage.findMany({
    where:   { jobId },
    include: {
      scrvnrResults: {
        orderBy: { evaluatedAt: "desc" },
        take:    1,
        select: {
          gateOpen:        true,
          gateStatus:      true,
          overrideApplied: true,
          overrideNote:    true,
          pass1Score:      true,
          pass1Pass:       true,
          pass2Score:      true,
          pass2Pass:       true,
          failedSections:  true,
          evaluatedAt:     true,
        },
      },
    },
    orderBy: { pageOrder: "asc" },
  });

  return NextResponse.json({ success: true, data: pages });
}
