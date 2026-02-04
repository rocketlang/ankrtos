/**
 * Simulated AIS Service
 * Generates realistic vessel positions for testing until real AIS API is configured
 *
 * Usage: Automatically used when AIS_MODE=simulated in .env
 *
 * Features:
 * - Realistic vessel movements along routes
 * - Speed variations based on vessel type
 * - Position updates every 5-15 minutes
 * - Owner/Operator data included
 * - Historical track generation
 */

interface SimulatedVessel {
  imo: number;
  mmsi: number;
  name: string;
  vesselType: string;
  flag: string;
  dwt: number;
  built: number;
  owner: string;
  operator: string;
  technicalManager?: string;
  commercialManager?: string;
  route: { lat: number; lon: number }[];
  currentRouteIndex: number;
  speed: number;
  heading: number;
  status: number;
}

/**
 * Simulated fleet with realistic data
 */
const SIMULATED_FLEET: SimulatedVessel[] = [
  {
    imo: 9000001,
    mmsi: 123456789,
    name: 'PACIFIC DREAM',
    vesselType: 'Bulk Carrier',
    flag: 'Panama',
    dwt: 82000,
    built: 2010,
    owner: 'Pacific Shipping Limited',
    operator: 'Global Maritime Operations Ltd',
    technicalManager: 'Ship Tech Management',
    commercialManager: 'Maritime Trading Co',
    route: [
      { lat: 1.2897, lon: 103.8501 }, // Singapore
      { lat: 5.5, lon: 100.0 },       // Andaman Sea
      { lat: 10.0, lon: 95.0 },       // Bay of Bengal
      { lat: 13.0833, lon: 80.2833 }, // Chennai
    ],
    currentRouteIndex: 0,
    speed: 12.5,
    heading: 315,
    status: 0,
  },
  {
    imo: 9000002,
    mmsi: 234567890,
    name: 'ATLANTIC VOYAGER',
    vesselType: 'Container Ship',
    flag: 'Liberia',
    dwt: 150000,
    built: 2018,
    owner: 'Atlantic Container Lines',
    operator: 'Global Shipping Corp',
    route: [
      { lat: 51.9244, lon: 4.4777 },  // Rotterdam
      { lat: 50.0, lon: -10.0 },      // Atlantic
      { lat: 40.6943, lon: -74.0446 }, // New York
    ],
    currentRouteIndex: 1,
    speed: 18.5,
    heading: 270,
    status: 0,
  },
  {
    imo: 9000003,
    mmsi: 345678901,
    name: 'ARABIAN STAR',
    vesselType: 'Tanker',
    flag: 'UAE',
    dwt: 320000,
    built: 2015,
    owner: 'Middle East Tankers LLC',
    operator: 'Gulf Shipping Co',
    commercialManager: 'Oil Trading Partners',
    route: [
      { lat: 25.2694, lon: 55.3095 }, // Jebel Ali
      { lat: 20.0, lon: 60.0 },       // Arabian Sea
      { lat: 1.2897, lon: 103.8501 }, // Singapore
    ],
    currentRouteIndex: 2,
    speed: 14.2,
    heading: 120,
    status: 0,
  },
  {
    imo: 9000004,
    mmsi: 456789012,
    name: 'ASIAN PIONEER',
    vesselType: 'Bulk Carrier',
    flag: 'Singapore',
    dwt: 180000,
    built: 2020,
    owner: 'Singapore Bulk Carriers',
    operator: 'Asia Pacific Shipping',
    route: [
      { lat: 31.2304, lon: 121.4737 }, // Shanghai
      { lat: 25.0, lon: 130.0 },       // East China Sea
      { lat: 35.1815, lon: 129.0757 }, // Busan
    ],
    currentRouteIndex: 1,
    speed: 13.8,
    heading: 45,
    status: 0,
  },
];

/**
 * Simulated AIS Service
 */
export class AISSimulatedService {
  private vessels: Map<number, SimulatedVessel> = new Map();
  private lastUpdate: Map<number, Date> = new Map();

  constructor() {
    // Initialize fleet
    SIMULATED_FLEET.forEach(vessel => {
      this.vessels.set(vessel.imo, vessel);
      this.lastUpdate.set(vessel.imo, new Date());
    });

    // Simulate vessel movements every 5 minutes
    setInterval(() => this.updateAllVessels(), 5 * 60 * 1000);
  }

