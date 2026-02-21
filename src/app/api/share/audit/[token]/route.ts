import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateAuditData } from "@/lib/audit/generator";
import { generateAuditHTML } from "@/lib/audit/template";

/**
 * Public audit share endpoint — no auth required.
 * Token is a one-time capability granting read access to a specific audit.
 * Re-generates the audit HTML from the original lead data so content is fresh.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || token.length < 32) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Look up the audit record by share token
  const auditRecord = await prisma.prospectAudit.findUnique({
    where: { shareToken: token },
    select: {
      leadId: true,
      repName: true,
      generatedAt: true,
    },
  });

  if (!auditRecord) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:48px;text-align:center;">
        <h2>Audit Not Found</h2>
        <p>This link may have expired or is invalid. Contact your GHM representative for a fresh copy.</p>
      </body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    const auditData = await generateAuditData(auditRecord.leadId, auditRecord.repName ?? undefined);
    const html = generateAuditHTML(auditData);

    const slug = auditData.lead.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="audit-${slug}.html"`,
        // Cache for 1 hour — rankings data won't change significantly faster
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("[share/audit] failed to regenerate:", err);
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:48px;text-align:center;">
        <h2>Unable to Load Audit</h2>
        <p>There was a problem generating this report. Please contact your GHM representative.</p>
      </body></html>`,
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
