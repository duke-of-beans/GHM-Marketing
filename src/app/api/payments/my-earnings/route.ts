import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFirstDayOfMonth } from "@/lib/payments/calculations";

/**
 * GET /api/payments/my-earnings
 * Get current user's earnings breakdown (commission + residuals + upsell)
 * Phase A: Returns per-client locked rate detail and upsell commissions
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const currentMonth = getFirstDayOfMonth();

    // All payment transactions for this user
    const allPayments = await prisma.paymentTransaction.findMany({
      where: { userId },
      include: {
        client: {
          select: {
            id: true,
            businessName: true,
            retainerAmount: true,
            lockedResidualAmount: true,
            closedInMonth: true,
            onboardedMonth: true,
          },
        },
      },
      orderBy: { month: "desc" },
    });

    // Aggregate totals by type + status
    const totalCommissionEarned = allPayments
      .filter((p) => p.type === "commission" && p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalResidualEarned = allPayments
      .filter((p) => p.type === "residual" && p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalUpsellEarned = allPayments
      .filter((p) => p.type === "upsell_commission" && p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingCommissions = allPayments
      .filter((p) => p.type === "commission" && p.status === "pending")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingUpsell = allPayments
      .filter((p) => p.type === "upsell_commission" && p.status === "pending")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Current month residual transactions (pending or paid)
    const thisMonthResiduals = allPayments.filter(
      (p) =>
        p.type === "residual" &&
        p.month.getTime() === currentMonth.getTime()
    );

    // Per-client locked rate breakdown (active book)
    const activeClients = await prisma.clientProfile.findMany({
      where: { salesRepId: userId, status: "active" },
      select: {
        id: true,
        businessName: true,
        retainerAmount: true,
        lockedResidualAmount: true,
        closedInMonth: true,
        onboardedMonth: true,
      },
    });

    const clientBreakdown = activeClients.map((c) => ({
      id: c.id,
      businessName: c.businessName,
      retainerAmount: Number(c.retainerAmount),
      lockedResidualAmount: c.lockedResidualAmount ? Number(c.lockedResidualAmount) : null,
      closedInMonth: c.closedInMonth?.toISOString() ?? null,
      onboardedMonth: c.onboardedMonth?.toISOString() ?? null,
    }));

    // Monthly recurring = sum of locked rates for active clients (what the cron will pay)
    const monthlyResidual = activeClients.reduce((sum, c) => {
      return sum + (c.lockedResidualAmount ? Number(c.lockedResidualAmount) : 0);
    }, 0);

    // Upsell commission line items (recent 10, pending + paid)
    const upsellLineItems = allPayments
      .filter((p) => p.type === "upsell_commission")
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        month: p.month.toISOString(),
        clientName: p.client?.businessName ?? "Unknown",
        notes: p.notes ?? "",
      }));

    return NextResponse.json({
      success: true,
      data: {
        totalCommissionEarned,
        totalResidualEarned,
        totalUpsellEarned,
        monthlyResidual,
        activeClients: activeClients.length,
        pendingCommissions,
        pendingUpsell,
        projectedMonthly: monthlyResidual,
        clientBreakdown,
        upsellLineItems,
        // This month's residuals for status display
        thisMonthResidualsPaid: thisMonthResiduals
          .filter((p) => p.status === "paid")
          .reduce((sum, p) => sum + Number(p.amount), 0),
        thisMonthResidualsPending: thisMonthResiduals
          .filter((p) => p.status === "pending")
          .reduce((sum, p) => sum + Number(p.amount), 0),
      },
    });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}
