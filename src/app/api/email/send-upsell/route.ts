import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withPermission } from "@/lib/auth/api-permissions";
import { sendUpsellNotification } from "@/lib/email/templates";
import { requireTenant } from "@/lib/tenant/server";

export async function POST(req: NextRequest) {
  const permissionError = await withPermission(req, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const { opportunityId } = await req.json();

    if (!opportunityId) {
      return NextResponse.json(
        { error: "Opportunity ID required" },
        { status: 400 }
      );
    }

    const opportunity = await prisma.upsellOpportunity.findUnique({
      where: { id: opportunityId },
      include: {
        client: {
          include: {
            lead: {
              select: {
                email: true,
                businessName: true,
              },
            },
          },
        },
        product: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    if (!opportunity.client.lead.email) {
      return NextResponse.json(
        { error: "Client has no email address" },
        { status: 400 }
      );
    }

    const tenant = await requireTenant();

    const result = await sendUpsellNotification({
      to: opportunity.client.lead.email,
      clientName: opportunity.client.lead.businessName,
      productName: opportunity.product.name,
      opportunityScore: opportunity.opportunityScore,
      projectedMrr: Number(opportunity.projectedMrr),
      projectedRoi: opportunity.projectedRoi
        ? Number(opportunity.projectedRoi)
        : null,
      reasoning: opportunity.reasoning || "",
    }, tenant);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send email", details: result.error },
        { status: 500 }
      );
    }

    if (opportunity.status === "detected") {
      await prisma.upsellOpportunity.update({
        where: { id: opportunityId },
        data: {
          status: "presented",
          presentedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      emailId: result.id,
      message: "Upsell notification sent successfully",
    });
  } catch (error) {
    console.error("Failed to send upsell email:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: (error as Error).message },
      { status: 500 }
    );
  }
}
