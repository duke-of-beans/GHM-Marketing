/**
 * Seed Sprint 3 — GBP + Ranking alert rules
 * Run: npx tsx prisma/seed-sprint3-alert-rules.ts
 * Safe to run multiple times (checks by name before inserting).
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const rules = [
  {
    name:            'Review average dropped below 4.0',
    description:     'Fires when GBP review average falls below 4.0 stars',
    sourceType:      'gbp',
    conditionType:   'threshold',
    conditionConfig: { field: 'reviewAvg', operator: 'lt', value: 4.0 },
    severity:        'critical',
    notifyOnTrigger: true,
    autoCreateTask:  true,
    taskTemplate: {
      title:    'Review score critical: {clientName} avg below 4.0',
      category: 'ops',
      priority: 'P1',
      contentBrief: {
        instructions: 'Review average has dropped below 4.0. Investigate recent negative reviews, respond promptly, and develop a review recovery strategy.',
      },
    },
    cooldownMinutes: 10080,
    isActive:        true,
  },
  {
    name:            'Zero new reviews — 30 days',
    description:     'No new reviews in the past 30-day snapshot window',
    sourceType:      'gbp',
    conditionType:   'threshold',
    conditionConfig: { field: 'newReviews', operator: 'eq', value: 0 },
    severity:        'warning',
    notifyOnTrigger: true,
    autoCreateTask:  false,
    cooldownMinutes: 10080,
    isActive:        true,
  },
  {
    name:            'Search views dropped > 25%',
    description:     'Month-over-month GBP search views declined more than 25%',
    sourceType:      'gbp',
    conditionType:   'delta',
    conditionConfig: { field: 'searchViewsDelta', operator: 'lte', value: -25 },
    severity:        'warning',
    notifyOnTrigger: true,
    autoCreateTask:  false,
    cooldownMinutes: 10080,
    isActive:        true,
  },
  {
    name:            'Keyword lost top 3 position',
    description:     'A tracked keyword dropped out of the top 3 organic results',
    sourceType:      'rankings',
    conditionType:   'threshold',
    conditionConfig: { field: 'lostTop3', operator: 'eq', value: 1 },
    severity:        'warning',
    notifyOnTrigger: true,
    autoCreateTask:  false,
    cooldownMinutes: 4320,
    isActive:        true,
  },
  {
    name:            'Keyword entered top 3',
    description:     'A tracked keyword moved into the top 3 organic results',
    sourceType:      'rankings',
    conditionType:   'threshold',
    conditionConfig: { field: 'enteredTop3', operator: 'eq', value: 1 },
    severity:        'info',
    notifyOnTrigger: true,
    autoCreateTask:  false,
    cooldownMinutes: 4320,
    isActive:        true,
  },
]

async function main() {
  console.log('🌱 Seeding Sprint 3 GBP + ranking alert rules...\n')

  for (const rule of rules) {
    const existing = await prisma.alertRule.findFirst({ where: { name: rule.name } })
    if (existing) {
      console.log(`  ⏭  Skipped (exists): ${rule.name}`)
      continue
    }
    await prisma.alertRule.create({ data: rule })
    console.log(`  ✅ Created: ${rule.name}`)
  }

  console.log('\n✅ Done — 5 rules processed.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
