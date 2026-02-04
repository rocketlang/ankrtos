# Mari8X Port Congestion Monitoring System - Implementation TODO

**Project Overview**: Build real-time port congestion detection and monitoring service using existing AIS data infrastructure (16,598+ vessels, 9.9M+ position records).

**Business Value**:
- Compete with TradLinx Port Congestion API
- Revenue tier: $99-499/month
- Detention cost prediction and alerts
- Integrated with existing Mari8X platform

**Timeline**: 6-9 days MVP → 3-4 weeks full production

---

## Architecture Overview

```
AIS Data Stream → Geofencing Engine → Congestion Detector → Alert System → Dashboard
     ↓                    ↓                    ↓                  ↓             ↓
VesselPosition    Port Boundaries      Wait Time Calc     Email/SMS    Real-time UI
  (existing)      (define zones)     (anchor analysis)   Webhooks     Charts/Maps
```

**Key Components**:
1. **Port Geofencing** - Define anchorage/berth boundaries for 100+ priority ports
2. **Congestion Detection** - Identify vessels at anchor, calculate wait times
3. **Alert Engine** - Notify on abnormal delays, predict detention costs
4. **Analytics Dashboard** - Real-time congestion levels, historical trends
5. **API** - RESTful + GraphQL endpoints for external integrations

---

## Database Schema Changes

### Phase 1: Core Tables (Day 1)

#### 1.1 `port_congestion_zones` Table
```prisma
model PortCongestionZone {
  id              String   @id @default(cuid())
  portId          String
  port            Port     @relation(fields: [portId], references: [id])

  // Zone definition
  zoneType        String   // 'ANCHORAGE', 'BERTH', 'WAITING_AREA', 'APPROACH'
  zoneName        String   // 'Mumbai Anchorage Alpha', 'Berth 1-3'

  // Geofencing (GeoJSON polygon)
  boundaryGeoJson Json     // { type: 'Polygon', coordinates: [...] }

  // Capacity limits
  normalCapacity  Int      // Normal vessel count threshold
  highCapacity    Int      // High congestion threshold
  criticalCapacity Int     // Critical congestion threshold

  // Metadata
  isActive        Boolean  @default(true)
  priority        Int      @default(5) // 1-10 (10 = highest)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  detections      PortCongestionDetection[]

  @@index([portId, zoneType])
  @@index([isActive])
}
```

#### 1.2 `port_congestion_detections` Table
```prisma
model PortCongestionDetection {
  id              String   @id @default(cuid())

  // References
  vesselId        String
  vessel          Vessel   @relation(fields: [vesselId], references: [id])
  portId          String
  port            Port     @relation(fields: [portId], references: [id])
  zoneId          String?
  zone            PortCongestionZone? @relation(fields: [zoneId], references: [id])

  // Detection details
  detectedAt      DateTime @default(now())
  navigationStatus String   // From AIS: 'AT_ANCHOR', 'MOORED', etc.

  // Position snapshot
  latitude        Float
  longitude       Float

  // Wait time tracking
  arrivalTime     DateTime // When vessel entered zone/anchor
  departureTime   DateTime? // When vessel left zone (null = still there)
  waitTimeHours   Float?   // Calculated on departure

  // Congestion metrics
  vesselCountAtArrival Int  // How many vessels in zone when this one arrived
  congestionLevel String   // 'NORMAL', 'MODERATE', 'HIGH', 'CRITICAL'

  // Cost impact
  estimatedDetentionCost Float? // USD per day * wait time

  // Status
  isActive        Boolean  @default(true) // false when vessel departs

  @@index([vesselId, isActive])
  @@index([portId, isActive])
  @@index([zoneId, isActive])
  @@index([detectedAt])
  @@index([congestionLevel])
}
```

#### 1.3 `port_congestion_snapshots` Table (Aggregated Stats)
```prisma
model PortCongestionSnapshot {
  id              String   @id @default(cuid())

  // References
  portId          String
  port            Port     @relation(fields: [portId], references: [id])
  zoneId          String?
  zone            PortCongestionZone? @relation(fields: [zoneId], references: [id])

  // Snapshot time (hourly)
  timestamp       DateTime @default(now())

  // Metrics
  vesselCount     Int      // Total vessels in zone
  anchoredCount   Int      // Vessels at anchor
  mooredCount     Int      // Vessels moored

  // Vessel type breakdown
  cargoCount      Int
  tankerCount     Int
  containerCount  Int
  bulkCarrierCount Int

  // Wait time statistics
  avgWaitTimeHours Float?
  maxWaitTimeHours Float?
  medianWaitTimeHours Float?

  // Congestion level
  congestionLevel String   // 'NORMAL', 'MODERATE', 'HIGH', 'CRITICAL'
  capacityPercent Float    // vesselCount / normalCapacity * 100

  // Trend indicators
  trend           String   // 'IMPROVING', 'STABLE', 'WORSENING'
  changePercent   Float?   // % change from previous snapshot

  @@index([portId, timestamp])
  @@index([zoneId, timestamp])
  @@index([congestionLevel])
  @@unique([portId, zoneId, timestamp])
}
```

#### 1.4 `port_congestion_alerts` Table
```prisma
model PortCongestionAlert {
  id              String   @id @default(cuid())

  // References
  portId          String
  port            Port     @relation(fields: [portId], references: [id])
  zoneId          String?
  zone            PortCongestionZone? @relation(fields: [zoneId], references: [id])
  vesselId        String?  // Optional - vessel-specific alerts
  vessel          Vessel?  @relation(fields: [vesselId], references: [id])

  // Alert details
  alertType       String   // 'CONGESTION_HIGH', 'WAIT_TIME_EXCEEDED', 'CAPACITY_CRITICAL'
  severity        String   // 'INFO', 'WARNING', 'CRITICAL'
  title           String
  message         String   @db.Text

  // Trigger conditions
  triggeredAt     DateTime @default(now())
  triggerValue    Float?   // e.g., 85.5 (capacity percent)
  threshold       Float?   // e.g., 80.0

  // Notification status
  status          String   @default("ACTIVE") // 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'
  acknowledgedAt  DateTime?
  acknowledgedBy  String?  // userId
  resolvedAt      DateTime?

  // Delivery tracking
  emailSent       Boolean  @default(false)
  smsSent         Boolean  @default(false)
  webhookSent     Boolean  @default(false)

  @@index([portId, status])
  @@index([severity, status])
  @@index([triggeredAt])
}
```

