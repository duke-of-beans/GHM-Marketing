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

  <div class="footer">
    <p>Generated by GHM Digital Marketing • ${formatDate(new Date())}</p>
    <p>Questions? Contact your account manager.</p>
  </div>
</body>
</html>
  `;
}
