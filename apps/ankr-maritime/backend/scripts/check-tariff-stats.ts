import { prisma } from '../src/lib/prisma.js';

async function getStats() {
  const ports = await prisma.port.findMany({
    select: {
      id: true,
      name: true,
      unlocode: true,
      country: true,
      _count: {
        select: {
          tariffs: true
        }
      }
    },
    where: {
      tariffs: {
        some: {}
      }
    },
    orderBy: {
      tariffs: {
        _count: 'desc'
      }
    }
  });

  const totalPorts = ports.length;
  const totalTariffs = ports.reduce((sum, p) => sum + p._count.tariffs, 0);
  const realTariffs = await prisma.portTariff.count({
    where: { dataSource: 'REAL_SCRAPED' }
  });

  console.log('=== Port Tariff Statistics ===');
  console.log(`Total ports with tariffs: ${totalPorts}`);
  console.log(`Total tariffs: ${totalTariffs}`);
  console.log(`Real scraped tariffs: ${realTariffs}`);
  console.log(`Simulated tariffs: ${totalTariffs - realTariffs}`);
  console.log(`Real tariff percentage: ${((realTariffs/totalTariffs)*100).toFixed(1)}%`);
  console.log('');
  console.log('Top 10 ports by tariff count:');
  ports.slice(0, 10).forEach((p, i) => {
    console.log(`${i+1}. ${p.name} (${p.unlocode}): ${p._count.tariffs} tariffs`);
  });

  // Get ports by country
  const byCountry: Record<string, number> = {};
  ports.forEach(p => {
    byCountry[p.country] = (byCountry[p.country] || 0) + 1;
  });

  console.log('');
  console.log('Ports by country:');
  Object.entries(byCountry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([country, count]) => {
      console.log(`${country}: ${count} ports`);
    });

  await prisma.$disconnect();
}

getStats().catch(console.error);
