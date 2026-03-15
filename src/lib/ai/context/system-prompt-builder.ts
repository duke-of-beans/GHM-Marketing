/**
 * System Prompt Builder — GHM Dashboard
 *
 * PERF-004: Assembly order refactored for Anthropic prompt caching.
 * buildSystemPrompt() now returns { static, dynamic } instead of a plain string.
 *
 * Static part  = role definition + feature protocol + output contract
 *               → identical for all calls to the same feature+tenant combo
 *               → sent with cache_control: { type: "ephemeral" }
 *
 * Dynamic part = client context + voice profile + per-call task/page/competitor data
 *               → changes per call, never cached
 *
 * Assembly order (cache breakpoint between static and dynamic):
 *   1. [STATIC]  buildStaticPreamble()  — role + OPERATING CONSTRAINTS
 *   2. [STATIC]  buildFeatureSection()  — feature-specific protocol (no ctx data)
 *   3. [STATIC]  buildOutputContract()  — output format contract (unchanged)
 *   4. [DYNAMIC] buildClientContext()   — clientName, industry, voice, task/page data
 *
 * All 7 active features produce functionally equivalent prompts — same information,
 * reordered so static content precedes dynamic client context.
 */

import type { FeatureContext, AIFeature } from "../router/types";
import type { TenantConfig } from "@/lib/tenant/config";

// ── Return type ───────────────────────────────────────────────────────────────

export interface SystemPromptParts {
  /** Static prefix — identical for all calls to the same feature+tenant combo.
   *  Sent with cache_control: { type: "ephemeral" } to enable Anthropic prompt caching. */
  static: string;
  /** Dynamic suffix — client-specific data that changes per call. Never cached. */
  dynamic: string;
}

// ── Main entry point ──────────────────────────────────────────────────────────

export function buildSystemPrompt(ctx: FeatureContext, tenant?: TenantConfig): SystemPromptParts {
  const staticPart = [
    buildStaticPreamble(ctx.feature, tenant),
    buildFeatureSection(ctx.feature, tenant),
    buildOutputContract(ctx.feature),
  ].filter(Boolean).join("\n\n");

  const dynamic = buildClientContext(ctx);
  return { static: staticPart, dynamic };
}

// ── Static preamble (role + operating constraints — no client data) ───────────

function buildStaticPreamble(_feature: AIFeature, tenant?: TenantConfig): string {
  const platformDescription = tenant
    ? `${tenant.name} Dashboard, a ${tenant.aiContext ?? "marketing platform"}`
    : "Marketing Dashboard";

  return `You are an AI assistant embedded in the ${platformDescription}.

OPERATING CONSTRAINTS:
- You are generating content for a professional services context. Accuracy and brand alignment matter.
- Do not fabricate statistics, citations, or competitor data.
- If asked to produce copy, it must be original — not generic AI filler.
- Always respond in the exact output format specified at the end of this prompt.`;
}

// ── Dynamic client context (per-call — client name, voice, task data) ─────────

