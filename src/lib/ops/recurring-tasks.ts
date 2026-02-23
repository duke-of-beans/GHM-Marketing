/**
 * Recurring Task Engine
 * src/lib/ops/recurring-tasks.ts
 *
 * Evaluates RecurringTaskRule records and creates ClientTask instances
 * when a rule is due. Designed to be called from a Vercel cron job.
 *
 * Cron expression parsing uses a minimal subset:
 * "0 9 1 * *" = at 09:00 on the 1st of every month
 * Full cron is not evaluated here — we compute nextRunAt at rule creation/update
 * and compare against now.
 */

import { prisma } from "@/lib/db";
import type { ClientTask, RecurringTaskRule } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RecurringTaskRunResult {
  rulesProcessed: number;
  tasksCreated: ClientTask[];
  errors: Array<{ ruleId: number; error: string }>;
}

// ---------------------------------------------------------------------------
// Due check
// ---------------------------------------------------------------------------

function isRuleDue(rule: RecurringTaskRule): boolean {
  if (!rule.isActive) return false;
  if (!rule.nextRunAt) return false;
  return rule.nextRunAt <= new Date();
}

// ---------------------------------------------------------------------------
// Next run calculation
// Supports: "0 H D * *" (minute hour day-of-month) — covers monthly use case.
// For weekly patterns use day-of-week field.
// ---------------------------------------------------------------------------

export function calculateNextRunAt(cronExpression: string, from?: Date): Date {
  const base = from ?? new Date();
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) {
    // Fallback: 30 days from now
    return new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  const [minutePart, hourPart, domPart] = parts;
  const minute = minutePart === "*" ? 0 : parseInt(minutePart, 10);
  const hour   = hourPart === "*" ? 9 : parseInt(hourPart, 10);
  const dom    = domPart === "*" ? 1 : parseInt(domPart, 10);

  // Next occurrence: try this month first, then next month
  const candidate = new Date(base);
  candidate.setDate(dom);
  candidate.setHours(hour, minute, 0, 0);

  if (candidate <= base) {
    candidate.setMonth(candidate.getMonth() + 1);
  }

  return candidate;
}

// ---------------------------------------------------------------------------
// Task creation for a single rule × client
// ---------------------------------------------------------------------------

async function createTaskForRule(
  rule: RecurringTaskRule,
  clientId: number,
  businessName: string
): Promise<ClientTask> {
  const title = rule.title.replace("{clientName}", businessName);

  const task = await prisma.clientTask.create({
    data: {
      clientId,
      title,
      description: rule.description ?? undefined,
      category: rule.category,
      priority: rule.priority,
      status: "queued",
      source: "recurring_rule",
      recurringRuleId: rule.id,
    },
  });

  // If rule has a checklist template, seed the checklist items
  if (rule.checklistTemplateId) {
    const template = await prisma.taskChecklistTemplate.findUnique({
      where: { id: rule.checklistTemplateId },
    });
    if (template) {
      const items = template.items as Array<{ label: string; sortOrder: number }>;
      await prisma.taskChecklistItem.createMany({
        data: items.map((item) => ({
          taskId: task.id,
          label: item.label,
          sortOrder: item.sortOrder,
        })),
      });
    }
  }

  return task;
}

// ---------------------------------------------------------------------------
// Main runner — called by cron
// ---------------------------------------------------------------------------

export async function processRecurringTasks(): Promise<RecurringTaskRunResult> {
  const result: RecurringTaskRunResult = {
    rulesProcessed: 0,
    tasksCreated: [],
    errors: [],
  };

  const dueRules = await prisma.recurringTaskRule.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: new Date() },
    },
  });

  for (const rule of dueRules) {
    result.rulesProcessed++;

    try {
      // Determine target clients
      let clientIds: number[];
      if (rule.clientId) {
        clientIds = [rule.clientId];
      } else {
        const clients = await prisma.clientProfile.findMany({
          where: { status: "active" },
          select: { id: true, businessName: true },
        });
        clientIds = clients.map((c) => c.id);
      }

      for (const clientId of clientIds) {
        const client = await prisma.clientProfile.findUnique({
          where: { id: clientId },
          select: { id: true, businessName: true },
        });
        if (!client) continue;

        const task = await createTaskForRule(rule, client.id, client.businessName);
        result.tasksCreated.push(task);
      }

      // Advance the rule schedule
      const nextRunAt = calculateNextRunAt(rule.cronExpression, new Date());
      await prisma.recurringTaskRule.update({
        where: { id: rule.id },
        data: { lastRunAt: new Date(), nextRunAt },
      });
    } catch (err) {
      result.errors.push({
        ruleId: rule.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}
