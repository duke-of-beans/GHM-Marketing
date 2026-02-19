/**
 * Complexity Analyzer — GHM Dashboard
 *
 * Adapted from GREGORE orchestration/router/complexity-analyzer.ts
 * Core weighted scoring preserved (syntactic 0.2, semantic 0.3, reasoning 0.3, domain 0.2).
 *
 * GHM additions:
 * - SEO, copywriting, competitive domains added to domain specificity map
 * - Intent detection extended for website_copy, brief_generation, scrvnr_eval
 */

import type {
  QueryComplexity,
  QueryClassification,
  QueryDomain,
  QueryIntent,
} from "./types";

interface ComplexityAnalysis {
  score: number;
  classification: QueryComplexity;
  factors: {
    syntactic: number;
    semantic: number;
    reasoningDepth: number;
    domainSpecificity: number;
  };
  confidence: number;
}

// ── Public entry points ───────────────────────────────────────────────────────

export function classifyQuery(query: string): QueryClassification {
  const complexityAnalysis = analyzeComplexity(query);
  const intent = detectIntent(query);
  const domain = detectDomain(query);

  return {
    intent: intent.classification,
    complexity: complexityAnalysis.classification,
    domain: domain.classification,
    confidence: {
      intent: intent.confidence,
      complexity: complexityAnalysis.confidence,
      domain: domain.confidence,
    },
  };
}

export function analyzeComplexity(query: string, domain?: QueryDomain): ComplexityAnalysis {
  const syntactic = analyzeSyntactic(query);
  const semantic = analyzeSemantic(query, domain);
  const reasoningDepth = analyzeReasoning(query);
  const domainSpecificity = analyzeDomainSpecificity(query, domain);

  const score =
    syntactic * 0.2 +
    semantic * 0.3 +
    reasoningDepth * 0.3 +
    domainSpecificity * 0.2;

  const classification = classifyScore(score);
  const confidence = factorConfidence([syntactic, semantic, reasoningDepth, domainSpecificity]);

  return { score, classification, factors: { syntactic, semantic, reasoningDepth, domainSpecificity }, confidence };
}

// ── Factor analyzers (from GREGORE, unchanged) ────────────────────────────────

function analyzeSyntactic(query: string): number {
  const sentences = query.split(/[.!?]+/).filter(Boolean);
  const avgLen = query.length / Math.max(sentences.length, 1);
  const nestingChars = (query.match(/[,;—–-]/g) || []).length;
  const questionCount = (query.match(/\?/g) || []).length;
  const subordinate = ["that", "which", "who", "where", "when", "if"].filter((w) =>
    query.toLowerCase().includes(w)
  ).length;

  return (
    Math.min(avgLen / 100, 1) * 0.3 +
    Math.min(nestingChars / 5, 1) * 0.3 +
    Math.min(questionCount / 3, 1) * 0.2 +
    Math.min(subordinate / 3, 1) * 0.2
  );
}

function analyzeSemantic(query: string, domain?: QueryDomain): number {
  const words = query.toLowerCase().split(/\s+/);
  const lexicalDiversity = new Set(words).size / Math.max(words.length, 1);

  const abstractMarkers = ["concept", "theory", "principle", "framework", "paradigm", "methodology"];
  const abstractScore = Math.min(
    abstractMarkers.filter((m) => query.toLowerCase().includes(m)).length / 3, 1
  );

  const reasoningMarkers = ["therefore", "because", "thus", "hence", "implies", "leads to", "causes"];
  const reasoningScore = Math.min(
    reasoningMarkers.filter((m) => query.toLowerCase().includes(m)).length / 2, 1
  );

  return lexicalDiversity * 0.3 + abstractScore * 0.3 + estimateTechnicalDensity(query, domain) * 0.2 + reasoningScore * 0.2;
}

function analyzeReasoning(query: string): number {
  const lower = query.toLowerCase();
  const logical = ["and", "or", "not", "however", "although", "unless"].filter((m) =>
    lower.includes(` ${m} `)
  ).length;
  const comparison = ["better", "worse", "compare", "contrast", "versus", "vs", "than"].filter((m) =>
    lower.includes(m)
  ).length;
  const quantifiers = ["all", "some", "none", "many", "few", "most", "every"].filter((q) =>
    lower.includes(q)
  ).length;
  const conditional = ["if", "when", "unless", "provided", "given"].filter((m) =>
    lower.includes(m)
  ).length;

  return (
    Math.min(logical / 3, 1) * 0.3 +
    Math.min(comparison / 2, 1) * 0.3 +
    Math.min(quantifiers / 2, 1) * 0.2 +
    Math.min(conditional / 2, 1) * 0.2
  );
}

