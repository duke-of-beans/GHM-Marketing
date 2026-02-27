import { NextRequest, NextResponse } from "next/server";
import { withPermission, getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";
import { generateWorkOrder } from "@/lib/pdf/generate-work-order";
import { sendWorkOrderEmail } from "@/lib/email";
import type { SessionUser } from "@/lib/auth/session";
import { territoryFilter } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant/server";

export async function POST(req: NextRequest) {
  // Check permission
  const permissionError = await withPermission(req, "manage_leads");
  if (permissionError) return permissionError;

  const user = await getCurrentUserWithPermissions();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { leadId, notes } = body;

  if (!leadId || typeof leadId !== "number") {
    return NextResponse.json({ success: false, error: "leadId required" }, { status: 400 });
  }

  // Verify lead access and get email
  const baseFilter = territoryFilter(user);
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, ...baseFilter },
    select: {
      id: true,
      businessName: true,
      email: true,
      assignedUser: { select: { name: true, email: true } },
      dealProducts: { select: { finalPrice: true } },
    },
  });

  if (!lead) {
    return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
  }

  if (!lead.email) {
    return NextResponse.json(
      { success: false, error: "Lead has no email address — add one before sending" },
      { status: 400 }
    );
  }

  try {
    const tenant = await requireTenant();

    // Generate PDF
    const { buffer, workOrder } = await generateWorkOrder(
      leadId,
      Number(user.id),
      tenant,
      notes
    );

    const grandTotal = lead.dealProducts.reduce(
      (sum, dp) => sum + Number(dp.finalPrice),
      0
    );

    // Send email
    const emailResult = await sendWorkOrderEmail({
      workOrderId: workOrder.id,
      pdfBuffer: buffer,
      woNumber: workOrder.woNumber,
      recipientEmail: lead.email,
      recipientName: lead.businessName,
      repName: lead.assignedUser?.name ?? user.name,
      repEmail: lead.assignedUser?.email ?? user.email ?? "",
      businessName: lead.businessName,
      grandTotal,
    }, tenant);

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: emailResult.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        workOrderId: workOrder.id,
        woNumber: workOrder.woNumber,
        emailId: emailResult.emailId,
        sentTo: lead.email,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send work order";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
