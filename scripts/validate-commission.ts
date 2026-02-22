import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  calculateResidual,
  calculateMasterFee,
  getFirstDayOfMonth,
} from '../src/lib/payments/calculations';

const prisma = new PrismaClient();

async function main() {
  console.log('=== COMMISSION VALIDATION DRY RUN ===\n');
  const currentMonth = getFirstDayOfMonth();
  console.log(`Month: ${currentMonth.toISOString()}\n`);

  const clients = await prisma.clientProfile.findMany({
    where: { status: 'active' },
    include: { compensationOverrides: true },
  });
  console.log(`Active clients: ${clients.length}`);
  clients.forEach(c => console.log(`  - [${c.id}] ${c.businessName} | repId=${c.salesRepId} | managerId=${c.masterManagerId} | onboardedMonth=${c.onboardedMonth}`));
  console.log('');

  const configs = await prisma.userCompensationConfig.findMany();
  const configMap = new Map(configs.map(c => [c.userId, c]));
  console.log(`Compensation configs loaded: ${configs.length}`);
  configs.forEach(c => console.log(`  - userId=${c.userId} | residualEnabled=${c.residualEnabled} | residualAmount=${c.residualAmount} | masterFeeEnabled=${c.masterFeeEnabled} | masterFeeAmount=${c.masterFeeAmount}`));
  console.log('');

  const toCreate: Array<{
    clientId: number;
    businessName: string;
    userId: number;
    type: string;
    amount: Decimal;
    notes: string;
  }> = [];

  for (const client of clients) {
    console.log(`--- Processing: ${client.businessName} ---`);

    // Sales residual
    if (client.salesRepId) {
      const salesConfig = configMap.get(client.salesRepId);
      const override = client.compensationOverrides.find(o => o.userId === client.salesRepId) ?? null;
      if (salesConfig) {
        const result = calculateResidual(salesConfig, override, client as any, currentMonth);
        console.log(`  RESIDUAL → shouldPay=${result.shouldPay} | amount=${result.amount} | reason="${result.reason}"`);
        if (result.shouldPay) {
          toCreate.push({ clientId: client.id, businessName: client.businessName, userId: client.salesRepId, type: 'residual', amount: result.amount, notes: result.reason });
        }
      } else {
        console.log(`  RESIDUAL → SKIP (no compensation config for repId=${client.salesRepId})`);
      }
    } else {
      console.log(`  RESIDUAL → SKIP (no salesRepId)`);
    }

    // Master fee
    if (client.masterManagerId) {
      const masterConfig = configMap.get(client.masterManagerId);
      if (masterConfig) {
        const result = calculateMasterFee(masterConfig, client as any, currentMonth, client.masterManagerId);
        console.log(`  MASTER_FEE → shouldPay=${result.shouldPay} | amount=${result.amount} | reason="${result.reason}"`);
        if (result.shouldPay) {
          toCreate.push({ clientId: client.id, businessName: client.businessName, userId: client.masterManagerId, type: 'master_fee', amount: result.amount, notes: result.reason });
        }
      } else {
        console.log(`  MASTER_FEE → SKIP (no compensation config for managerId=${client.masterManagerId})`);
      }
    } else {
      console.log(`  MASTER_FEE → SKIP (no masterManagerId)`);
    }

    console.log('');
  }

  console.log('=== DRY RUN RESULTS ===');
  if (toCreate.length === 0) {
    console.log('No transactions would be created. (Expected for GAD — owner guard + no rep)');
  } else {
    console.log(`Would create ${toCreate.length} transaction(s):`);
    toCreate.forEach(t => {
      console.log(`  [${t.type}] ${t.businessName} → userId=${t.userId} | $${t.amount} | "${t.notes}"`);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
