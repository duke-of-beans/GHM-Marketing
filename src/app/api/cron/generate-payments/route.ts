/**
 * GET /api/cron/generate-payments
 *
 * Vercel Cron job that runs on the 5th of every month at 12:01 AM UTC.
 * Safety-net catch-all — the webhook (invoice.paid) is the primary trigger.
 * Generates payment transactions for any active clients not already covered:
 *   - Sales residuals (month 2+ after onboarding)
 *   - Master manager fees (month 1+ after onboarding)
 *
 * Idempotent: skips any transaction that already exists for the current
 * month / client / user / type combination, so re-running is safe.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import {
  calculateResidual,
  calculateMasterFee,
  getFirstDayOfMonth,
} from "@/lib/payments/calculations";

export async function GET(req: NextRequest) {
  // Vercel Cron Authentication
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Cron] Starting monthly payment generation...");
    const startTime = Date.now();
    const currentMonth = getFirstDayOfMonth();

    // Fetch all active clients with per-client compensation overrides
    const clients = await prisma.clientProfile.findMany({
      where: { status: "active" },
      include: { compensationOverrides: true },
    });

    // Load all compensation configs into a map for O(1) lookup
    const configs = await prisma.userCompensationConfig.findMany();
    const configMap = new Map(configs.map((c) => [c.userId, c]));

    // Idempotency: get all transactions already created for this month
    const existing = await prisma.paymentTransaction.findMany({
      where: { month: currentMonth },
      select: { clientId: true, userId: true, type: true },
    });
    const existingSet = new Set(
      existing.map((t) => `${t.clientId}-${t.userId}-${t.type}`)
    );

    // Build the list of transactions to create
    const toCreate: Array<{
      clientId: number;
      userId: number;
      type: string;
      amount: Decimal;
      month: Date;
      status: string;
      notes: string;
    }> = [];

    for (const client of clients) {
      // ── Sales Residual ────────────────────────────────────────────────────
      if (client.salesRepId) {
        const salesConfig = configMap.get(client.salesRepId);
        const override =
          client.compensationOverrides.find(
            (o) => o.userId === client.salesRepId
          ) ?? null;

        if (salesConfig) {
          const result = calculateResidual(
            salesConfig,
            override,
            client,
            currentMonth
          );
          const key = `${client.id}-${client.salesRepId}-residual`;

          if (result.shouldPay && !existingSet.has(key)) {
            toCreate.push({
              clientId: client.id,
              userId: client.salesRepId,
              type: "residual",
              amount: result.amount,
              month: currentMonth,
              status: "pending",
              notes: result.reason,
            });
          }
        }
      }

      // ── Master Manager Fee ────────────────────────────────────────────────
      if (client.masterManagerId) {
        const masterConfig = configMap.get(client.masterManagerId);

        if (masterConfig) {
          const result = calculateMasterFee(
            masterConfig,
            client,
            currentMonth,
            client.masterManagerId
          );
          const key = `${client.id}-${client.masterManagerId}-master_fee`;

          if (result.shouldPay && !existingSet.has(key)) {
            toCreate.push({
              clientId: client.id,
              userId: client.masterManagerId,
              type: "master_fee",
              amount: result.amount,
              month: currentMonth,
              status: "pending",
              notes: result.reason,
            });
          }
        }
      }
    }

    // Batch insert — createMany is atomic, safe to run concurrently
    const created =
      toCreate.length > 0
        ? await prisma.paymentTransaction.createMany({ data: toCreate })
        : { count: 0 };

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(
      `[Cron] Payment generation complete in ${duration}s — ` +
        `${created.count} created, ${existing.length} already existed, ` +
        `${clients.length} clients processed`
    );

    return NextResponse.json({
      success: true,
      duration: `${duration}s`,
      created: created.count,
      skipped: existing.length,
      clientsProcessed: clients.length,
    });
  } catch (error) {
    console.error("[Cron] Payment generation failed:", error);
    return NextResponse.json(
      { error: "Payment generation failed", details: String(error) },
      { status: 500 }
    );
  }
}