function buildClientContext(ctx: FeatureContext): string {
  const lines: string[] = [];

  lines.push("CLIENT CONTEXT:");
  lines.push(`- Client name: ${ctx.clientName}`);
  lines.push(`- Client ID: ${ctx.clientId}`);
  if (ctx.industry)         lines.push(`- Industry: ${ctx.industry}`);
  if (ctx.voiceProfileSlug) lines.push(`- Voice profile: ${ctx.voiceProfileSlug}`);

  // Inject tenant voice guidelines if configured (Sprint 35 / FEAT-016)
  if (ctx.tenantVoice) {
    const v = ctx.tenantVoice;
    lines.push("\nBRAND VOICE GUIDELINES:");
    if (v.tone)         lines.push(`- Tone: ${v.tone}`);
    if (v.keywords)     lines.push(`- Preferred terms: ${v.keywords}`);
    if (v.antiKeywords) lines.push(`- Terms to avoid: ${v.antiKeywords}`);
    if (v.sampleCopy)   lines.push(`- Match this voice: "${v.sampleCopy.slice(0, 500)}"`);
    if (v.industry)     lines.push(`- Industry context: ${v.industry}`);
    if (v.audience)     lines.push(`- Target audience: ${v.audience}`);
  }

  // Feature-specific dynamic data (task/page/competitor context per call)
  switch (ctx.feature) {
    case "content_brief":
      if (ctx.taskContext) {
        const t = ctx.taskContext;
        lines.push("\nTASK:");
        lines.push(`- Title: ${t.title}`);
        lines.push(`- Category: ${t.category}`);
        if (t.targetKeywords?.length) lines.push(`- Target keywords: ${t.targetKeywords.join(", ")}`);
      }
      break;

    case "website_copy":
      if (ctx.propertyTier) {
        const tierLabel: Record<string, string> = {
          tier1: "Site Extension (tier1)",
          tier2: "Branded Satellite (tier2)",
          tier3: "Pure Satellite (tier3)",
        };
        lines.push(`\nSELECTED PROPERTY TIER: ${tierLabel[ctx.propertyTier] ?? ctx.propertyTier}`);
      }
      if (ctx.pageContext) {
        const p = ctx.pageContext;
        lines.push("\nPAGE CONTEXT:");
        lines.push(`- Page: ${p.pageTitle}`);
        lines.push(`- Section: ${p.sectionKey}`);
        if (p.targetKeywords?.length) lines.push(`- Target keywords: ${p.targetKeywords.join(", ")}`);
      }
      break;

    case "competitive_scan":
      if (ctx.competitors?.length) {
        lines.push("\nKNOWN COMPETITORS:");
        ctx.competitors.forEach((c) => lines.push(`- ${c}`));
      }
      break;
  }

  return lines.join("\n");
}

// ── Feature-specific protocol sections (static — no per-call ctx data) ────────

function buildFeatureSection(feature: AIFeature, tenant?: TenantConfig): string {
  switch (feature) {
    case "content_brief":    return buildContentBriefProtocol();
    case "website_copy":     return buildWebsiteCopyProtocol(tenant);
    case "scrvnr_gate":      return buildScrvnrProtocol();
    case "competitive_scan": return buildCompetitiveScanProtocol();
    case "upsell_detection": return buildUpsellProtocol(tenant);
    case "voice_capture":    return buildVoiceCaptureProtocol();
    case "report_narrative":
      return `FEATURE: Monthly Report Narrative Generation

Your job is to write a single, focused narrative paragraph for a specific section of a client-facing monthly SEO performance report.

REQUIREMENTS:
- Write in a professional, plain-language style appropriate for a business owner audience.
- Be specific — reference actual numbers from the data provided. Never use vague language.
- Do not fabricate data or mention specific competitor names unless provided.
- Keep each paragraph to 2-3 sentences unless instructed otherwise.
- Output plain text only — no markdown, no headers, no bullet points.
- The paragraph will be inserted directly into a formatted PDF report.`;
    // Content Studio: lean system prompt — detailed instructions live in the user prompt
    case "seo_strategy":
      return `FEATURE: SEO Strategy\nYou are an expert SEO strategist. Follow the instructions in the user message exactly. Return only what is asked — no preamble, no explanations outside the requested format.`;
    case "blog_post":
      return `FEATURE: Blog Post Generation\nYou are an SEO content writer. Write in a natural, human voice — not generic AI filler. Follow all specifications in the user message. Output clean HTML only.`;
    case "social_posts":
      return `FEATURE: Social Media Content\nYou are a social media content specialist. Follow the instructions in the user message exactly. Return only the requested JSON array — no preamble, no markdown fences.`;
    case "ppc_ads":
      return `FEATURE: Google Ads Copy\nYou are a Google Ads specialist. Follow the character limits and format specified in the user message exactly. Return only the requested JSON array — no preamble, no markdown fences.`;
    case "meta_description":
      return `FEATURE: Meta Description\nYou are an SEO specialist. Write a single meta description following the specifications in the user message. Return only the meta description text — no quotes, no explanation.`;
    default:
      return "";
  }
}