### Phase 1: Migration Script
```sql
-- File: /backend/prisma/migrations/add_port_congestion_tables.sql

-- 1. Port Congestion Zones
CREATE TABLE "port_congestion_zones" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "portId" TEXT NOT NULL,
  "zoneType" TEXT NOT NULL,
  "zoneName" TEXT NOT NULL,
  "boundaryGeoJson" JSONB NOT NULL,
  "normalCapacity" INTEGER NOT NULL,
  "highCapacity" INTEGER NOT NULL,
  "criticalCapacity" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "priority" INTEGER NOT NULL DEFAULT 5,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "port_congestion_zones_portId_fkey" FOREIGN KEY ("portId") REFERENCES "ports"("id") ON DELETE CASCADE
);

CREATE INDEX "port_congestion_zones_portId_zoneType_idx" ON "port_congestion_zones"("portId", "zoneType");
CREATE INDEX "port_congestion_zones_isActive_idx" ON "port_congestion_zones"("isActive");

-- 2. Port Congestion Detections
CREATE TABLE "port_congestion_detections" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "vesselId" TEXT NOT NULL,
  "portId" TEXT NOT NULL,
  "zoneId" TEXT,
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "navigationStatus" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "arrivalTime" TIMESTAMP(3) NOT NULL,
  "departureTime" TIMESTAMP(3),
  "waitTimeHours" DOUBLE PRECISION,
  "vesselCountAtArrival" INTEGER NOT NULL,
  "congestionLevel" TEXT NOT NULL,
  "estimatedDetentionCost" DOUBLE PRECISION,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "port_congestion_detections_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE CASCADE,
  CONSTRAINT "port_congestion_detections_portId_fkey" FOREIGN KEY ("portId") REFERENCES "ports"("id") ON DELETE CASCADE,
  CONSTRAINT "port_congestion_detections_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "port_congestion_zones"("id") ON DELETE SET NULL
);

CREATE INDEX "port_congestion_detections_vesselId_isActive_idx" ON "port_congestion_detections"("vesselId", "isActive");
CREATE INDEX "port_congestion_detections_portId_isActive_idx" ON "port_congestion_detections"("portId", "isActive");
CREATE INDEX "port_congestion_detections_zoneId_isActive_idx" ON "port_congestion_detections"("zoneId", "isActive");
CREATE INDEX "port_congestion_detections_detectedAt_idx" ON "port_congestion_detections"("detectedAt");
CREATE INDEX "port_congestion_detections_congestionLevel_idx" ON "port_congestion_detections"("congestionLevel");

-- 3. Port Congestion Snapshots
CREATE TABLE "port_congestion_snapshots" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "portId" TEXT NOT NULL,
  "zoneId" TEXT,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "vesselCount" INTEGER NOT NULL,
  "anchoredCount" INTEGER NOT NULL,
  "mooredCount" INTEGER NOT NULL,
  "cargoCount" INTEGER NOT NULL,
  "tankerCount" INTEGER NOT NULL,
  "containerCount" INTEGER NOT NULL,
  "bulkCarrierCount" INTEGER NOT NULL,
  "avgWaitTimeHours" DOUBLE PRECISION,
  "maxWaitTimeHours" DOUBLE PRECISION,
  "medianWaitTimeHours" DOUBLE PRECISION,
  "congestionLevel" TEXT NOT NULL,
  "capacityPercent" DOUBLE PRECISION NOT NULL,
  "trend" TEXT NOT NULL,
  "changePercent" DOUBLE PRECISION,
  CONSTRAINT "port_congestion_snapshots_portId_fkey" FOREIGN KEY ("portId") REFERENCES "ports"("id") ON DELETE CASCADE,
  CONSTRAINT "port_congestion_snapshots_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "port_congestion_zones"("id") ON DELETE SET NULL
);

CREATE INDEX "port_congestion_snapshots_portId_timestamp_idx" ON "port_congestion_snapshots"("portId", "timestamp");
CREATE INDEX "port_congestion_snapshots_zoneId_timestamp_idx" ON "port_congestion_snapshots"("zoneId", "timestamp");
CREATE INDEX "port_congestion_snapshots_congestionLevel_idx" ON "port_congestion_snapshots"("congestionLevel");
CREATE UNIQUE INDEX "port_congestion_snapshots_portId_zoneId_timestamp_key" ON "port_congestion_snapshots"("portId", "zoneId", "timestamp");

-- 4. Port Congestion Alerts
CREATE TABLE "port_congestion_alerts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "portId" TEXT NOT NULL,
  "zoneId" TEXT,
  "vesselId" TEXT,
  "alertType" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "triggerValue" DOUBLE PRECISION,
  "threshold" DOUBLE PRECISION,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "acknowledgedAt" TIMESTAMP(3),
  "acknowledgedBy" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "emailSent" BOOLEAN NOT NULL DEFAULT false,
  "smsSent" BOOLEAN NOT NULL DEFAULT false,
  "webhookSent" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "port_congestion_alerts_portId_fkey" FOREIGN KEY ("portId") REFERENCES "ports"("id") ON DELETE CASCADE,
  CONSTRAINT "port_congestion_alerts_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "port_congestion_zones"("id") ON DELETE SET NULL,
  CONSTRAINT "port_congestion_alerts_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE SET NULL
);

CREATE INDEX "port_congestion_alerts_portId_status_idx" ON "port_congestion_alerts"("portId", "status");
CREATE INDEX "port_congestion_alerts_severity_status_idx" ON "port_congestion_alerts"("severity", "status");
CREATE INDEX "port_congestion_alerts_triggeredAt_idx" ON "port_congestion_alerts"("triggeredAt");
```

---

## Implementation Phases

### PHASE 1: Foundation (Days 1-2) - Geofencing & Detection

#### Task 1.1: Port Zone Configuration (Day 1 - 3 hours)
**File**: `/backend/scripts/seed-port-congestion-zones.ts` (NEW)

```typescript
/**
 * Seed initial port congestion zones for 20 priority ports
 */

interface PortZoneConfig {
  portUnlocode: string;
  zones: Array<{
    zoneType: string;
    zoneName: string;
    boundary: { lat: number; lng: number }[]; // Polygon points
    normalCapacity: number;
    highCapacity: number;
    criticalCapacity: number;
    priority: number;
  }>;
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
  // Add 18 more ports...
];

async function seedCongestionZones() {
  for (const portConfig of PRIORITY_PORTS) {
    const port = await prisma.port.findUnique({
      where: { unlocode: portConfig.portUnlocode },
    });

    if (!port) continue;

    for (const zoneConfig of portConfig.zones) {
      await prisma.portCongestionZone.upsert({
        where: {
          portId_zoneName: {
            portId: port.id,
            zoneName: zoneConfig.zoneName,
          },
        },
        create: {
          portId: port.id,
          zoneType: zoneConfig.zoneType,
          zoneName: zoneConfig.zoneName,
          boundaryGeoJson: {
            type: 'Polygon',
            coordinates: [
              zoneConfig.boundary.map(p => [p.lng, p.lat]),
            ],
          },
          normalCapacity: zoneConfig.normalCapacity,
          highCapacity: zoneConfig.highCapacity,
          criticalCapacity: zoneConfig.criticalCapacity,
          priority: zoneConfig.priority,
        },
        update: {},
      });
    }
  }
}
```

**Deliverable**: 20 ports with 35+ congestion zones configured

---

