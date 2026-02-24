// POST /api/bulk/tasks
// Bulk operations: close, reassign, create_for_clients
import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import type { BulkTaskOperation } from "@/lib/bulk/types";
import { bulkResponse } from "@/lib/bulk/types";
import { addDays } from "date-fns";

export async function POST(request: NextRequest) {
  const permErr = await withPermission(request, "manage_clients");
  if (permErr) return permErr;

  const body = await request.json() as { ids?: number[] } & BulkTaskOperation;
  const { operation } = body;
  const params = (body as { params?: Record<string, unknown> }).params ?? {};

  switch (operation) {
    case "close": {
      const { ids } = body as { ids: number[] };
      if (!Array.isArray(ids) || ids.length === 0)
        return NextResponse.json({ error: "ids array required" }, { status: 400 });
      if (ids.length > 200)
        return NextResponse.json({ error: "Maximum 200 tasks per bulk operation" }, { status: 400 });

      const tasks = await prisma.clientTask.findMany({ where: { id: { in: ids } }, select: { id: true } });
      const found = new Set(tasks.map(t => t.id));
      const results: { id: number; error?: string }[] = [];

      for (const id of ids) {
        if (!found.has(id)) { results.push({ id, error: "Not found" }); continue; }
        try {
          await prisma.clientTask.update({
            where: { id },
            data: { status: "completed", completedAt: new Date() },
          });
          results.push({ id });
        } catch (e) { results.push({ id, error: String(e) }); }
      }
      return bulkResponse(results);
    }

    case "reassign": {
      const { ids } = body as { ids: number[] };
      if (!Array.isArray(ids) || ids.length === 0)
        return NextResponse.json({ error: "ids array required" }, { status: 400 });
      // ClientTask FK is assignedToUserId, not assignedToId
      const assignedToUserId = params.assignedToId as number | null;
      if (assignedToUserId !== null) {
        const user = await prisma.user.findUnique({ where: { id: assignedToUserId }, select: { id: true, isActive: true } });
        if (!user?.isActive) return NextResponse.json({ error: "User not found or inactive" }, { status: 400 });
      }
      const tasks = await prisma.clientTask.findMany({ where: { id: { in: ids } }, select: { id: true } });
      const found = new Set(tasks.map(t => t.id));
      const results: { id: number; error?: string }[] = [];

      for (const id of ids) {
        if (!found.has(id)) { results.push({ id, error: "Not found" }); continue; }
        try {
          await prisma.clientTask.update({ where: { id }, data: { assignedToUserId } });
          results.push({ id });
        } catch (e) { results.push({ id, error: String(e) }); }
      }
      return bulkResponse(results);
    }

    case "create_for_clients": {
      const { clientIds, title, type: category, description, dueOffset } = params as {
        clientIds: number[];
        title: string;
        type: string;
        description?: string;
        dueOffset?: number;
      };
      if (!Array.isArray(clientIds) || clientIds.length === 0)
        return NextResponse.json({ error: "clientIds required in params" }, { status: 400 });
      if (!title || !category)
        return NextResponse.json({ error: "title and type (category) required in params" }, { status: 400 });
      if (clientIds.length > 200)
        return NextResponse.json({ error: "Maximum 200 clients per bulk task creation" }, { status: 400 });

      const clients = await prisma.clientProfile.findMany({ where: { id: { in: clientIds } }, select: { id: true } });
      const found = new Set(clients.map(c => c.id));
      const results: { id: number; error?: string }[] = [];
      const dueDate = dueOffset ? addDays(new Date(), dueOffset) : null;

      for (const clientId of clientIds) {
        if (!found.has(clientId)) { results.push({ id: clientId, error: "Client not found" }); continue; }
        try {
          await prisma.clientTask.create({
            data: {
              clientId,
              title,
              category,          // ClientTask uses `category` not `type`
              description: description ?? "",
              status: "queued",
              dueDate,           // ClientTask uses `dueDate` not `dueAt`
            },
          });
          results.push({ id: clientId });
        } catch (e) { results.push({ id: clientId, error: String(e) }); }
      }
      return bulkResponse(results, `Tasks created for ${results.filter(r => !r.error).length} clients`);
    }

    default:
      return NextResponse.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
  }
}
