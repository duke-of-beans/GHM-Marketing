/**
 * Generate HTML template for client monthly report
 */
export function generateReportHTML(reportData: any): string {
  const {
    client,
    period,
    health,
    alerts,
    tasks,
    wins,
    gaps,
    rankTracking,
    citationHealth,
    gbpPerformance,
  } = reportData;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const healthColor = health.change >= 0 ? "#10b981" : "#ef4444";
  const healthIcon = health.change >= 0 ? "↑" : "↓";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #3b82f6;
    }
    .header h1 {
      font-size: 28px;
      color: #1f2937;
      margin-bottom: 8px;
    }
    .header .period {
      font-size: 14px;
      color: #6b7280;
    }
    .client-info {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .client-info h2 {
      font-size: 20px;
      margin-bottom: 10px;
    }
    .client-info p {
      color: #6b7280;
      font-size: 14px;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .metric-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    .metric-card .label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .metric-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #1f2937;
    }
    .metric-card .change {
      font-size: 14px;
      margin-top: 4px;
    }
    .metric-card .change.positive { color: #10b981; }
    .metric-card .change.negative { color: #ef4444; }
    .section {
      margin-bottom: 30px;
    }
    .section h3 {
      font-size: 18px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    .list-item {
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 10px;
      border-left: 3px solid #3b82f6;
    }
    .list-item .title {
      font-weight: 600;
      margin-bottom: 4px;
    }
    .list-item .description {
      font-size: 14px;
      color: #6b7280;
    }
    .gap-item {
      border-left-color: #ef4444;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .kpi {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 14px;
      text-align: center;
    }
    .kpi .kpi-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px; }
    .kpi .kpi-value { font-size: 24px; font-weight: bold; color: #111827; margin: 4px 0; }
    .kpi .kpi-sub { font-size: 12px; color: #6b7280; }
    .kpi .kpi-delta.pos { color: #10b981; }
    .kpi .kpi-delta.neg { color: #ef4444; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px; }
    .data-table th { background: #f3f4f6; text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
    .data-table td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge-green { background: #d1fae5; color: #065f46; }
    .badge-yellow { background: #fef3c7; color: #92400e; }
    .badge-gray { background: #f3f4f6; color: #6b7280; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .star { color: #f59e0b; }
    @media print {
      body { padding: 20px; }
      .metric-grid { break-inside: avoid; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Monthly SEO Performance Report</h1>
    <p class="period">${formatDate(period.start)} - ${formatDate(period.end)}</p>
  </div>

  <div class="client-info">
    <h2>${client.businessName}</h2>
    <p>${client.website || ""}</p>
    <p>${client.city}, ${client.state}</p>
  </div>

  <div class="metric-grid">
    <div class="metric-card">
      <div class="label">Health Score</div>
      <div class="value">${health.current}</div>
      <div class="change ${health.change >= 0 ? "positive" : "negative"}">
        ${healthIcon} ${Math.abs(health.change)} from last month
      </div>
    </div>
    <div class="metric-card">
      <div class="label">Scans Run</div>
      <div class="value">${period.scansCount}</div>
    </div>
    <div class="metric-card">
      <div class="label">Tasks Completed</div>
      <div class="value">${tasks.completed}</div>
    </div>
  </div>

  <div class="section">
    <h3>🏆 Top Wins This Month</h3>
    ${wins.length > 0 ? wins.map((win: any) => `
      <div class="list-item">
        <div class="title">${win.metric}</div>
        <div class="description">${win.description || "Improved by " + win.improvement}</div>
      </div>
    `).join("") : "<p>No significant wins this period.</p>"}
  </div>

  <div class="section">
    <h3>⚠️ Areas Needing Attention</h3>
    ${gaps.length > 0 ? gaps.map((gap: any) => `
      <div class="list-item gap-item">
        <div class="title">${gap.issue}</div>
        <div class="description">${gap.recommendation || ""}</div>
      </div>
    `).join("") : "<p>No critical issues detected.</p>"}
  </div>

  <div class="section">
    <h3>✅ Work Completed</h3>
    ${tasks.list.length > 0 ? tasks.list.map((task: any) => `
      <div class="list-item">
        <div class="title">${task.title}</div>
        <div class="description">
          ${task.category} • Deployed ${formatDate(task.deployedAt)}
          ${task.deployedUrl ? `• <a href="${task.deployedUrl}" target="_blank">${task.deployedUrl}</a>` : ""}
        </div>
      </div>
    `).join("") : "<p>No tasks deployed this period.</p>"}
  </div>

  <div class="section">
    <h3>✅ Work Completed</h3>
    ${tasks.list.length > 0 ? tasks.list.map((task: any) => `
      <div class="list-item">
        <div class="title">${task.title}</div>
        <div class="description">
          ${task.category} • Deployed ${formatDate(task.deployedAt)}
          ${task.deployedUrl ? `• <a href="${task.deployedUrl}" target="_blank">${task.deployedUrl}</a>` : ""}
        </div>
      </div>
    `).join("") : "<p>No tasks deployed this period.</p>"}
  </div>

  ${rankTracking?.hasData ? `
  <div class="section">
    <h3>📈 Keyword Rankings</h3>
    <div class="kpi-row">
      <div class="kpi">
        <div class="kpi-label">Tracked</div>
        <div class="kpi-value">${rankTracking.summary.totalKeywords}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Top 3</div>
        <div class="kpi-value">${rankTracking.summary.inTop3}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">In Local Pack</div>
        <div class="kpi-value">${rankTracking.summary.inLocalPack}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Avg Position</div>
        <div class="kpi-value">${rankTracking.summary.avgPosition ?? "—"}</div>
      </div>
    </div>
    ${rankTracking.movers.gainers.length > 0 ? `
    <p style="font-weight:600; margin-bottom:6px; color:#065f46;">↑ Top Movers (Improved)</p>
    <table class="data-table">
      <thead><tr><th>Keyword</th><th>Position</th><th>Change</th></tr></thead>
      <tbody>${rankTracking.movers.gainers.map((g: any) => `
        <tr>
          <td>${g.keyword}</td>
          <td>${g.organicPosition ?? "—"}</td>
          <td><span class="badge badge-green">↑ ${g.delta}</span></td>
        </tr>`).join("")}
      </tbody>
    </table>` : ""}
    ${rankTracking.movers.losers.length > 0 ? `
    <p style="font-weight:600; margin:12px 0 6px; color:#991b1b;">↓ Dropped Rankings</p>
    <table class="data-table">
      <thead><tr><th>Keyword</th><th>Position</th><th>Change</th></tr></thead>
      <tbody>${rankTracking.movers.losers.map((l: any) => `
        <tr>
          <td>${l.keyword}</td>
          <td>${l.organicPosition ?? "—"}</td>
          <td><span class="badge badge-red">↓ ${l.delta}</span></td>
        </tr>`).join("")}
      </tbody>
    </table>` : ""}
    ${rankTracking.localPack.length > 0 ? `
    <p style="font-weight:600; margin:12px 0 6px;">📍 Local Pack Presence</p>
    <table class="data-table">
      <thead><tr><th>Keyword</th><th>Local Pack Position</th></tr></thead>
      <tbody>${rankTracking.localPack.map((lp: any) => `
        <tr><td>${lp.keyword}</td><td><span class="badge badge-green">#${lp.localPackPosition}</span></td></tr>`).join("")}
      </tbody>
    </table>` : ""}
  </div>` : ""}

  ${citationHealth?.hasData ? `
  <div class="section">
    <h3>🗂️ Citation Consistency</h3>
    <div class="kpi-row">
      <div class="kpi">
        <div class="kpi-label">Citation Score</div>
        <div class="kpi-value">${citationHealth.score ?? "—"}</div>
        ${citationHealth.scoreDelta !== null ? `<div class="kpi-sub kpi-delta ${citationHealth.scoreDelta >= 0 ? "pos" : "neg"}">${citationHealth.scoreDelta >= 0 ? "↑" : "↓"} ${Math.abs(citationHealth.scoreDelta)} pts</div>` : ""}
      </div>
      <div class="kpi">
        <div class="kpi-label">Directories Checked</div>
        <div class="kpi-value">${citationHealth.summary.totalChecked}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Matches</div>
        <div class="kpi-value" style="color:#065f46">${citationHealth.summary.matches}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Issues</div>
        <div class="kpi-value" style="color:${citationHealth.summary.mismatches + citationHealth.summary.missing > 0 ? "#dc2626" : "#111827"}">${citationHealth.summary.mismatches + citationHealth.summary.missing}</div>
      </div>
    </div>
    ${citationHealth.criticalIssues.length > 0 ? `
    <p style="font-weight:600; margin-bottom:6px;">Priority Fixes</p>
    ${citationHealth.criticalIssues.map((issue: any) => `
      <div class="list-item gap-item">
        <div class="title">${issue.directory}</div>
        <div class="description">${(issue.issues ?? []).join(" • ") || "NAP mismatch detected"}</div>
      </div>`).join("")}` : "<p style='color:#065f46'>✓ All critical directories consistent.</p>"}
  </div>` : ""}

  ${gbpPerformance?.hasData ? `
  <div class="section">
    <h3>📍 Google Business Profile</h3>
    ${gbpPerformance.insights ? `
    <p style="font-weight:600; margin-bottom:8px;">Search Visibility — ${gbpPerformance.insights.period}</p>
    <div class="kpi-row">
      <div class="kpi">
        <div class="kpi-label">Search Impressions</div>
        <div class="kpi-value">${gbpPerformance.insights.impressionsSearch.toLocaleString()}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Maps Impressions</div>
        <div class="kpi-value">${gbpPerformance.insights.impressionsMaps.toLocaleString()}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Website Clicks</div>
        <div class="kpi-value">${gbpPerformance.insights.websiteClicks.toLocaleString()}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Calls + Directions</div>
        <div class="kpi-value">${(gbpPerformance.insights.callClicks + gbpPerformance.insights.directionRequests).toLocaleString()}</div>
      </div>
    </div>` : ""}
    ${gbpPerformance.reviews ? `
    <p style="font-weight:600; margin:12px 0 8px;">Reviews</p>
    <div class="kpi-row">
      <div class="kpi">
        <div class="kpi-label">Avg Rating</div>
        <div class="kpi-value">${gbpPerformance.reviews.averageRating ?? "—"} <span class="star">★</span></div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Total Reviews</div>
        <div class="kpi-value">${gbpPerformance.reviews.total}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">New This Period</div>
        <div class="kpi-value">${gbpPerformance.reviews.newInPeriod}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Unanswered</div>
        <div class="kpi-value" style="color:${gbpPerformance.reviews.unanswered > 0 ? "#dc2626" : "#111827"}">${gbpPerformance.reviews.unanswered}</div>
      </div>
    </div>
    ${gbpPerformance.reviews.recentSnippets?.length > 0 ? `
    ${gbpPerformance.reviews.recentSnippets.map((r: any) => `
      <div class="list-item" style="border-left-color: #f59e0b;">
        <div class="title">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)} &nbsp; ${new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
        <div class="description">${r.snippet}${r.snippet.length >= 120 ? "…" : ""}</div>
      </div>`).join("")}` : ""}` : ""}
    ${gbpPerformance.posts ? `
    <p style="font-size:13px; color:#6b7280; margin-top:12px;">📢 Posts published this period: <strong>${gbpPerformance.posts.publishedInPeriod}</strong></p>` : ""}
  </div>` : ""}

  <div class="footer">
    <p>Generated by GHM Digital Marketing • ${formatDate(new Date())}</p>
    <p>Questions? Contact your account manager.</p>
  </div>
</body>
</html>
  `;
}
