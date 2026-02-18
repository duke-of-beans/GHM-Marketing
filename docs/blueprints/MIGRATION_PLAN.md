# GHM Platform — Migration Plan
**Version:** 1.0
**Date:** February 18, 2026
**Owner:** David Kirsch
**Status:** Planned — execute when ready, do not begin mid-session

---

## Objective

Consolidate the current scattered directory structure into a unified `GHM-Platform\` root that reflects the actual product architecture. Both studios, the dashboard, shared infrastructure, and all client work output live under one roof. This migration is a prerequisite for building Website Studio properly.

---

## Current State Inventory

```
D:\Work\
├── SEO-Services\
│   └── ghm-dashboard\          ← Next.js dashboard app (active, deployed)
├── ContentStudio\               ← Content Studio files (active, GAD in production)
│   ├── blueprint\
│   ├── clients\
│   │   └── german-auto-doctor\
│   └── templates\
│       └── gad-mirror.css
├── audi-hub-demo\               ← Early prototype (superseded, archive or delete)
├── audi-satellite-demo\         ← Early prototype (superseded, archive or delete)
├── lead-gen-engine\             ← Separate tool (not part of platform, leave in place)
├── BUSINESS_REGISTRY.md         ← Root-level doc (move to platform docs)
└── CLAUDE_INSTRUCTIONS.md       ← Root-level instructions (update path references after migration)
```

---

## Target State

```
D:\Work\GHM-Platform\
├── dashboard\                   ← Moved from D:\Work\SEO-Services\ghm-dashboard\
├── content-studio\              ← Moved from D:\Work\ContentStudio\
├── website-studio\              ← New directory, created during migration
├── shared\                      ← New directory, created during migration
│   ├── dna-engine\
│   ├── scrvnr\
│   ├── vercel\
│   └── schemas\
└── clients\                     ← New unified client output directory
    └── german-auto-doctor\      ← Moved from ContentStudio\clients\german-auto-doctor\
```

---

## Migration Steps

Execute in order. Do not skip steps.

### Step 1 — Create the platform root
```
mkdir D:\Work\GHM-Platform
mkdir D:\Work\GHM-Platform\website-studio
mkdir D:\Work\GHM-Platform\website-studio\blueprint
mkdir D:\Work\GHM-Platform\website-studio\templates
mkdir D:\Work\GHM-Platform\website-studio\templates\tier-1-extension
mkdir D:\Work\GHM-Platform\website-studio\templates\tier-2-branded-satellite
mkdir D:\Work\GHM-Platform\website-studio\templates\tier-3-pure-satellite
mkdir D:\Work\GHM-Platform\shared
mkdir D:\Work\GHM-Platform\shared\dna-engine
mkdir D:\Work\GHM-Platform\shared\scrvnr
mkdir D:\Work\GHM-Platform\shared\vercel
mkdir D:\Work\GHM-Platform\shared\schemas
mkdir D:\Work\GHM-Platform\clients
mkdir D:\Work\GHM-Platform\clients\german-auto-doctor
mkdir D:\Work\GHM-Platform\clients\german-auto-doctor\dna
mkdir D:\Work\GHM-Platform\clients\german-auto-doctor\dna\voice-profiles
mkdir D:\Work\GHM-Platform\clients\german-auto-doctor\hub-extensions
mkdir D:\Work\GHM-Platform\clients\german-auto-doctor\satellites
mkdir D:\Work\GHM-Platform\clients\german-auto-doctor\satellites\branded
mkdir D:\Work\GHM-Platform\clients\german-auto-doctor\satellites\pure
mkdir D:\Work\GHM-Platform\clients\german-auto-doctor\content
```

### Step 2 — Move the dashboard
```
move D:\Work\SEO-Services\ghm-dashboard D:\Work\GHM-Platform\dashboard
```
**Post-move:** Verify `.git` is intact. Verify `npm run dev` still starts from new path. Update Vercel project root setting if needed. Update any absolute path references in `.env` files.

### Step 3 — Move Content Studio
```
move D:\Work\ContentStudio D:\Work\GHM-Platform\content-studio
```
**Post-move:** Update `D:\Work\CLAUDE_INSTRUCTIONS.md` path references. Verify Python utility scripts (`_clean_snippets.py` etc.) still resolve correctly. Move `gad-mirror.css` from `content-studio\templates\` to `clients\german-auto-doctor\dna\visual-dna.css` — it belongs in the client directory, not the studio templates.

### Step 4 — Move client work output
Move all client-specific build output from its current location into the unified clients directory.
```
move D:\Work\GHM-Platform\content-studio\clients\german-auto-doctor\* 
     D:\Work\GHM-Platform\clients\german-auto-doctor\
