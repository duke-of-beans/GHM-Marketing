import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('ChangeMe123!', 10)
  const user = await prisma.user.update({
    where: { email: 'david@ghmmarketing.com' },
    data: { passwordHash: hash },
    select: { id: true, email: true, name: true }
  })
  console.log('✅ Password reset for:', user.email, '(id:', user.id + ')')
  await prisma.$disconnect()
}

main().catch(e => { console.error('❌', e); process.exit(1) })
