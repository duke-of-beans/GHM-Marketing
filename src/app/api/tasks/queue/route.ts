/**
 * GET /api/tasks/queue
 *
 * Personal task queue — aggregates all tasks for the current user.
 * Elevated users (admin/master) see all tasks; sales reps see only their own.
 *
 * Query params:
 *   status   — filter by status (comma-separated, default: active statuses)
 *   priority — filter by priority (e.g. "P1,P2")
 *   view     — "mine" (assigned to me), "team" (all), "unassigned"
 *   sort     — "priority" (default), "due_date", "updated", "sort_order"
 *   limit    — max results (default: 50)
 *   offset   — pagination offset (default: 0)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isElevated } from "@/lib/auth/roles";
import { ACTIVE_STATUSES, getValidTransitions } from "@/lib/tasks/status-machine";
import type { TaskStatus } from "@/lib/tasks/status-machine";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = Number(user.id);
    const elevated = isElevated(user.role);

    const params = req.nextUrl.searchParams;
    const statusFilter = params.get("status")?.split(",") ?? ACTIVE_STATUSES;
    const priorityFilter = params.get("priority")?.split(",") ?? null;
    const view = params.get("view") ?? (elevated ? "team" : "mine");
    const sort = params.get("sort") ?? "priority";
    const limit = Math.min(parseInt(params.get("limit") ?? "50"), 100);
    const offset = parseInt(params.get("offset") ?? "0");

    // ── Build where clause ──────────────────────────────────────────────────
    const where: any = {
      status: { in: statusFilter },
    };

    if (priorityFilter) {
      where.priority = { in: priorityFilter };
    }

    // View-based filtering
    if (view === "mine") {
      // Tasks explicitly assigned to me, OR tasks for my clients (legacy fallback)
      const myClientIds = await prisma.clientProfile.findMany({
        where: { lead: { assignedTo: userId } },
        select: { id: true },
      });
      where.OR = [
        { assignedToUserId: userId },
        {
          assignedToUserId: null,
          clientId: { in: myClientIds.map((c) => c.id) },
        },
      ];
    } else if (view === "unassigned") {
      where.assignedToUserId = null;
    } else if (view === "team" && !elevated) {
      // Non-elevated users can't see team view — force to "mine"
      const myClientIds = await prisma.clientProfile.findMany({
        where: { lead: { assignedTo: userId } },
        select: { id: true },
      });
      where.OR = [
        { assignedToUserId: userId },
        {
          assignedToUserId: null,
          clientId: { in: myClientIds.map((c) => c.id) },
        },
      ];
    }
    // team + elevated = no additional filter (see all)

    // ── Sort order ──────────────────────────────────────────────────────────
    let orderBy: any[];
    switch (sort) {
      case "due_date":
        orderBy = [{ dueDate: "asc" }, { priority: "asc" }, { sortOrder: "asc" }];
        break;
      case "updated":
        orderBy = [{ statusChangedAt: "desc" }];
        break;
      case "sort_order":
        orderBy = [{ sortOrder: "asc" }, { priority: "asc" }];
        break;
      default: // "priority"
        orderBy = [{ priority: "asc" }, { dueDate: "asc" }, { sortOrder: "asc" }];
    }

    // ── Fetch tasks ─────────────────────────────────────────────────────────
    const [tasks, total] = await Promise.all([
      prisma.clientTask.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          priority: true,
          status: true,
          source: true,
          dueDate: true,
          clientId: true,
          assignedToUserId: true,
          assignedByUserId: true,
          startedAt: true,
          completedAt: true,
          statusChangedAt: true,
          estimatedMinutes: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
          sourceAlertId: true,
          recurringRuleId: true,
          checklistComplete: true,
          client: {
            select: {
              businessName: true,
            },
          },
          assignedToUser: {
            select: { id: true, name: true, role: true },
          },
          assignedByUser: {
            select: { id: true, name: true },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.clientTask.count({ where }),
    ]);

    // ── Aggregate stats ─────────────────────────────────────────────────────
    const statsWhere = { ...where };
    delete statsWhere.status; // Remove status filter for stats

    const allStatusCounts = await prisma.clientTask.groupBy({
      by: ["status"],
      where: statsWhere,
      _count: { id: true },
    });

    const now = new Date();
    const overdueCount = await prisma.clientTask.count({
      where: {
        ...where,
        dueDate: { lt: now },
        status: { in: ["queued", "in_progress", "review"] },
      },
    });

    const stats = {
      byStatus: Object.fromEntries(
        allStatusCounts.map((s) => [s.status, s._count.id])
      ),
      overdue: overdueCount,
      total,
    };

    // ── Build response ──────────────────────────────────────────────────────
    const enrichedTasks = tasks.map((t) => {
      const isOverdue = t.dueDate && new Date(t.dueDate) < now &&
        ["queued", "in_progress", "review"].includes(t.status);

      const transitions = getValidTransitions(t.status as TaskStatus, elevated);

      return {
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        source: t.source,
        dueDate: t.dueDate?.toISOString() ?? null,
        clientId: t.clientId,
        clientName: t.client.businessName,
        assignedTo: t.assignedToUser
          ? { id: t.assignedToUser.id, name: t.assignedToUser.name, role: t.assignedToUser.role }
          : null,
        assignedBy: t.assignedByUser
          ? { id: t.assignedByUser.id, name: t.assignedByUser.name }
          : null,
        startedAt: t.startedAt?.toISOString() ?? null,
        completedAt: t.completedAt?.toISOString() ?? null,
        statusChangedAt: t.statusChangedAt.toISOString(),
        estimatedMinutes: t.estimatedMinutes,
        sortOrder: t.sortOrder,
        isOverdue,
        isMine: t.assignedToUserId === userId,
        transitions: transitions.map((tr) => ({
          to: tr.to,
          label: tr.label,
          requiresComment: tr.requiresComment,
        })),
        createdAt: t.createdAt.toISOString(),
        sourceAlertId: t.sourceAlertId ?? null,
        recurringRuleId: t.recurringRuleId ?? null,
        checklistComplete: t.checklistComplete,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        tasks: enrichedTasks,
        stats,
        pagination: { total, limit, offset, hasMore: offset + limit < total },
      },
    });
  } catch (error: any) {
    console.error("Task queue error:", error);
    return NextResponse.json(
      { success: false, error: error.message ?? "Failed to load task queue" },
      { status: 500 }
    );
  }
}
