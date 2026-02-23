/**
 * AI Narrative Generator — Sprint 5
 *
 * Generates human-readable narrative paragraphs for each report section,
 * using the client's VoiceProfile for tone matching and the model router
 * for cost-optimal model selection.
 *
 * Called by generator.ts after all section data is assembled.
 * Results are stored in ClientReport.content under each section's `narrative` field.
 */

import { callAI } from "@/lib/ai/client";
import type { FeatureContext } from "@/lib/ai/router/types";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface NarrativeSections {
  executiveSummary: string;
  rankingChanges: string;
  siteHealthTrends: string;
  gmbPerformance: string;
  competitivePositioning: string;
  recommendedNextSteps: string;
}

export interface VoiceProfileData {
  tonality: string;
  vocabulary: string[];
  sentenceStructure: string;
  formality: number;
  enthusiasm: number;
  technicality: number;
  brevity: number;
}

// ── Main export ────────────────────────────────────────────────────────────────

export async function generateAINarratives(
  reportData: any,
  voiceProfile: VoiceProfileData | null
): Promise<NarrativeSections> {
  const fallback: NarrativeSections = {
    executiveSummary: "",
    rankingChanges: "",
    siteHealthTrends: "",
    gmbPerformance: "",
    competitivePositioning: "",
    recommendedNextSteps: "",
  };

  const context: FeatureContext = {
    feature: "report_narrative",
    clientId: reportData.client.id,
    clientName: reportData.client.businessName,
  };

  const voiceInstruction = voiceProfile
    ? buildVoiceInstruction(voiceProfile)
    : "Use a professional, clear, and concise tone suitable for a business report.";

  // Run all 6 narrative calls in parallel for speed
  const [
    executiveSummary,
    rankingChanges,
    siteHealthTrends,
    gmbPerformance,
    competitivePositioning,
    recommendedNextSteps,
  ] = await Promise.allSettled([
    narrativeCall(context, voiceInstruction, buildExecutiveSummaryPrompt(reportData)),
    narrativeCall(context, voiceInstruction, buildRankingChangesPrompt(reportData)),
    narrativeCall(context, voiceInstruction, buildSiteHealthPrompt(reportData)),
    narrativeCall(context, voiceInstruction, buildGMBPrompt(reportData)),
    narrativeCall(context, voiceInstruction, buildCompetitivePrompt(reportData)),
    narrativeCall(context, voiceInstruction, buildNextStepsPrompt(reportData)),
  ]);

  return {
    executiveSummary: resolveSettled(executiveSummary, fallback.executiveSummary),
    rankingChanges: resolveSettled(rankingChanges, fallback.rankingChanges),
    siteHealthTrends: resolveSettled(siteHealthTrends, fallback.siteHealthTrends),
    gmbPerformance: resolveSettled(gmbPerformance, fallback.gmbPerformance),
    competitivePositioning: resolveSettled(competitivePositioning, fallback.competitivePositioning),
    recommendedNextSteps: resolveSettled(recommendedNextSteps, fallback.recommendedNextSteps),
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function resolveSettled(
  result: PromiseSettledResult<string>,
  fallback: string
): string {
  return result.status === "fulfilled" ? result.value : fallback;
}

async function narrativeCall(
  context: FeatureContext,
  voiceInstruction: string,
  prompt: string
): Promise<string> {
  const result = await callAI({
    feature: "report_narrative",
    prompt: `${voiceInstruction}\n\n${prompt}`,
    context,
  });

  if (result.ok) return result.content.trim();
  return "";
}

function buildVoiceInstruction(vp: VoiceProfileData): string {
  const formalityLabel = vp.formality >= 7 ? "formal" : vp.formality >= 4 ? "conversational" : "casual";
  const enthusiasmLabel = vp.enthusiasm >= 7 ? "enthusiastic" : vp.enthusiasm >= 4 ? "measured" : "restrained";
  const techLabel = vp.technicality >= 7 ? "technical" : vp.technicality >= 4 ? "moderately technical" : "plain-language";
  const brevityLabel = vp.brevity >= 7 ? "concise" : vp.brevity >= 4 ? "moderate length" : "detailed";

  return `Write in a ${formalityLabel}, ${enthusiasmLabel}, ${techLabel}, and ${brevityLabel} style. ` +
    `Tonality: ${vp.tonality}. ` +
    `Sentence structure: ${vp.sentenceStructure}. ` +
    (vp.vocabulary.length > 0
      ? `Use or echo these brand terms where natural: ${vp.vocabulary.slice(0, 6).join(", ")}. `
      : "") +
    `Write a single focused paragraph suitable for a client-facing performance report.`;
}

// ── Prompt builders ────────────────────────────────────────────────────────────

function buildExecutiveSummaryPrompt(d: any): string {
  const health = d.health;
  const wins = (d.wins || []).slice(0, 3).map((w: any) => w.metric || w.description).join(", ") || "no notable wins";
  const tasksCompleted = d.tasks?.completed ?? 0;

  return `Write an executive summary paragraph for ${d.client.businessName}'s monthly SEO performance report.

Key data:
- Health score: ${health.current} (change: ${health.change >= 0 ? "+" : ""}${health.change} from last period)
- Top wins this month: ${wins}
- Tasks completed: ${tasksCompleted}
- Total alerts: ${d.alerts?.total ?? 0} (${d.alerts?.critical ?? 0} critical, ${d.alerts?.warning ?? 0} warning)

Summarize overall performance in 2-3 sentences. Be specific about the health score change and highlight the most meaningful win.`;
}

function buildRankingChangesPrompt(d: any): string {
  const rt = d.rankTracking;
  if (!rt?.hasData) {
    return `Write a brief note that no keyword ranking data is available for this reporting period. Keep it to one sentence.`;
  }

  const gainers = (rt.movers?.gainers || [])
    .slice(0, 3)
    .map((g: any) => `"${g.keyword}" moved up ${g.delta} positions`)
    .join("; ");

  const losers = (rt.movers?.losers || [])
    .slice(0, 3)
    .map((l: any) => `"${l.keyword}" dropped ${l.delta} positions`)
    .join("; ");

  return `Write a keyword ranking analysis paragraph for ${d.client.businessName}.

Data:
- Total tracked keywords: ${rt.summary.totalKeywords}
- Keywords in top 3: ${rt.summary.inTop3}
- Keywords in local pack: ${rt.summary.inLocalPack}
- Average position: ${rt.summary.avgPosition ?? "N/A"}
- Top movers (improved): ${gainers || "none"}
- Dropped keywords: ${losers || "none"}

Write 2-3 sentences summarizing keyword movement. Call out the strongest gains and any keywords needing attention.`;
}

function buildSiteHealthPrompt(d: any): string {
  const health = d.health;
  return `Write a site health trends paragraph for ${d.client.businessName}.

Data:
- Current health score: ${health.current}/100
- Previous health score: ${health.previous}/100
- Score change: ${health.change >= 0 ? "+" : ""}${health.change}
- Total scans run: ${d.period?.scansCount ?? 0}
- Critical alerts: ${d.alerts?.critical ?? 0}
- Warning alerts: ${d.alerts?.warning ?? 0}

Write 2 sentences. If health improved, acknowledge it. If there are critical alerts, briefly note they require attention without being alarmist.`;
}

function buildGMBPrompt(d: any): string {
  const gbp = d.gbpPerformance;
  if (!gbp?.hasData) {
    return `Write a brief note that Google Business Profile data is not available for this period. One sentence only.`;
  }

  const insights = gbp.insights;
  const reviews = gbp.reviews;

  return `Write a Google Business Profile performance paragraph for ${d.client.businessName}.

Data:
${insights ? `- Search impressions: ${insights.impressionsSearch}\n- Maps impressions: ${insights.impressionsMaps}\n- Website clicks: ${insights.websiteClicks}\n- Calls + directions: ${insights.callClicks + insights.directionRequests}` : "- Insights data unavailable"}
${reviews ? `- Average rating: ${reviews.averageRating} stars\n- Total reviews: ${reviews.total}\n- New reviews this period: ${reviews.newInPeriod}\n- Unanswered reviews: ${reviews.unanswered}` : "- Review data unavailable"}

Write 2 sentences covering visibility metrics and review standing. If there are unanswered reviews, note the opportunity to respond.`;
}

function buildCompetitivePrompt(d: any): string {
  const health = d.health;
  const rt = d.rankTracking;

  return `Write a competitive positioning paragraph for ${d.client.businessName}.

Data:
- Current health score: ${health.current} vs industry average ~60
- Keywords in local pack: ${rt?.summary?.inLocalPack ?? "N/A"}
- Top 3 rankings: ${rt?.summary?.inTop3 ?? "N/A"}

Write 2 sentences contextualizing their performance in the competitive landscape. Avoid making up specific competitor names. Focus on how their health score and local rankings position them.`;
}

function buildNextStepsPrompt(d: any): string {
  const gaps = (d.gaps || [])
    .slice(0, 3)
    .map((g: any) => g.issue || g.recommendation)
    .filter(Boolean)
    .join("; ");

  const citation = d.citationHealth;
  const citationIssues = citation?.hasData && citation.summary
    ? `${citation.summary.mismatches + citation.summary.missing} citation issues`
    : null;

  return `Write a recommended next steps paragraph for ${d.client.businessName}'s SEO campaign.

Priority issues identified:
${gaps ? `- ${gaps}` : "- No critical issues"}
${citationIssues ? `- ${citationIssues}` : ""}

Write 2-3 sentences recommending specific, actionable next steps based on the data above. Be direct and prioritized. Frame as what the team will focus on next month.`;
}
