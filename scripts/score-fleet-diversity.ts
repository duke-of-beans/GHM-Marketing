/**
 * Sprint MORPH-05: Pairwise similarity scoring for a registered fleet.
 * Reads all IntelFingerprint records for the given fleet, calculates
 * similarity across 7 morpheme dimensions, writes IntelSimilarityScore
 * records, and outputs a JSON summary to stdout.
 *
 * Run: npx tsx scripts/score-fleet-diversity.ts --fleetId=<id>
 *
 * Dimension weights (sum = 1.0):
 *   infra 0.35 | typography 0.20 | schema 0.10
 *   nav 0.07  | hierarchy 0.07  | urlSchema 0.07
 *   footer 0.07 | cta 0.07
 *
 * Thresholds: >= 0.70 → DANGER | 0.60–0.69 → WATCH | < 0.60 → PASS
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ── Weights ───────────────────────────────────────────────────────────────
const W = {
  infra:      0.35,
  typography: 0.20,
  schema:     0.10,
  nav:        0.07,
  hierarchy:  0.07,
  urlSchema:  0.07,
  footer:     0.07,
  cta:        0.07,
} as const

// 1.0 if same value, 0.0 if different (or either is null)
function dimSim(a: string | null | undefined, b: string | null | undefined): number {
  if (!a || !b) return 0.0
  return a === b ? 1.0 : 0.0
}

// ── Parse --fleetId arg ───────────────────────────────────────────────────
function parseFleetId(): number {
  const arg = process.argv.find(a => a.startsWith('--fleetId='))
  if (!arg) {
    console.error('Usage: npx tsx scripts/score-fleet-diversity.ts --fleetId=<id>')
    process.exit(1)
  }
  return parseInt(arg.split('=')[1], 10)
}

async function main() {
  const fleetId = parseFleetId()
  console.error(`Scoring fleet id=${fleetId}...`)

  // ── Fetch fingerprints with asset names ──────────────────────────────────
  const fingerprints = await prisma.intelFingerprint.findMany({
    where: { fleetId },
    include: { asset: { select: { id: true, name: true, domain: true } } },
  })

  if (fingerprints.length < 2) {
    throw new Error(`Fleet ${fleetId} has ${fingerprints.length} fingerprints — need at least 2`)
  }
  console.error(`Found ${fingerprints.length} fingerprints. Calculating ${fingerprints.length * (fingerprints.length - 1) / 2} pairs...`)

  // ── Delete existing scores for this fleet (idempotent re-run) ────────────
  await prisma.intelSimilarityScore.deleteMany({ where: { fleetId } })

  // ── Pairwise scoring ─────────────────────────────────────────────────────
  type PairResult = {
    assetA: string
    assetB: string
    assetAId: number
    assetBId: number
    dims: {
      infra: number
      nav: number
      hierarchy: number
      urlSchema: number
      footer: number
      cta: number
      typography: number
      schema: number
    }
    templateSimilarity: number
    visualSimilarity: number
    infrastructureSimilarity: number
    contentSimilarity: number
    compositeScore: number
    status: 'PASS' | 'WATCH' | 'DANGER'
  }

  const results: PairResult[] = []

  for (let i = 0; i < fingerprints.length; i++) {
    for (let j = i + 1; j < fingerprints.length; j++) {
      const a = fingerprints[i]
      const b = fingerprints[j]

      // Per-dimension similarity (0 or 1)
      const infra_sim  = dimSim(a.headTagOrder as string, b.headTagOrder as string)
      const nav_sim    = dimSim(a.navPattern,       b.navPattern)
      const hier_sim   = dimSim(a.contentHierarchy, b.contentHierarchy)
      const url_sim    = dimSim(a.urlStructure,     b.urlStructure)
      const foot_sim   = dimSim(a.footerStructure,  b.footerStructure)
      const cta_sim    = dimSim(a.ctaPattern,        b.ctaPattern)
      const typo_sim   = dimSim(a.primaryFont,       b.primaryFont)

      // Schema: compare as serialised JSON arrays
      const schA = JSON.stringify((a.schemaMarkupTypes as string[] | null)?.sort() ?? [])
      const schB = JSON.stringify((b.schemaMarkupTypes as string[] | null)?.sort() ?? [])
      const schema_sim = schA === schB ? 1.0 : 0.0

      // Composite (sprint weights)
      const composite =
        W.infra      * infra_sim  +
        W.nav        * nav_sim    +
        W.hierarchy  * hier_sim   +
        W.urlSchema  * url_sim    +
        W.footer     * foot_sim   +
        W.cta        * cta_sim    +
        W.typography * typo_sim   +
        W.schema     * schema_sim

      // Template similarity = avg of 5 template dims
      const templateSim = (nav_sim + hier_sim + url_sim + foot_sim + cta_sim) / 5

      const status: 'PASS' | 'WATCH' | 'DANGER' =
        composite >= 0.70 ? 'DANGER' :
        composite >= 0.60 ? 'WATCH'  : 'PASS'

      // Write to DB
      await prisma.intelSimilarityScore.create({
        data: {
          fleetId,
          assetAId:                a.assetId,
          assetBId:                b.assetId,
          templateSimilarity:      parseFloat(templateSim.toFixed(4)),
          visualSimilarity:        parseFloat(typo_sim.toFixed(4)),
          infrastructureSimilarity: parseFloat(infra_sim.toFixed(4)),
          contentSimilarity:       parseFloat(schema_sim.toFixed(4)),
          linkSimilarity:          0.0,
          compositeScore:          parseFloat(composite.toFixed(4)),
        },
      })

      results.push({
        assetA:  a.asset.name,
        assetB:  b.asset.name,
        assetAId: a.assetId,
        assetBId: b.assetId,
        dims: {
          infra:      infra_sim,
          nav:        nav_sim,
          hierarchy:  hier_sim,
          urlSchema:  url_sim,
          footer:     foot_sim,
          cta:        cta_sim,
          typography: typo_sim,
          schema:     schema_sim,
        },
        templateSimilarity:      parseFloat(templateSim.toFixed(4)),
        visualSimilarity:        parseFloat(typo_sim.toFixed(4)),
        infrastructureSimilarity: parseFloat(infra_sim.toFixed(4)),
        contentSimilarity:       parseFloat(schema_sim.toFixed(4)),
        compositeScore:          parseFloat(composite.toFixed(4)),
        status,
      })
    }
  }

  // ── Update fleet diversityScore = 1 - max compositeScore ─────────────────
  const maxScore = Math.max(...results.map(r => r.compositeScore))
  await prisma.intelFleet.update({
    where: { id: fleetId },
    data: {
      diversityScore: parseFloat((1 - maxScore).toFixed(4)),
      lastAuditAt:    new Date(),
    },
  })

  // ── Sort by composite descending and output JSON ─────────────────────────
  results.sort((a, b) => b.compositeScore - a.compositeScore)

  const danger = results.filter(r => r.status === 'DANGER').length
  const watch  = results.filter(r => r.status === 'WATCH').length
  const pass   = results.filter(r => r.status === 'PASS').length

  const summary = {
    fleetId,
    totalPairs: results.length,
    danger,
    watch,
    pass,
    maxCompositeScore: maxScore,
    fleetDiversityScore: parseFloat((1 - maxScore).toFixed(4)),
    pairs: results,
  }

  console.log(JSON.stringify(summary, null, 2))
  console.error(`\nDone. ${pass} PASS | ${watch} WATCH | ${danger} DANGER`)
  console.error(`Fleet diversity score: ${summary.fleetDiversityScore} (1 - max composite)`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
