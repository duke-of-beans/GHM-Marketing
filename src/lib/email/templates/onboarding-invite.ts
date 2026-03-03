/**
 * Onboarding Invite Email Template — Sprint 36
 * Covers both ops notification and partner notification for new onboarding submissions.
 */

import type { TenantConfig } from "@/lib/tenant/config";
import { baseLayout, styles } from "./base";

/* ── Ops team notification ──────────────────────────────────────────── */

export interface OpsOnboardingData {
  businessName: string;
  partnerName: string;
  submissionId: number;
  viewUrl: string;
}

export function opsOnboardingEmailHtml(data: OpsOnboardingData, tenant: TenantConfig): string {
  const { businessName, partnerName, submissionId, viewUrl } = data;

  const body = `
    <p style="${styles.text}">
      <strong>${businessName}</strong> has completed their onboarding form.
    </p>
    ${styles.dataTable(
      styles.dataRow("Business", businessName) +
      styles.dataRow("Partner / Sales rep", partnerName) +
      styles.dataRow("Submission ID", `#${submissionId}`)
    )}
    ${styles.button(viewUrl, "View Submission + Checklist →")}
    <p style="${styles.muted}">
      The ops checklist is ready for you. Work through each item to complete client onboarding.
    </p>
  `;

  return baseLayout({
    tenant,
    body,
    previewText: `New onboarding completed — ${businessName}`,
  });
}

/* ── Partner notification ───────────────────────────────────────────── */

export interface PartnerOnboardingData {
  partnerName: string;
  businessName: string;
  viewUrl: string;
}

export function partnerOnboardingEmailHtml(data: PartnerOnboardingData, tenant: TenantConfig): string {
  const { partnerName, businessName, viewUrl } = data;

  const body = `
    <p style="${styles.text}">Hi ${partnerName},</p>
    <p style="${styles.text}">
      Great news — <strong>${businessName}</strong> just completed their onboarding form.
      The ops team has been notified and will begin setting up their account.
    </p>
    ${styles.successBox(`
      <p style="margin:0;color:#166534;font-size:14px;font-weight:600;">What happens next</p>
      <p style="color:#166534;font-size:14px;margin:8px 0 0;line-height:1.8;">
        The ops team reviews the submission and begins account setup, technical access is collected
        and verified, then the first work order is issued and invoicing begins.
      </p>
    `)}
    ${styles.button(viewUrl, "View Submission")}
    <p style="${styles.muted}">
      Questions? Reply to this email or reach out to the ops team directly.
    </p>
  `;

  return baseLayout({
    tenant,
    body,
    previewText: `${businessName} completed onboarding!`,
  });
}
