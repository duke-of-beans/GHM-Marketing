import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('ChangeMe123!', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'test@account.com' },
    update: { passwordHash: hash, name: 'Test Account', role: 'admin', isActive: true },
    create: {
      email: 'test@account.com',
      name: 'Test Account',
      passwordHash: hash,
      role: 'admin',
      isActive: true,
      permissionPreset: 'admin',
      permissions: {},
    },
    select: { id: true, email: true, name: true, role: true }
  })
  
  console.log('✅ Test user ready:', user)
  await prisma.$disconnect()
}

main().catch(e => { console.error('❌', e); process.exit(1) })