#### Task 1.2: Geofencing Service (Day 1 - 4 hours)
**File**: `/backend/src/services/geofencing-service.ts` (NEW)

```typescript
/**
 * Geofencing Service - Point-in-polygon detection
 */

import { prisma } from '../lib/prisma.js';

interface Point {
  lat: number;
  lng: number;
}

interface PolygonBoundary {
  type: 'Polygon';
  coordinates: number[][][]; // GeoJSON format
}

export class GeofencingService {
  private zoneCache: Map<string, any> = new Map();

  /**
   * Check if a point is inside a polygon (ray casting algorithm)
   */
  private isPointInPolygon(point: Point, polygon: number[][]): boolean {
    const { lat, lng } = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i]; // lng, lat
      const [xj, yj] = polygon[j];

      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * Find which congestion zone a vessel is in
   */
  async findZoneForPosition(
    portId: string,
    position: Point
  ): Promise<{ zoneId: string; zoneName: string; zoneType: string } | null> {
    // Get all active zones for this port
    const zones = await prisma.portCongestionZone.findMany({
      where: { portId, isActive: true },
      orderBy: { priority: 'desc' }, // Check high-priority zones first
    });

    for (const zone of zones) {
      const boundary = zone.boundaryGeoJson as PolygonBoundary;
      const polygonPoints = boundary.coordinates[0]; // First ring (outer boundary)

      if (this.isPointInPolygon(position, polygonPoints)) {
        return {
          zoneId: zone.id,
          zoneName: zone.zoneName,
          zoneType: zone.zoneType,
        };
      }
    }

    return null; // Not in any zone
  }

  /**
   * Batch check multiple vessels
   */
  async checkVesselPositions(
    vessels: Array<{ vesselId: string; portId: string; position: Point }>
  ): Promise<Map<string, { zoneId: string; zoneName: string; zoneType: string } | null>> {
    const results = new Map();

    for (const vessel of vessels) {
      const zone = await this.findZoneForPosition(vessel.portId, vessel.position);
      results.set(vessel.vesselId, zone);
    }

    return results;
  }
}

export const geofencingService = new GeofencingService();
```

**Deliverable**: Point-in-polygon detection with 20 ports configured

---

#### Task 1.3: Congestion Detection Service (Day 2 - 6 hours)
**File**: `/backend/src/services/port-congestion-detector.ts` (NEW)

```typescript
/**
 * Port Congestion Detector
 * Monitors vessel positions and detects congestion
 */

import { prisma } from '../lib/prisma.js';
import { geofencingService } from './geofencing-service.js';

export class PortCongestionDetector {
  /**
   * Process AIS position update for congestion detection
   */
  async processVesselPosition(
    vesselId: string,
    position: { lat: number; lng: number },
    navigationStatus: string,
    timestamp: Date
  ): Promise<void> {
    // Only process vessels at anchor or moored
    if (!['AT_ANCHOR', 'MOORED'].includes(navigationStatus)) {
      return;
    }

    // Find nearest port (within 50km)
    const nearbyPort = await this.findNearestPort(position);
    if (!nearbyPort) return;

    // Check if vessel is in a congestion zone
    const zone = await geofencingService.findZoneForPosition(nearbyPort.id, position);
    if (!zone) return;

    // Check if we already have an active detection for this vessel
    const existingDetection = await prisma.portCongestionDetection.findFirst({
      where: {
        vesselId,
        portId: nearbyPort.id,
        isActive: true,
      },
    });

    if (existingDetection) {
      // Vessel still in zone - update position
      await prisma.portCongestionDetection.update({
        where: { id: existingDetection.id },
        data: {
          latitude: position.lat,
          longitude: position.lng,
          navigationStatus,
        },
      });
    } else {
      // New arrival - create detection record
      const currentVesselCount = await this.getVesselCountInZone(zone.zoneId);
      const congestionLevel = await this.calculateCongestionLevel(zone.zoneId, currentVesselCount);

      await prisma.portCongestionDetection.create({
        data: {
          vesselId,
          portId: nearbyPort.id,
          zoneId: zone.zoneId,
          detectedAt: timestamp,
          navigationStatus,
          latitude: position.lat,
          longitude: position.lng,
          arrivalTime: timestamp,
          vesselCountAtArrival: currentVesselCount,
          congestionLevel,
          isActive: true,
        },
      });

      console.log(`🚢 New congestion detection: Vessel ${vesselId} in ${zone.zoneName} (${congestionLevel})`);
    }
  }

  /**
   * Mark vessel as departed from zone
   */
  async processVesselDeparture(
    vesselId: string,
    departureTime: Date
  ): Promise<void> {
    const activeDetections = await prisma.portCongestionDetection.findMany({
      where: {
        vesselId,
        isActive: true,
      },
    });

    for (const detection of activeDetections) {
      const waitTimeHours = (departureTime.getTime() - detection.arrivalTime.getTime()) / (1000 * 60 * 60);

      // Estimate detention cost (assume $10,000/day for cargo vessels)
      const detentionCost = (waitTimeHours / 24) * 10000;

      await prisma.portCongestionDetection.update({
        where: { id: detection.id },
        data: {
          isActive: false,
          departureTime,
          waitTimeHours,
          estimatedDetentionCost: detentionCost,
        },
      });

      console.log(`✅ Vessel ${vesselId} departed after ${waitTimeHours.toFixed(1)} hours (cost: $${detentionCost.toFixed(0)})`);
    }
  }

  /**
   * Find nearest port within radius
   */
  private async findNearestPort(position: { lat: number; lng: number }) {
    // Simple distance calculation (Haversine would be more accurate)
    const ports = await prisma.port.findMany({
      where: {
        latitude: {
          gte: position.lat - 0.5, // ~50km radius
          lte: position.lat + 0.5,
        },
        longitude: {
          gte: position.lng - 0.5,
          lte: position.lng + 0.5,
        },
      },
      take: 1,
    });

    return ports[0] || null;
  }

  /**
   * Count vessels currently in zone
   */
  private async getVesselCountInZone(zoneId: string): Promise<number> {
    return await prisma.portCongestionDetection.count({
      where: {
        zoneId,
        isActive: true,
      },
    });
  }

  /**
   * Calculate congestion level based on capacity thresholds
   */
  private async calculateCongestionLevel(
    zoneId: string,
    currentCount: number
  ): Promise<string> {
    const zone = await prisma.portCongestionZone.findUnique({
      where: { id: zoneId },
    });

    if (!zone) return 'NORMAL';

    if (currentCount >= zone.criticalCapacity) return 'CRITICAL';
    if (currentCount >= zone.highCapacity) return 'HIGH';
    if (currentCount >= zone.normalCapacity) return 'MODERATE';
    return 'NORMAL';
  }
}

export const portCongestionDetector = new PortCongestionDetector();
```

**Deliverable**: Real-time congestion detection working for 16,598 vessels

---

#### Task 1.4: Integrate with AIS Stream (Day 2 - 2 hours)
**File**: `/backend/src/services/aisstream-service.ts` (MODIFY)

