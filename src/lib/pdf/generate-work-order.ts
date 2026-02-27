import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { prisma } from "@/lib/db";
import { WorkOrderPDF, type WorkOrderData } from "./work-order-template";
import type { TenantConfig } from "@/lib/tenant/config";

function generateWONumber(): string {
  const date = new Date();
  const prefix = `WO-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${random}`;
}

export async function generateWorkOrder(
  leadId: number,
  userId: number,
  tenant: TenantConfig,
  notes?: string
): Promise<{ buffer: Buffer; workOrder: { id: number; woNumber: string } }> {
  // Fetch lead with all needed relations
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      territory: true,
      assignedUser: true,
      dealProducts: {
        include: { product: true },
      },
      competitiveIntel: true,
    },
  });

  if (!lead) {
    throw new Error(`Lead ${leadId} not found`);
  }

  if (lead.dealProducts.length === 0) {
    throw new Error("No products attached to this lead — add products before generating a work order");
  }

  const rep = lead.assignedUser ?? (await prisma.user.findUnique({ where: { id: userId } }));
  if (!rep) throw new Error("Rep not found");

  // Calculate totals
  let oneTimeTotal = 0;
  let monthlyTotal = 0;
  let annualTotal = 0;

  const products = lead.dealProducts.map((dp) => {
    const finalPrice = Number(dp.finalPrice);
    const model = dp.product.pricingModel;

    if (model === "one_time") oneTimeTotal += finalPrice;
    else if (model === "monthly") monthlyTotal += finalPrice;
    else if (model === "annual") annualTotal += finalPrice;

    return {
      name: dp.product.name,
      pricingModel: model,
      quantity: dp.quantity,
      unitPrice: Number(dp.priceAtSale),
      discountPercent: Number(dp.discountPercent),
      finalPrice,
    };
  });

  // Map competitive intel to work order data
  const intel = lead.competitiveIntel;

  const woNumber = generateWONumber();

  const data: WorkOrderData = {
    workOrderNumber: woNumber,
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    businessName: lead.businessName,
    phone: lead.phone,
    email: lead.email ?? undefined,
    website: lead.website ?? undefined,
    address: lead.address ?? undefined,
    city: lead.city,
    state: lead.state,
    zipCode: lead.zipCode,
    repName: rep.name,
    repEmail: rep.email,
    domainRating: intel?.domainRating ?? (lead.domainRating ? Number(lead.domainRating) : undefined),
    ahrefsRank: intel?.currentRank ?? undefined,
    reviewCount: intel?.reviewCount ?? (lead.reviewCount ?? undefined),
    reviewAvg: intel?.reviewAvg ? Number(intel.reviewAvg) : (lead.reviewAvg ? Number(lead.reviewAvg) : undefined),
    performanceScore: intel?.siteSpeedMobile ?? undefined,
    seoScore: intel?.siteSpeedDesktop ?? undefined,
    organicTraffic: undefined, // Not stored in current schema
    products,
    oneTimeTotal,
    monthlyTotal,
    annualTotal,
    grandTotal: oneTimeTotal + monthlyTotal + annualTotal,
    notes,
  };

  // Render PDF to buffer (type assertion needed for React-PDF/Next.js type compatibility)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(WorkOrderPDF, { data, tenant }) as any);

  // Save work order record
  const pricingBreakdown = {
    oneTimeTotal,
    monthlyTotal,
    annualTotal,
    grandTotal: oneTimeTotal + monthlyTotal + annualTotal,
    products: products.map((p) => ({
      name: p.name,
      pricingModel: p.pricingModel,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      discountPercent: p.discountPercent,
      finalPrice: p.finalPrice,
    })),
  };

  const workOrder = await prisma.workOrder.create({
    data: {
      leadId,
      userId,
      executiveSummary: notes ?? null,
      pricingBreakdown,
    },
  });

  return {
    buffer: Buffer.from(buffer),
    workOrder: { id: workOrder.id, woNumber },
  };
}
