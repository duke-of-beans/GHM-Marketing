// reset-password.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    // Hash a NEW password
    const passwordHash = await bcrypt.hash('TestPass123!', 10);
    
    await prisma.user.update({
      where: { email: 'dk.dkes@hotmail.com' },
      data: { passwordHash }
    });
    
    console.log('✅ Password reset!');
    console.log('Email: dk.dkes@hotmail.com');
    console.log('New Password: TestPass123!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
