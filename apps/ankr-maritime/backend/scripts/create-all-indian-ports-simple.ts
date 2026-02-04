#!/usr/bin/env tsx
/**
 * Create All Indian Ports - Simple Version
 * Uses existing Port schema fields only
 */

import { prisma } from '../src/lib/prisma.js';

interface SimplePortData {
  unlocode: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  type?: string;
}

const allIndianPorts: SimplePortData[] = [
  // MAJOR PORTS (12)
  { unlocode: 'INMUN', name: 'Mumbai Port Trust', country: 'IN', latitude: 18.9388, longitude: 72.8354, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INNSA', name: 'Nhava Sheva (JNPT)', country: 'IN', latitude: 18.9484, longitude: 72.9961, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INMAA', name: 'Chennai', country: 'IN', latitude: 13.0827, longitude: 80.2707, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INVTZ', name: 'Visakhapatnam', country: 'IN', latitude: 17.6868, longitude: 83.2185, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INCOK', name: 'Kochi (Cochin)', country: 'IN', latitude: 9.9663, longitude: 76.2679, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INKDL', name: 'Kandla (Deendayal Port)', country: 'IN', latitude: 23.0333, longitude: 70.2167, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INHAL', name: 'Kolkata / Haldia', country: 'IN', latitude: 22.0209, longitude: 88.0632, timezone: 'Asia/Kolkata', type: 'river_port' },
  { unlocode: 'INPBD', name: 'Paradip', country: 'IN', latitude: 20.3104, longitude: 86.6101, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INTUT', name: 'Tuticorin (V.O. Chidambaranar)', country: 'IN', latitude: 8.7642, longitude: 78.1348, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INMAA1', name: 'New Mangalore', country: 'IN', latitude: 12.9176, longitude: 74.7965, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INENN', name: 'Ennore (Kamarajar Port)', country: 'IN', latitude: 13.2333, longitude: 80.3167, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INMRM', name: 'Mormugao', country: 'IN', latitude: 15.4167, longitude: 73.8, timezone: 'Asia/Kolkata', type: 'seaport' },

  // GUJARAT PORTS (15)
  { unlocode: 'INMUN1', name: 'Mundra', country: 'IN', latitude: 22.8397, longitude: 69.7239, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INPPV', name: 'Pipavav (GPPL)', country: 'IN', latitude: 20.9058, longitude: 71.5390, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INDAE', name: 'Dahej', country: 'IN', latitude: 21.7067, longitude: 72.5397, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INHZA', name: 'Hazira', country: 'IN', latitude: 21.1116, longitude: 72.6156, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INMGD', name: 'Magdalla', country: 'IN', latitude: 21.0833, longitude: 72.6667, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INPBD1', name: 'Porbandar', country: 'IN', latitude: 21.6417, longitude: 69.6293, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INOKH', name: 'Okha', country: 'IN', latitude: 22.4682, longitude: 69.0703, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INNAV', name: 'Navlakhi', country: 'IN', latitude: 22.9333, longitude: 70.0167, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INSIK', name: 'Sikka', country: 'IN', latitude: 22.4333, longitude: 69.8333, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INBED', name: 'Bedi', country: 'IN', latitude: 22.5, longitude: 70.05, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INJAF', name: 'Jafrabad', country: 'IN', latitude: 20.9167, longitude: 71.3333, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INVRL', name: 'Veraval', country: 'IN', latitude: 20.9072, longitude: 70.3675, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INBHJ', name: 'Bhavnagar', country: 'IN', latitude: 21.7645, longitude: 72.1519, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INDHO', name: 'Dholera', country: 'IN', latitude: 21.9, longitude: 72.2, timezone: 'Asia/Kolkata', type: 'seaport' },

  // WEST COAST (8)
  { unlocode: 'INRAT', name: 'Ratnagiri', country: 'IN', latitude: 16.9902, longitude: 73.3120, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INJGD', name: 'Jaigad', country: 'IN', latitude: 17.2911, longitude: 73.0667, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INREW', name: 'Rewas', country: 'IN', latitude: 18.5833, longitude: 72.9167, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INDAB', name: 'Dabhol', country: 'IN', latitude: 17.6, longitude: 73.1667, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INKAW', name: 'Karwar', country: 'IN', latitude: 14.8167, longitude: 74.1333, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INTAD', name: 'Tadri (Belekeri)', country: 'IN', latitude: 14.4833, longitude: 74.4167, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INMAL', name: 'Malpe', country: 'IN', latitude: 13.35, longitude: 74.7, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INBEY', name: 'Beypore', country: 'IN', latitude: 11.1717, longitude: 75.8061, timezone: 'Asia/Kolkata', type: 'seaport' },

  // EAST COAST (10)
  { unlocode: 'INCUD', name: 'Cuddalore', country: 'IN', latitude: 11.7479, longitude: 79.7714, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INNAG', name: 'Nagapattinam', country: 'IN', latitude: 10.7653, longitude: 79.8420, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INRAM', name: 'Rameswaram', country: 'IN', latitude: 9.2876, longitude: 79.3129, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INKAT', name: 'Kattupalli', country: 'IN', latitude: 13.2167, longitude: 80.1833, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INGAV', name: 'Gangavaram', country: 'IN', latitude: 17.6167, longitude: 83.2167, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INKAK', name: 'Kakinada', country: 'IN', latitude: 16.9391, longitude: 82.2475, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INMAC', name: 'Machilipatnam', country: 'IN', latitude: 16.1796, longitude: 81.1383, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INKRI', name: 'Krishnapatnam', country: 'IN', latitude: 14.2500, longitude: 80.1167, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INGOP', name: 'Gopalpur', country: 'IN', latitude: 19.2667, longitude: 84.9, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INDHA', name: 'Dhamra', country: 'IN', latitude: 20.8667, longitude: 86.9833, timezone: 'Asia/Kolkata', type: 'seaport' },

  // ANCHORAGE PORTS (7)
  { unlocode: 'INMUN-OA', name: 'Mumbai Outer Anchorage', country: 'IN', latitude: 18.85, longitude: 72.75, timezone: 'Asia/Kolkata', type: 'anchorage' },
  { unlocode: 'INPPV-OA', name: 'Pipavav Outer Anchorage', country: 'IN', latitude: 20.85, longitude: 71.45, timezone: 'Asia/Kolkata', type: 'anchorage' },
  { unlocode: 'INHAL-SH', name: 'Haldia Sandheads', country: 'IN', latitude: 21.65, longitude: 87.85, timezone: 'Asia/Kolkata', type: 'anchorage' },
  { unlocode: 'INPBD-RD', name: 'Paradip Roads', country: 'IN', latitude: 20.25, longitude: 86.55, timezone: 'Asia/Kolkata', type: 'anchorage' },
  { unlocode: 'INVTZ-OH', name: 'Vizag Outer Harbor', country: 'IN', latitude: 17.65, longitude: 83.15, timezone: 'Asia/Kolkata', type: 'anchorage' },
  { unlocode: 'INMAA-RD', name: 'Chennai Roads', country: 'IN', latitude: 13.05, longitude: 80.22, timezone: 'Asia/Kolkata', type: 'anchorage' },
  { unlocode: 'INCOK-OC', name: 'Cochin Outer Channel', country: 'IN', latitude: 9.92, longitude: 76.20, timezone: 'Asia/Kolkata', type: 'anchorage' },

  // ISLAND PORTS (7)
  { unlocode: 'INIXZ', name: 'Port Blair', country: 'IN', latitude: 11.6234, longitude: 92.7265, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INDIG', name: 'Diglipur', country: 'IN', latitude: 13.2667, longitude: 92.9667, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INCAR', name: 'Car Nicobar', country: 'IN', latitude: 9.1667, longitude: 92.8167, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INHAV', name: 'Havelock', country: 'IN', latitude: 11.9934, longitude: 93.0094, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INKAV', name: 'Kavaratti', country: 'IN', latitude: 10.5626, longitude: 72.6369, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INAGA', name: 'Agatti', country: 'IN', latitude: 10.8333, longitude: 72.1833, timezone: 'Asia/Kolkata', type: 'seaport' },
  { unlocode: 'INMIN', name: 'Minicoy', country: 'IN', latitude: 8.2833, longitude: 73.0500, timezone: 'Asia/Kolkata', type: 'seaport' },
];

async function main() {
  console.log('🇮🇳 Creating All Indian Ports (Simple)');
  console.log('========================================\n');

  let created = 0;
  let updated = 0;

  for (const portData of allIndianPorts) {
    try {
      const existing = await prisma.port.findFirst({
        where: { unlocode: portData.unlocode }
      });

      if (existing) {
        await prisma.port.update({
          where: { id: existing.id },
          data: portData,
        });
        console.log(`🔄 ${portData.name} (${portData.unlocode})`);
        updated++;
      } else {
        await prisma.port.create({
          data: portData,
        });
        console.log(`✅ ${portData.name} (${portData.unlocode})`);
        created++;
      }
    } catch (error) {
      console.error(`❌ ${portData.name}:`, error);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Created: ${created} ports`);
  console.log(`   🔄 Updated: ${updated} ports`);
  console.log(`   📈 Total: ${allIndianPorts.length} ports\n`);

  await prisma.$disconnect();
  console.log('✅ All Indian ports ready!');
}

main().catch(console.error);
