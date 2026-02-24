// POST /api/bulk/clients
// Bulk operations on clients: status, assign_rep, assign_manager, scan, report
import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import type { BulkClientOperation } from "@/lib/bulk/types";
import { bulkResponse } from "@/lib/bulk/types";
import { generateMonthlyReportData } from "@/lib/reports/generator";
import { generateReportHTML } from "@/lib/reports/template";
import { sendReportEmail } from "@/lib/email";

const VALID_STATUSES = ["active","signed","paused","churned"];

export async function POST(request: NextRequest) {
  const permErr = await withPermission(request, "manage_clients");
  if (permErr) return permErr;

  const body = await request.json() as { ids: number[] } & BulkClientOperation;
  const { ids, operation } = body;
  const params = (body as { params?: Record<string, unknown> }).params ?? {};

  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  if (ids.length > 200)
    return NextResponse.json({ error: "Maximum 200 clients per bulk operation" }, { status: 400 });

  const clients = await prisma.clientProfile.findMany({
    where: { id: { in: ids } },
    select: { id: true, businessName: true, reportDeliveryEmails: true, lead: { select: { email: true } } },
  });
  const found = new Set(clients.map(c => c.id));
  const results: { id: number; error?: string }[] = [];

  switch (operation) {
    case "status": {
      const status = params.status as string;
      if (!VALID_STATUSES.includes(status))
        return NextResponse.json({ error: `Invalid status. Valid: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
      for (const id of ids) {
        if (!found.has(id)) { results.push({ id, error: "Not found" }); continue; }
        try {
          const data: Record<string, unknown> = { status };
          if (status === "churned") data.churnedAt = new Date();
          await prisma.clientProfile.update({ where: { id }, data });
          results.push({ id });
        } catch (e) { results.push({ id, error: String(e) }); }
      }
      break;
    }
    case "assign_rep": {
      const salesRepId = params.salesRepId as number | null;
      if (salesRepId !== null) {
        const rep = await prisma.user.findUnique({ where: { id: salesRepId }, select: { id: true, isActive: true } });
        if (!rep?.isActive) return NextResponse.json({ error: "Rep not found or inactive" }, { status: 400 });
      }
      for (const id of ids) {
        if (!found.has(id)) { results.push({ id, error: "Not found" }); continue; }
        try {
          await prisma.clientProfile.update({ where: { id }, data: { salesRepId } });
          results.push({ id });
        } catch (e) { results.push({ id, error: String(e) }); }
      }
      break;
    }
    case "assign_manager": {
      const masterManagerId = params.masterManagerId as number | null;
      if (masterManagerId !== null) {
        const mgr = await prisma.user.findUnique({ where: { id: masterManagerId }, select: { id: true, isActive: true, role: true } });
        if (!mgr?.isActive || (mgr.role !== "manager" && mgr.role !== "admin"))
          return NextResponse.json({ error: "Manager not found, inactive, or wrong role" }, { status: 400 });
      }
      for (const id of ids) {
        if (!found.has(id)) { results.push({ id, error: "Not found" }); continue; }
        try {
          await prisma.clientProfile.update({ where: { id }, data: { masterManagerId } });
          results.push({ id });
        } catch (e) { results.push({ id, error: String(e) }); }
      }
      break;
    }
    case "scan": {
      // Trigger on-demand scan for each client by creating a scan task
      // Lightweight: just set nextScanAt = now so cron picks them up next cycle
      for (const id of ids) {
        if (!found.has(id)) { results.push({ id, error: "Not found" }); continue; }
        try {
          await prisma.clientProfile.update({ where: { id }, data: { nextScanAt: new Date() } });
          results.push({ id });
        } catch (e) { results.push({ id, error: String(e) }); }
      }
      break;
    }
    case "report": {
      const sendEmail = (params.send as boolean) ?? false;
      const now = new Date();
      const periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const periodLabel = periodEnd.toLocaleString("en-US", { month: "long", year: "numeric" });

      for (const client of clients) {
        if (!found.has(client.id)) { results.push({ id: client.id, error: "Not found" }); continue; }
        try {
          const reportData = await generateMonthlyReportData(client.id, periodStart, periodEnd, { includeNarratives: false });
          const reportHtml = generateReportHTML(reportData);
          const report = await prisma.clientReport.create({
            data: { clientId: client.id, type: "monthly", periodStart, periodEnd, content: reportData as object, sentToClient: false },
          });
          if (sendEmail) {
            const recipients = client.reportDeliveryEmails.length > 0
              ? client.reportDeliveryEmails
              : client.lead.email ? [client.lead.email] : [];
            if (recipients.length > 0) {
              const result = await sendReportEmail({
                reportId: report.id, clientName: client.businessName,
                periodLabel, reportHtml, recipientEmails: recipients,
              });
              await prisma.clientReport.update({
                where: { id: report.id },
                data: { sentToClient: result.success, sentAt: result.success ? new Date() : null },
              });
            }
          }
          results.push({ id: client.id });
        } catch (e) { results.push({ id: client.id, error: String(e) }); }
      }
      break;
    }
    default:
      return NextResponse.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
  }

  return bulkResponse(results);
}