Add congestion detection to existing position handler:

```typescript
// Add import
import { portCongestionDetector } from './port-congestion-detector.js';

// In handlePositionReport method, after vessel upsert:
private async handlePositionReport(
  metadata: AISPosition['MetaData'],
  positionReport: NonNullable<AISPosition['Message']['PositionReport']>
): Promise<void> {
  // ... existing code ...

  // Add congestion detection
  await portCongestionDetector.processVesselPosition(
    vessel.id,
    { lat: position.latitude, lng: position.longitude },
    mappedNavStatus,
    timestamp
  );

  // Check if vessel is moving (SOG > 3 knots) - mark as departed
  if (positionReport.Sog > 3) {
    await portCongestionDetector.processVesselDeparture(vessel.id, timestamp);
  }
}
```

**Deliverable**: AIS stream feeding congestion detector in real-time

---

### PHASE 2: Analytics & Aggregation (Days 3-4)

#### Task 2.1: Snapshot Generator (Day 3 - 4 hours)
**File**: `/backend/src/jobs/port-congestion-snapshot-generator.ts` (NEW)

```typescript
/**
 * Hourly snapshot generator for port congestion metrics
 * Runs via cron: 0 * * * * (every hour)
 */

import { prisma } from '../lib/prisma.js';

export class PortCongestionSnapshotGenerator {
  async generateSnapshots(): Promise<void> {
    const zones = await prisma.portCongestionZone.findMany({
      where: { isActive: true },
    });

    for (const zone of zones) {
      await this.generateZoneSnapshot(zone);
    }
  }

  private async generateZoneSnapshot(zone: any): Promise<void> {
    const timestamp = new Date();
    timestamp.setMinutes(0, 0, 0); // Round to hour

    // Get all active detections in this zone
    const detections = await prisma.portCongestionDetection.findMany({
      where: {
        zoneId: zone.id,
        isActive: true,
      },
      include: {
        vessel: true,
      },
    });

    // Count by navigation status
    const anchoredCount = detections.filter(d => d.navigationStatus === 'AT_ANCHOR').length;
    const mooredCount = detections.filter(d => d.navigationStatus === 'MOORED').length;

    // Count by vessel type
    const cargoCount = detections.filter(d => d.vessel.type === 'CARGO').length;
    const tankerCount = detections.filter(d => d.vessel.type === 'TANKER').length;
    const containerCount = detections.filter(d => d.vessel.type === 'CONTAINER').length;
    const bulkCarrierCount = detections.filter(d => d.vessel.type === 'BULK_CARRIER').length;

    // Calculate wait time statistics
    const waitTimes = detections.map(d => {
      const hours = (Date.now() - d.arrivalTime.getTime()) / (1000 * 60 * 60);
      return hours;
    });

    const avgWaitTimeHours = waitTimes.length > 0
      ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
      : null;

    const maxWaitTimeHours = waitTimes.length > 0
      ? Math.max(...waitTimes)
      : null;

    const medianWaitTimeHours = waitTimes.length > 0
      ? this.calculateMedian(waitTimes)
      : null;

    // Calculate congestion level
    const vesselCount = detections.length;
    const capacityPercent = (vesselCount / zone.normalCapacity) * 100;

    let congestionLevel = 'NORMAL';
    if (vesselCount >= zone.criticalCapacity) congestionLevel = 'CRITICAL';
    else if (vesselCount >= zone.highCapacity) congestionLevel = 'HIGH';
    else if (vesselCount >= zone.normalCapacity) congestionLevel = 'MODERATE';

    // Calculate trend (compare with previous snapshot)
    const previousSnapshot = await prisma.portCongestionSnapshot.findFirst({
      where: { zoneId: zone.id },
      orderBy: { timestamp: 'desc' },
    });

    let trend = 'STABLE';
    let changePercent = 0;

    if (previousSnapshot) {
      changePercent = ((vesselCount - previousSnapshot.vesselCount) / previousSnapshot.vesselCount) * 100;
      if (changePercent > 5) trend = 'WORSENING';
      else if (changePercent < -5) trend = 'IMPROVING';
    }

    // Create snapshot
    await prisma.portCongestionSnapshot.upsert({
      where: {
        portId_zoneId_timestamp: {
          portId: zone.portId,
          zoneId: zone.id,
          timestamp,
        },
      },
      create: {
        portId: zone.portId,
        zoneId: zone.id,
        timestamp,
        vesselCount,
        anchoredCount,
        mooredCount,
        cargoCount,
        tankerCount,
        containerCount,
        bulkCarrierCount,
        avgWaitTimeHours,
        maxWaitTimeHours,
        medianWaitTimeHours,
        congestionLevel,
        capacityPercent,
        trend,
        changePercent,
      },
      update: {},
    });

    console.log(`📊 Snapshot: ${zone.zoneName} - ${vesselCount} vessels (${congestionLevel})`);
  }

  private calculateMedian(values: number[]): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}

export const snapshotGenerator = new PortCongestionSnapshotGenerator();
```

**Cron Setup**:
```typescript
// File: /backend/src/jobs/index.ts
import cron from 'node-cron';
import { snapshotGenerator } from './port-congestion-snapshot-generator.js';

// Run hourly at :00
cron.schedule('0 * * * *', async () => {
  console.log('⏰ Running congestion snapshot generator...');
  await snapshotGenerator.generateSnapshots();
});
```

**Deliverable**: Hourly aggregated metrics for all zones

---

#### Task 2.2: Alert Engine (Day 3-4 - 5 hours)
**File**: `/backend/src/services/port-congestion-alert-engine.ts` (NEW)

