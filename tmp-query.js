const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Only block on real business data, NOT on comp configs (those are just FK deps we clean up)
  const checks = await Promise.all([
    p.paymentTransaction.count({ where: { userId: { in: [2, 3] } } }),
    p.clientProfile.count({ where: { salesRepId: { in: [2, 3] } } }),
    p.clientProfile.count({ where: { masterManagerId: { in: [2, 3] } } }),
    p.clientTask.count({ where: { assignedToUserId: { in: [2, 3] } } }),
    p.clientNote.count({ where: { authorId: { in: [2, 3] } } }),
    p.bugReport.count({ where: { userId: { in: [2, 3] } } }),
  ]);
  
  const labels = ['PaymentTransactions','SalesRepClients','MasterClients','AssignedTasks','ClientNotes','BugReports'];
  console.log('=== Pre-delete safety check ===');
  checks.forEach((c, i) => console.log(`  ${labels[i]}: ${c}`));
  
  const totalRealData = checks.reduce((a, b) => a + b, 0);
  if (totalRealData > 0) {
    console.log('\n⛔ CANNOT DELETE — real business data attached.');
    return;
  }
  
  console.log('\n✅ No real data attached. Proceeding...');
  
  // Delete comp configs (FK dep) then users
  const deletedConfigs = await p.userCompensationConfig.deleteMany({ where: { userId: { in: [2, 3] } } });
  console.log(`  Deleted ${deletedConfigs.count} comp config(s)`);
  
  const deletedUsers = await p.user.deleteMany({ where: { id: { in: [2, 3] } } });
  console.log(`  Deleted ${deletedUsers.count} user(s) (Alex Johnson id=2, Sarah Chen id=3)`);
  
  // Confirm remaining roster
  const remaining = await p.user.findMany({ orderBy: { id: 'asc' }, select: { id: true, name: true, role: true, isActive: true } });
  console.log('\n=== Confirmed user roster ===');
  remaining.forEach(u => console.log(`  [${u.id}] ${u.name} (${u.role}) active=${u.isActive}`));
}

main().catch(console.error).finally(() => p.$disconnect());
