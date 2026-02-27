/**
 * Notification Delivery Service
 * src/lib/ops/notification-service.ts
 *
 * Multi-channel: in-app (SSE via publishDashboardEvent), push, email.
 * Reads GlobalSettings for channel preferences.
 */

import { prisma } from "@/lib/db";
import { publishDashboardEvent } from "@/lib/realtime/event-store";
import { TENANT_REGISTRY } from "@/lib/tenant/config";
import type { NotificationEvent } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateNotificationInput {
  type: "alert" | "task_assigned" | "task_status" | "report_ready" | "system";
  title: string;
  body?: string;
  href?: string;
  alertId?: number;
  clientId?: number;
  userIds?: number[];
  channel?: "in_app" | "push" | "email" | "all";
}

// ---------------------------------------------------------------------------
// Channel helpers
// ---------------------------------------------------------------------------

function deliverInApp(userId: number, event: NotificationEvent): void {
  try {
    publishDashboardEvent("user_activity", {
      notificationId: event.id,
      notificationType: event.type,
      title: event.title,
      body: event.body,
      href: event.href,
      createdAt: event.createdAt,
    }, userId);
  } catch (err) {
    console.error("[notification-service] SSE delivery failed:", err);
  }
}

async function deliverPush(userId: number, title: string, body?: string): Promise<void> {
  try {
    const { sendPushToUser } = await import("@/lib/push");
    await sendPushToUser(userId, { title, body: body ?? "" });
  } catch (err) {
    console.error("[notification-service] Push delivery failed:", err);
  }
}

async function deliverEmail(
  userId: number,
  title: string,
  body?: string,
  href?: string
): Promise<void> {
  try {
    const { sendNotificationEmail } = await import("@/lib/email");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    if (!user) return;
    // TODO: resolve tenant dynamically when multi-tenant notification routing is supported
    const tenant = TENANT_REGISTRY["ghm"];
    await sendNotificationEmail({ to: user.email, name: user.name, subject: title, body: body ?? title, href }, tenant);
  } catch (err) {
    console.error("[notification-service] Email delivery failed:", err);
  }
}

// ---------------------------------------------------------------------------
// User targeting
// ---------------------------------------------------------------------------

async function resolveTargetUsers(input: CreateNotificationInput): Promise<number[]> {
  if (input.userIds && input.userIds.length > 0) return input.userIds;
  const users = await prisma.user.findMany({
    where: { isActive: true, role: { in: ["manager", "admin"] } },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function createNotification(
  input: CreateNotificationInput
): Promise<NotificationEvent[]> {
  const settings = await prisma.globalSettings.findFirst({
    select: {
      emailNotifications: true,
      taskAssignmentAlerts: true,
      pushMessagesEnabled: true,
      pushTasksEnabled: true,
    },
  });

  const channel = input.channel ?? "in_app";
  const targetUsers = await resolveTargetUsers(input);
  if (targetUsers.length === 0) return [];

  const useEmail =
    (channel === "email" || channel === "all") &&
    settings?.emailNotifications !== false;
  const usePush =
    (channel === "push" || channel === "all") &&
    settings?.pushMessagesEnabled !== false &&
    (input.type !== "task_assigned" || settings?.pushTasksEnabled !== false);

  const created: NotificationEvent[] = [];

  for (const userId of targetUsers) {
    const event = await prisma.notificationEvent.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href,
        alertId: input.alertId,
        channel,
        delivered: false,
      },
    });
    created.push(event);

    deliverInApp(userId, event);

    if (usePush) await deliverPush(userId, input.title, input.body);
    if (useEmail) await deliverEmail(userId, input.title, input.body, input.href);

    await prisma.notificationEvent.update({
      where: { id: event.id },
      data: { delivered: true, deliveredAt: new Date() },
    });
  }

  return created;
}

export async function markNotificationsRead(
  userId: number,
  notificationIds?: number[]
): Promise<void> {
  const where = notificationIds
    ? { userId, id: { in: notificationIds } }
    : { userId, read: false };

  await prisma.notificationEvent.updateMany({
    where,
    data: { read: true, readAt: new Date() },
  });
}
