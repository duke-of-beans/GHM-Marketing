import type { DemoData } from "./generator";

export function generateDemoHTML(data: DemoData): string {
  const { lead, currentRankings, projectedRankings, satelliteSites, competitorSnapshot, monthlyValue, generatedAt, expiresAt, repName } = data;

  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const packInNow = currentRankings.filter((r) => r.inLocalPack).length;
  const packInProjected = projectedRankings.filter((r) => r.projectedLocalPack).length;

  const rankRow = (curr: typeof currentRankings[0], proj: typeof projectedRankings[0]) => {
    const currBadge = curr.inLocalPack
      ? `<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">Local Pack</span>`
      : `<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">Not in Pack</span>`;
    const projBadge = `<span style="background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">🎯 #${proj.projectedPosition ?? 1} Local Pack</span>`;
    const arrow = !curr.inLocalPack ? `<span style="color:#16a34a;font-size:18px;">→</span>` : `<span style="color:#16a34a;font-size:18px;">↑</span>`;
    return `
      <tr>
        <td style="padding:12px 14px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:500;">${curr.keyword}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #f3f4f6;">${currBadge}<br><span style="font-size:11px;color:#6b7280;margin-top:3px;display:block;">${curr.top3Competitors.slice(0,2).join(", ") || "—"}</span></td>
        <td style="padding:12px 14px;border-bottom:1px solid #f3f4f6;text-align:center;">${arrow}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #f3f4f6;">${projBadge}<br><span style="font-size:11px;color:#16a34a;margin-top:3px;display:block;font-weight:600;">Est. 90 days</span></td>
      </tr>`;
  };

  const satRow = (s: typeof satelliteSites[0], i: number) => {
    const statusBadge = s.status === "live"
      ? `<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">✓ Live</span>`
      : s.status === "building"
      ? `<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">⚙ Building</span>`
      : `<span style="background:#f3f4f6;color:#374151;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">📋 Planned</span>`;
    return `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#374151;font-family:monospace;">${s.domain}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;">${s.targetKeyword}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;">${statusBadge}</td>
      </tr>`;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GHM Digital Marketing — Your SEO Preview: ${lead.businessName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #f8fafc; color: #111827; }
    @media print { .no-print { display: none !important; } body { background: white; } }
  </style>
</head>
<body>

<!-- HEADER BAR -->
<div style="background:#1e3a5f;color:white;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
  <div>
    <span style="font-weight:800;font-size:16px;letter-spacing:-0.5px;">GHM Digital Marketing</span>
    <span style="opacity:0.5;margin:0 8px;">·</span>
    <span style="opacity:0.7;font-size:13px;">Personalized SEO Preview</span>
  </div>
  <div style="font-size:12px;opacity:0.6;">Preview expires ${fmt(expiresAt)} · ${repName ? `Prepared by ${repName}` : "GHM Sales Team"}</div>
</div>

<!-- HERO -->
<section style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);color:white;padding:56px 32px 40px;text-align:center;">
  <p style="font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;opacity:0.55;margin-bottom:14px;">Your GHM Account Preview</p>
  <h1 style="font-size:clamp(26px,5vw,46px);font-weight:800;line-height:1.15;margin-bottom:14px;">${lead.businessName}<br><span style="opacity:0.7;font-size:0.6em;font-weight:400;">What the next 90 days looks like with GHM</span></h1>
  <p style="opacity:0.75;font-size:15px;max-width:520px;margin:0 auto 32px;">${lead.city}, ${lead.state} · Generated ${fmt(generatedAt)}</p>
  <div style="display:flex;justify-content:center;gap:16px;flex-wrap:wrap;">
    <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:16px 24px;text-align:center;min-width:130px;">
      <div style="font-size:28px;font-weight:800;">${packInNow}/${currentRankings.length}</div>
      <div style="font-size:11px;opacity:0.7;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">In Local Pack Now</div>
    </div>
    <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:16px 24px;text-align:center;min-width:130px;">
      <div style="font-size:28px;font-weight:800;color:#86efac;">${packInProjected}/${projectedRankings.length}</div>
      <div style="font-size:11px;opacity:0.7;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">In Pack at 90 Days</div>
    </div>
    <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:16px 24px;text-align:center;min-width:130px;">
      <div style="font-size:28px;font-weight:800;color:#86efac;">$${monthlyValue.estimatedRevGain.toLocaleString()}</div>
      <div style="font-size:11px;opacity:0.7;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Est. Monthly Rev Gain</div>
    </div>
  </div>
</section>

<!-- RANKING IMPACT -->
<section style="max-width:900px;margin:0 auto;padding:48px 24px;">
  <h2 style="font-size:22px;font-weight:800;margin-bottom:6px;">Ranking Impact — Current vs. Projected (90 Days)</h2>
  <p style="color:#64748b;font-size:14px;margin-bottom:24px;">Live rankings pulled ${fmt(generatedAt)}. Projections based on GHM's satellite cluster methodology and local authority building.</p>
  <div style="overflow-x:auto;border-radius:10px;border:1px solid #e2e8f0;background:white;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#1e3a5f;color:white;">
          <th style="padding:12px 14px;text-align:left;font-weight:700;">Keyword</th>
          <th style="padding:12px 14px;text-align:left;font-weight:700;">Today</th>
          <th style="padding:12px 14px;text-align:center;font-weight:700;"></th>
          <th style="padding:12px 14px;text-align:left;font-weight:700;">With GHM (90 Days)</th>
        </tr>
      </thead>
      <tbody>
        ${currentRankings.map((r, i) => rankRow(r, projectedRankings[i])).join("")}
      </tbody>
    </table>
  </div>
  <p style="font-size:12px;color:#94a3b8;margin-top:10px;">Projections are targets, not guarantees. Based on GHM's historical performance in comparable markets.</p>
</section>

<!-- SATELLITE CLUSTER -->
<section style="background:white;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:48px 24px;">
  <div style="max-width:900px;margin:0 auto;">
    <h2 style="font-size:22px;font-weight:800;margin-bottom:6px;">Your Satellite Site Cluster</h2>
    <p style="color:#64748b;font-size:14px;margin-bottom:24px;">GHM builds and maintains a cluster of supporting sites targeting your highest-value keywords. Each site is a separate ranking asset working for you 24/7.</p>
    <div style="overflow-x:auto;border-radius:10px;border:1px solid #e2e8f0;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:11px 14px;text-align:left;font-weight:700;color:#374151;border-bottom:2px solid #e2e8f0;">Domain</th>
            <th style="padding:11px 14px;text-align:left;font-weight:700;color:#374151;border-bottom:2px solid #e2e8f0;">Target Keyword</th>
            <th style="padding:11px 14px;text-align:left;font-weight:700;color:#374151;border-bottom:2px solid #e2e8f0;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${satelliteSites.map(satRow).join("")}
        </tbody>
      </table>
    </div>
    <div style="margin-top:16px;padding:14px 18px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;">
      <p style="font-size:13px;color:#1e40af;font-weight:600;margin:0;">All domains acquired, built, and maintained by GHM. You own nothing extra — it's included in your $2,400/month.</p>
    </div>
  </div>
</section>

<!-- COMPETITOR SNAPSHOT -->
${competitorSnapshot.length > 0 ? `
<section style="max-width:900px;margin:0 auto;padding:48px 24px;">
  <h2 style="font-size:22px;font-weight:800;margin-bottom:6px;">Who You're Up Against</h2>
  <p style="color:#64748b;font-size:14px;margin-bottom:24px;">Current Local Pack holders for your target keywords.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;">
    ${competitorSnapshot.map((c) => `
    <div style="background:white;border:1px solid #e2e8f0;border-radius:10px;padding:18px 16px;">
      <p style="font-weight:700;font-size:14px;margin-bottom:10px;">${c.name}</p>
      <div style="display:flex;gap:16px;">
        <div>
          <p style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">DR</p>
          <p style="font-size:18px;font-weight:800;color:#dc2626;">${c.domainRating}</p>
        </div>
        <div>
          <p style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">Pack Presence</p>
          <p style="font-size:18px;font-weight:800;color:#dc2626;">${c.localPackPresence}/${currentRankings.length} KW</p>
        </div>
      </div>
    </div>`).join("")}
  </div>
</section>` : ""}

<!-- ROI ESTIMATE -->
<section style="background:#f0fdf4;border-top:1px solid #bbf7d0;border-bottom:1px solid #bbf7d0;padding:48px 24px;">
  <div style="max-width:900px;margin:0 auto;text-align:center;">
    <h2 style="font-size:22px;font-weight:800;margin-bottom:6px;">Estimated Monthly Impact</h2>
    <p style="color:#64748b;font-size:14px;margin-bottom:32px;">Conservative estimates based on local search traffic data for your market.</p>
    <div style="display:flex;justify-content:center;gap:24px;flex-wrap:wrap;">
      ${[
        { label: "Additional Monthly Visitors", value: `+${monthlyValue.estimatedTrafficGain.toLocaleString()}`, color: "#065f46" },
        { label: "Estimated New Lead Inquiries", value: `+${monthlyValue.estimatedLeadGain}/mo`, color: "#065f46" },
        { label: "Estimated Revenue Gain", value: `$${monthlyValue.estimatedRevGain.toLocaleString()}/mo`, color: "#065f46" },
      ].map(stat => `
      <div style="background:white;border:1px solid #bbf7d0;border-radius:12px;padding:20px 28px;min-width:160px;">
        <div style="font-size:28px;font-weight:800;color:${stat.color};">${stat.value}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:6px;">${stat.label}</div>
      </div>`).join("")}
    </div>
    <p style="font-size:12px;color:#94a3b8;margin-top:20px;">Based on 4% traffic-to-lead conversion · 25% lead close rate · $450 avg job value. Your actual results may vary.</p>
  </div>
</section>

<!-- WHAT'S INCLUDED -->
<section style="max-width:900px;margin:0 auto;padding:48px 24px;">
  <h2 style="font-size:22px;font-weight:800;margin-bottom:6px;">Everything in Your Account</h2>
  <p style="color:#64748b;font-size:14px;margin-bottom:24px;">$2,400/month. All-inclusive. No surprises. Month-to-month.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
    ${["Satellite site cluster (5+ domains)", "Domain acquisition & management", "Authority link building", "Active rank monitoring & defense", "PPC campaign management", "Monthly competitive intelligence report", "Zero lock-in — cancel anytime", "Dedicated point of contact"].map(item => `
    <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:white;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;font-weight:500;">
      <span style="color:#2563eb;font-weight:800;font-size:16px;">✓</span>${item}
    </div>`).join("")}
  </div>
</section>

<!-- CTA -->
<section style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);color:white;padding:56px 24px;text-align:center;">
  <h2 style="font-size:28px;font-weight:800;margin-bottom:10px;">Ready to Own ${lead.city}?</h2>
  <p style="opacity:0.8;font-size:16px;max-width:440px;margin:0 auto 16px;">Month-to-month. No setup fees. Just DNS access and we handle everything else.</p>
  <p style="opacity:0.6;font-size:13px;">${repName ? `Questions? Contact ${repName} · ` : ""}GHM Digital Marketing</p>
</section>

<div style="padding:16px;text-align:center;font-size:11px;color:#94a3b8;background:#f8fafc;">
  This preview was generated specifically for ${lead.businessName} · ${fmt(generatedAt)} · Expires ${fmt(expiresAt)} · For sales use only
</div>

</body>
</html>`;
}
