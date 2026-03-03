/**
 * Generic Notification Email Template — Sprint 36
 * Replaces inline HTML in sendNotificationEmail() and sendStatusNotification()
 */

import type { TenantConfig } from "@/lib/tenant/config";
import { baseLayout, styles } from "./base";

/* ── Generic notification ───────────────────────────────────────────── */

export interface NotificationEmailData {
  recipientName: string;
  subject: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
}

export function notificationEmailHtml(data: NotificationEmailData, tenant: TenantConfig): string {
  const { recipientName, subject, body, actionUrl, actionLabel } = data;

  const actionButton = actionUrl
    ? styles.button(actionUrl, actionLabel || "View Details")
    : "";

  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">${subject}</h2>
    <p style="${styles.text}">Hi ${recipientName},</p>
    <p style="${styles.text};white-space:pre-wrap;">${body}</p>
    ${actionButton}
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
      ${tenant.name} Dashboard — automated notification
    </p>
  `;

  return baseLayout({
    tenant,
    body: content,
    previewText: subject,
  });
}

/* ── Status update notification ─────────────────────────────────────── */

export interface StatusNotificationData {
  recipientEmail: string;
  businessName: string;
  newStatus: string;
  repName: string;
  message?: string;
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: "We've scheduled your consultation",
  contacted: "Thanks for connecting with us",
  follow_up: "Following up on our conversation",
  paperwork: "Your proposal is ready for review",
  won: "Welcome aboard! Let's get started",
};

export function statusNotificationEmailHtml(data: StatusNotificationData, tenant: TenantConfig): string {
  const subject = STATUS_LABELS[data.newStatus] || `Update: ${data.businessName}`;

  const body = `
    <h2 style="color:#1a1a2e;margin:0 0 16px;">${subject}</h2>
    <p style="${styles.text}">
      Hi, this is ${data.repName} from ${tenant.fromName}.
    </p>
    ${data.message ? `<p style="${styles.text}">${data.message}</p>` : ""}
    <p style="${styles.text}">
      If you have any questions, feel free to reply to this email.
    </p>
  `;

  return baseLayout({
    tenant,
    body,
    previewText: subject,
  });
}

export { STATUS_LABELS };
