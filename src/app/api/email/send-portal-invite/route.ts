import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMaster } from "@/lib/auth/session";
import { sendPortalInvite } from "@/lib/email/templates";
import { requireTenant } from "@/lib/tenant/server";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    await requireMaster();

    const { clientId } = await req.json();

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID required" },
        { status: 400 }
      );
    }

    // Get client
    const client = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      include: {
        lead: {
          select: {
            email: true,
            businessName: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (!client.lead.email) {
      return NextResponse.json(
        { error: "Client has no email address" },
        { status: 400 }
      );
    }

    // Generate portal token if not exists
    let portalToken = client.portalToken;
    if (!portalToken) {
      portalToken = randomBytes(32).toString("hex");
      await prisma.clientProfile.update({
        where: { id: clientId },
        data: { portalToken },
      });
    }

    // Generate portal URL
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal?token=${portalToken}`;

    const tenant = await requireTenant();

    // Send email
    const result = await sendPortalInvite({
      to: client.lead.email,
      clientName: client.lead.businessName,
      portalUrl,
    }, tenant);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send email", details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailId: result.id,
      portalUrl,
      message: "Portal invite sent successfully",
    });
  } catch (error) {
    console.error("Failed to send portal invite:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: (error as Error).message },
      { status: 500 }
    );
  }
}
