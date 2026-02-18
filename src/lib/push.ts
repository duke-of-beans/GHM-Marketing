/**
 * Server-side push notification utility
 * Sends web push notifications to all subscriptions for a given user (or all users).
 */
import webpush from "web-push";
import { prisma } from "@/lib/db";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? "mailto:admin@ghmmarketing.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

/**
 * Send a push notification to all subscriptions for a specific user.
 */
export async function sendPushToUser(userId: number, payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return;

  const payloadStr = JSON.stringify(payload);
  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payloadStr
      )
    )
  );

  // Clean up expired/invalid subscriptions (410 Gone)
  const expiredEndpoints: string[] = [];
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const err = result.reason as any;
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        expiredEndpoints.push(subscriptions[i].endpoint);
      }
    }
  });

  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: expiredEndpoints } },
    });
  }
}

/**
 * Send a push notification to all subscriptions for multiple users.
 */
export async function sendPushToUsers(userIds: number[], payload: PushPayload) {
  await Promise.allSettled(userIds.map((id) => sendPushToUser(id, payload)));
}

/**
 * Check if push notifications are enabled globally for a given type.
 */
export async function isPushEnabled(type: "messages" | "tasks"): Promise<boolean> {
  const settings = await prisma.globalSettings.findFirst({
    select: { pushMessagesEnabled: true, pushTasksEnabled: true },
  });
  if (!settings) return true; // default on
  return type === "messages" ? settings.pushMessagesEnabled : settings.pushTasksEnabled;
}
