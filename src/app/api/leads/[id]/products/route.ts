import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addDealProductSchema } from "@/lib/validations";
import type { SessionUser } from "@/lib/auth/session";
import { territoryFilter } from "@/lib/auth/session";

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

  // Verify lead access
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, ...baseFilter },
    select: { id: true },
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
