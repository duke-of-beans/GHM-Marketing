# MORNING BRIEFING
**Session:** 2026-03-15T00:00:00
**Environment:** BUSINESS
**Project:** GHM Dashboard / COVOS
**Blueprint:** COVOS-PERF-04 — callAI() Prompt Caching

---

## SHIPPED
| Item | Status | Files Modified |
|------|--------|----------------|
| PERF-004: Refactor system-prompt-builder.ts — new assembly order, buildStaticPreamble + buildClientContext, return { static, dynamic } | COMPLETE | src/lib/ai/context/system-prompt-builder.ts |
| PERF-004: Update callModel() — two-block system array with cache_control: ephemeral on static block | COMPLETE | src/lib/ai/client.ts |
| PERF-004: Add anthropic-beta prompt-caching-2024-07-31 header to Anthropic client singleton | COMPLETE | src/lib/ai/client.ts |
| PERF-004: Export SystemPromptParts type from public AI index | COMPLETE | src/lib/ai/index.ts |

---

## QUALITY GATES
- **tsc --noEmit:** PASS — 0 new errors. 10 pre-existing errors in unrelated files (basecamp scripts, presence route, leads component) unchanged.
- **SHIM:** Not run this session (no code quality issues detected — pure structural refactor).
- **Git:** `5eecb65`

---

## DECISIONS MADE BY AGENT

- **voice_capture protocol text** — Removed `${ctx.clientName}` from static protocol text, replaced with "the client identified in the CLIENT CONTEXT above". Rationale: clientName is dynamic per-call; the static section cannot reference it. The client is unambiguously identified by the dynamic CLIENT CONTEXT block that follows. Confidence: HIGH.

- **buildStaticPreamble receives _feature param** — Included `_feature: AIFeature` as first parameter (unused, prefixed with underscore) for future extensibility. Rationale: feature-specific static preamble may be needed later without a signature change. Confidence: HIGH.

- **website_copy tier guidance** — Old code showed only the *selected* tier's guidance string. New static section describes all 3 tiers; selected tier value moves to dynamic CLIENT CONTEXT as "SELECTED PROPERTY TIER: tier1/2/3". Rationale: tier descriptions are platform-level static content; only the selection is per-call. Functionally equivalent — the model receives all same information. Confidence: HIGH.

- **competitive_scan KNOWN COMPETITORS header** — Old code included competitors inline in the feature section. New static section adds "Known competitors (if any) are listed in the CLIENT CONTEXT section above." as a forward reference; competitors list moves to dynamic block. Rationale: competitor list is client-specific, changes per call. Confidence: HIGH.

- **content_brief TASK block** — Old code embedded task title/category/keywords in the static feature section. New static section adds "Task title, category, and target keywords (if provided) appear in the CLIENT CONTEXT section above." as a forward reference; TASK block moves to dynamic. Rationale: task data is per-call, not reusable across clients. Confidence: HIGH.

- **Pre-existing tsc errors** — 10 errors in basecamp/presence/leads files not touched by this sprint. Confirmed pre-existing by verifying error locations are all outside the AI module. No new errors introduced. Confidence: HIGH.

---

## UNEXPECTED FINDINGS

- intel/ai-client.ts (CPR-01) caches the entire system prompt as a single static block, while callAI() (PERF-004) splits into static + dynamic. This is correct and intentional — IE prompts are fully developer-authored with no per-call client context, so single-block caching is appropriate there. The two patterns are not in conflict, just different use cases.

- No external consumers of `buildSystemPrompt` were found in the codebase (confirmed via full-project content search). The return-type change from `string` to `{ static: string; dynamic: string }` has zero downstream breakage risk outside the AI module.

---

## FRICTION LOG

### Logged Only
| # | Category | What happened |
|---|----------|--------------|
| 1 | TOOL | `mcp__Desktop_Commander__read_file` returned only file metadata with no content body. Had to use `read_multiple_files` then parse the JSON output file via Python in the Linux sandbox. |
| 2 | TOOL | `read_multiple_files` result exceeded token limit (183K chars); tool saved to temp file instead of returning inline. Required secondary read + Python parsing step. |
| 3 | ENV | `cmd /c type` failed for Windows file paths from Linux VM shell. Required PowerShell `Get-Content` as fallback. |

---

## NEXT QUEUE (RECOMMENDED)

1. **TRUST-001 — Privacy Trust Dashboard** — Ready to run. No dependencies on PERF-004. Next in sprint queue per STATUS.md.
2. **SEC-004 — Tenant Isolation Verification** — Ready to run. Structural sprint; no schema changes required.
3. **SEC-004-FRICTION — sanitizeContentInput configurable max-length** — Small friction item, can be batched with SEC-004 or run standalone. Tagged Small.

---

*Written by Cowork agent at session end. Do not edit — this is a point-in-time record.*
