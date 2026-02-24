// POST /api/bulk/content
// Bulk operations: approve, reject, archive
// Note: ClientContent has no assignedToId — assignment is not a feature of this model
import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import type { BulkContentOperation } from "@/lib/bulk/types";
import { bulkResponse } from "@/lib/bulk/types";

export async function POST(request: NextRequest) {
  const permErr = await withPermission(request, "manage_clients");
  if (permErr) return permErr;

  const body = await request.json() as { ids: number[] } & BulkContentOperation;
  const { ids, operation } = body;

  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  if (ids.length > 200)
    return NextResponse.json({ error: "Maximum 200 items per bulk operation" }, { status: 400 });

  const items = await prisma.clientContent.findMany({ where: { id: { in: ids } }, select: { id: true, status: true } });
  const found = new Set(items.map(i => i.id));
  const results: { id: number; error?: string }[] = [];

  const statusMap: Record<string, string> = {
    approve: "approved",
    reject: "draft",     // Rejected goes back to draft for revision
    archive: "archived",
  };

  switch (operation) {
    case "approve":
    case "reject":
    case "archive": {
      const newStatus = statusMap[operation];
      for (const id of ids) {
        if (!found.has(id)) { results.push({ id, error: "Not found" }); continue; }
        try {
          await prisma.clientContent.update({ where: { id }, data: { status: newStatus } });
          results.push({ id });
        } catch (e) { results.push({ id, error: String(e) }); }
      }
      break;
    }
    case "assign":
      // ClientContent does not have an assignedToId field — operation not supported
      return NextResponse.json({ error: "Content assignment is not supported — content is scoped to clients, not users" }, { status: 400 });
    default:
      return NextResponse.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
  }

  return bulkResponse(results);
}
