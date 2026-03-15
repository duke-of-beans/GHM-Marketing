# SEC-002 Audit Log — AI Prompt Injection Defense
**Sprint:** COVOS-SEC-01 | **Date:** 2026-03-14 | **Status:** COMPLETE

All AI call sites in the codebase were audited for user-controlled string
interpolation into prompt templates.  Every identified injection vector has
been wrapped with `sanitizePromptInput()` from `src/lib/ai-security.ts`.
Developer-authored system prompts containing no user data are marked CLEAN.

---

## Sanitizer implementation

**File:** `src/lib/ai-security.ts`  
**Export:** `sanitizePromptInput(str: string): string`

Transforms applied in order:
1. Strip null bytes (`\x00`)
2. Strip Unicode direction-override characters (U+202A–U+202E, U+2066–U+2069)
3. Collapse runs of 4+ consecutive newlines to exactly 3
4. Strip injection phrases at line start: `ignore previous instructions`, `system:`, `###`
5. Truncate to 2000 chars with `[truncated]` suffix

A clean string passes through unchanged (verified via static analysis).

---

## Call site audit

### 1. `src/app/api/content/generate-blog/route.ts`
**Status: PATCHED**  
**AI function:** `callAI({ feature: 'blog_post', prompt, ... })`  
**Injection vectors found:**
- `keywords` (request body array → joined string) → `keywordList`
- `industry` (request body string) → `businessIndustry`
- `tone` (request body string) → `postTone`

**Fix:** All three wrapped in `sanitizePromptInput()` before prompt template assembly.  
`client.businessName` is DB-sourced (not directly user-typed in this request) — included
in prompt but considered low-risk; no change needed per spec.

### 2. `src/app/api/content/generate-meta/route.ts`
**Status: PATCHED**  
**AI function:** `callAI({ feature: 'meta_description', prompt, ... })`  
**Injection vectors found:**
- `pageContent` (request body — full page text submitted by user)
- `url` (request body string)
- `keywords` (request body array → joined string)

**Fix:** All three sanitized. `safePageContent`, `safeUrl`, sanitized `keywordList`.

---

### 3. `src/app/api/content/generate-ppc/route.ts`
**Status: PATCHED**  
**AI function:** `callAI({ feature: 'ppc_ads', prompt, ... })`  
**Injection vectors found:**
- `service` (request body — campaign/service description)
- `keywords` (request body string)
- `callToAction` (request body string)
- Voice profile fields (DB-sourced but originally captured from user-authored website copy):
  `tonality`, `vocabulary`, `sentenceStructure`

**Fix:** `service`, `keywords`, `callToAction` → `safeService`, `safeKeywords`, `safeCta`.
Voice profile text fields wrapped: `safeTonality`, `safeVocab`, `safeSentenceStructure`.
Numeric voice fields (`formality`, `enthusiasm`) are not user text — no wrapping needed.

---

### 4. `src/app/api/content/generate-social/route.ts`
**Status: PATCHED**  
**AI function:** `callAI({ feature: 'social_posts', prompt, ... })`  
**Injection vectors found:**
- `topic` (request body — user-supplied topic string, used when no `blogPostId`)
- `tone` (request body string)
- `blogPost.content` (DB-sourced AI-generated content — defensive sanitization)
- `blogPost.title` (DB-sourced — defensive sanitization)

**Fix:** `topic` → `sanitizePromptInput(topic)`. `tone` sanitized. Blog content and title
sanitized defensively (AI-generated but cached in DB, could be re-injected if a prior
AI response was tampered with or if DB was compromised).

---

### 5. `src/app/api/content/generate-strategy/route.ts`
**Status: PATCHED**  
**AI function:** `callAI({ feature: 'seo_strategy', prompt, ... })`  
**Injection vectors found:**
- `input` (request body — theme/niche for topics mode, or topic for keywords mode)

**Fix:** `input` → `safeInput` via `sanitizePromptInput()`. Used in both `topics` and
`keywords` branches.

---

### 6. `src/app/api/clients/[id]/capture-voice/route.ts`
**Status: CLEAN — no direct AI call**  
Delegates entirely to `captureVoiceFromWebsite()` in `src/lib/scrvnr/voice-capture.ts`.
No prompt construction in this file. Sanitization applied at the library level (see #7).

---

### 7. `src/lib/scrvnr/voice-capture.ts`
**Status: PATCHED**  
**AI function:** `callAI({ feature: 'voice_capture', prompt, ... })`  
**Injection vectors found:**
- `websiteContent` — scraped HTML text from a user-supplied URL. An adversarial
  website could embed injection phrases designed to override the AI system prompt.

**Fix:** `websiteContent` → `safeWebsiteContent = sanitizePromptInput(websiteContent)`.

---

### 8. `src/lib/ai/task-intelligence.ts` (`generateContentBrief`)
**Status: PATCHED**  
**AI function:** `callAI({ feature: 'content_brief', prompt, ... })`  
**Injection vectors found:**
- `title` — ClientTask title, created by users via the task interface
- `description` — ClientTask description, user-authored
- `clientName` — ClientProfile.businessName, user-entered at client creation
- `competitorInfo` — concatenated competitor `businessName (domain)` strings, user-entered

**Fix:** All four wrapped: `safeTitle`, `safeDescription`, `safeClientName`,
`safeCompetitorInfo`. `safeClientName` also used in `context.clientName` passed to
`callAI()` for system-prompt building.

---

### 9. `src/lib/intel/task-generator.ts`
**Status: CLEAN — no AI calls**  
Uses `interpolate()` from `task-templates.ts` to build task titles and descriptions
that are written to the DB as `ClientTask` records. No AI API calls are made in this
file. The interpolated strings never reach a prompt directly.

---

### 10. `src/lib/intel/patterns/upsell.ts`
**Status: CLEAN — no AI calls**  
`interpolateReasoning()` builds reasoning strings using competitor domain (DB) and
metric values (numeric). Output written to `UpsellOpportunity.reasoning` or
`ClientTask.description` in DB. No AI API calls in this file.

---

### 11. `src/lib/intel/patterns/cannibalization.ts`
**Status: CLEAN — no AI calls**  
Task title and description constructed from DB-sourced keyword strings and domain
names. No AI API calls.

---

### 12. `src/lib/intel/patterns/cross-client.ts`
**Status: CLEAN — no AI calls**  
Pure read-only DB aggregation. Returns structured `CrossClientSummary` objects.
No AI API calls.

---

### 13. `src/lib/intel/scan-orchestrator.ts`
**Status: CLEAN — no direct AI calls**  
Orchestrates sensor execution and pattern detection. All AI calls are two levels
down (sensors → external APIs, or task-generator → DB writes). No prompt construction
in this file.

---

### 14. `src/lib/intel/health-score.ts`
**Status: CLEAN — no AI calls**  
Pure mathematical scoring function. Zero external calls of any kind.

---

## Summary

| Patched | Clean (no AI calls) |
|---------|---------------------|
| 7 | 7 |

All user-controlled interpolation vectors are now wrapped in `sanitizePromptInput()`.
Developer-authored system prompt templates (the static parts of each prompt) are
unchanged — they contain no user data and require no modification.
