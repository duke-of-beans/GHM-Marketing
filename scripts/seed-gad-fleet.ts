/**
 * Sprint MORPH-05: Seed GAD satellite fleet into Intelligence Engine.
 * Creates: IntelFleet → 7 IntelAsset → 7 IntelFingerprint records.
 *
 * Run: npx tsx scripts/seed-gad-fleet.ts
 * Output: prints fleetId + assetIds for use in score-fleet-diversity.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ── Fleet definition ────────────────────────────────────────────────────────
const FLEET_NAME = 'GAD Satellite Cluster'

// 7 satellites: domain, name, and morpheme recipe
const SATELLITES = [
  {
    domain: 'www.vwrepairspecialistsimivalley.com',
    name: 'VW Repair Specialist Simi Valley',
    recipe: {
      nav: 'nav_sidebar',
      hierarchy: 'hierarchy_problem_solution',
      typography: 'typo_poppins_nunito',
      urlSchema: 'url_problem_solution',
      footer: 'footer_link_bar',
      cta: 'cta_sticky_bar',
      schemaMarkup: 'schema_howto_mixed',
      infrastructure: 'infra_minimal',
    },
    primaryFont: 'Poppins',
    secondaryFont: 'Nunito',
  },
  {
    domain: 'www.mercedesautorepairsimivalley.com',
    name: 'Mercedes Auto Repair Simi Valley',
    recipe: {
      nav: 'nav_minimal_sticky',
      hierarchy: 'hierarchy_resource_hub',
      typography: 'typo_montserrat_lora',
      urlSchema: 'url_category_topic',
      footer: 'footer_minimal',
      cta: 'cta_inline',
      schemaMarkup: 'schema_faq_heavy',
      infrastructure: 'infra_rich',
    },
    primaryFont: 'Montserrat',
    secondaryFont: 'Lora',
  },
  {
    domain: 'www.thebmwautospecialistsimivalley.com',
    name: 'The BMW Auto Specialist Simi Valley',
    recipe: {
      nav: 'nav_split',
      hierarchy: 'hierarchy_model_hub',
      typography: 'typo_dm_sans_ibm',
      urlSchema: 'url_model_service',
      footer: 'footer_contact',
      cta: 'cta_section_breaks',
      schemaMarkup: 'schema_auto_repair',
      infrastructure: 'infra_extended',
    },
    primaryFont: 'DM Sans',
    secondaryFont: 'IBM Plex Sans',
  },
  {
    domain: 'www.theaudiautospecialistsimivalley.com',
    name: 'The Audi Auto Specialist Simi Valley',
    recipe: {
      nav: 'nav_horizontal',
      hierarchy: 'hierarchy_service_forward',
      typography: 'typo_inter_source',
      urlSchema: 'url_service_keyword',
      footer: 'footer_mega',
      cta: 'cta_sticky_bar',
      schemaMarkup: 'schema_local_business',
      infrastructure: 'infra_standard',
    },
    primaryFont: 'Inter',
    secondaryFont: 'Source Sans 3',
  },
  {
    domain: 'www.porscheautospecialistsimivalley.com',
    name: 'Porsche Auto Specialist Simi Valley',
    recipe: {
      nav: 'nav_horizontal',
      hierarchy: 'hierarchy_resource_hub',
      typography: 'typo_work_sans_libre',
      urlSchema: 'url_category_topic',
      footer: 'footer_contact',
      cta: 'cta_sticky_bar',
      schemaMarkup: 'schema_auto_repair',
      infrastructure: 'infra_standard',
    },
    primaryFont: 'Work Sans',
    secondaryFont: 'Libre Baskerville',
  },
  {
    domain: 'www.landroverrepairspecialistsimivalley.com',
    name: 'Land Rover Repair Specialist Simi Valley',
    recipe: {
      nav: 'nav_split',
      hierarchy: 'hierarchy_service_forward',
      typography: 'typo_oswald_merri',
      urlSchema: 'url_service_keyword',
      footer: 'footer_mega',
      cta: 'cta_section_breaks',
      schemaMarkup: 'schema_local_business',
      infrastructure: 'infra_rich',
    },
    primaryFont: 'Oswald',
    secondaryFont: 'Merriweather',
  },
  {
    domain: 'www.europeanautospecialistsimivalley.com',
    name: 'European Auto Specialist Simi Valley',
    recipe: {
      nav: 'nav_minimal_sticky',
      hierarchy: 'hierarchy_problem_solution',
      typography: 'typo_rubik_karla',
      urlSchema: 'url_problem_solution',
      footer: 'footer_minimal',
      cta: 'cta_inline',
      schemaMarkup: 'schema_faq_heavy',
      infrastructure: 'infra_extended',
    },
    primaryFont: 'Rubik',
    secondaryFont: 'Karla',
  },
]

// ── Schema markup type mapping ────────────────────────────────────────────
function schemaTypes(morpheme: string): string[] {
  const map: Record<string, string[]> = {
    schema_howto_mixed:    ['HowTo', 'AutoRepair', 'LocalBusiness'],
    schema_faq_heavy:      ['FAQPage', 'LocalBusiness'],
    schema_auto_repair:    ['AutoRepair', 'LocalBusiness'],
    schema_local_business: ['LocalBusiness'],
  }
  return map[morpheme] ?? ['LocalBusiness']
}

async function main() {
  // ── Find GHM tenant ──────────────────────────────────────────────────────
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'ghm' } })
  if (!tenant) throw new Error('GHM tenant not found — is TENANT_DEV_OVERRIDE=ghm and DB correct?')
  console.log(`Tenant: ${tenant.name} (id=${tenant.id})`)

  // ── Create IntelFleet ────────────────────────────────────────────────────
  const fleet = await prisma.intelFleet.create({
    data: {
      tenantId:      tenant.id,
      name:          FLEET_NAME,
      diversityScore: 1.0,
    },
  })
  console.log(`\nIntelFleet created: id=${fleet.id} "${fleet.name}"`)

  // ── Create 7 IntelAssets + IntelFingerprints ─────────────────────────────
  const assetIds: number[] = []

  for (const sat of SATELLITES) {
    const asset = await prisma.intelAsset.create({
      data: {
        tenantId:      tenant.id,
        domain:        sat.domain,
        name:          sat.name,
        type:          'satellite',
        ownershipModel: 'tenant_owned',
        status:        'active',
        fleetId:       fleet.id,
        fleetRole:     'satellite',
      },
    })
    assetIds.push(asset.id)
    console.log(`  Asset: id=${asset.id} "${sat.name}"`)

    await prisma.intelFingerprint.create({
      data: {
        assetId:         asset.id,
        fleetId:         fleet.id,
        // Template architecture
        navPattern:       sat.recipe.nav,
        contentHierarchy: sat.recipe.hierarchy,
        urlStructure:     sat.recipe.urlSchema,
        footerStructure:  sat.recipe.footer,
        ctaPattern:       sat.recipe.cta,
        // Visual identity
        primaryFont:   sat.primaryFont,
        secondaryFont: sat.secondaryFont,
        // Infrastructure
        hostingProvider: 'vercel',
        framework:       'static',
        sslProvider:     'letsencrypt',
        headTagOrder:    sat.recipe.infrastructure,   // morpheme ID as JSON string value
        schemaMarkupTypes: schemaTypes(sat.recipe.schemaMarkup),
        // Registration
        registrationDate: new Date('2026-03-10'),
      },
    })
    console.log(`  Fingerprint: nav=${sat.recipe.nav} infra=${sat.recipe.infrastructure}`)
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════')
  console.log('SEED COMPLETE')
  console.log(`  fleetId   : ${fleet.id}`)
  console.log(`  assetIds  : [${assetIds.join(', ')}]`)
  console.log(`  tenant    : ${tenant.id} (${tenant.slug})`)
  console.log(`  Run next  : npx tsx scripts/score-fleet-diversity.ts --fleetId=${fleet.id}`)
  console.log('════════════════════════════════════════════')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
