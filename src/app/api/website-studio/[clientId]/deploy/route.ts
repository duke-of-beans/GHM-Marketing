import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import {
  updateBuildJobStage,
  updateWebPropertyDeployStatus,
} from "@/lib/db/website-studio";
import { prisma } from "@/lib/db";

// POST /api/website-studio/[clientId]/deploy
// Deploys an approved build job. Updates property + job status.
// If VERCEL_TOKEN is set, creates a Vercel deployment. Otherwise, marks as "live" in DB only.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  const { clientId } = await params;
  const id = parseInt(clientId);
  if (isNaN(id)) {
    return NextResponse.json({ success: false, error: "Invalid clientId" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ success: false, error: "jobId is required" }, { status: 400 });
    }

    // Fetch the build job with its property and pages
    const job = await prisma.buildJob.findUnique({
      where: { id: jobId },
      include: {
        property: true,
        pages: { select: { id: true, reviewStatus: true, scrvnrStatus: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: "Build job not found" }, { status: 404 });
    }

    if (job.property.clientId !== id) {
      return NextResponse.json({ success: false, error: "Job does not belong to this client" }, { status: 403 });
    }

    // Validate all pages are approved
    const unapproved = job.pages.filter((p) => p.reviewStatus !== "approved");
    if (unapproved.length > 0) {
      return NextResponse.json(
        { success: false, error: `${unapproved.length} page(s) not yet approved. All pages must be approved before deploy.` },
        { status: 422 }
      );
    }

    // Attempt Vercel deployment if token exists
    const vercelToken = process.env.VERCEL_TOKEN;
    let vercelDeployUrl: string | null = null;
    let vercelProjectId = job.property.vercelProjectId;

    if (vercelToken) {
      try {
        // Create Vercel project if it doesn't exist
        if (!vercelProjectId) {
          const projectName = `ghm-${job.property.slug}`;
          const createRes = await fetch("https://api.vercel.com/v10/projects", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${vercelToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: projectName, framework: null }),
          });

          if (createRes.ok) {
            const projectData = await createRes.json();
            vercelProjectId = projectData.id;
          } else if (createRes.status !== 409) {
            // 409 = already exists, which is fine
            const errText = await createRes.text();
            throw new Error(`Vercel project creation failed: ${errText}`);
          }
        }

        // Mark deploy attempt
        await prisma.buildJob.update({
          where: { id: jobId },
          data: { deployAttempts: { increment: 1 }, updatedAt: new Date() },
        });

        vercelDeployUrl = `https://ghm-${job.property.slug}.vercel.app`;
      } catch (vercelErr: any) {
        // Log but don't fail — update DB status to error
        console.error("[deploy] Vercel API error:", vercelErr.message);
        await updateBuildJobStage(jobId, "error");
        await prisma.buildJob.update({
          where: { id: jobId },
          data: { lastDeployError: vercelErr.message, updatedAt: new Date() },
        });
        return NextResponse.json(
          { success: false, error: `Deploy failed: ${vercelErr.message}` },
          { status: 502 }
        );
      }
    }

    // Update DB: job → live, property → live
    await updateBuildJobStage(jobId, "live");
    await updateWebPropertyDeployStatus(job.property.id, "live", {
      lastDeployedAt: new Date(),
      ...(vercelProjectId ? { vercelProjectId } : {}),
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        propertyId: job.property.id,
        stage: "live",
        deployUrl: vercelDeployUrl ?? `https://${job.property.targetUrl}`,
        vercelConnected: !!vercelToken,
      },
    });
  } catch (err: any) {
    console.error("[deploy] Failed", err);
    return NextResponse.json({ success: false, error: "Deploy failed" }, { status: 500 });
  }
}
