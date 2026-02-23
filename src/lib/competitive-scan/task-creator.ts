/**
 * Competitive Scan Task Auto-Creator
 * 
 * Converts actionable alerts into ClientTask records.
 * Links tasks back to the scan for traceability.
 */

import type { Alert, Alerts } from '@/types/competitive-scan';
import { prisma } from '@/lib/db';

// ============================================================================
// Task Category Mapping
// ============================================================================

// Maps alert categories to ClientTask categories
const CATEGORY_MAP: Record<string, string> = {
  'link-building': 'link-building',
  'review-mgmt': 'review-mgmt',
  'technical-seo': 'technical-seo',
  'content': 'content',
  'competitive-response': 'competitive-response',
} as const;

// ============================================================================
// Helper: Build Content Brief from Alert
// ============================================================================

function buildContentBrief(alert: Alert): string {
  const parts = [
    `**Alert:** ${alert.message}`,
    '',
    `**Details:**`,
    `- Metric: ${alert.metric}`,
    `- Change: ${alert.delta > 0 ? '+' : ''}${alert.delta}`,
  ];
  
  if (alert.competitor) {
    parts.push(`- Competitor: ${alert.competitor}`);
  }
  
  if (alert.keyword) {
    parts.push(`- Keyword: ${alert.keyword}`);
  }
  
  parts.push('');
  parts.push(`**Recommended Action:**`);
  parts.push(alert.taskSuggestion?.description || 'Review and address this competitive gap.');
  
  return parts.join('\n');
}

// ============================================================================
// Core Task Creator
// ============================================================================

interface CreateTasksParams {
  clientId: number;
  scanId: number;
  alerts: Alerts;
}

interface CreateTasksResult {
  created: number;
  tasks: Array<{ id: number; title: string }>;
  errors: string[];
}

export async function createTasksFromAlerts(
  params: CreateTasksParams
): Promise<CreateTasksResult> {
  const { clientId, scanId, alerts } = params;
  
  const created: Array<{ id: number; title: string }> = [];
  const errors: string[] = [];
  
  // Look up any AlertEvents for this scan to link tasks to
  const scanAlertEvents = await prisma.alertEvent.findMany({
    where: { sourceType: "competitive_scan", sourceId: scanId, clientId },
    select: { id: true },
  });
  const alertEventId = scanAlertEvents[0]?.id ?? null;
  
  // Collect all actionable alerts
  const actionableAlerts: Alert[] = [];
  
  for (const severityGroup of [alerts.critical, alerts.warning, alerts.info]) {
    for (const alert of severityGroup) {
      if (alert.actionable && alert.taskSuggestion) {
        actionableAlerts.push(alert);
      }
    }
  }
  
  // Create task for each actionable alert
  for (const alert of actionableAlerts) {
    try {
      const task = await prisma.clientTask.create({
        data: {
          clientId,
          scanId,
          title: alert.taskSuggestion!.title,
          category: CATEGORY_MAP[alert.taskSuggestion!.category] || 'competitive-response',
          priority: alert.severity === 'critical' ? 'high' : alert.severity === 'warning' ? 'medium' : 'low',
          status: 'todo',
          contentBrief: buildContentBrief(alert),
          targetKeywords: alert.keyword ? [alert.keyword] : [],
          competitorRef: alert.competitor || null,
          sourceAlertId: alertEventId,
        },
      });

      // Link task to AlertEvent for traceability
      if (alertEventId) {
        await prisma.taskAlertLink.create({
          data: { taskId: task.id, alertId: alertEventId },
        });
      }
      
      created.push({ id: task.id, title: task.title });
    } catch (error) {
      errors.push(`Failed to create task for alert: ${alert.message} - ${String(error)}`);
    }
  }
  
  return {
    created: created.length,
    tasks: created,
    errors,
  };
}
