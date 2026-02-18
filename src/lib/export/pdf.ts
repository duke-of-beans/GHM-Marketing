/**
 * PDF Report Generation
 * Uses jsPDF for client-side PDF generation
 */

export interface ReportSection {
  title: string;
  content: string | string[];
  type?: "text" | "table" | "chart";
}

export interface ReportMetadata {
  title: string;
  subtitle?: string;
  author?: string;
  date?: Date;
  logo?: string;
}

/**
 * Generate PDF report (placeholder for actual implementation)
 * In production, use jsPDF or similar library
 */
export async function generatePDFReport(
  metadata: ReportMetadata,
  sections: ReportSection[]
): Promise<Blob> {
  // This is a placeholder - in production, use jsPDF
  const content = [
    `# ${metadata.title}`,
    metadata.subtitle ? `## ${metadata.subtitle}` : "",
    `Generated: ${(metadata.date || new Date()).toLocaleString()}`,
    metadata.author ? `By: ${metadata.author}` : "",
    "",
    ...sections.map((section) => [
      `## ${section.title}`,
      Array.isArray(section.content)
        ? section.content.join("\n")
        : section.content,
      "",
    ]).flat(),
  ]
    .filter(Boolean)
    .join("\n");

  return new Blob([content], { type: "application/pdf" });
}

/**
 * Download PDF blob
 */
export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Common report templates
 */
export const reportTemplates = {
  /**
   * Performance Summary Report
   */
  performanceSummary: (data: {
    period: string;
    mrr: number;
    arr: number;
    clients: number;
    deals: number;
    conversionRate: number;
  }): ReportSection[] => [
    {
      title: "Executive Summary",
      content: [
        `Performance Period: ${data.period}`,
        `Monthly Recurring Revenue: $${data.mrr.toLocaleString()}`,
        `Annual Run Rate: $${data.arr.toLocaleString()}`,
        `Active Clients: ${data.clients}`,
        `Deals Closed: ${data.deals}`,
        `Conversion Rate: ${data.conversionRate.toFixed(2)}%`,
      ],
    },
  ],

  /**
   * Sales Activity Report
   */
  salesActivity: (data: {
    rep: string;
    period: string;
    leads: number;
    calls: number;
    demos: number;
    deals: number;
    revenue: number;
  }): ReportSection[] => [
    {
      title: `Sales Activity - ${data.rep}`,
      content: [
        `Period: ${data.period}`,
        `Leads Contacted: ${data.leads}`,
        `Calls Made: ${data.calls}`,
        `Demos Conducted: ${data.demos}`,
        `Deals Closed: ${data.deals}`,
        `Revenue Generated: $${data.revenue.toLocaleString()}`,
      ],
    },
  ],

  /**
   * Client Health Report
   */
  clientHealth: (data: {
    clientName: string;
    healthScore: number;
    tasksCompleted: number;
    tasksPending: number;
    lastScan: Date;
    issues: string[];
  }): ReportSection[] => [
    {
      title: `Client Health Report - ${data.clientName}`,
      content: [
        `Health Score: ${data.healthScore}/100`,
        `Tasks Completed: ${data.tasksCompleted}`,
        `Tasks Pending: ${data.tasksPending}`,
        `Last Scan: ${data.lastScan.toLocaleDateString()}`,
        "",
        "Issues Identified:",
        ...data.issues.map((issue) => `• ${issue}`),
      ],
    },
  ],
};
