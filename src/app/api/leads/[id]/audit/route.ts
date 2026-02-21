import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { territoryFilter } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/session";
import { generateAuditData } from "@/lib/audit/generator";
import { generateAuditHTML } from "@/lib/audit/template";

async function handleAudit(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) {
    return NextResponse.json({ success: false, error: "Invalid lead ID" }, { status: 400 });
  }

  const user = session.user as unknown as SessionUser;
  const baseFilter = territoryFilter(user);

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, ...baseFilter },
    select: { id: true },
  });

  if (!lead) {
    return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
  }

  try {
    const auditData = await generateAuditData(leadId, user.name ?? undefined);
    const html = generateAuditHTML(auditData);

    // Persist history record (non-fatal)
    await prisma.prospectAudit.create({
      data: {
        leadId,
        generatedBy: (user as unknown as { id: number }).id,
        repName: user.name ?? null,
        healthScore: auditData.healthScore,
        gapCount: auditData.gaps.length,
      },
    }).catch(() => {});

    const slug = auditData.lead.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="audit-${slug}.html"`,
        "X-Audit-Score": String(auditData.healthScore),
        "X-Audit-Gaps": String(auditData.gaps.length),
      },
    });
  } catch (err) {
    console.error("[audit] generate failed:", err);
    return NextResponse.json({ success: false, error: `Audit generation failed: ${err}` }, { status: 500 });
  }
}

export { handleAudit as GET, handleAudit as POST };
