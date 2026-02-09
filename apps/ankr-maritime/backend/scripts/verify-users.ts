import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ['admin@ankr.in', 'demo@mari8x.com', 'ops@ankr.in'],
      },
    },
    select: {
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
    orderBy: { email: 'asc' },
  });

  console.log('\n📊 User Verification Report\n');
  console.log('═'.repeat(60));

  if (users.length === 0) {
    console.log('❌ No users found. Run: npx prisma db seed');
  } else {
    users.forEach((user) => {
      const icon = user.role === 'admin' ? '👑' : user.role === 'viewer' ? '👁️' : '👤';
      const access = user.role === 'admin' ? 'Full Access (153 pages)' :
                     user.role === 'viewer' ? 'Limited Access (~20 pages)' :
                     'Operator Access';

      console.log(`${icon} ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Access: ${access}`);
      console.log(`   Status: ${user.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log('─'.repeat(60));
    });
  }

  console.log('\n💡 Login Instructions:');
  console.log('   1. Visit: https://mari8x.com/login');
  console.log('   2. Use quick login buttons or enter credentials');
  console.log('   3. Admin login shows all pages, Demo shows limited pages');
  console.log('\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