```typescript
/**
 * Port Congestion Alert Engine
 * Monitors snapshots and triggers alerts
 */

import { prisma } from '../lib/prisma.js';
import { notificationService } from './notification-service.js';

export class PortCongestionAlertEngine {
  /**
   * Check for alert conditions after each snapshot
   */
  async checkAlertConditions(snapshot: any): Promise<void> {
    // 1. Check for high congestion
    if (snapshot.congestionLevel === 'CRITICAL' || snapshot.congestionLevel === 'HIGH') {
      await this.triggerCongestionAlert(snapshot);
    }

    // 2. Check for excessive wait times
    if (snapshot.maxWaitTimeHours && snapshot.maxWaitTimeHours > 48) {
      await this.triggerWaitTimeAlert(snapshot);
    }

    // 3. Check for capacity threshold breach
    if (snapshot.capacityPercent > 90) {
      await this.triggerCapacityAlert(snapshot);
    }

    // 4. Check for worsening trend
    if (snapshot.trend === 'WORSENING' && snapshot.changePercent > 20) {
      await this.triggerTrendAlert(snapshot);
    }
  }

  private async triggerCongestionAlert(snapshot: any): Promise<void> {
    const existingAlert = await prisma.portCongestionAlert.findFirst({
      where: {
        portId: snapshot.portId,
        zoneId: snapshot.zoneId,
        alertType: 'CONGESTION_HIGH',
        status: 'ACTIVE',
      },
    });

    if (existingAlert) return; // Already alerted

    const zone = await prisma.portCongestionZone.findUnique({
      where: { id: snapshot.zoneId },
      include: { port: true },
    });

    const alert = await prisma.portCongestionAlert.create({
      data: {
        portId: snapshot.portId,
        zoneId: snapshot.zoneId,
        alertType: 'CONGESTION_HIGH',
        severity: snapshot.congestionLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        title: `${snapshot.congestionLevel} Congestion at ${zone?.port.name}`,
        message: `${zone?.zoneName} has ${snapshot.vesselCount} vessels (capacity: ${snapshot.capacityPercent.toFixed(0)}%). Average wait time: ${snapshot.avgWaitTimeHours?.toFixed(1)} hours.`,
        triggerValue: snapshot.capacityPercent,
        threshold: 80,
      },
    });

    // Send notifications
    await notificationService.sendEmail({
      to: 'operations@mari8x.com',
      subject: alert.title,
      body: alert.message,
    });

    await prisma.portCongestionAlert.update({
      where: { id: alert.id },
      data: { emailSent: true },
    });

    console.log(`🚨 ALERT: ${alert.title}`);
  }

  private async triggerWaitTimeAlert(snapshot: any): Promise<void> {
    // Implementation similar to above
  }

  private async triggerCapacityAlert(snapshot: any): Promise<void> {
    // Implementation similar to above
  }

  private async triggerTrendAlert(snapshot: any): Promise<void> {
    // Implementation similar to above
  }
}

export const alertEngine = new PortCongestionAlertEngine();
```

**Deliverable**: Automated alerts for congestion events

---

### PHASE 3: API & Integration (Days 5-6)

#### Task 3.1: GraphQL API (Day 5 - 6 hours)
**File**: `/backend/src/schema/types/port-congestion.ts` (NEW)

```typescript
/**
 * Port Congestion GraphQL Types
 */

import { builder } from '../builder.js';
import { prisma } from '../context.js';

// ===============================
// OBJECT TYPES
// ===============================

const PortCongestionZone = builder.prismaObject('PortCongestionZone', {
  fields: (t) => ({
    id: t.exposeID('id'),
    portId: t.exposeString('portId'),
    port: t.relation('port'),
    zoneType: t.exposeString('zoneType'),
    zoneName: t.exposeString('zoneName'),
    boundaryGeoJson: t.expose('boundaryGeoJson', { type: 'JSON' }),
    normalCapacity: t.exposeInt('normalCapacity'),
    highCapacity: t.exposeInt('highCapacity'),
    criticalCapacity: t.exposeInt('criticalCapacity'),
    isActive: t.exposeBoolean('isActive'),
    priority: t.exposeInt('priority'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

const PortCongestionDetection = builder.prismaObject('PortCongestionDetection', {
  fields: (t) => ({
    id: t.exposeID('id'),
    vessel: t.relation('vessel'),
    port: t.relation('port'),
    zone: t.relation('zone', { nullable: true }),
    detectedAt: t.expose('detectedAt', { type: 'DateTime' }),
    navigationStatus: t.exposeString('navigationStatus'),
    latitude: t.exposeFloat('latitude'),
    longitude: t.exposeFloat('longitude'),
    arrivalTime: t.expose('arrivalTime', { type: 'DateTime' }),
    departureTime: t.expose('departureTime', { type: 'DateTime', nullable: true }),
    waitTimeHours: t.exposeFloat('waitTimeHours', { nullable: true }),
    vesselCountAtArrival: t.exposeInt('vesselCountAtArrival'),
    congestionLevel: t.exposeString('congestionLevel'),
    estimatedDetentionCost: t.exposeFloat('estimatedDetentionCost', { nullable: true }),
    isActive: t.exposeBoolean('isActive'),
  }),
});

const PortCongestionSnapshot = builder.prismaObject('PortCongestionSnapshot', {
  fields: (t) => ({
    id: t.exposeID('id'),
    port: t.relation('port'),
    zone: t.relation('zone', { nullable: true }),
    timestamp: t.expose('timestamp', { type: 'DateTime' }),
    vesselCount: t.exposeInt('vesselCount'),
    anchoredCount: t.exposeInt('anchoredCount'),
    mooredCount: t.exposeInt('mooredCount'),
    avgWaitTimeHours: t.exposeFloat('avgWaitTimeHours', { nullable: true }),
    maxWaitTimeHours: t.exposeFloat('maxWaitTimeHours', { nullable: true }),
    medianWaitTimeHours: t.exposeFloat('medianWaitTimeHours', { nullable: true }),
    congestionLevel: t.exposeString('congestionLevel'),
    capacityPercent: t.exposeFloat('capacityPercent'),
    trend: t.exposeString('trend'),
    changePercent: t.exposeFloat('changePercent', { nullable: true }),
  }),
});

const PortCongestionAlert = builder.prismaObject('PortCongestionAlert', {
  fields: (t) => ({
    id: t.exposeID('id'),
    port: t.relation('port'),
    zone: t.relation('zone', { nullable: true }),
    vessel: t.relation('vessel', { nullable: true }),
    alertType: t.exposeString('alertType'),
    severity: t.exposeString('severity'),
    title: t.exposeString('title'),
    message: t.exposeString('message'),
    triggeredAt: t.expose('triggeredAt', { type: 'DateTime' }),
    triggerValue: t.exposeFloat('triggerValue', { nullable: true }),
    threshold: t.exposeFloat('threshold', { nullable: true }),
    status: t.exposeString('status'),
  }),
});

// ===============================
// QUERIES
// ===============================

builder.queryFields((t) => ({
  // Get current congestion status for a port
  portCongestionStatus: t.prismaField({
    type: [PortCongestionSnapshot],
    args: {
      portId: t.arg.string({ required: true }),
    },
    resolve: async (query, root, args) => {
      const latestTimestamp = await prisma.portCongestionSnapshot.findFirst({
        where: { portId: args.portId },
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true },
      });

      if (!latestTimestamp) return [];

      return prisma.portCongestionSnapshot.findMany({
        ...query,
        where: {
          portId: args.portId,
          timestamp: latestTimestamp.timestamp,
        },
      });
    },
  }),

  // Get historical congestion trends
  portCongestionHistory: t.prismaField({
    type: [PortCongestionSnapshot],
    args: {
      portId: t.arg.string({ required: true }),
      zoneId: t.arg.string(),
      fromDate: t.arg({ type: 'DateTime', required: true }),
      toDate: t.arg({ type: 'DateTime', required: true }),
    },
    resolve: async (query, root, args) => {
      return prisma.portCongestionSnapshot.findMany({
        ...query,
        where: {
          portId: args.portId,
          ...(args.zoneId && { zoneId: args.zoneId }),
          timestamp: {
            gte: args.fromDate,
            lte: args.toDate,
          },
        },
        orderBy: { timestamp: 'asc' },
      });
    },
  }),

  // Get active detections (vessels currently waiting)
  activeCongestionDetections: t.prismaField({
    type: [PortCongestionDetection],
    args: {
      portId: t.arg.string(),
      zoneId: t.arg.string(),
      congestionLevel: t.arg.string(),
    },
    resolve: async (query, root, args) => {
      return prisma.portCongestionDetection.findMany({
        ...query,
        where: {
          ...(args.portId && { portId: args.portId }),
          ...(args.zoneId && { zoneId: args.zoneId }),
          ...(args.congestionLevel && { congestionLevel: args.congestionLevel }),
          isActive: true,
        },
        orderBy: { arrivalTime: 'asc' },
      });
    },
  }),

  // Get active alerts
  portCongestionAlerts: t.prismaField({
    type: [PortCongestionAlert],
    args: {
      portId: t.arg.string(),
      severity: t.arg.string(),
      status: t.arg.string({ defaultValue: 'ACTIVE' }),
    },
    resolve: async (query, root, args) => {
      return prisma.portCongestionAlert.findMany({
        ...query,
        where: {
          ...(args.portId && { portId: args.portId }),
          ...(args.severity && { severity: args.severity }),
          status: args.status,
        },
        orderBy: { triggeredAt: 'desc' },
      });
    },
  }),
}));

// ===============================
// MUTATIONS
// ===============================

builder.mutationFields((t) => ({
  // Acknowledge alert
  acknowledgePortCongestionAlert: t.prismaField({
    type: PortCongestionAlert,
    args: {
      alertId: t.arg.string({ required: true }),
      userId: t.arg.string({ required: true }),
    },
    resolve: async (query, root, args, context) => {
      return prisma.portCongestionAlert.update({
        ...query,
        where: { id: args.alertId },
        data: {
          status: 'ACKNOWLEDGED',
          acknowledgedAt: new Date(),
          acknowledgedBy: args.userId,
        },
      });
    },
  }),

  // Resolve alert
  resolvePortCongestionAlert: t.prismaField({
    type: PortCongestionAlert,
    args: {
      alertId: t.arg.string({ required: true }),
    },
    resolve: async (query, root, args) => {
      return prisma.portCongestionAlert.update({
        ...query,
        where: { id: args.alertId },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
      });
    },
  }),
}));
```

