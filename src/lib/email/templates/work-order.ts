/**
 * Work Order Email Template — Sprint 36
 * Replaces inline HTML in sendWorkOrderEmail()
 */

import type { TenantConfig } from "@/lib/tenant/config";
import { baseLayout, styles } from "./base";

export interface WorkOrderEmailData {
  recipientName?: string;
  businessName: string;
  woNumber: string;
  grandTotal: number;
  repName: string;
}

export function workOrderEmailHtml(data: WorkOrderEmailData, tenant: TenantConfig): string {
  const { recipientName, businessName, woNumber, grandTotal, repName } = data;

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const body = `
    <p style="${styles.text}">
      Hi${recipientName ? ` ${recipientName}` : ""},
    </p>
    <p style="${styles.muted}">
      Thank you for your interest in our services. Please find attached your customized work order
      with our recommended digital marketing solutions for <strong>${businessName}</strong>.
    </p>
    <div style="background-color:#f5f5f5;padding:16px;border-radius:8px;margin:24px 0;">
      ${styles.dataTable(
        styles.dataRow("Work Order", woNumber) +
        `<tr>
          <td style="padding:4px 0;color:#6b7280;font-size:14px;">Total Investment</td>
          <td style="padding:4px 0;text-align:right;font-weight:bold;color:#1a1a2e;font-size:18px;">${formatCurrency(grandTotal)}</td>
        </tr>`
      )}
    </div>
    <p style="${styles.muted}">
      Your dedicated account manager <strong>${repName}</strong> is available to discuss
      any questions. Feel free to reply to this email or call us directly.
    </p>
    <p style="color:#999;font-size:12px;margin-top:32px;">
      This work order is valid for 30 days from the date of issue.
    </p>
  `;

  return baseLayout({
    tenant,
    headerSubtitle: tenant.companyTagline,
    body,
    previewText: `Work Order ${woNumber} for ${businessName}`,
  });
}
