import { prisma } from './src/lib/prisma.js';

async function findVessels() {
  const vessels = await prisma.vessel.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      mmsi: true,
      name: true,
      type: true,
      _count: {
        select: { positions: true }
      }
    }
  });

  console.log('\nAvailable vessels with position data:');
  vessels.forEach(v => {
    console.log(`  MMSI: ${v.mmsi} | Name: ${v.name || 'Unknown'} | Type: ${v.type} | Positions: ${v._count.positions}`);
  });

  await prisma.$disconnect();
}

findVessels();