**Deliverable**: Full GraphQL API for congestion data

---

#### Task 3.2: REST API Endpoints (Day 5 - 3 hours)
**File**: `/backend/src/routes/port-congestion.ts` (NEW)

```typescript
/**
 * Port Congestion REST API
 * For external integrations and webhooks
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

/**
 * GET /api/port-congestion/status/:portId
 * Get current congestion status for a port
 */
router.get('/status/:portId', async (req, res) => {
  try {
    const { portId } = req.params;

    const latestSnapshot = await prisma.portCongestionSnapshot.findFirst({
      where: { portId },
      orderBy: { timestamp: 'desc' },
      include: {
        port: { select: { name: true, unlocode: true } },
        zone: { select: { zoneName: true, zoneType: true } },
      },
    });

    if (!latestSnapshot) {
      return res.status(404).json({ error: 'No congestion data found for port' });
    }

    res.json({
      port: latestSnapshot.port,
      zone: latestSnapshot.zone,
      timestamp: latestSnapshot.timestamp,
      vesselCount: latestSnapshot.vesselCount,
      congestionLevel: latestSnapshot.congestionLevel,
      capacityPercent: latestSnapshot.capacityPercent,
      avgWaitTimeHours: latestSnapshot.avgWaitTimeHours,
      maxWaitTimeHours: latestSnapshot.maxWaitTimeHours,
      trend: latestSnapshot.trend,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch congestion status' });
  }
});

/**
 * GET /api/port-congestion/active-vessels/:portId
 * Get list of vessels currently waiting
 */
router.get('/active-vessels/:portId', async (req, res) => {
  try {
    const { portId } = req.params;

    const detections = await prisma.portCongestionDetection.findMany({
      where: {
        portId,
        isActive: true,
      },
      include: {
        vessel: {
          select: {
            name: true,
            imo: true,
            type: true,
            loa: true,
            beam: true,
          },
        },
        zone: {
          select: { zoneName: true },
        },
      },
      orderBy: { arrivalTime: 'asc' },
    });

    const vessels = detections.map(d => ({
      vesselName: d.vessel.name,
      imo: d.vessel.imo,
      type: d.vessel.type,
      zone: d.zone?.zoneName,
      arrivalTime: d.arrivalTime,
      waitTimeHours: (Date.now() - d.arrivalTime.getTime()) / (1000 * 60 * 60),
      navigationStatus: d.navigationStatus,
      position: {
        lat: d.latitude,
        lng: d.longitude,
      },
    }));

    res.json({
      portId,
      totalVessels: vessels.length,
      vessels,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active vessels' });
  }
});

/**
 * GET /api/port-congestion/alerts
 * Get active alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    const { severity, limit = '20' } = req.query;

    const alerts = await prisma.portCongestionAlert.findMany({
      where: {
        status: 'ACTIVE',
        ...(severity && { severity: severity as string }),
      },
      include: {
        port: { select: { name: true, unlocode: true } },
        zone: { select: { zoneName: true } },
      },
      orderBy: { triggeredAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

export default router;
```

**Register in main app**:
```typescript
// File: /backend/src/main.ts
import portCongestionRoutes from './routes/port-congestion.js';

app.use('/api/port-congestion', portCongestionRoutes);
```

**Deliverable**: REST API for external integrations

---

### PHASE 4: Dashboard & UI (Days 7-9)

#### Task 4.1: Congestion Dashboard Component (Day 7 - 6 hours)
**File**: `/frontend/src/pages/PortCongestionDashboard.tsx` (NEW)

```typescript
/**
 * Port Congestion Monitoring Dashboard
 */

import React, { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';

const GET_CONGESTION_STATUS = gql`
  query GetCongestionStatus($portId: String!) {
    portCongestionStatus(portId: $portId) {
      id
      timestamp
      vesselCount
      anchoredCount
      mooredCount
      avgWaitTimeHours
      maxWaitTimeHours
      congestionLevel
      capacityPercent
      trend
      zone {
        zoneName
        zoneType
      }
    }
  }
`;

const GET_ACTIVE_DETECTIONS = gql`
  query GetActiveDetections($portId: String!) {
    activeCongestionDetections(portId: $portId) {
      id
      vessel {
        name
        imo
        type
      }
      latitude
      longitude
      arrivalTime
      navigationStatus
      congestionLevel
      zone {
        zoneName
      }
    }
  }
`;

const GET_ALERTS = gql`
  query GetAlerts($portId: String) {
    portCongestionAlerts(portId: $portId, status: "ACTIVE") {
      id
      alertType
      severity
      title
      message
      triggeredAt
      port {
        name
      }
      zone {
        zoneName
      }
    }
  }
