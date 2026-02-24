import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withPermission } from "@/lib/auth/api-permissions";

/**
 * GET /api/reports/schedule?clientId=123
 * Returns the current report delivery schedule for a client.
 */
export async function GET(req: NextRequest) {
  const permissionError = await withPermission(req, "manage_clients");
  if (permissionError) return permissionError;

  const { searchParams } = new URL(req.url);
  const clientId = parseInt(searchParams.get("clientId") ?? "");

  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  const client = await prisma.clientProfile.findUnique({
    where: { id: clientId },
    select: {
      reportDeliveryDay: true,
      reportDeliveryEmails: true,
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Last 12 delivery records
  const deliveries = await prisma.clientReport.findMany({
    where: { clientId, sentToClient: true },
    orderBy: { sentAt: "desc" },
    take: 12,
    select: {
      id: true,
      type: true,
      periodStart: true,
      periodEnd: true,
      sentAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    deliveryDay: client.reportDeliveryDay,
    deliveryEmails: client.reportDeliveryEmails,
    deliveries,
  });
}

/**
 * PATCH /api/reports/schedule
 * Updates delivery schedule for a client.
 * Body: { clientId: number, deliveryDay: 1 | 5 | 15 | null, deliveryEmails: string[] }
 */
export async function PATCH(req: NextRequest) {
  const permissionError = await withPermission(req, "manage_clients");
  if (permissionError) return permissionError;

  const body = await req.json();
  const { clientId, deliveryDay, deliveryEmails } = body;

  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  // Validate deliveryDay
  if (deliveryDay !== null && deliveryDay !== undefined) {
    if (![1, 5, 15].includes(deliveryDay)) {
      return NextResponse.json(
        { error: "deliveryDay must be 1, 5, 15, or null" },
        { status: 400 }
      );
    }
  }

  // Validate emails if provided
  const emails: string[] = Array.isArray(deliveryEmails) ? deliveryEmails : [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidEmails = emails.filter((e) => !emailRegex.test(e));
  if (invalidEmails.length > 0) {
    return NextResponse.json(
      { error: `Invalid email(s): ${invalidEmails.join(", ")}` },
      { status: 400 }
    );
  }

  const updated = await prisma.clientProfile.update({
    where: { id: clientId },
    data: {
      reportDeliveryDay: deliveryDay ?? null,
      reportDeliveryEmails: emails,
    },
    select: {
      reportDeliveryDay: true,
      reportDeliveryEmails: true,
    },
  });

  return NextResponse.json({ success: true, ...updated });
}