function buildContentBriefProtocol(): string {
  return `FEATURE: Content Brief Generation

Your job is to produce a structured content brief that a writer can execute without further research.

Task title, category, and target keywords (if provided) appear in the CLIENT CONTEXT section above.

BRIEF REQUIREMENTS:
- Primary objective (1-2 sentences: what this piece achieves for the client)
- Target audience (specific, not generic)
- Recommended word count range
- Proposed H1 headline (punchy, keyword-adjacent)
- Content outline (H2 sections with brief description of what each covers)
- 3–5 target keywords with usage guidance (primary, secondary, LSI)
- Competitive angle (what gap does this fill vs. what's already ranking?)
- SEO requirements (internal links, meta description guidance, schema if relevant)
- Tone notes (reference the client voice profile if available)

Do not pad. Every section should be actionable.`;
}

function buildWebsiteCopyProtocol(tenant?: TenantConfig): string {
  const tenantName = tenant?.name ?? "Platform";
  return `FEATURE: Website Copy Generation

PROPERTY TIER GUIDANCE (selected tier is specified in CLIENT CONTEXT above):
- Site Extension (tier1): Visual and voice DNA cloned from the client's primary site. Copy must feel like a natural part of that brand.
- Branded Satellite (tier2): Same brand identity, separate domain. Strong brand signals, but slightly more independent voice.
- Pure Satellite (tier3): Independent brand, ${tenantName}-owned. Establish credibility and trust from scratch.

COPY STANDARDS:
- Write for a real human reader first. SEO is secondary.
- No keyword stuffing. Keywords appear naturally where they fit.
- Active voice. Specific claims over vague superlatives.
- CTAs must be action-oriented and concrete (not "Learn More" — tell them what happens when they click).
- Do not use filler phrases: "In today's world", "Look no further", "At [Company]", "We are proud to".
- Match tone to the client voice profile if specified.

SCRVNR GATE AWARENESS:
All copy you generate will be evaluated by the SCRVNR gate, which checks:
  Pass 1 — AI Detection: Copy must not read as AI-generated. Vary sentence length. Use specific details. Avoid patterned structures.
  Pass 2 — Voice Alignment: Copy must match the client voice profile. If no profile, default to confident, direct, conversational.
Write as if SCRVNR will reject generic output. It will.`;
}

function buildScrvnrProtocol(): string {
  return `FEATURE: SCRVNR Gate Evaluation

You are evaluating website copy against two criteria. Respond with a structured verdict only — no conversational text.

PASS 1 — AI DETECTION:
Evaluate whether the copy reads as AI-generated. Look for:
- Repetitive sentence structure (every sentence same length/rhythm)
- Filler openers ("In today's competitive landscape", "As a business owner...")
- Generic claims with no specificity ("high quality", "expert team", "customer-focused")
- Patterned list structures where prose would serve better
- Missing concrete details (numbers, specifics, named services)

Score 0.0–1.0 where 1.0 = definitely human-written.
Threshold to pass: 0.65

PASS 2 — VOICE ALIGNMENT:
Evaluate whether the copy matches the specified voice profile.
If no voice profile is provided, evaluate against: confident, direct, conversational, specific.
Score 0.0–1.0 where 1.0 = perfect alignment.
Threshold to pass: 0.70

Gate opens only if BOTH passes meet threshold.
For each failed section, list specific failure reasons — actionable, not vague.`;
}

function buildCompetitiveScanProtocol(): string {
  return `FEATURE: Competitive Analysis

Known competitors (if any) are listed in the CLIENT CONTEXT section above.

ANALYSIS REQUIREMENTS:
- Identify positioning gaps (what competitors claim vs. what they can prove)
- Surface content opportunities (topics competitors rank for that the client doesn't)
- Flag differentiation angles (genuine advantages the client has vs. the field)
- Do not fabricate data. If you don't have information, say so explicitly.
- Cite your reasoning. Every claim should trace to observable evidence.`;
}

function buildUpsellProtocol(tenant?: TenantConfig): string {
  const tenantName = tenant?.name ?? "our platform";
  return `FEATURE: Upsell Opportunity Detection

Analyze the provided client data and identify genuine upsell opportunities.
An opportunity is genuine if:
1. There is an observable gap in the client's current service coverage
2. The gap is causing measurable harm (traffic loss, missed rankings, competitive disadvantage)
3. There is a specific ${tenantName} service that directly addresses it

Do not manufacture urgency. Do not recommend services that aren't warranted.
For each opportunity: describe the gap, quantify the impact if possible, and name the service that addresses it.`;
}

