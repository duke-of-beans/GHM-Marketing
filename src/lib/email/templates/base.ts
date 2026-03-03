/**
 * Base Email Layout — Sprint 36 (FEAT-016c)
 *
 * Shared wrapper for all transactional emails. Provides consistent
 * header, footer, and responsive container. Every individual template
 * calls `baseLayout()` so styling changes propagate everywhere.
 */

import type { TenantConfig } from "@/lib/tenant/config";

export interface BaseLayoutOptions {
  /** Tenant config for branding (name, tagline, colors) */
  tenant: TenantConfig;
  /** Optional header subtitle (e.g. "MONTHLY PERFORMANCE REPORT") */
  headerSubtitle?: string;
  /** Email body HTML (inserted inside the content area) */
  body: string;
  /** Optional preview text (hidden preheader) */
  previewText?: string;
}

export function baseLayout(opts: BaseLayoutOptions): string {
  const { tenant, headerSubtitle, body, previewText } = opts;

  const preheader = previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${tenant.fromName}</title>
  <!--[if mso]><style>body{font-family:Arial,sans-serif!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- HEADER -->
          <tr>
            <td style="background-color:#1a1a2e;padding:24px;border-radius:8px 8px 0 0;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">${tenant.fromName}</h1>
              ${headerSubtitle ? `<p style="color:#a0a0b0;margin:4px 0 0;font-size:12px;letter-spacing:1px;text-transform:uppercase;">${headerSubtitle}</p>` : ""}
            </td>
          </tr>
          <!-- BODY -->
          <tr>
            <td style="background-color:#ffffff;padding:32px 24px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              ${body}
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background-color:#ffffff;padding:0 24px 24px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;border-radius:0 0 8px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-top:24px;border-top:1px solid #e5e7eb;">
                    <p style="color:#9ca3af;font-size:12px;margin:0;">
                      ${tenant.companyName}${tenant.companyTagline ? ` · ${tenant.companyTagline}` : ""}
                    </p>
                    <p style="color:#d1d5db;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;margin:6px 0 0;">
                      Powered by COVOS
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ── Shared style helpers ─────────────────────────────────────────────── */

export const styles = {
  /** Primary text */
  text: "color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;",
  /** Muted / secondary text */
  muted: "color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 16px;",
  /** Primary CTA button */
  button: (href: string, label: string) =>
    `<div style="text-align:center;margin:24px 0;">
      <a href="${href}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 28px;text-decoration:none;border-radius:6px;font-size:15px;font-weight:600;">
        ${label}
      </a>
    </div>`,
  /** Info box (light blue background) */
  infoBox: (content: string) =>
    `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin:20px 0;">${content}</div>`,
  /** Success box (light green background) */
  successBox: (content: string) =>
    `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px;margin:20px 0;">${content}</div>`,
  /** Data table row */
  dataRow: (label: string, value: string) =>
    `<tr>
      <td style="padding:8px 0;color:#6b7280;font-size:14px;width:40%;">${label}</td>
      <td style="padding:8px 0;color:#111827;font-weight:600;font-size:14px;">${value}</td>
    </tr>`,
  /** Full data table wrapper */
  dataTable: (rows: string) =>
    `<table role="presentation" style="width:100%;border-collapse:collapse;margin:16px 0;">${rows}</table>`,
} as const;
