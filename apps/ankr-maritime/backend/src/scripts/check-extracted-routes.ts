#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

async function main() {
  const routes = await prisma.extractedAISRoute.findMany({
    include: {
      originPort: { select: { name: true } },
      destPort: { select: { name: true } },
      vessel: { select: { name: true } },
    },
    orderBy: { actualSailedNm: 'asc' },
  });

  console.log(`Total routes: ${routes.length}\n`);

  routes.forEach((r, i) => {
    console.log(`${i + 1}. ${r.vessel.name}`);
    console.log(`   ${r.originPort.name} → ${r.destPort.name}`);
    console.log(`   GC: ${r.greatCircleNm.toFixed(0)}nm, Actual: ${r.actualSailedNm.toFixed(0)}nm, Factor: ${r.distanceFactor.toFixed(2)}x`);
    console.log(`   Quality: ${r.qualityScore.toFixed(2)}, Type: ${r.routeType}\n`);
  });

  await prisma.$disconnect();
}

main();
