import type { AuditData, AuditGap } from "./generator";

export function generateAuditHTML(data: AuditData): string {
  const { lead, intel, rankings, nap, gaps, healthScore, generatedAt, repName } = data;

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const scoreColor = healthScore >= 70 ? "#10b981" : healthScore >= 45 ? "#f59e0b" : "#ef4444";
  const scoreLabel = healthScore >= 70 ? "Healthy" : healthScore >= 45 ? "Needs Attention" : "Critical Issues Found";

  const severityConfig: Record<AuditGap["severity"], { color: string; bg: string; icon: string; label: string }> = {
    critical: { color: "#991b1b", bg: "#fee2e2", icon: "🚨", label: "Critical" },
    warning:  { color: "#92400e", bg: "#fef3c7", icon: "⚠️", label: "Warning" },
    opportunity: { color: "#1e40af", bg: "#dbeafe", icon: "💡", label: "Opportunity" },
  };

  const rankRow = (kw: typeof rankings[0]) => {
    const packBadge = kw.inLocalPack
      ? `<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">#${kw.localPackRank ?? "?"} Local Pack</span>`
      : `<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">Not in Pack</span>`;
    const orgBadge = kw.organicPosition
      ? `<span style="background:#f3f4f6;color:#374151;padding:2px 8px;border-radius:10px;font-size:11px;">#${kw.organicPosition} Organic</span>`
      : `<span style="background:#f3f4f6;color:#9ca3af;padding:2px 8px;border-radius:10px;font-size:11px;">Not ranked</span>`;
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;">${kw.keyword}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">${packBadge}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">${orgBadge}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;">${kw.localPackTop3.slice(0,2).join(", ") || "—"}</td>
      </tr>`;
  };

  const napRow = (n: typeof nap[0]) => {
    const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
      match:   { bg: "#d1fae5", color: "#065f46", label: "✓ Consistent" },
      mismatch: { bg: "#fef3c7", color: "#92400e", label: "⚠ Mismatch" },
      missing:  { bg: "#fee2e2", color: "#991b1b", label: "✕ Missing" },
      not_checked: { bg: "#f3f4f6", color: "#6b7280", label: "— Not checked" },
    };
    const s = statusConfig[n.status] ?? statusConfig.not_checked;
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;">${n.displayName || n.directory}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">
          <span style="background:${s.bg};color:${s.color};padding:2px 10px;border-radius:10px;font-size:11px;font-weight:600;">${s.label}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;">${n.issues.slice(0,2).join("; ") || ""}</td>
      </tr>`;
  };

  const gapCard = (g: AuditGap) => {
    const c = severityConfig[g.severity];
    return `
    <div style="border:1px solid ${c.color}40;border-left:4px solid ${c.color};border-radius:6px;padding:16px;margin-bottom:12px;background:white;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:16px;">${c.icon}</span>
        <span style="background:${c.bg};color:${c.color};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;text-transform:uppercase;">${c.label}</span>
        <span style="font-size:13px;font-weight:600;color:#111827;">${g.finding}</span>
      </div>
      <p style="font-size:12px;color:#6b7280;margin:0 0 6px 0;"><strong style="color:#374151;">Impact:</strong> ${g.impact}</p>
      <p style="font-size:12px;color:#1e40af;margin:0;"><strong>Recommendation:</strong> ${g.recommendation}</p>
    </div>`;
  };

  const kpiBox = (label: string, value: string, sub?: string, color?: string) => `
    <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;">
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;">${label}</div>
      <div style="font-size:28px;font-weight:700;color:${color ?? "#111827"};">${value}</div>
      ${sub ? `<div style="font-size:11px;color:#9ca3af;margin-top:2px;">${sub}</div>` : ""}
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script>
    // Auto-print if ?autoprint=1 is in the URL
    if (new URLSearchParams(window.location.search).get('autoprint') === '1') {
      window.addEventListener('load', () => setTimeout(() => window.print(), 400));
    }
  </script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1f2937; background: #f9fafb; }
    .page { max-width: 860px; margin: 0 auto; background: white; }
    /* Cover */
    .cover { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; padding: 56px 48px 48px; }
    .cover-logo { font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; opacity: 0.7; margin-bottom: 32px; }
    .cover-title { font-size: 36px; font-weight: 800; line-height: 1.2; margin-bottom: 8px; }
    .cover-business { font-size: 22px; font-weight: 500; opacity: 0.85; margin-bottom: 24px; }
    .cover-meta { font-size: 13px; opacity: 0.6; }
    /* Score banner */
    .score-banner { background: #f8fafc; border-bottom: 1px solid #e5e7eb; padding: 32px 48px; display: flex; align-items: center; gap: 32px; }
    .score-ring { width: 96px; height: 96px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 6px solid; flex-shrink: 0; }
    .score-ring .num { font-size: 30px; font-weight: 800; line-height: 1; }
    .score-ring .denom { font-size: 12px; opacity: 0.6; }
    .score-text h2 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .score-text p { font-size: 13px; color: #6b7280; max-width: 480px; line-height: 1.5; }
    /* Section */
    .section { padding: 32px 48px; border-bottom: 1px solid #f3f4f6; }
    .section-title { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
    /* KPI grid */
    .kpi-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .kpi-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    /* Tables */
    table { width: 100%; border-collapse: collapse; }
    th { background: #f9fafb; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
    /* CTA footer */
    .cta { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; padding: 40px 48px; text-align: center; }
    .cta h2 { font-size: 24px; font-weight: 700; margin-bottom: 12px; }
    .cta p { opacity: 0.8; font-size: 14px; max-width: 520px; margin: 0 auto 20px; line-height: 1.6; }
    .cta-pill { display: inline-block; background: white; color: #1e3a5f; padding: 10px 28px; border-radius: 24px; font-weight: 700; font-size: 14px; }
    .disclaimer { padding: 16px 48px; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
    @media print { body { background: white; } .page { max-width: 100%; } }
  </style>
</head>
<body>
<div class="page">

  <!-- COVER -->
  <div class="cover">
    <div class="cover-logo">GHM Digital Marketing Inc</div>
    <div class="cover-title">Local SEO Audit Report</div>
    <div class="cover-business">${lead.businessName}</div>
    <div class="cover-meta">
      ${lead.city}, ${lead.state} · ${lead.website?.replace(/^https?:\/\//, "") ?? "No website on file"} · Generated ${fmt(generatedAt)}
      ${repName ? ` · Prepared by ${repName}` : ""}
    </div>
  </div>

  <!-- OVERALL SCORE -->
  <div class="score-banner">
    <div class="score-ring" style="border-color:${scoreColor};color:${scoreColor};">
      <div class="num">${healthScore}</div>
      <div class="denom">/100</div>
    </div>
    <div class="score-text">
      <h2 style="color:${scoreColor};">${scoreLabel}</h2>
      <p>This audit analyzed ${lead.businessName}'s keyword rankings, local citations, online reviews, website performance, and domain authority against local competitors in ${lead.city}, ${lead.state}. We identified <strong>${gaps.filter(g => g.severity === "critical").length} critical issue${gaps.filter(g => g.severity === "critical").length !== 1 ? "s" : ""}</strong> and ${gaps.filter(g => g.severity === "warning").length} areas for improvement.</p>
    </div>
  </div>

  <!-- DIGITAL METRICS OVERVIEW -->
  <div class="section">
    <div class="section-title">📊 Digital Presence Overview</div>
    <div class="kpi-grid-4">
      ${kpiBox("Domain Rating", intel.domainRating !== null ? String(intel.domainRating) : "—", "Ahrefs authority (0–100)", intel.domainRating !== null && intel.domainRating < 20 ? "#ef4444" : "#111827")}
      ${kpiBox("Google Reviews", intel.reviewCount !== null ? String(intel.reviewCount) : "—", intel.reviewAvg !== null ? `Avg ${Number(intel.reviewAvg).toFixed(1)} ★` : undefined, intel.reviewCount !== null && intel.reviewCount < 20 ? "#ef4444" : "#111827")}
      ${kpiBox("Mobile Speed", intel.siteSpeedMobile !== null ? String(intel.siteSpeedMobile) : "—", "PageSpeed /100", intel.siteSpeedMobile !== null && intel.siteSpeedMobile < 50 ? "#ef4444" : "#111827")}
      ${kpiBox("Backlinks", intel.backlinks !== null ? intel.backlinks.toLocaleString() : "—", "Inbound links (Ahrefs)")}
    </div>
    ${intel.photosCount !== null ? `<p style="font-size:12px;color:#6b7280;margin-top:4px;">📷 ${intel.photosCount} Google Business photos on file${intel.photosCount < 10 ? " — <strong>below recommended minimum of 10</strong>" : ""}</p>` : ""}
  </div>

  ${rankings.length > 0 ? `
  <!-- KEYWORD RANKINGS -->
  <div class="section">
    <div class="section-title">🔍 Local Keyword Rankings</div>
    <p style="font-size:13px;color:#6b7280;margin-bottom:16px;">Live rankings for primary target keywords in ${lead.city}, ${lead.state}. The <strong>Local Pack</strong> (Google Maps 3-pack) drives ~70% of local clicks.</p>
    <table>
      <thead><tr><th>Keyword</th><th>Local Pack</th><th>Organic</th><th>Pack Leaders</th></tr></thead>
      <tbody>${rankings.map(rankRow).join("")}</tbody>
    </table>
  </div>` : ""}

  ${nap.length > 0 ? `
  <!-- NAP CITATIONS -->
  <div class="section">
    <div class="section-title">🗂️ Citation Consistency</div>
    ${data.napScore !== null ? `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
      <div style="font-size:32px;font-weight:800;color:${data.napScore < 60 ? "#ef4444" : data.napScore < 80 ? "#f59e0b" : "#10b981"};">${data.napScore}<span style="font-size:16px;font-weight:400;color:#6b7280;">/100</span></div>
      <div style="font-size:13px;color:#6b7280;">NAP Consistency Score<br><span style="font-size:12px;">Business name, address, and phone number accuracy across directories</span></div>
    </div>` : ""}
    <table>
      <thead><tr><th>Directory</th><th>Status</th><th>Issues</th></tr></thead>
      <tbody>${nap.map(napRow).join("")}</tbody>
    </table>
  </div>` : ""}

  <!-- GAP ANALYSIS -->
  <div class="section">
    <div class="section-title">🎯 Gap Analysis & Recommendations</div>
    ${gaps.length > 0
      ? gaps.map(gapCard).join("")
      : `<p style="color:#10b981;font-weight:600;">No significant issues found — strong local presence detected.</p>`
    }
  </div>

  <!-- WHAT WE DO -->
  <div class="section" style="background:#f8fafc;">
    <div class="section-title">🏆 How GHM Closes These Gaps</div>
    <div class="kpi-grid-3">
      <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:20px;">
        <div style="font-size:24px;margin-bottom:8px;">📍</div>
        <div style="font-weight:700;margin-bottom:6px;font-size:14px;">Local Pack Domination</div>
        <div style="font-size:12px;color:#6b7280;line-height:1.6;">GBP optimization, citation building, and local content strategy targeting the top 3 pack positions for your highest-value keywords.</div>
      </div>
      <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:20px;">
        <div style="font-size:24px;margin-bottom:8px;">⭐</div>
        <div style="font-weight:700;margin-bottom:6px;font-size:14px;">Review Generation</div>
        <div style="font-size:12px;color:#6b7280;line-height:1.6;">Automated post-service review requests via SMS and email, turning satisfied customers into public advocates that build trust and improve rankings.</div>
      </div>
      <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:20px;">
        <div style="font-size:24px;margin-bottom:8px;">📊</div>
        <div style="font-weight:700;margin-bottom:6px;font-size:14px;">Monthly Reporting</div>
        <div style="font-size:12px;color:#6b7280;line-height:1.6;">Transparent performance reports with ranking movement, citation health, and GBP insights delivered every month — no guesswork.</div>
      </div>
    </div>
  </div>

  <!-- CTA -->
  <div class="cta">
    <h2>Ready to Dominate Local Search?</h2>
    <p>This audit reveals the exact gaps holding ${lead.businessName} back from page-one visibility. GHM has a proven system for local businesses in ${lead.city} to climb rankings, earn more reviews, and convert more searchers into customers.</p>
    <div class="cta-pill">Let's Build a Plan →</div>
  </div>

  <div class="disclaimer">
    This audit was generated on ${fmt(generatedAt)} using live ranking data, Ahrefs domain analysis, and directory citation checks. Rankings may fluctuate. Contact GHM Digital Marketing Inc for a comprehensive strategy session.
    ${intel.intelAge !== null ? ` Business profile data is ${intel.intelAge} day${intel.intelAge !== 1 ? "s" : ""} old.` : ""}
  </div>

</div>
</body>
</html>`;
}
