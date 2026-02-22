import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { id: 'asc' },
    take: 10
  });
  console.log('USERS:', JSON.stringify(users, null, 2));

  const gad = await prisma.clientProfile.findFirst({
    where: {
      OR: [
        { businessName: { contains: 'German', mode: 'insensitive' } },
        { businessName: { contains: 'Auto Doctor', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      businessName: true,
      status: true,
      salesRepId: true,
      masterManagerId: true,
      onboardedMonth: true,
      onboardedAt: true,
      lockedResidualAmount: true,
      closedInMonth: true,
      retainerAmount: true,
      compensationOverrides: true
    }
  });
  console.log('GAD:', JSON.stringify(gad, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
