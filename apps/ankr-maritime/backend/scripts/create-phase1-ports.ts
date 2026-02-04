#!/usr/bin/env tsx
/**
 * Create Phase 1 Ports in Database
 */

import { prisma } from '../src/lib/prisma.js';

const phase1Ports = [
  { unlocode: 'INMUN', name: 'Mumbai', country: 'IN', latitude: 18.9388, longitude: 72.8354 },
  { unlocode: 'INKDL', name: 'Kandla', country: 'IN', latitude: 23.0333, longitude: 70.2167 },
  { unlocode: 'INMUN1', name: 'Mundra', country: 'IN', latitude: 22.8397, longitude: 69.7239 },
  { unlocode: 'INNSA', name: 'JNPT (Nhava Sheva)', country: 'IN', latitude: 18.9484, longitude: 72.9961 },
  { unlocode: 'LKCMB', name: 'Colombo', country: 'LK', latitude: 6.9271, longitude: 79.8612 },
  { unlocode: 'SGSIN', name: 'Singapore', country: 'SG', latitude: 1.2897, longitude: 103.8501 },
  { unlocode: 'AEJEA', name: 'Jebel Ali', country: 'AE', latitude: 25.0131, longitude: 55.0536 },
  { unlocode: 'SAJED', name: 'Jeddah', country: 'SA', latitude: 21.5433, longitude: 39.1728 },
  { unlocode: 'AEFJR', name: 'Fujairah', country: 'AE', latitude: 25.1164, longitude: 56.3406 },
];

async function main() {
  console.log('Creating Phase 1 ports in database...\n');

  for (const port of phase1Ports) {
    try {
      const existing = await prisma.port.findFirst({
        where: { unlocode: port.unlocode }
      });

      if (existing) {
        console.log(`✓ ${port.name} (${port.unlocode}) already exists`);
      } else {
        await prisma.port.create({
          data: port
        });
        console.log(`✅ Created ${port.name} (${port.unlocode})`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${port.name}:`, error);
    }
  }

  console.log('\n✅ Phase 1 ports ready!');
  await prisma.$disconnect();
}

main();