function analyzeDomainSpecificity(query: string, domain?: QueryDomain): number {
  if (domain && domain !== "general") {
    const domainComplexityMap: Record<QueryDomain, number> = {
      general: 0.1,
      technical: 0.7,
      seo: 0.6,
      copywriting: 0.5,
      competitive: 0.6,
      financial: 0.8,
      legal: 0.9,
    };
    return domainComplexityMap[domain] ?? 0.5;
  }
  return estimateTechnicalDensity(query);
}

function estimateTechnicalDensity(query: string, _domain?: QueryDomain): number {
  const words = query.split(/\s+/);
  const capitalizedScore = Math.min(
    words.filter((w) => w === w.toUpperCase() && w.length > 1).length / 3, 1
  );
  const suffixScore = Math.min(
    words.filter((w) =>
      ["tion", "ism", "ology", "ence", "ance", "ment"].some((s) => w.toLowerCase().endsWith(s))
    ).length / 3, 1
  );
  const numericScore = Math.min((query.match(/\d+/g) || []).length / 5, 1);
  return capitalizedScore * 0.4 + suffixScore * 0.3 + numericScore * 0.3;
}

function classifyScore(score: number): QueryComplexity {
  if (score < 0.25) return "simple";
  if (score < 0.5) return "moderate";
  if (score < 0.75) return "complex";
  return "very_complex";
}

function factorConfidence(factors: number[]): number {
  const mean = factors.reduce((s, f) => s + f, 0) / factors.length;
  const variance = factors.reduce((s, f) => s + Math.pow(f - mean, 2), 0) / factors.length;
  return Math.exp(-5 * variance);
}

// ── Intent + Domain detection ─────────────────────────────────────────────────

function detectIntent(query: string): { classification: QueryIntent; confidence: number } {
  const lower = query.toLowerCase();

  const scores: Record<QueryIntent, number> = {
    website_copy:      ["hero", "headline", "section", "copy", "cta", "page copy", "above the fold"].filter((m) => lower.includes(m)).length,
    brief_generation:  ["brief", "content brief", "outline", "strategy", "keywords brief"].filter((m) => lower.includes(m)).length,
    scrvnr_eval:       ["scrvnr", "voice alignment", "ai detection", "gate", "pass", "fail"].filter((m) => lower.includes(m)).length,
    creation:          ["create", "generate", "write", "build", "make", "design"].filter((m) => lower.includes(m)).length,
    analysis:          ["analyze", "examine", "review", "evaluate", "assess"].filter((m) => lower.includes(m)).length,
    reasoning:         ["explain", "why", "how", "prove", "deduce", "reason"].filter((m) => lower.includes(m)).length,
    coding:            ["code", "function", "debug", "fix", "implement", "algorithm"].filter((m) => lower.includes(m)).length,
  };

  const best = (Object.entries(scores) as [QueryIntent, number][]).reduce(
    (max, [intent, score]) => (score > max.score ? { intent, score } : max),
    { intent: "reasoning" as QueryIntent, score: 0 }
  );

  return {
    classification: best.intent,
    confidence: Math.min(best.score / 3, 1) * 0.7 + 0.3,
  };
}

function detectDomain(query: string): { classification: QueryDomain; confidence: number } {
  const lower = query.toLowerCase();

  const scores: Record<QueryDomain, number> = {
    seo:          ["seo", "keyword", "ranking", "serp", "backlink", "meta", "organic"].filter((m) => lower.includes(m)).length,
    copywriting:  ["copy", "headline", "cta", "tone", "voice", "brand", "page copy", "message"].filter((m) => lower.includes(m)).length,
    competitive:  ["competitor", "competition", "rival", "market share", "benchmark"].filter((m) => lower.includes(m)).length,
    technical:    ["api", "database", "server", "algorithm", "framework", "library"].filter((m) => lower.includes(m)).length,
    financial:    ["financial", "revenue", "cost", "invoice", "pricing", "commission"].filter((m) => lower.includes(m)).length,
    legal:        ["legal", "contract", "regulation", "compliance", "law"].filter((m) => lower.includes(m)).length,
    general:      0,
  };

  const best = (Object.entries(scores) as [QueryDomain, number][]).reduce(
    (max, [domain, score]) => (score > max.score ? { domain, score } : max),
    { domain: "general" as QueryDomain, score: 0 }
  );

  return {
    classification: best.domain,
    confidence: Math.min(best.score / 3, 1) * 0.7 + 0.3,
  };
}
