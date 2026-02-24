// POST /api/bulk/leads
// Bulk operations on leads: status transition, assign, archive, delete, enrich
import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import { enrichLeadsBatch } from "@/lib/enrichment";
import type { BulkLeadOperation } from "@/lib/bulk/types";
import { bulkResponse } from "@/lib/bulk/types";

// LeadStatus enum values from Prisma schema
const VALID_STATUSES = ["available","scheduled","contacted","follow_up","paperwork","won","lost_rejection","lost_deferred"];

export async function POST(request: NextRequest) {
  const permErr = await withPermission(request, "manage_leads");
  if (permErr) return permErr;

  const body = await request.json() as { ids: number[] } & BulkLeadOperation;
  const { ids, operation } = body;
  const params = (body as { params?: Record<string, unknown> }).params ?? {};

  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  if (ids.length > 200)
    return NextResponse.json({ error: "Maximum 200 leads per bulk operation" }, { status: 400 });

  const leads = await prisma.lead.findMany({ where: { id: { in: ids } }, select: { id: true, status: true } });
  const found = new Set(leads.map(l => l.id));
  const results: { id: number; error?: string }[] = [];

  switch (operation) {
    case "stage": {
      // "stage" in UI terms maps to Lead.status in schema
      const status = params.stage as string;
      if (!VALID_STATUSES.includes(status))
        return NextResponse.json({ error: `Invalid status. Valid: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
      for (const id of ids) {
        if (!found.has(id)) { results.push({ id, error: "Not found" }); continue; }
        try {
          await prisma.lead.update({ where: { id }, data: { status: status as never } });
          results.push({ id });
        } catch (e) { results.push({ id, error: String(e) }); }
      }
      break;
    }
    case "assign": {
      const salesRepId = params.salesRepId as number | null;
      if (salesRepId !== null) {
        const rep = await prisma.user.findUnique({ where: { id: salesRepId }, select: { id: true, isActive: true } });
        if (!rep || !rep.isActive)
          return NextResponse.json({ error: "Rep not found or inactive" }, { status: 400 });
      }
      for (const id of ids) {
        if (!found.has(id)) { results.push({ id, error: "Not found" }); continue; }
        try {
          // Lead.assignedTo is the FK field name (not assignedToId)
          await prisma.lead.update({ where: { id }, data: { assignedTo: salesRepId } });
          results.push({ id });
        } catch (e) { results.push({ id, error: String(e) }); }
      }
      break;
    }
    case "archive": {
      for (const id of ids) {
        if (!found.has(id)) { results.push({ id, error: "Not found" }); continue; }
        try {
          await prisma.lead.update({ where: { id }, data: { status: "lost_deferred" } });
          results.push({ id });
        } catch (e) { results.push({ id, error: String(e) }); }
      }
      break;
    }
    case "delete": {
      const clients = await prisma.clientProfile.findMany({ where: { leadId: { in: ids } }, select: { leadId: true } });
      const convertedIds = new Set(clients.map(c => c.leadId));
      for (const id of ids) {
        if (!found.has(id)) { results.push({ id, error: "Not found" }); continue; }
        if (convertedIds.has(id)) { results.push({ id, error: "Lead has an active client — delete client first" }); continue; }
        try {
          await prisma.lead.delete({ where: { id } });
          results.push({ id });
        } catch (e) { results.push({ id, error: String(e) }); }
      }
      break;
    }
    case "enrich": {
      const force = (params.force as boolean) ?? false;
      if (ids.length > 50)
        return NextResponse.json({ error: "Maximum 50 leads per enrichment batch" }, { status: 400 });
      try {
        const { summary } = await enrichLeadsBatch(ids, force);
        return NextResponse.json({
          success: true,
          processed: summary.enriched,
          failed: summary.errors ?? 0,
          summary: `${summary.enriched} enriched, ${summary.skipped} skipped`,
        });
      } catch (e) {
        return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
      }
    }
    default:
      return NextResponse.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
  }

  return bulkResponse(results);
}
