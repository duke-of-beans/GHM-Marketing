/**
 * AI-Powered Brief Generation
 * Uses Claude API to generate detailed content briefs from scan alerts
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

export async function generateContentBrief(params: {
  title: string;
  description: string;
  clientName: string;
  category: string;
  competitorInfo?: string;
}): Promise<string> {
  const { title, description, clientName, category, competitorInfo } = params;

  const prompt = `You are a content strategist creating a detailed brief for an SEO task.

Client: ${clientName}
Task Category: ${category}
Task Title: ${title}
Gap/Issue: ${description}
${competitorInfo ? `Competitor Context: ${competitorInfo}` : ""}

Create a detailed, actionable content brief that includes:

1. OBJECTIVE
   - What we're trying to achieve
   - Success criteria

2. TARGET KEYWORDS
   - Primary keyword (1)
   - Secondary keywords (2-3)
   - Long-tail variations (2-3)

3. CONTENT OUTLINE
   - H2 and H3 structure
   - Key points to cover
   - Word count target

4. COMPETITIVE ANALYSIS
   - What competitors are doing well
   - Gaps we can exploit
   - Differentiation strategy

5. SEO REQUIREMENTS
   - Meta title (55-60 chars)
   - Meta description (150-160 chars)
   - Internal linking opportunities
   - External linking suggestions

6. DELIVERABLES
   - Final output format
   - Assets needed (images, charts, etc.)
   - Deadline considerations

Keep it practical, specific, and actionable. Format in markdown.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    const brief = data.content?.[0]?.text || "";

    return brief;
  } catch (error) {
    console.error("Failed to generate AI brief:", error);
    throw error;
  }
}

/**
 * Smart task prioritization algorithm
 */
export function calculateTaskPriority(task: {
  category: string;
  severity?: string;
  createdAt: Date;
  clientHealthScore?: number;
}): {
  score: number;
  priority: "urgent" | "high" | "medium" | "low";
  reasons: string[];
} {
  let score = 50; // Base score
  const reasons: string[] = [];

  // Category impact (max +20)
  const categoryWeights: Record<string, number> = {
    technical: 20,
    "on-page": 15,
    content: 15,
    links: 10,
    local: 10,
    other: 5,
  };
  const categoryScore = categoryWeights[task.category] || 5;
  score += categoryScore;
  if (categoryScore >= 15) {
    reasons.push("High-impact category");
  }

  // Severity impact (max +25)
  if (task.severity === "critical") {
    score += 25;
    reasons.push("Critical severity");
  } else if (task.severity === "warning") {
    score += 15;
    reasons.push("Warning severity");
  }

  // Age impact (max +15)
  const daysOld = Math.floor(
    (Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysOld > 14) {
    score += 15;
    reasons.push("Overdue (14+ days)");
  } else if (daysOld > 7) {
    score += 10;
    reasons.push("Aging (7+ days)");
  } else if (daysOld > 3) {
    score += 5;
  }

  // Client health impact (max +10)
  if (task.clientHealthScore && task.clientHealthScore < 50) {
    score += 10;
    reasons.push("Low client health");
  } else if (task.clientHealthScore && task.clientHealthScore < 70) {
    score += 5;
  }

  // Normalize to 0-100
  score = Math.min(100, Math.max(0, score));

  // Determine priority level
  let priority: "urgent" | "high" | "medium" | "low";
  if (score >= 80) {
    priority = "urgent";
  } else if (score >= 65) {
    priority = "high";
  } else if (score >= 50) {
    priority = "medium";
  } else {
    priority = "low";
  }

  return { score, priority, reasons };
}

/**
 * Suggest next tasks based on current workload and priorities
 */
export function suggestNextTasks(
  tasks: Array<{
    id: number;
    title: string;
    status: string;
    priorityScore?: number;
    category: string;
  }>,
  limit: number = 5
): Array<{
  taskId: number;
  title: string;
  reason: string;
}> {
  // Filter to actionable tasks (queued, in-progress)
  const actionable = tasks.filter(
    (t) => t.status === "queued" || t.status === "in-progress"
  );

  // Sort by priority score (highest first)
  const sorted = actionable.sort(
    (a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)
  );

  // Take top N
  return sorted.slice(0, limit).map((task) => ({
    taskId: task.id,
    title: task.title,
    reason: `High priority ${task.category} task (score: ${task.priorityScore || 0})`,
  }));
}
