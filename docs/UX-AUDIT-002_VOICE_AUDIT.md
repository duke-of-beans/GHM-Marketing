# UX-AUDIT-002: Voice Audit — Dashboard UI Copy

**Date:** February 25, 2026
**Status:** ✅ COMPLETE — All 9 issues fixed
**Scope:** Full SCRVNR pass on all user-facing copy — page headers, subtitles, nav labels, empty states, button labels, badge labels, toast messages, card titles.
**Target voice:** Professional B2B SaaS for agency operations. Confident, direct, no filler. Not consumer, not casual, not startup-quirky.

---

## Summary

The dashboard voice is **already strong**. Page headers are clean, descriptive, and consistently formatted. The nav structure uses professional labels. Most copy reads like a real operations platform. The audit found **9 specific issues** worth fixing — all minor. No systemic voice problems.

---

## Issues Found

### 1. CASUAL EMPTY STATE — Sales Dashboard "Needs Attention" section

**File:** `src/app/(dashboard)/sales/page.tsx:191`
**Current:** `No active leads — grab some from Available!`
**Problem:** "grab some" is casual/consumer. Exclamation mark adds false urgency.
**Fix:** `No active leads in pipeline. Claim leads from Available to get started.`

### 2. CASUAL FALLBACK — Manager Dashboard subtitle

**File:** `src/app/(dashboard)/manager/page.tsx:104`
**Current:** `Good work, ${firstName} — everything looks healthy`
**Problem:** "Good work" is patronizing in a B2B tool. An operations dashboard shouldn't praise you for logging in.
**Fix:** `All systems nominal` or simply show the contextual stats without a fallback compliment.

### 3. EMOJI IN STATUS BADGES — Onboarding Queue

**File:** `src/app/(dashboard)/clients/onboarding/page.tsx:133-136`
**Current:** `✅ Done` and `⏳ In Progress` as Badge content
**Problem:** Emoji in badges reads consumer/mobile-app. The rest of the dashboard uses Lucide icons (CheckCircle2, Clock) for the same purpose.
**Fix:** Replace emoji with Lucide icons (`<CheckCircle2 className="h-3 w-3" />`) to match bugs-page-client.tsx pattern.

### 4. EMOJI IN NAV LABELS

**File:** `src/components/dashboard/nav.tsx:63-115`
**Current:** All nav items use emoji icons: 🔍, 👥, 🏢, ✅, 🔁, ✍️, 🌐, 📈, 💳, 📦, 🗄️
**Problem:** This is the single biggest voice inconsistency. Emoji nav icons read as a side project or prototype. Every serious B2B SaaS (Linear, Vercel, Stripe) uses SVG/Lucide icons.
**Fix:** Replace all emoji with Lucide icons. Mapping: 🔍→Search, 👥→Users, 🏢→Building2, ✅→CheckSquare, 🔁→Repeat, ✍️→PenTool, 🌐→Globe, 📈→TrendingUp, 💳→CreditCard, 📦→Package, 🗄️→Archive.
**Impact:** HIGH — nav is visible on every page. This is the single highest-impact fix in this audit.

### 5. EMOJI IN SETTINGS TAB — Wave

**File:** `src/app/(dashboard)/settings/page.tsx:103`
**Current:** `💳 Wave` as TabsTrigger content
**Problem:** Every other settings tab uses a Lucide icon. Wave tab uses emoji, breaking the pattern.
**Fix:** `<CreditCard className="h-4 w-4" />Wave` to match siblings.

### 6. INCONSISTENT H1 SIZES

**File:** Multiple pages
**Pattern:** Most pages use `text-3xl font-bold` or `text-2xl font-bold`. But:
- `live-sites/page.tsx` uses `text-xl font-semibold` (smaller, lighter)
- `clients/onboarding/page.tsx` uses `text-xl font-semibold` (smaller, lighter)
**Fix:** Standardize all page h1s to `text-2xl font-bold` (the most common pattern).

### 7. DISCOVERY PAGE SUBTITLE — Too long/feature-oriented

**File:** `src/app/(dashboard)/discovery/page.tsx:11-13`
**Current:** `Search Google Maps for local businesses and get instant quality scores based on reviews, ratings, and online presence`
**Problem:** Reads like marketing copy / feature description rather than an operational subtitle. Other pages use short, functional subtitles.
**Fix:** `Search for businesses and score lead quality` or `Find and qualify new prospects`

### 8. VAULT SUBTITLE — Slightly casual

**File:** `src/app/(dashboard)/vault/page.tsx:44`
**Current:** `Contracts, resources, reports, and personal files — all in one place.`
**Problem:** "all in one place" is a consumer marketing phrase. The em-dash + period ending is slightly casual.
**Fix:** `Contracts, resources, reports, and personal files`

### 9. TOAST MESSAGE VOLUME

**Observation:** 352 toast messages across components. Spot-checked sample — most are clean ("Lead enriched with latest data", "Status updated", "Failed to update — try again"). No systemic issues found, but a few edge cases exist:
- `upsell-opportunities.tsx:114` — `"Service recommendation sent successfully!"` — exclamation mark is consumer-toned. Should be `"Service recommendation sent"`.
- `tutorials/ResetToursCard.tsx:21` — likely casual. Worth checking.

---

## What's Already Good

- **Page headers:** Consistently professional — "Business Analytics", "Sales Pipeline", "Client Portfolio", "Service Catalog", "Permission Management", "Audit Logs", "Recurring Tasks", "Reports".
- **Nav group labels:** "Prospects", "Clients", "Insights", "Finance", "Resources" — all clean.
- **Upsell → Service Recommendations:** The user-facing label already says "Service Recommendations" not "Upsell." Backend code uses "upsell" internally (fine).
- **Empty states:** Most are clean and professional.
- **Card titles:** "Territory Performance", "Lead Source Performance", "Revenue Growth Trend" — all good.
- **Form labels:** Profile, settings, team management — all professional.
- **Onboarding wizard copy:** Professional and clear.

---

## Recommended Execution Order

1. **Nav emoji → Lucide icons** (Issue #4) — highest-impact, visible on every page
2. **Settings Wave tab emoji** (Issue #5) — 1-line fix, completes the pattern
3. **Onboarding badge emoji → icons** (Issue #3) — small fix, pattern consistency
4. **Manager dashboard fallback** (Issue #2) — removes patronizing copy
5. **Sales empty state** (Issue #1) — removes casual copy
6. **H1 size standardization** (Issue #6) — visual consistency
7. **Discovery subtitle** (Issue #7) — tighten copy
8. **Vault subtitle** (Issue #8) — minor polish
9. **Toast exclamation marks** (Issue #9) — micro-polish pass

Total estimated work: ~45 minutes for all 9 fixes.
