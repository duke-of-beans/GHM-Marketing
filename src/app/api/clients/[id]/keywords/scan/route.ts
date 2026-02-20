/**
 * POST /api/clients/[id]/keywords/scan
 * Trigger an on-demand rank scan for a client.
 */

import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import { postSerpTasks } from "@/lib/enrichment/providers/dataforseo";
import { logProviderCall } from "@/lib/enrichment/cost-tracker";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  const { id } = await params;
  const clientId = parseInt(id);
  if (isNaN(clientId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const client = await prisma.clientProfile.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      lead: { select: { website: true, city: true, state: true, zipCode: true } },
      keywordTrackers: {
        where: { isActive: true },
        select: { id: true, keyword: true },
      },
    },
  });

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  if (client.keywordTrackers.length === 0) {
    return NextResponse.json({ error: "No active keywords to scan" }, { status: 400 });
  }

  const domain =
    client.lead.website?.replace(/^https?:\/\//, "").replace(/\/.*$/, "") ?? "";
  const zipCode = client.lead.zipCode ?? "00000";

  const tasks = client.keywordTrackers.map((kw) => ({
    keyword: kw.keyword,
    zipCode,
    domain,
    tag: `${clientId}_${kw.id}`,
  }));

  const t0 = Date.now();
  const taskIds = await postSerpTasks(tasks);
  const costUsd = taskIds.length * 0.0006;

  await logProviderCall({
    provider: "dataforseo",
    operation: "serp_task_post_manual",
    clientId,
    cacheHit: false,
    costUsd,
    latencyMs: Date.now() - t0,
    success: taskIds.length > 0,
  });

  if (taskIds.length > 0) {
    await prisma.pendingRankTask.createMany({
      data: taskIds.map((taskId, i) => ({
        taskId,
        clientId,
        keywordId: client.keywordTrackers[i]?.id ?? client.keywordTrackers[0].id,
        zipCode,
        keyword: client.keywordTrackers[i]?.keyword ?? "",
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({
    ok: true,
    tasksPosted: taskIds.length,
    estimatedCost: costUsd,
    note: "Results available in ~5 minutes via rank-poll cron.",
  });
}
