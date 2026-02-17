import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import {
  calculateResidual,
  getFirstDayOfMonth,
} from "@/lib/payments/calculations";

/**
 * GET /api/payments/my-earnings
 * Get current user's earnings breakdown (commission + residuals)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const currentMonth = getFirstDayOfMonth();

    // Get user compensation config
    const compensationConfig = await prisma.userCompensationConfig.findUnique({
      where: { userId },
    });

    if (!compensationConfig) {
      return NextResponse.json({
        success: true,
        data: {
          totalCommissionEarned: 0,
          totalResidualEarned: 0,
          monthlyResidual: 0,
          activeClients: 0,
          pendingCommissions: 0,
          projectedMonthly: 0,
        },
      });
    }

    // Get all clients where user is sales rep
    const clients = await prisma.clientProfile.findMany({
      where: {
        salesRepId: userId,
        status: "active",
      },
      include: {
        compensationOverrides: {
          where: { userId },
        },
      },
    });

    // Calculate current month residuals
    let monthlyResidual = new Decimal(0);
    let activeClients = 0;

    for (const client of clients) {
      const override = client.compensationOverrides[0] || null;
      const residual = calculateResidual(
        compensationConfig,
        override,
        client,
        currentMonth
      );

      if (residual.shouldPay) {
        monthlyResidual = monthlyResidual.plus(residual.amount);
        activeClients++;
      }
    }

    // Get actual payments from database
    const payments = await prisma.paymentTransaction.findMany({
      where: {
        userId,
      },
    });

    const totalCommissionEarned = payments
      .filter((p) => p.type === "commission" && p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalResidualEarned = payments
      .filter((p) => p.type === "residual" && p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingCommissions = payments
      .filter((p) => p.type === "commission" && p.status === "pending")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return NextResponse.json({
      success: true,
      data: {
        totalCommissionEarned,
        totalResidualEarned,
        monthlyResidual: Number(monthlyResidual),
        activeClients,
        pendingCommissions,
        projectedMonthly: Number(monthlyResidual),
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