function buildVoiceCaptureProtocol(): string {
  return `FEATURE: Brand Voice Capture

You are analyzing scraped website content to extract a precise, actionable brand voice profile for the client identified in the CLIENT CONTEXT above.

ANALYSIS OBJECTIVE:
Extract the authentic brand voice so that AI-generated content written for this client sounds indistinguishable from their own writing. This profile will be used to tune all future content generation for this account.

ANALYSIS METHODOLOGY:
- Read the content holistically before scoring — look for patterns, not exceptions
- Vocabulary: pull actual repeated terms and phrases from the text — do not invent them
- Sentence structure: note real observed patterns (length, subordinate clauses, fragments, questions)
- Formality: 1 = "hey, what's up!" casual / 10 = legal brief formal
- Enthusiasm: 1 = dry and matter-of-fact / 10 = exclamation points everywhere
- Technicality: 1 = plain everyday language / 10 = assumes deep domain expertise
- Brevity: 1 = long discursive paragraphs / 10 = terse bullet-point style

QUALITY STANDARDS:
- Tonality must be specific. "Professional yet approachable" is too generic — describe HOW they achieve that.
- Vocabulary must contain actual terms from the text, not generic industry words.
- Every score must be defensible from the content provided. If the content is insufficient to determine a dimension, score it 5 (neutral) and note the uncertainty in tonality.`;
}

// ── Output format contracts (static — unchanged from pre-PERF-004) ─────────────

function buildOutputContract(feature: AIFeature): string {
  switch (feature) {
    case "content_brief":
      return `OUTPUT FORMAT:
Respond with a JSON object only. No preamble. No markdown backticks.
Schema:
{
  "headline": string,
  "objective": string,
  "targetAudience": string,
  "wordCountRange": { "min": number, "max": number },
  "outline": [{ "heading": string, "description": string }],
  "keywords": [{ "term": string, "type": "primary"|"secondary"|"lsi", "guidance": string }],
  "competitiveAngle": string,
  "seoRequirements": string,
  "toneNotes": string
}`;

    case "website_copy":
      return `OUTPUT FORMAT:
Respond with the copy text only. No JSON wrapper. No commentary.
Write the section copy directly. If multiple sections were requested, separate with ---SECTION_BREAK---.`;

    case "scrvnr_gate":
      return `OUTPUT FORMAT:
Respond with a JSON object only. No preamble. No markdown backticks.
Schema:
{
  "gate_open": boolean,
  "pass1_score": number,
  "pass2_score": number,
  "sections_evaluated": string[],
  "failed_sections": string[],
  "action_required": string | null,
  "composer_feedback": [{ "section": string, "pass": boolean, "failures": string[] }]
}`;

    case "competitive_scan":
      return `OUTPUT FORMAT:
Respond with a JSON object only. No preamble. No markdown backticks.
Schema:
{
  "gaps": [{ "description": string, "impact": string, "evidence": string }],
  "contentOpportunities": [{ "topic": string, "reasoning": string }],
  "differentiationAngles": [{ "advantage": string, "basis": string }]
}`;

    case "upsell_detection":
      return `OUTPUT FORMAT:
Respond with a JSON array only. No preamble. No markdown backticks.
Schema: [{ "service": string, "gap": string, "impact": string, "urgency": "high"|"medium"|"low" }]`;

    case "voice_capture":
      return `OUTPUT FORMAT:
Respond with a JSON object only. No preamble. No markdown backticks. No \`\`\`json fences.
Schema:
{
  "tonality": string,
  "vocabulary": string[],
  "sentenceStructure": string,
  "characteristics": {
    "formality": number,
    "enthusiasm": number,
    "technicality": number,
    "brevity": number
  }
}`;

    // Content Studio — detailed format instructions are inline in user prompt; no contract needed here
    case "seo_strategy":
    case "blog_post":
    case "social_posts":
    case "ppc_ads":
    case "meta_description":
      return "";

    default:
      return "";
  }
}
