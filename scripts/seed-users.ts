import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminHash = await bcrypt.hash('ChangeMe123!', 10)
  const testHash = await bcrypt.hash('ChangeMe123!', 10)

  const users = [
    { email: 'dk.dkes@hotmail.com',        name: 'David Kirsch',    role: 'admin',  hash: adminHash },
    { email: 'gavin@ghmdigitalmarketing.com', name: 'Gavin Muirhead', role: 'master', hash: adminHash },
    { email: 'ArianGerami@gmail.com',       name: 'Arian Gerami',   role: 'sales',  hash: adminHash },
    { email: 'david@ghmmarketing.com',      name: 'Test Account',   role: 'sales',  hash: testHash  },
  ]

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: u.hash, name: u.name, role: u.role as any },
      create: { email: u.email, passwordHash: u.hash, name: u.name, role: u.role as any },
    })
    console.log(`✅ ${user.role.padEnd(6)} | ${user.name.padEnd(20)} | ${user.email}`)
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error('❌', e); process.exit(1) })
