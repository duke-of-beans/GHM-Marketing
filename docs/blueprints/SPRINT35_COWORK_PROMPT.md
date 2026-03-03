Execute Sprint 35 — Tenant Visual Identity + Brand System per the blueprint at docs/blueprints/SPRINT35_36_BLUEPRINT.md. Read the Sprint 35 sections completely before writing any code.

CONTEXT: Sprint 34 made COVOS the platform and GHM a tenant at the data layer. Sprint 35 does the same at the visual layer. A second tenant must be able to log in and see their logo, their colors, their voice — not GHM's. Before this sprint, the navbar, login screen, brochure, audit PDFs, and comp sheet all still say GHM. After this sprint, they're all tenant-driven.

MANDATORY READS BEFORE ANY WORK:
1. docs/blueprints/SPRINT35_36_BLUEPRINT.md — Sprint 35 sections
2. prisma/schema.prisma — GlobalSettings model (voice/style fields already exist — no migration needed)
3. src/components/layout/ — find sidebar/navbar component (logo location)
4. src/app/(auth)/login/page.tsx — find hardcoded logo
5. src/lib/email/index.ts — find all sendEmail() calls
6. Grep for "GHM" across src/ — every hardcoded GHM string in UI is a target

PHASE 1 — run all three tracks in parallel:

Track A (FEAT-016): Audit the Settings UI against the existing GlobalSettings schema. Fields for voice (voiceTone, voiceKeywords, voiceAntiKeywords, voiceSampleCopy, voiceIndustry, voiceAudience) and visual style (brandColor, brandColorSecondary, brandColorAccent, styleFontHeading, styleFontBody) already exist in schema — the gap is in the UI. Build or complete the Branding settings tab (3 color pickers with role labels + reset buttons + null state indicator). Build or complete the Brand Voice settings tab (tone, keywords tag input, anti-keywords tag input, sample copy textarea, industry, audience). Then audit every AI route that generates copy (content studio, work orders, reports, audit summaries) — inject tenant voice into every system prompt using the pattern in the blueprint.

Track B (FEAT-018): Create src/components/ui/tenant-logo.tsx — reads GlobalSettings.logoUrl, falls back to COVOS wordmark SVG, accepts size prop. Wire it into sidebar/navbar and login page — replace every hardcoded logo reference. Add logo upload to Settings → Branding tab (Vercel Blob upload, max 2MB, PNG/SVG/WEBP, preview renders immediately, remove button clears to null). Confirm BrandThemeInjector (from Sprint 17) reads brandColor/brandColorSecondary/brandColorAccent and injects CSS custom properties — if not built, build it now.

Track C (UX-FEAT-003): Define default dashboard widget layouts per role in src/lib/dashboard/default-layouts.ts — admin/manager layout (revenue metrics, client health, team activity, goals, quick actions) and sales rep layout (my pipeline, my book, needs attention, sales tools, earnings). On first render, check user.dashboardLayout — if null, inject role default and persist via PATCH /api/users/me/dashboard-layout. Never overwrite an existing custom layout.

PHASE 2 — after Phase 1 complete, run parallel:

Track D (FEAT-017): Redesign the brochure generator. Grep the brochure template/generator for every hardcoded "GHM" string and replace with tenant variables (companyName, companyTagline, logoUrl, brandColor, voiceIndustry). Redesign layout: strong typographic hierarchy, brand color section bars, clean whitespace, sections (About → Services → Process → Results → Next Steps → Contact). Generate a test brochure as covosdemo tenant — zero GHM text.

Track E (FEAT-021): Same tenant variable treatment for audit PDFs and comp sheet. Grep for "GHM" strings in all three document generators — replace with TenantConfig/GlobalSettings equivalents. Generate test outputs as covosdemo tenant — zero GHM text, COVOS Demo branding renders correctly.

PHASE 3 — after all prior tracks complete:

Track F: npx tsc --noEmit — zero new errors. Visual spot check as covosdemo tenant: login (correct logo) → navbar (correct logo) → brochure (COVOS Demo branding) → audit PDF (COVOS Demo branding) → dashboard (role-appropriate widget defaults). Add partner restriction language to SERVICE_AGREEMENT.md per LEGAL-001 in the blueprint.

CONSTRAINTS:
- No Prisma migrations — GlobalSettings schema is complete, Settings UI is the gap
- Zero new TypeScript errors
- GHM tenant must continue working throughout — ghm.covos.app is not broken
- covosdemo tenant is the verification target — use it for every spot check
- No behavior changes for any existing feature

CLOSE THE SPRINT:
1. Update STATUS.md
2. Add Sprint 35 to CHANGELOG.md  
3. Update BACKLOG.md — close Sprint 35 items, confirm Sprint 36 is next
4. git sync/commit/push with the commit message from the blueprint
