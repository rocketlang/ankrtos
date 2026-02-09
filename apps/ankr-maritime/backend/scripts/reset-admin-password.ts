#!/usr/bin/env tsx
/**
 * Reset Admin Password Script
 * Usage: npx tsx scripts/reset-admin-password.ts [password]
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  const password = process.argv[2] || 'admin123!';

  console.log('🔑 Resetting admin@ankr.in password...\n');

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Update user
  const user = await prisma.user.update({
    where: { email: 'admin@ankr.in' },
    data: {
      passwordHash,
      isActive: true,
    },
    select: {
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  console.log('✅ Password reset successful!\n');
  console.log('📧 Email:', user.email);
  console.log('👤 Name:', user.name);
  console.log('🔐 Role:', user.role);
  console.log('🆕 New Password:', password);
  console.log('\n⚠️  Please change this password after first login!\n');

  await prisma.$disconnect();
}

resetAdminPassword().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