`;

export const PortCongestionDashboard: React.FC = () => {
  const [selectedPort, setSelectedPort] = useState('clr1234...'); // Default port ID

  const { data: statusData, loading: statusLoading } = useQuery(GET_CONGESTION_STATUS, {
    variables: { portId: selectedPort },
    pollInterval: 60000, // Refresh every minute
  });

  const { data: detectionsData } = useQuery(GET_ACTIVE_DETECTIONS, {
    variables: { portId: selectedPort },
    pollInterval: 30000,
  });

  const { data: alertsData } = useQuery(GET_ALERTS, {
    variables: { portId: selectedPort },
    pollInterval: 30000,
  });

  // Calculate congestion color
  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return '#EF4444'; // red-500
      case 'HIGH': return '#F59E0B'; // amber-500
      case 'MODERATE': return '#FCD34D'; // amber-300
      default: return '#10B981'; // green-500
    }
  };

  if (statusLoading) return <div>Loading...</div>;

  const status = statusData?.portCongestionStatus || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Port Congestion Monitor</h1>
        <select
          value={selectedPort}
          onChange={(e) => setSelectedPort(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="clr1234...">Mumbai (INMUN)</option>
          <option value="clr5678...">Singapore (SGSIN)</option>
          {/* Add more ports */}
        </select>
      </div>

      {/* Alerts Banner */}
      {alertsData?.portCongestionAlerts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {alertsData.portCongestionAlerts.length} active congestion alert(s)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {status.map((zone: any) => (
          <div key={zone.id} className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">{zone.zone?.zoneName}</div>
            <div className="mt-2 flex items-baseline">
              <div className="text-3xl font-bold">{zone.vesselCount}</div>
              <div className="ml-2 text-sm text-gray-500">vessels</div>
            </div>
            <div className="mt-2">
              <span
                className="inline-block px-2 py-1 text-xs font-semibold rounded"
                style={{
                  backgroundColor: getCongestionColor(zone.congestionLevel) + '20',
                  color: getCongestionColor(zone.congestionLevel),
                }}
              >
                {zone.congestionLevel}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Avg wait: {zone.avgWaitTimeHours?.toFixed(1) || '0'} hrs
            </div>
            <div className="mt-1 text-sm text-gray-600">
              Capacity: {zone.capacityPercent?.toFixed(0) || '0'}%
            </div>
          </div>
        ))}
      </div>

      {/* Live Map */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Vessel Positions</h2>
        <div style={{ height: '500px' }}>
          <MapContainer
            center={[18.94, 72.82]}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Plot active detections */}
            {detectionsData?.activeCongestionDetections.map((detection: any) => (
              <Circle
                key={detection.id}
                center={[detection.latitude, detection.longitude]}
                radius={500}
                pathOptions={{ color: getCongestionColor(detection.congestionLevel) }}
              >
                <Popup>
                  <div>
                    <strong>{detection.vessel.name}</strong><br />
                    IMO: {detection.vessel.imo}<br />
                    Zone: {detection.zone?.zoneName}<br />
                    Status: {detection.navigationStatus}<br />
                    Arrived: {new Date(detection.arrivalTime).toLocaleString()}
                  </div>
                </Popup>
              </Circle>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Waiting Vessels Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Vessels Currently Waiting</h2>
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Vessel Name</th>
              <th className="text-left py-2">IMO</th>
              <th className="text-left py-2">Type</th>
              <th className="text-left py-2">Zone</th>
              <th className="text-left py-2">Arrival</th>
              <th className="text-left py-2">Wait Time</th>
              <th className="text-left py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {detectionsData?.activeCongestionDetections.map((detection: any) => {
              const waitHours = (Date.now() - new Date(detection.arrivalTime).getTime()) / (1000 * 60 * 60);
              return (
                <tr key={detection.id} className="border-b">
                  <td className="py-2">{detection.vessel.name}</td>
                  <td className="py-2">{detection.vessel.imo}</td>
                  <td className="py-2">{detection.vessel.type}</td>
                  <td className="py-2">{detection.zone?.zoneName || 'N/A'}</td>
                  <td className="py-2">{new Date(detection.arrivalTime).toLocaleString()}</td>
                  <td className="py-2">{waitHours.toFixed(1)} hrs</td>
                  <td className="py-2">
                    <span className="px-2 py-1 text-xs rounded" style={{
                      backgroundColor: getCongestionColor(detection.congestionLevel) + '20',
                      color: getCongestionColor(detection.congestionLevel),
                    }}>
                      {detection.navigationStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Alerts List */}
      {alertsData?.portCongestionAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Active Alerts</h2>
          <div className="space-y-3">
            {alertsData.portCongestionAlerts.map((alert: any) => (
              <div
                key={alert.id}
                className="border-l-4 p-4"
                style={{
                  borderColor: alert.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B',
                  backgroundColor: alert.severity === 'CRITICAL' ? '#FEE2E2' : '#FEF3C7',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">{alert.title}</div>
                    <div className="text-sm text-gray-700">{alert.message}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(alert.triggeredAt).toLocaleString()}
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-white border rounded text-sm">
                    Acknowledge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

**Add to navigation**:
```typescript
// File: /frontend/src/lib/sidebar-nav.ts
{
  title: 'Port Congestion',
  href: '/port-congestion',
  icon: 'Anchor',
  badge: 'NEW',
},
```

**Deliverable**: Real-time congestion monitoring dashboard

---

## Testing Plan

### Unit Tests (Day 8 - 4 hours)

**File**: `/backend/src/services/__tests__/geofencing-service.test.ts`
```typescript
describe('GeofencingService', () => {
  it('should detect point inside polygon', () => {
    // Test point-in-polygon algorithm
  });

  it('should find correct zone for vessel position', () => {
    // Test zone detection
  });
});
```

**File**: `/backend/src/services/__tests__/port-congestion-detector.test.ts`
```typescript
describe('PortCongestionDetector', () => {
  it('should create detection when vessel enters anchorage', () => {
    // Test detection creation
  });

  it('should mark vessel as departed when moving', () => {
    // Test departure detection
  });

  it('should calculate wait time correctly', () => {
    // Test wait time calculation
  });
});
```

### Integration Tests (Day 8 - 3 hours)

**File**: `/backend/src/__tests__/port-congestion-e2e.test.ts`
```typescript
describe('Port Congestion E2E', () => {
  it('should process AIS position → detection → snapshot → alert', async () => {
    // Test full pipeline
  });
});
```

---

## Deployment Checklist

### Prerequisites
- [ ] Run database migration: `add_port_congestion_tables.sql`
- [ ] Seed port zones: `npm run seed:congestion-zones`
- [ ] Configure cron jobs for snapshot generator
- [ ] Set up notification service (email/SMS)

### Production Deployment (Day 9)
- [ ] Deploy backend with new services
- [ ] Deploy frontend with congestion dashboard
- [ ] Start AIS stream integration
- [ ] Monitor first 24 hours
- [ ] Verify hourly snapshots generating
- [ ] Test alert delivery

---

## Success Metrics

### Technical Metrics
- **Detection Accuracy**: >95% of vessels at anchor detected within 5 minutes
- **Snapshot Latency**: Hourly snapshots generated within 2 minutes of top of hour
- **Alert Latency**: Alerts triggered within 5 minutes of threshold breach
- **API Response Time**: <500ms for status queries
- **Dashboard Load Time**: <2s

### Business Metrics
- **Port Coverage**: 20 ports at launch → 100 ports in Month 2
- **Daily Active Users**: 50 users (operations teams)
- **Alert Action Rate**: >70% of alerts acknowledged
- **Revenue**: $99-499/month per user (Pro/Enterprise tiers)

---

## Pricing Tiers

### Free Tier
- 3 ports monitored
- Daily snapshots
- Email alerts
- 7-day history

### Pro Tier ($99/month)
- 20 ports monitored
- Hourly snapshots
- Real-time alerts (email + SMS)
- 90-day history
- API access (1000 req/day)
- Custom alert thresholds

### Enterprise Tier ($499/month)
- Unlimited ports
- Real-time updates
- Webhooks
- Unlimited API access
- 2-year history
- Custom zones
- Priority support
- Detention cost prediction

---

## Future Enhancements (Post-MVP)

### Phase 5: Advanced Analytics (Weeks 5-6)
- **Machine Learning**: Predict congestion 24-48 hours ahead
- **Seasonal Patterns**: Identify peak congestion periods
- **Port Efficiency Scoring**: Rank ports by turnaround time
- **Route Optimization**: Suggest alternative ports

### Phase 6: Integration Ecosystem (Weeks 7-8)
- **Webhook System**: Real-time push to external systems
- **Slack/Teams Integration**: Alerts in communication tools
- **Mobile App**: iOS/Android congestion monitoring
- **Public API**: Developer portal with documentation

### Phase 7: Revenue Features (Weeks 9-10)
- **Detention Cost Calculator**: Precise cost estimates
- **Insurance Integration**: Claims automation
- **Charter Party Integration**: Laytime calculation
- **White-Label Solution**: Branded for brokers/operators

---

## Known Dependencies

### External Services
- AISstream.io (free tier - 16,598 vessels)
- Email service (SendGrid/AWS SES)
- SMS service (Twilio - optional)
- Map tiles (OpenStreetMap)

### Technical Dependencies
- PostgreSQL with PostGIS extension (for spatial queries)
- Redis (for alert deduplication)
- BullMQ (for snapshot generation queue)
- Node-cron (for scheduling)

---

## Risk Mitigation

### Technical Risks
1. **AIS Data Quality**: Some vessels may not report status correctly
   - **Mitigation**: Use multiple signals (position changes, speed, distance from port)

2. **False Positives**: Vessels may be at anchor for non-congestion reasons
   - **Mitigation**: Filter out known anchorage patterns, add manual override

3. **Performance**: High-frequency AIS updates may overload detector
   - **Mitigation**: Rate limiting, batch processing, caching

### Business Risks
1. **AISstream Terms**: May require paid plan for commercial use
   - **Mitigation**: Budget $200/month for Spire Maritime, migrate if needed

2. **Competition**: TradLinx already established
   - **Mitigation**: Differentiate with integrated platform, better UX, lower pricing

---

## Files to Create/Modify Summary

### NEW FILES (15)
1. `/backend/prisma/migrations/add_port_congestion_tables.sql`
2. `/backend/scripts/seed-port-congestion-zones.ts`
3. `/backend/src/services/geofencing-service.ts`
4. `/backend/src/services/port-congestion-detector.ts`
5. `/backend/src/jobs/port-congestion-snapshot-generator.ts`
6. `/backend/src/services/port-congestion-alert-engine.ts`
7. `/backend/src/schema/types/port-congestion.ts`
8. `/backend/src/routes/port-congestion.ts`
9. `/backend/src/services/__tests__/geofencing-service.test.ts`
10. `/backend/src/services/__tests__/port-congestion-detector.test.ts`
11. `/backend/src/__tests__/port-congestion-e2e.test.ts`
12. `/frontend/src/pages/PortCongestionDashboard.tsx`
13. `/backend/prisma/schema.prisma` (add 4 new models)
14. `/backend/src/jobs/index.ts` (add cron job)
15. `/backend/src/main.ts` (register routes)

### MODIFIED FILES (3)
1. `/backend/src/services/aisstream-service.ts` (add detector integration)
2. `/frontend/src/lib/sidebar-nav.ts` (add menu item)
3. `/frontend/src/App.tsx` (add route)

---

## Quick Start Commands

```bash
# Backend Setup
cd /root/apps/ankr-maritime/backend