```
Reorganize to match the new structure:
- `hub-extensions\` content → `clients\german-auto-doctor\hub-extensions\`
- `satellites\audi\` → `clients\german-auto-doctor\satellites\pure\audi\` (Quattro Authority is Tier 3)
- Voice profile if exists → `clients\german-auto-doctor\dna\voice-profiles\gad-main.json`

### Step 5 — Migrate shared assets
Move `gad-mirror.css` and any other shared template infrastructure into `shared\`:
- DNA schemas → `shared\schemas\visual-dna-schema.json`
- SCRVNR specs (from ContentStudio blueprint) → `shared\scrvnr\`
- Vercel config templates → `shared\vercel\`

### Step 6 — Archive early prototypes
```
mkdir D:\Work\_archive
move D:\Work\audi-hub-demo D:\Work\_archive\audi-hub-demo
move D:\Work\audi-satellite-demo D:\Work\_archive\audi-satellite-demo
```
Do not delete — they contain design decisions and reference content worth preserving.

### Step 7 — Update CLAUDE_INSTRUCTIONS.md
Update all path references in `D:\Work\CLAUDE_INSTRUCTIONS.md` to reflect new locations:
- Dashboard: `D:\Work\GHM-Platform\dashboard`
- Content Studio: `D:\Work\GHM-Platform\content-studio`
- Client files: `D:\Work\GHM-Platform\clients\`
- New Website Studio: `D:\Work\GHM-Platform\website-studio`

### Step 8 — Update environment files
In `dashboard\.env` and `dashboard\.env.local`, update any absolute paths that referenced the old `ghm-dashboard` location.

### Step 9 — Verify dashboard still runs
```
cd D:\Work\GHM-Platform\dashboard
npm run dev
```
Confirm no broken imports or path-dependent failures.

### Step 10 — Update Vercel project settings
If the Vercel project has a root directory configured, update it to point to `dashboard\` within the new monorepo-style structure, or keep it as a standalone project — either works, just needs to be consistent.

---

## Files to Leave in Place

`D:\Work\lead-gen-engine\` — separate tool, not part of the platform. Leave where it is.

`D:\Work\BUSINESS_REGISTRY.md` — move to `D:\Work\GHM-Platform\dashboard\docs\` as a reference document.

`D:\Work\CLAUDE_INSTRUCTIONS.md` — update in place (do not move, it's the root bootstrap file).

---

## Post-Migration Verification Checklist

- [ ] `npm run dev` runs from `D:\Work\GHM-Platform\dashboard\`
- [ ] Dashboard loads in browser, all tabs functional
- [ ] Content Studio tab in client card still renders
- [ ] GAD client data intact in database (Prisma — not affected by file moves)
- [ ] `D:\Work\CLAUDE_INSTRUCTIONS.md` updated with new paths
- [ ] No dangling references to `D:\Work\SEO-Services\ghm-dashboard\`
- [ ] No dangling references to `D:\Work\ContentStudio\`
- [ ] Archive prototypes confirmed present in `D:\Work\_archive\`
- [ ] `clients\german-auto-doctor\` structure matches target layout

---

## Risk Notes

**Git history** — the dashboard has a `.git` directory. Moving it preserves history as long as the `.git` folder moves with the directory. Do not copy without `.git`.

**Vercel deployment** — the live dashboard deployment on Vercel points to a git remote, not a local path. The file system migration does not affect the live deployment at all. The Vercel project just needs its root directory setting verified if it was configured.

**Prisma database** — client data lives in a database, not in the file system. Migration does not touch or risk any client records.

**Python scripts** — the Content Studio utility scripts use relative paths. Verify after move that they still resolve correctly from their new location.

---

**Document status:** Ready to execute
**Execute after:** All four foundation documents are complete
**Do not execute mid-session** — this is a deliberate, focused operation
