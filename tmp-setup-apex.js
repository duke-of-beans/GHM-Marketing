const { PrismaClient, Decimal } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Create a minimal Lead record (required FK for ClientProfile)
  const lead = await p.lead.create({
    data: {
      businessName: 'Apex North LLC',
      phone: '8055551234',
      city: 'Simi Valley',
      state: 'CA',
      zipCode: '93065',
      status: 'won',
      assignedTo: 5, // Arian
      dealValueMonthly: new Decimal(2400),
      mrr: new Decimal(2400),
    },
  });

  // Create ClientProfile — mirrors createClientFromWonLead output
  // onboardedMonth = Dec 2025 → puts us at month 3 in Feb 2026
  // lockedResidualAmount = $200 (tier 1, retainer < $3000)
  const client = await p.clientProfile.create({
    data: {
      leadId: lead.id,
      businessName: 'Apex North LLC',
      retainerAmount: new Decimal(2400),
      status: 'active',
      salesRepId: 5,        // Arian Germani
      masterManagerId: 1,   // David Kirsch
      onboardedMonth: new Date('2025-12-01'),
      lockedResidualAmount: new Decimal(200), // tier 1
      closedInMonth: new Date('2025-12-01'),
      healthScore: 50,
      scanFrequency: 'biweekly',
      nextScanAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('=== Apex North LLC created ===');
  console.log(`  Lead id:   ${lead.id}`);
  console.log(`  Client id: ${client.id}`);
  console.log(`  salesRepId: ${client.salesRepId} (Arian)`);
  console.log(`  masterManagerId: ${client.masterManagerId} (David)`);
  console.log(`  onboardedMonth: ${client.onboardedMonth}`);
  console.log(`  lockedResidualAmount: $${client.lockedResidualAmount}`);
  console.log(`  status: ${client.status}`);
  console.log('\nReady for cron trigger.');
}

main().catch(console.error).finally(() => p.$disconnect());
