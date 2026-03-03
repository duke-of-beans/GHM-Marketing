/**
 * Reset Password Email Template — Sprint 36
 * New template (no existing inline equivalent).
 */

import type { TenantConfig } from "@/lib/tenant/config";
import { baseLayout, styles } from "./base";

export interface ResetPasswordEmailData {
  recipientName: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

export function resetPasswordEmailHtml(data: ResetPasswordEmailData, tenant: TenantConfig): string {
  const { recipientName, resetUrl, expiresInMinutes = 60 } = data;

  const body = `
    <p style="${styles.text}">Hi ${recipientName},</p>
    <p style="${styles.text}">
      We received a request to reset your password for your ${tenant.name} account.
      Click the button below to choose a new password.
    </p>
    ${styles.button(resetUrl, "Reset Password")}
    <p style="${styles.muted}">
      This link will expire in ${expiresInMinutes} minutes. If you didn't request a password reset,
      you can safely ignore this email — your password will remain unchanged.
    </p>
    ${styles.infoBox(`
      <p style="color:#1e40af;font-size:14px;margin:0;">
        <strong>Security tip:</strong> Never share this link with anyone. ${tenant.fromName} will
        never ask you for your password via email.
      </p>
    `)}
  `;

  return baseLayout({
    tenant,
    headerSubtitle: "PASSWORD RESET",
    body,
    previewText: `Reset your ${tenant.name} password`,
  });
}
