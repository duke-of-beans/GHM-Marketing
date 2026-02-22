import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Set onboardedMonth to Feb 1 2026 (matches onboardedAt of Feb 17 2026)
  const updated = await prisma.clientProfile.update({
    where: { id: 3 },
    data: {
      onboardedMonth: new Date('2026-02-01'),
      closedInMonth: new Date('2026-02-01'),
    },
    select: {
      id: true,
      businessName: true,
      onboardedMonth: true,
      closedInMonth: true,
      onboardedAt: true,
      salesRepId: true,
      masterManagerId: true,
      lockedResidualAmount: true,
    }
  });
  console.log('Updated GAD:', JSON.stringify(updated, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
