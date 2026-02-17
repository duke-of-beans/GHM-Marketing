import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import {
  calculateMonthlyProfit,
  generateClientMonthlyPayments,
  getFirstDayOfMonth,
} from "@/lib/payments/calculations";

/**
 * GET /api/payments/profitability
 * Get company profit breakdown (owners only)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    
    // Check if user is owner (IDs 1 or 2)
    if (![1, 2].includes(userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const currentMonth = getFirstDayOfMonth();

    // Get all active clients
    const clients = await prisma.clientProfile.findMany({
      where: { status: "active" },
      include: {
        compensationOverrides: true,
      },
    });

    // Get compensation configs for all users
    const compensationConfigs = await prisma.userCompensationConfig.findMany();
    const configMap = new Map(
      compensationConfigs.map((c) => [c.userId, c])
    );

    // Generate all expected payments for this month
    const allPayments = [];
    for (const client of clients) {
      const salesRepConfig = client.salesRepId
        ? configMap.get(client.salesRepId) || null
        : null;
      const masterConfig = client.masterManagerId
        ? configMap.get(client.masterManagerId) || null
        : null;
      const salesRepOverride =
        client.compensationOverrides.find(
          (o) => o.userId === client.salesRepId
        ) || null;

      const payments = generateClientMonthlyPayments(
        client,
        salesRepConfig,
        salesRepOverride,
        masterConfig,
        currentMonth,
        false
      );

      allPayments.push(...payments);
    }

    // Calculate profit breakdown
    const profit = calculateMonthlyProfit(clients, allPayments);

    // Get actual payment status from database
    const actualPayments = await prisma.paymentTransaction.findMany({
      where: {
        month: currentMonth,
      },
    });

    const totalPaid = actualPayments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalPending = actualPayments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: Number(profit.totalRevenue),
        totalCommissions: Number(profit.totalCommissions),
        totalResiduals: Number(profit.totalResiduals),
        totalMasterFees: Number(profit.totalMasterFees),
        totalExpenses: Number(profit.totalExpenses),
        netProfit: Number(profit.netProfit),
        profitMargin: profit.profitMargin,
        activeClients: clients.length,
        totalPaid,
        totalPending,
      },
    });
  } catch (error) {
    console.error("Error fetching profitability:", error);
    return NextResponse.json(
      { error: "Failed to fetch profitability" },
      { status: 500 }
    );
  }
}
