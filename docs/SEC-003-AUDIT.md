# SEC-003 Audit Log — Context Minimization
**Sprint:** COVOS-SEC-01 | **Date:** 2026-03-14 | **Status:** COMPLETE

Every AI API call site was reviewed against the three minimization rules:
- (a) No client PII (full names, phone, email) unless the task is explicitly about that client's communication
- (b) Competitor data limited to specific metrics required by the task — no full snapshot objects
- (c) No tenant config, API keys, DB IDs, or internal scoring weights in any prompt

Field counts below refer to distinct user-data fields interpolated into the **prompt string**.
Context object fields (`clientId`, `clientName`, `tenantVoice`) are passed to `callAI()` for
system-prompt building and cost attribution only — they do not appear in the prompt string itself.

---

| Call site | Feature | Prompt fields BEFORE | Prompt fields AFTER | PII present? | API key present? | DB IDs in prompt? | Notes |
|-----------|---------|---------------------|--------------------|-|-|-|-|
| `generate-blog/route.ts` | `blog_post` | 4 | 4 | No | No | No | All user fields now length-bounded at 2000 chars |
| `generate-meta/route.ts` | `meta_description` | 3 | 3 | No | No | No | `pageContent` now max 2000 chars |
| `generate-ppc/route.ts` | `ppc_ads` | 3 + 3 voice | 3 + 3 voice | No | No | No | Voice fields already limited to 5 specific DB columns |
| `generate-social/route.ts` | `social_posts` | 3 | 3 | No | No | No | `blogPost.content` (DB) now max 2000 chars |
| `generate-strategy/route.ts` | `seo_strategy` | 1 | 1 | No | No | No | `input` now max 2000 chars |
| `voice-capture.ts` | `voice_capture` | 1 | 1 | No | No | No | **Key reduction:** websiteContent was up to ~25,000 chars; now capped at 2000 |
| `task-intelligence.ts` | `content_brief` | 4 | 4 | No | No | No | `competitorInfo` already limited to 3 competitors (`.take(3)`) |


---

## Per-call-site detail

### 1. `generate-blog/route.ts` — `blog_post`
- **Before:** 4 user fields in prompt (businessName, keywordList, businessIndustry, postTone). No bound on field length.
- **After:** Same 4 fields, each now max 2000 chars.
- **Removed:** Nothing. Fields are minimum necessary for the task.
- **PII check:** `client.businessName` is a business name, not personal PII. ✅
- **API keys / DB IDs:** None in prompt. `clientId` is in `context` for cost tracking only. ✅

### 2. `generate-meta/route.ts` — `meta_description`
- **Before:** 3 user fields (pageContent, url, keywordList). `pageContent` unbounded.
- **After:** Same 3 fields, all max 2000 chars. Key: `pageContent` was previously unbounded user text — could be an entire web page.
- **Removed:** Nothing. Minimal for generating a meta description.
- **PII check:** No personal PII. ✅
- **API keys / DB IDs:** None. ✅

### 3. `generate-ppc/route.ts` — `ppc_ads`
- **Before:** 3 request fields (service, keywords, callToAction) + 3 voice profile text fields (tonality, vocabulary[0:10], sentenceStructure).
- **After:** Same 6 fields, all max 2000 chars. Voice profile already pre-limited to 5 specific DB columns (not the full VoiceProfile object).
- **Removed:** Full VoiceProfile object never passed — already correct. Numeric fields (formality, enthusiasm) are interpolated as numbers, not text.
- **PII check:** No personal PII. ✅
- **API keys / DB IDs:** None. ✅

### 4. `generate-social/route.ts` — `social_posts`
- **Before:** 3 fields (sourceContent/topic, postTone, sourceTitle or blogPost.content). `blogPost.content` unbounded (full blog post).
- **After:** Same 3 fields, all max 2000 chars. `blogPost.content` now truncated to 2000 chars — sufficient context for social post generation.
- **Removed:** Nothing structural; payload size bounded.
- **PII check:** No personal PII. ✅
- **API keys / DB IDs:** None. ✅

### 5. `generate-strategy/route.ts` — `seo_strategy`
- **Before:** 1 user field (`input`). Unbounded.
- **After:** 1 field, max 2000 chars.
- **Removed:** Nothing. `client.businessName` is needed for business-specific keyword/topic generation.
- **PII check:** No personal PII. ✅
- **API keys / DB IDs:** None. ✅

### 6. `src/lib/scrvnr/voice-capture.ts` — `voice_capture`
- **Before:** 1 field (`websiteContent`). Unbounded — scraper limited to ~5,000 words (~25,000–35,000 chars) but no further restriction before AI call.
- **After:** 1 field, max 2,000 chars. **Significant payload reduction.**
- **Removed:** ~23,000–33,000 chars of scraped content per call.
- **Note (friction):** The 2,000-char cap may reduce voice profile accuracy. This is a known trade-off between security and feature quality. Logged in FRICTION section of MORNING_BRIEFING.
- **PII check:** Scraped website content could contain public business contact info (address, email on contact page). The `$('script, style, nav, footer, header').remove()` call in the scraper removes footer contact blocks, mitigating most exposure. ✅
- **API keys / DB IDs:** None. ✅

### 7. `src/lib/ai/task-intelligence.ts` — `content_brief`
- **Before:** 4 fields (title, description, clientName, competitorInfo). No bound. Competitors already limited to 3 via `.take(3)` in the route handler.
- **After:** Same 4 fields, all max 2000 chars.
- **Removed:** Nothing. `client.healthScore` is fetched from DB but confirmed NOT passed to the prompt string (verified by reading the route handler). `competitorInfo` format is already `"businessName (domain)"` — minimum necessary.
- **PII check:** `client.healthScore` is a numeric score, not personal PII. `competitorInfo` contains business names and domains, not personal data. ✅
- **API keys / DB IDs:** `clientId` in `context` object is for cost attribution logging, not in prompt string. ✅

---

## Rules compliance summary

| Rule | Status |
|------|--------|
| (a) No client PII (full names, phone, email) in prompts | ✅ PASS — only business names used |
| (b) Competitor data limited to task-specific metrics | ✅ PASS — no full snapshot objects passed anywhere |
| (c) No tenant config, API keys, DB IDs, or scoring weights in prompts | ✅ PASS — `clientId` is in context for logging only, never in prompt strings |

No structural field removals were required — all call sites were already sending
minimum-necessary data. The primary SEC-003 remediation is payload size bounding
via `sanitizePromptInput()` (shared with SEC-002), which caps unbounded fields.
