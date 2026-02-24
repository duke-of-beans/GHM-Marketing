require('fs').readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const idx = trimmed.indexOf('=');
  if (idx === -1) return;
  const k = trimmed.slice(0, idx).trim();
  let v = trimmed.slice(idx + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[k] = v;
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Renaming UserRole enum value: master -> manager...');
  await prisma.$executeRawUnsafe(`ALTER TYPE "UserRole" RENAME VALUE 'master' TO 'manager'`);
  console.log('Done. Verifying...');
  const users = await prisma.user.findMany({
    where: { role: 'manager' },
    select: { id: true, name: true, role: true }
  });
  console.log('Users with role=manager:', JSON.stringify(users));
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
