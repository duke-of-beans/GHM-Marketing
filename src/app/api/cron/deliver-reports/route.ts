import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateMonthlyReportData } from "@/lib/reports/generator";
import { generateReportHTML } from "@/lib/reports/template";
import { sendReportEmail } from "@/lib/email";
import { TENANT_REGISTRY } from "@/lib/tenant/config";
import { log } from "@/lib/logger";

/**
 * POST /api/cron/deliver-reports
 * Runs daily. Finds all active clients whose reportDeliveryDay matches today.
 * Generates their monthly report and sends via Resend.
 * Schedule: 0 7 * * * (7 AM daily)
 */
export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const dayOfMonth = today.getDate();

  // TODO: resolve tenant from request when multi-tenant cron is supported
  const tenant = TENANT_REGISTRY["ghm"];

  log.info({ dayOfMonth }, "deliver-reports cron start");

  // Find clients scheduled for today
  const clients = await prisma.clientProfile.findMany({
    where: {
      reportDeliveryDay: dayOfMonth,
      status: "active",
    },
    include: {
      lead: {
        select: {
          businessName: true,
          email: true,
        },
      },
    },
  });

  if (clients.length === 0) {
    log.info(`deliver-reports: no clients scheduled today — dayOfMonth=${dayOfMonth}`);
    return NextResponse.json({ success: true, processed: 0 });
  }

  log.info(`deliver-reports: ${clients.length} client(s) scheduled — dayOfMonth=${dayOfMonth}`);

  const now = today;
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const periodLabel = periodEnd.toLocaleString("en-US", { month: "long", year: "numeric" });

  const results = { sent: 0, failed: 0, errors: [] as string[] };

  for (const client of clients) {
    try {
      // Generate report data
      const reportData = await generateMonthlyReportData(
        client.id,
        periodStart,
        periodEnd,
        { includeNarratives: true }
      );

      const reportHtml = generateReportHTML(reportData, tenant);

      // Persist report record
      const report = await prisma.clientReport.create({
        data: {
          clientId: client.id,
          type: "monthly",
          periodStart,
          periodEnd,
          content: reportData as any,
          sentToClient: false,
        },
      });

      // Determine recipients: stored delivery emails or fall back to lead email
      const recipients: string[] =
        client.reportDeliveryEmails.length > 0
          ? client.reportDeliveryEmails
          : client.lead.email
          ? [client.lead.email]
          : [];

      if (recipients.length === 0) {
        log.warn(`deliver-reports: no recipient for client ${client.id}, skipping`);
        results.errors.push(`Client ${client.id}: no recipient email`);
        results.failed++;
        continue;
      }

      const emailResult = await sendReportEmail({
        reportId: report.id,
        clientName: client.lead.businessName,
        periodLabel,
        reportHtml,
        recipientEmails: recipients,
      }, tenant);

      // Mark report as sent (or log failure)
      await prisma.clientReport.update({
        where: { id: report.id },
        data: {
          sentToClient: emailResult.success,
          sentAt: emailResult.success ? new Date() : null,
        },
      });

      if (emailResult.success) {
        log.info(`deliver-reports: sent report ${report.id} for client ${client.id}`);
        results.sent++;
      } else {
        log.error(`deliver-reports: email failed for client ${client.id} — error=${emailResult.error}`);
        results.errors.push(`Client ${client.id}: ${emailResult.error}`);
        results.failed++;
      }
    } catch (err) {
      log.error(`deliver-reports: exception for client ${client.id} — error=${String(err)}`);
      results.errors.push(`Client ${client.id}: ${String(err)}`);
      results.failed++;
    }
  }

  log.info(`deliver-reports cron complete — sent=${results.sent} failed=${results.failed}`);

  return NextResponse.json({
    success: true,
    dayOfMonth,
    scheduled: clients.length,
    ...results,
  });
}