# 1. Run migration
psql -U mari8x -d mari8x_db -f prisma/migrations/add_port_congestion_tables.sql

# 2. Generate Prisma client
npx prisma generate

# 3. Seed zones
npm run seed:congestion-zones

# 4. Restart backend (with new cron jobs)
pm2 restart mari8x-backend

# Frontend
cd /root/apps/ankr-maritime/frontend
npm run dev

# Verification
# Check detections: psql -U mari8x -d mari8x_db -c "SELECT COUNT(*) FROM port_congestion_detections WHERE \"isActive\" = true;"
# Check snapshots: psql -U mari8x -d mari8x_db -c "SELECT * FROM port_congestion_snapshots ORDER BY timestamp DESC LIMIT 5;"
# Check alerts: psql -U mari8x -d mari8x_db -c "SELECT * FROM port_congestion_alerts WHERE status = 'ACTIVE';"
```

---

## Summary

**Total Implementation**: 6-9 days MVP, 3-4 weeks full production

**Phase 1 (Days 1-2)**: Foundation - Geofencing, detection, AIS integration
**Phase 2 (Days 3-4)**: Analytics - Snapshots, alerts, aggregation
**Phase 3 (Days 5-6)**: API - GraphQL, REST, webhooks
**Phase 4 (Days 7-9)**: UI - Dashboard, maps, charts

**Revenue Potential**: $99-499/month × 100 users = $10K-50K MRR

**Competitive Advantage**:
- Free AIS data (16,598 vessels, 9.9M positions)
- Integrated platform (no separate subscription)
- Real-time alerts (TradLinx is delayed)
- Better UX (modern React dashboard)
- Lower pricing (TradLinx is enterprise-only)

---

## Next Actions

1. **Review & Approve TODO** - Get sign-off on implementation plan
2. **Start Phase 1** - Begin with geofencing service
3. **Daily Standups** - 15-min progress check
4. **Weekly Demos** - Show working features to stakeholders
5. **Launch Beta** - Invite 10 pilot users after Phase 3

---

**Last Updated**: February 3, 2026
**Status**: Ready for Implementation
**Priority**: P1 (High Revenue Potential)