  /**
   * Get current vessel position
   */
  async getVesselPosition(imo: number, mmsi?: number) {
    const vessel = this.vessels.get(imo);
    if (!vessel) {
      return null;
    }

    // Update position if needed
    this.updateVesselPosition(vessel);

    const currentWaypoint = vessel.route[vessel.currentRouteIndex];

    return {
      imo: vessel.imo,
      mmsi: vessel.mmsi,
      shipName: vessel.name,
      latitude: currentWaypoint.lat,
      longitude: currentWaypoint.lon,
      speed: vessel.speed,
      course: vessel.heading,
      heading: vessel.heading,
      status: vessel.status,
      timestamp: new Date(),
      source: 'simulated',
      // Owner/Operator data
      owner: vessel.owner,
      operator: vessel.operator,
      technicalManager: vessel.technicalManager,
      commercialManager: vessel.commercialManager,
      flag: vessel.flag,
      vesselType: vessel.vesselType,
      dwt: vessel.dwt,
      built: vessel.built,
    };
  }

  /**
   * Get vessel static data
   */
  async getVesselInfo(imo: number) {
    const vessel = this.vessels.get(imo);
    if (!vessel) {
      return null;
    }

    return {
      imo: vessel.imo,
      mmsi: vessel.mmsi,
      name: vessel.name,
      vesselType: vessel.vesselType,
      flag: vessel.flag,
      dwt: vessel.dwt,
      built: vessel.built,
      owner: vessel.owner,
      operator: vessel.operator,
      technicalManager: vessel.technicalManager,
      commercialManager: vessel.commercialManager,
    };
  }

  /**
   * Get historical track (last 7 days)
   */
  async getVesselTrack(imo: number, days: number = 7) {
    const vessel = this.vessels.get(imo);
    if (!vessel) {
      return [];
    }

    // Generate historical positions along the route
    const positions = [];
    const now = new Date();
    const pointsPerDay = 24; // 1 position per hour

    for (let d = days - 1; d >= 0; d--) {
      for (let h = 0; h < 24; h++) {
        const timestamp = new Date(now.getTime() - (d * 24 + h) * 60 * 60 * 1000);

        // Calculate position along route
        const progress = ((days * 24 - (d * 24 + h)) / (days * 24)) * vessel.route.length;
        const index = Math.floor(progress) % vessel.route.length;
        const nextIndex = (index + 1) % vessel.route.length;
        const fraction = progress - Math.floor(progress);

        const current = vessel.route[index];
        const next = vessel.route[nextIndex];

        positions.push({
          latitude: current.lat + (next.lat - current.lat) * fraction,
          longitude: current.lon + (next.lon - current.lon) * fraction,
          speed: vessel.speed + (Math.random() - 0.5) * 2, // Speed variation
          course: vessel.heading,
          timestamp,
        });
      }
    }

    return positions;
  }

  /**
   * Search vessels by name/IMO/MMSI
   */
  async searchVessels(query: string) {
    const results = [];
    const queryLower = query.toLowerCase();

    for (const vessel of this.vessels.values()) {
      if (
        vessel.name.toLowerCase().includes(queryLower) ||
        vessel.imo.toString().includes(query) ||
        vessel.mmsi.toString().includes(query) ||
        vessel.owner.toLowerCase().includes(queryLower)
      ) {
        const position = await this.getVesselPosition(vessel.imo);
        results.push(position);
      }
    }

    return results;
  }

  /**
   * Get fleet positions (all vessels)
   */
  async getFleetPositions() {
    const positions = [];
    for (const vessel of this.vessels.values()) {
      const position = await this.getVesselPosition(vessel.imo);
      if (position) {
        positions.push(position);
      }
    }
    return positions;
  }

  /**
   * Update vessel position (simulate movement)
   */
  private updateVesselPosition(vessel: SimulatedVessel) {
    const lastUpdate = this.lastUpdate.get(vessel.imo);
    if (!lastUpdate) return;

    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

    // Update every 15 minutes
    if (minutesSinceUpdate >= 15) {
      // Move to next waypoint
      vessel.currentRouteIndex = (vessel.currentRouteIndex + 1) % vessel.route.length;

      // Small speed variation
      vessel.speed = vessel.speed + (Math.random() - 0.5) * 0.5;

      // Clamp speed by vessel type
      const speedLimits: Record<string, { min: number; max: number }> = {
        'Bulk Carrier': { min: 11, max: 15 },
        'Container Ship': { min: 16, max: 22 },
        'Tanker': { min: 12, max: 16 },
      };
      const limits = speedLimits[vessel.vesselType] || { min: 10, max: 20 };
      vessel.speed = Math.max(limits.min, Math.min(limits.max, vessel.speed));

      this.lastUpdate.set(vessel.imo, now);
    }
  }

  /**
   * Update all vessels
   */
  private updateAllVessels() {
    for (const vessel of this.vessels.values()) {
      this.updateVesselPosition(vessel);
    }
  }

  /**
   * Add custom vessel for testing
   */
  addVessel(vessel: SimulatedVessel) {
    this.vessels.set(vessel.imo, vessel);
    this.lastUpdate.set(vessel.imo, new Date());
  }
}

// Singleton instance
export const aisSimulatedService = new AISSimulatedService();
