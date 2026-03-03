/**
 * Report Delivery Email Template — Sprint 36
 * Replaces inline HTML in sendReportEmail()
 */

import type { TenantConfig } from "@/lib/tenant/config";
import { baseLayout, styles } from "./base";

export interface ReportDeliveryEmailData {
  clientName: string;
  periodLabel: string;
  reportHtml: string;
  pdfUrl?: string;
  reportId: number;
}

export function reportDeliveryEmailHtml(data: ReportDeliveryEmailData, tenant: TenantConfig): string {
  const { clientName, periodLabel, reportHtml, pdfUrl, reportId } = data;

  const pdfButton = pdfUrl
    ? `<div style="margin-top:24px;padding-top:24px;border-top:1px solid #e5e5e5;">
        ${styles.button(pdfUrl, "Download Full PDF Report")}
      </div>`
    : "";

  const body = `
    <h2 style="color:#1a1a2e;margin:0 0 8px;">${clientName}</h2>
    <p style="color:#666;margin:0 0 24px;font-size:14px;">Performance Summary — ${periodLabel}</p>
    ${reportHtml}
    ${pdfButton}
    <p style="color:#999;font-size:12px;margin-top:32px;">
      Questions? Reply to this email or contact your account manager directly.
      <br>Report ID: ${reportId}
    </p>
  `;

  return baseLayout({
    tenant,
    headerSubtitle: "MONTHLY PERFORMANCE REPORT",
    body,
    previewText: `${clientName} — ${periodLabel} Performance Report`,
  });
}
