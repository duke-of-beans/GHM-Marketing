/**
 * Alert Rule Evaluation Engine
 * src/lib/ops/alert-engine.ts
 *
 * Post-scan hook pattern: called AFTER executeScan() completes.
 * Also callable from payment-check and rank-poll crons.
 * Does NOT modify existing alert-generator.ts — adds a rule evaluation layer on top.
 */

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { AlertEvent, AlertRule, ClientTask, NotificationEvent } from "@prisma/client";
import { createNotification } from "./notification-service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AlertSourceType =
  | "competitive_scan"
  | "payment_check"
  | "rank_tracking"
  | "nap_scan"
  | "health"
  | "manual";

export interface AlertEngineInput {
  sourceType: AlertSourceType;
  sourceId: number;
  clientId: number;
  /** Source-specific data to evaluate against rule conditions */
  data: Record<string, unknown>;
}

export interface AlertEngineResult {
  alertsCreated: AlertEvent[];
  tasksCreated: ClientTask[];
  notificationsSent: NotificationEvent[];
}

// ---------------------------------------------------------------------------
// Condition evaluation
// ---------------------------------------------------------------------------

interface ConditionConfig {
  field: string;
  operator: "gt" | "lt" | "gte" | "lte" | "eq" | "neq" | "contains" | "changed_to";
  value: unknown;
  /** Rolling window in minutes for time-based conditions */
  window?: number;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((cur: unknown, key) => {
    if (cur && typeof cur === "object") {
      return (cur as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function evaluateCondition(
  data: Record<string, unknown>,
  config: ConditionConfig
): boolean {
  const actual = getNestedValue(data, config.field);

  if (actual === undefined || actual === null) return false;

  const expected = config.value;

  switch (config.operator) {
    case "gt":  return Number(actual) > Number(expected);
    case "lt":  return Number(actual) < Number(expected);
    case "gte": return Number(actual) >= Number(expected);
    case "lte": return Number(actual) <= Number(expected);
    case "eq":  return actual === expected;
    case "neq": return actual !== expected;
    case "contains":
      return typeof actual === "string" && actual.includes(String(expected));
    case "changed_to":
      // Expects data to contain { previous_<field>, <field> }
      return actual === expected && getNestedValue(data, `previous_${config.field}`) !== expected;
    default:
      return false;
  }
}

function isCoolingDown(rule: AlertRule): boolean {
  if (!rule.lastTriggeredAt) return false;
  const cooldownMs = rule.cooldownMinutes * 60 * 1000;
  return Date.now() - rule.lastTriggeredAt.getTime() < cooldownMs;
}


// ---------------------------------------------------------------------------
// Task creation from alert rule template
// ---------------------------------------------------------------------------

async function createTaskFromRule(
  rule: AlertRule,
  alert: AlertEvent,
  clientId: number
): Promise<ClientTask | null> {
  if (!rule.autoCreateTask || !rule.taskTemplate) return null;

  const template = rule.taskTemplate as {
    title?: string;
    category?: string;
    priority?: string;
    contentBrief?: Record<string, unknown>;
  };

  // Fetch client name for interpolation
  const client = await prisma.clientProfile.findUnique({
    where: { id: clientId },
    select: { id: true, businessName: true },
  });
  if (!client) return null;

  const title = (template.title ?? `Alert: ${alert.title}`)
    .replace("{clientName}", client.businessName)
    .replace("{alertType}", alert.type);

  const task = await prisma.clientTask.create({
    data: {
      clientId,
      title,
      category: template.category ?? "ops",
      priority: template.priority ?? "P3",
      status: "queued",
      source: "alert_rule",
      sourceAlertId: alert.id,
      contentBrief: {
        alertId: alert.id,
        alertType: alert.type,
        alertSeverity: alert.severity,
        alertTitle: alert.title,
        ...(template.contentBrief ?? {}),
      },
    },
  });

  // Link task ↔ alert
  await prisma.taskAlertLink.create({
    data: { taskId: task.id, alertId: alert.id },
  });

  return task;
}


// ---------------------------------------------------------------------------
// Core evaluation loop
// ---------------------------------------------------------------------------

export async function evaluateAlertRules(
  input: AlertEngineInput
): Promise<AlertEngineResult> {
  const result: AlertEngineResult = {
    alertsCreated: [],
    tasksCreated: [],
    notificationsSent: [],
  };

  // Fetch active rules for this source type
  const rules = await prisma.alertRule.findMany({
    where: { sourceType: input.sourceType, isActive: true },
  });

  for (const rule of rules) {
    // Skip if in cooldown window
    if (isCoolingDown(rule)) continue;

    // Evaluate the condition
    const config = rule.conditionConfig as unknown as ConditionConfig;
    const triggered = evaluateCondition(input.data, config);
    if (!triggered) continue;

    // Create AlertEvent
    const alert = await prisma.alertEvent.create({
      data: {
        type: `${input.sourceType}_rule`,
        severity: rule.severity,
        clientId: input.clientId,
        title: rule.name,
        description: rule.description,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        metadata: input.data as unknown as Prisma.InputJsonValue,
        ruleId: rule.id,
      },
    });
    result.alertsCreated.push(alert);

    // Update rule lastTriggeredAt
    await prisma.alertRule.update({
      where: { id: rule.id },
      data: { lastTriggeredAt: new Date() },
    });

    // Optionally create task
    if (rule.autoCreateTask) {
      const task = await createTaskFromRule(rule, alert, input.clientId);
      if (task) {
        result.tasksCreated.push(task);
        await prisma.alertEvent.update({
          where: { id: alert.id },
          data: { autoTaskCreated: true },
        });
      }
    }

    // Optionally notify
    if (rule.notifyOnTrigger) {
      const notifications = await createNotification({
        type: "alert",
        title: `[${rule.severity.toUpperCase()}] ${rule.name}`,
        body: rule.description ?? undefined,
        href: input.clientId ? `/clients/${input.clientId}` : "/alerts",
        alertId: alert.id,
        clientId: input.clientId,
      });
      result.notificationsSent.push(...notifications);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Convenience wrappers for specific source types
// ---------------------------------------------------------------------------

/** Called at end of executeScan() */
export async function evaluateScanAlerts(
  clientId: number,
  scanId: number,
  scanData: { criticalCount: number; warningCount: number; infoCount: number }
): Promise<AlertEngineResult> {
  return evaluateAlertRules({
    sourceType: "competitive_scan",
    sourceId: scanId,
    clientId,
    data: {
      criticalCount: scanData.criticalCount,
      warningCount: scanData.warningCount,
      infoCount: scanData.infoCount,
      totalAlerts: scanData.criticalCount + scanData.warningCount + scanData.infoCount,
      hasCritical: scanData.criticalCount > 0,
    },
  });
}

/** Called from payment-check cron when status changes */
export async function evaluatePaymentAlert(
  clientId: number,
  invoiceId: number,
  paymentStatus: string,
  previousStatus: string
): Promise<AlertEngineResult> {
  return evaluateAlertRules({
    sourceType: "payment_check",
    sourceId: invoiceId,
    clientId,
    data: {
      paymentStatus,
      previous_paymentStatus: previousStatus,
      isOverdue: paymentStatus === "overdue",
    },
  });
}

/** Called from rank-poll cron when significant rank change detected */
export async function evaluateRankAlert(
  clientId: number,
  snapshotId: number,
  rankDelta: number,
  keyword: string
): Promise<AlertEngineResult> {
  return evaluateAlertRules({
    sourceType: "rank_tracking",
    sourceId: snapshotId,
    clientId,
    data: {
      rankDelta,
      keyword,
      isDecline: rankDelta < 0,
      isCriticalDecline: rankDelta <= -20,
      isWarningDecline: rankDelta <= -10 && rankDelta > -20,
    },
  });
}
