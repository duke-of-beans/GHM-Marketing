import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addDealProductSchema } from "@/lib/validations";
import type { SessionUser } from "@/lib/auth/session";
import { territoryFilter } from "@/lib/auth/session";
import { evaluateUpsellCommission, getFirstDayOfMonth } from "@/lib/payments/calculations";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(
  request: NextRequest,
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

  const body = await request.json();
  const parsed = addDealProductSchema.safeParse({ ...body, leadId });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const user = session.user as unknown as SessionUser;
  const baseFilter = territoryFilter(user);

  // Verify lead access — fetch status so we can trigger upsell commission on won clients
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, ...baseFilter },
    select: { id: true, status: true, assignedTo: true },
  });
  if (!lead) {
    return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
  }

  // Get product price
  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { price: true, isActive: true },
  });
  if (!product || !product.isActive) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  // Calculate final price with discount
  const unitPrice = Number(product.price);
  const discountMultiplier = 1 - (parsed.data.discountPercent / 100);
  const finalPrice = unitPrice * parsed.data.quantity * discountMultiplier;

  const dealProduct = await prisma.dealProduct.create({
    data: {
      leadId,
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
      priceAtSale: unitPrice,
      discountPercent: parsed.data.discountPercent,
      finalPrice,
    },
    include: { product: true },
  });

  // Note: DB trigger recalculates lead.dealValueTotal/mrr/arr/ltv

  // Phase A (A6): Generate upsell commission if this lead is a won/active client
  if (lead.status === "won" && lead.assignedTo) {
    try {
      const clientProfile = await prisma.clientProfile.findUnique({
        where: { leadId },
        select: { id: true, status: true, salesRepId: true },
      });

      if (clientProfile?.status === "active" && clientProfile.salesRepId) {
        const globalSettings = await prisma.globalSettings.findFirst({
          select: { upsellCommissionRate: true },
        });
        const rate = globalSettings?.upsellCommissionRate ?? 0.10;

        const result = evaluateUpsellCommission(
          clientProfile.salesRepId,
          new Decimal(finalPrice),
          "active",
          rate
        );

        if (result.shouldPay) {
          const currentMonth = getFirstDayOfMonth();
          // Check idempotency — avoid duplicate for same client/user/month/type
          const existing = await prisma.paymentTransaction.findFirst({
            where: {
              clientId: clientProfile.id,
              userId: clientProfile.salesRepId,
              type: "upsell_commission",
              month: currentMonth,
              notes: { contains: `product:${parsed.data.productId}` },
            },
          });

          if (!existing) {
            await prisma.paymentTransaction.create({
              data: {
                clientId: clientProfile.id,
                userId: clientProfile.salesRepId,
                type: "upsell_commission",
                amount: result.amount,
                month: currentMonth,
                status: "pending",
                notes: `${result.reason} | product:${parsed.data.productId} | dealProduct:${dealProduct.id}`,
              },
            });
          }
        }
      }
    } catch (err) {
      // Non-fatal — log but don't fail the product add
      console.error("[UpsellCommission] Failed to generate upsell commission:", err);
    }
  }

  return NextResponse.json({ success: true, data: dealProduct }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const leadId = parseInt(id, 10);

  const { dealProductId } = await request.json();
  if (!dealProductId) {
    return NextResponse.json({ success: false, error: "dealProductId required" }, { status: 400 });
  }

  const user = session.user as unknown as SessionUser;
  const baseFilter = territoryFilter(user);

  // Verify lead access
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, ...baseFilter },
    select: { id: true },
  });
  if (!lead) {
    return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
  }

  await prisma.dealProduct.delete({
    where: { id: dealProductId },
  });

  return NextResponse.json({ success: true });
}
