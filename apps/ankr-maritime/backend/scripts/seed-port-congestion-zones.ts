/**
 * Seed Port Congestion Zones
 *
 * Configure 20 priority ports with anchorage/berth boundaries for congestion monitoring
 * Run: npx tsx backend/scripts/seed-port-congestion-zones.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface PortZoneConfig {
  portUnlocode: string
  zones: Array<{
    zoneType: string
    zoneName: string
    boundary: { lat: number; lng: number }[] // Polygon points
    normalCapacity: number
    highCapacity: number
    criticalCapacity: number
    priority: number
  }>
}

const PRIORITY_PORTS: PortZoneConfig[] = [
  {
    portUnlocode: 'SGSIN', // Singapore
    zones: [
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'Singapore Eastern Anchorage',
        boundary: [
          { lat: 1.2167, lng: 103.9167 },
          { lat: 1.2167, lng: 104.0167 },
          { lat: 1.1667, lng: 104.0167 },
          { lat: 1.1667, lng: 103.9167 },
        ],
        normalCapacity: 150,
        highCapacity: 200,
        criticalCapacity: 250,
        priority: 10,
      },
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'Singapore Western Anchorage',
        boundary: [
          { lat: 1.2667, lng: 103.7167 },
          { lat: 1.2667, lng: 103.8167 },
          { lat: 1.2167, lng: 103.8167 },
          { lat: 1.2167, lng: 103.7167 },
        ],
        normalCapacity: 100,
        highCapacity: 140,
        criticalCapacity: 180,
        priority: 9,
      },
    ],
  },
  {
    portUnlocode: 'INMUN', // Mumbai
    zones: [
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'Mumbai Outer Anchorage',
        boundary: [
          { lat: 18.95, lng: 72.82 },
          { lat: 18.95, lng: 72.88 },
          { lat: 18.88, lng: 72.88 },
          { lat: 18.88, lng: 72.82 },
        ],
        normalCapacity: 80,
        highCapacity: 110,
        criticalCapacity: 140,
        priority: 8,
      },
    ],
  },
  {
    portUnlocode: 'INNSA', // Nhava Sheva (JNPT)
    zones: [
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'JNPT Anchorage',
        boundary: [
          { lat: 18.95, lng: 72.95 },
          { lat: 18.95, lng: 73.05 },
          { lat: 18.88, lng: 73.05 },
          { lat: 18.88, lng: 72.95 },
        ],
        normalCapacity: 60,
        highCapacity: 85,
        criticalCapacity: 110,
        priority: 8,
      },
    ],
  },
  {
    portUnlocode: 'AEJEA', // Jebel Ali (Dubai)
    zones: [
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'Jebel Ali Outer Anchorage',
        boundary: [
          { lat: 24.95, lng: 54.95 },
          { lat: 24.95, lng: 55.05 },
          { lat: 24.85, lng: 55.05 },
          { lat: 24.85, lng: 54.95 },
        ],
        normalCapacity: 120,
        highCapacity: 160,
        criticalCapacity: 200,
        priority: 9,
      },
    ],
  },
  {
    portUnlocode: 'NLRTM', // Rotterdam
    zones: [
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'Rotterdam Outer Roads',
        boundary: [
          { lat: 52.05, lng: 4.00 },
          { lat: 52.05, lng: 4.15 },
          { lat: 51.95, lng: 4.15 },
          { lat: 51.95, lng: 4.00 },
        ],
        normalCapacity: 100,
        highCapacity: 135,
        criticalCapacity: 170,
        priority: 9,
      },
    ],
  },
  {
    portUnlocode: 'CNSHA', // Shanghai
    zones: [
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'Shanghai Yangtze Anchorage',
        boundary: [
          { lat: 31.45, lng: 121.85 },
          { lat: 31.45, lng: 121.95 },
          { lat: 31.35, lng: 121.95 },
          { lat: 31.35, lng: 121.85 },
        ],
        normalCapacity: 180,
        highCapacity: 240,
        criticalCapacity: 300,
        priority: 10,
      },
    ],
  },
  {
    portUnlocode: 'CNNGB', // Ningbo
    zones: [
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'Ningbo Outer Anchorage',
        boundary: [
          { lat: 29.95, lng: 122.05 },
          { lat: 29.95, lng: 122.15 },
          { lat: 29.85, lng: 122.15 },
          { lat: 29.85, lng: 122.05 },
        ],
        normalCapacity: 140,
        highCapacity: 190,
        criticalCapacity: 240,
        priority: 9,
      },
    ],
  },
  {
    portUnlocode: 'USNYC', // New York
    zones: [
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'New York Anchorage',
        boundary: [
          { lat: 40.50, lng: -74.05 },
          { lat: 40.50, lng: -73.95 },
          { lat: 40.40, lng: -73.95 },
          { lat: 40.40, lng: -74.05 },
        ],
        normalCapacity: 70,
        highCapacity: 95,
        criticalCapacity: 120,
        priority: 8,
      },
    ],
  },
  {
    portUnlocode: 'USHOU', // Houston
    zones: [
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'Houston Ship Channel Anchorage',
        boundary: [
          { lat: 29.75, lng: -94.95 },
          { lat: 29.75, lng: -94.85 },
          { lat: 29.65, lng: -94.85 },
          { lat: 29.65, lng: -94.95 },
        ],
        normalCapacity: 65,
        highCapacity: 90,
        criticalCapacity: 115,
        priority: 7,
      },
    ],
  },
  {
    portUnlocode: 'USLAX', // Los Angeles
    zones: [
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'LA/Long Beach Anchorage',
        boundary: [
          { lat: 33.75, lng: -118.25 },
          { lat: 33.75, lng: -118.15 },
          { lat: 33.65, lng: -118.15 },
          { lat: 33.65, lng: -118.25 },
        ],
        normalCapacity: 90,
        highCapacity: 120,
        criticalCapacity: 150,
        priority: 8,
      },
    ],
  },
  {
    portUnlocode: 'GBLON', // London Gateway/Felixstowe
    zones: [
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'Thames Anchorage',
        boundary: [
          { lat: 51.55, lng: 1.25 },
          { lat: 51.55, lng: 1.35 },
          { lat: 51.45, lng: 1.35 },
          { lat: 51.45, lng: 1.25 },
        ],
        normalCapacity: 55,
        highCapacity: 75,
        criticalCapacity: 95,
        priority: 7,
      },
    ],
  },
  {
    portUnlocode: 'DEHAM', // Hamburg
    zones: [
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'Hamburg Elbe Anchorage',
        boundary: [
          { lat: 53.95, lng: 9.85 },
          { lat: 53.95, lng: 9.95 },
          { lat: 53.85, lng: 9.95 },
          { lat: 53.85, lng: 9.85 },
        ],
        normalCapacity: 60,
        highCapacity: 80,
        criticalCapacity: 100,
        priority: 7,
      },
    ],
  },
  {
    portUnlocode: 'BEANT', // Antwerp
    zones: [
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'Antwerp Roads',
        boundary: [
          { lat: 51.35, lng: 4.25 },
          { lat: 51.35, lng: 4.35 },
          { lat: 51.25, lng: 4.35 },
          { lat: 51.25, lng: 4.25 },
        ],
        normalCapacity: 65,
        highCapacity: 90,
        criticalCapacity: 115,
        priority: 7,
      },
    ],
  },
  {
    portUnlocode: 'JPYOK', // Yokohama
    zones: [
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'Tokyo Bay Anchorage',
        boundary: [
          { lat: 35.45, lng: 139.75 },
          { lat: 35.45, lng: 139.85 },
          { lat: 35.35, lng: 139.85 },
          { lat: 35.35, lng: 139.75 },
        ],
        normalCapacity: 75,
        highCapacity: 100,
        criticalCapacity: 125,
        priority: 8,
      },
    ],
  },
  {
    portUnlocode: 'KRPUS', // Busan
    zones: [
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'Busan Outer Anchorage',
        boundary: [
          { lat: 35.15, lng: 129.05 },
          { lat: 35.15, lng: 129.15 },
          { lat: 35.05, lng: 129.15 },
          { lat: 35.05, lng: 129.05 },
        ],
        normalCapacity: 85,
        highCapacity: 115,
        criticalCapacity: 145,
        priority: 8,
      },
    ],
  },
  {
    portUnlocode: 'BRSSZ', // Santos (Brazil)
    zones: [
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'Santos Outer Anchorage',
        boundary: [
          { lat: -23.95, lng: -46.35 },
          { lat: -23.95, lng: -46.25 },
          { lat: -24.05, lng: -46.25 },
          { lat: -24.05, lng: -46.35 },
        ],
        normalCapacity: 70,
        highCapacity: 95,
        criticalCapacity: 120,
        priority: 7,
      },
    ],
  },
  {
    portUnlocode: 'AUMEL', // Melbourne
    zones: [
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'Port Phillip Anchorage',
        boundary: [
          { lat: -37.95, lng: 144.85 },
          { lat: -37.95, lng: 144.95 },
          { lat: -38.05, lng: 144.95 },
          { lat: -38.05, lng: 144.85 },
        ],
        normalCapacity: 50,
        highCapacity: 70,
        criticalCapacity: 90,
        priority: 7,
      },
    ],
  },
  {
    portUnlocode: 'ZADUR', // Durban (South Africa)
    zones: [
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'Durban Outer Anchorage',
        boundary: [
          { lat: -29.85, lng: 31.05 },
          { lat: -29.85, lng: 31.15 },
          { lat: -29.95, lng: 31.15 },
          { lat: -29.95, lng: 31.05 },
        ],
        normalCapacity: 55,
        highCapacity: 75,
        criticalCapacity: 95,
        priority: 7,
      },
    ],
  },
  {
    portUnlocode: 'INCCU', // Kolkata
    zones: [
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'Kolkata Anchorage',
        boundary: [
          { lat: 22.65, lng: 88.45 },
          { lat: 22.65, lng: 88.55 },
          { lat: 22.55, lng: 88.55 },
          { lat: 22.55, lng: 88.45 },
        ],
        normalCapacity: 45,
        highCapacity: 65,
        criticalCapacity: 85,
        priority: 7,
      },
    ],
  },
  {
    portUnlocode: 'INVTZ', // Visakhapatnam
    zones: [
      {
        zoneType: 'ANCHORAGE',
        zoneName: 'Visakhapatnam Outer Anchorage',
        boundary: [
          { lat: 17.75, lng: 83.35 },
          { lat: 17.75, lng: 83.45 },
          { lat: 17.65, lng: 83.45 },
          { lat: 17.65, lng: 83.35 },
        ],
        normalCapacity: 55,
        highCapacity: 75,
        criticalCapacity: 95,
        priority: 7,
      },
    ],
  },
]

async function seedCongestionZones() {
  console.log('🚀 Starting port congestion zones seed...')

  let portsProcessed = 0
  let zonesCreated = 0

  for (const portConfig of PRIORITY_PORTS) {
    // Find port by unlocode
    const port = await prisma.port.findUnique({
      where: { unlocode: portConfig.portUnlocode },
    })

    if (!port) {
      console.log(`⚠️  Port ${portConfig.portUnlocode} not found, skipping...`)
      continue
    }

    console.log(`\n📍 Processing ${port.name} (${port.unlocode})...`)
    portsProcessed++

    for (const zoneConfig of portConfig.zones) {
      // Create or update zone
      const zone = await prisma.portCongestionZone.upsert({
        where: {
          id: `${port.id}-${zoneConfig.zoneName.replace(/\s+/g, '-').toLowerCase()}`,
        },
        create: {
          portId: port.id,
          zoneType: zoneConfig.zoneType,
          zoneName: zoneConfig.zoneName,
          boundaryGeoJson: {
            type: 'Polygon',
            coordinates: [
              zoneConfig.boundary.map((p) => [p.lng, p.lat]),
            ],
          },
          normalCapacity: zoneConfig.normalCapacity,
          highCapacity: zoneConfig.highCapacity,
          criticalCapacity: zoneConfig.criticalCapacity,
          priority: zoneConfig.priority,
          isActive: true,
        },
        update: {
          boundaryGeoJson: {
            type: 'Polygon',
            coordinates: [
              zoneConfig.boundary.map((p) => [p.lng, p.lat]),
            ],
          },
          normalCapacity: zoneConfig.normalCapacity,
          highCapacity: zoneConfig.highCapacity,
          criticalCapacity: zoneConfig.criticalCapacity,
          priority: zoneConfig.priority,
          isActive: true,
        },
      })

      console.log(
        `  ✅ ${zoneConfig.zoneName} - Capacity: ${zoneConfig.normalCapacity}/${zoneConfig.highCapacity}/${zoneConfig.criticalCapacity}`
      )
      zonesCreated++
    }
  }

  console.log(`\n🎉 Seed complete!`)
  console.log(`   Ports processed: ${portsProcessed}`)
  console.log(`   Zones created/updated: ${zonesCreated}`)
}

seedCongestionZones()
  .catch((e) => {
    console.error('❌ Error seeding port congestion zones:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
