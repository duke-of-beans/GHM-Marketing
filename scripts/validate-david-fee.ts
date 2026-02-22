import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  calculateResidual,
  calculateMasterFee,
  getFirstDayOfMonth,
} from '../src/lib/payments/calculations';

const prisma = new PrismaClient();

async function main() {
  console.log('=== SIMULATED REP-CLOSED CLIENT — David as Manager ===\n');

  const currentMonth = getFirstDayOfMonth();
  const configs = await prisma.userCompensationConfig.findMany();
  const configMap = new Map(configs.map(c => [c.userId, c]));

  // Simulate a client closed by Arian (userId=5), managed by David (userId=1)
  const mockClient = {
    id: 99,
    businessName: 'Mock Client LLC',
    status: 'active',
    salesRepId: 5,
    masterManagerId: 1,
    onboardedMonth: new Date('2026-01-01'),
    onboardedAt: new Date('2026-01-01'),
    lockedResidualAmount: new Decimal(200),
    closedInMonth: new Date('2026-01-01'),
    retainerAmount: new Decimal(2400),
    compensationOverrides: [],
  };

  const repConfig = configMap.get(5);
  const managerConfig = configMap.get(1);

  if (repConfig) {
    const residual = calculateResidual(repConfig, null, mockClient as any, currentMonth);
    console.log(`RESIDUAL (Arian, userId=5) → shouldPay=${residual.shouldPay} | amount=$${residual.amount} | "${residual.reason}"`);
  }

  if (managerConfig) {
    const fee = calculateMasterFee(managerConfig, mockClient as any, currentMonth, 1);
    console.log(`MASTER_FEE (David, userId=1) → shouldPay=${fee.shouldPay} | amount=$${fee.amount} | "${fee.reason}"`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
