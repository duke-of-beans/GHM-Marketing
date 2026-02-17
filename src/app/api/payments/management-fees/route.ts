import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import {
  calculateMasterFee,
  getFirstDayOfMonth,
} from "@/lib/payments/calculations";

/**
 * GET /api/payments/management-fees
 * Get current user's management fees (for master managers)
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
          totalFeesEarned: 0,
          monthlyFees: 0,
          managedClients: 0,
          pendingFees: 0,
        },
      });
    }

    // Get all clients where user is master manager
    const clients = await prisma.clientProfile.findMany({
      where: {
        masterManagerId: userId,
        status: "active",
      },
    });

    // Calculate current month management fees
    let monthlyFees = new Decimal(0);
    let managedClients = 0;

    for (const client of clients) {
      const fee = calculateMasterFee(
        compensationConfig,
        client,
        currentMonth,
        userId
      );

      if (fee.shouldPay) {
        monthlyFees = monthlyFees.plus(fee.amount);
        managedClients++;
      }
    }

    // Get actual payments from database
    const payments = await prisma.paymentTransaction.findMany({
      where: {
        userId,
        type: "master_fee",
      },
    });

    const totalFeesEarned = payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingFees = payments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return NextResponse.json({
      success: true,
      data: {
        totalFeesEarned,
        monthlyFees: Number(monthlyFees),
        managedClients,
        pendingFees,
      },
    });
  } catch (error) {
    console.error("Error fetching management fees:", error);
    return NextResponse.json(
      { error: "Failed to fetch management fees" },
      { status: 500 }
    );
  }
}
