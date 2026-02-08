/**
 * Free AIS Data Sources Integration
 * No cost alternatives to commercial providers
 */

export interface AISStreamConfig {
  apiKey: string; // Free API key from aisstream.io
  wsUrl: string;
}

export interface NorwegianAISConfig {
  host: string;
  port: number;
  // No auth required - open data!
}

/**
 * AISStream.io - TRULY FREE WebSocket API
 * https://aisstream.io
 * No hardware required - just register for free API key
 */
export class AISStreamClient {
  private apiKey: string;
  private wsUrl = 'wss://stream.aisstream.io/v0/stream';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Create WebSocket connection for real-time global AIS
   */
  createStream(options?: {
    mmsi?: string[];  // Filter by specific vessels
    bbox?: [[number, number], [number, number]];  // [[west, south], [east, north]]
  }) {
    const ws = new WebSocket(this.wsUrl);

    ws.on('open', () => {
      // Subscribe to AIS messages
      const subscription: any = {
        APIKey: this.apiKey,
        BoundingBoxes: options?.bbox ? [options.bbox] : undefined,
        FiltersShipMMSI: options?.mmsi,
        FilterMessageTypes: ['PositionReport', 'ShipStaticData']
      };

      ws.send(JSON.stringify(subscription));
    });

    return ws;
  }

  /**
   * Get vessels in area (using WebSocket)
   * Returns promise that resolves with vessels in bounding box
   */
  async getVesselsInArea(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }, timeoutMs = 5000): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const vessels = new Map();
      const ws = this.createStream({
        bbox: [[bounds.west, bounds.south], [bounds.east, bounds.north]]
      });

      const timeout = setTimeout(() => {
        ws.close();
        resolve(Array.from(vessels.values()));
      }, timeoutMs);

      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          if (message.Message) {
            const mmsi = message.MetaData?.MMSI;
            if (mmsi) {
              vessels.set(mmsi, {
                mmsi,
                lat: message.Message.PositionReport?.Latitude,
                lon: message.Message.PositionReport?.Longitude,
                speed: message.Message.PositionReport?.Sog,
                course: message.Message.PositionReport?.Cog,
                heading: message.Message.PositionReport?.TrueHeading,
                name: message.MetaData?.ShipName,
                timestamp: message.MetaData?.time_utc
              });
            }
          }
        } catch (e) {
          console.error('Failed to parse AIS message:', e);
        }
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }
}

/**
 * Norwegian Coastal Administration - 100% Free, No Registration
 * https://kystdatahuset.no
 */
export class NorwegianAISClient {
  private baseUrl = 'https://kystdatahuset.no/ws';

  /**
   * Get real-time AIS stream (Norwegian waters)
   * NLOD 2.0 License - completely open
   */
  async getRealtimeStream() {
    // REST API endpoint
    const response = await fetch(`${this.baseUrl}/ais/latest`);
    return response.json();
  }

  /**
   * TCP socket for streaming (recommended for real-time)
   */
  createTCPStream() {
    // For Node.js backend
    const net = require('net');
    const client = net.createConnection({
      host: 'ais.kystverket.no',
      port: 5631
    });

    client.on('data', (data: Buffer) => {
      // NMEA sentences (AIS messages)
      console.log('AIS:', data.toString());
    });

    return client;
  }
}

/**
 * Sentinel-1 SAR Ship Detection (100% Free)
 * EU Copernicus Open Data
 */
export class SentinelShipDetection {
  private hubUrl = 'https://scihub.copernicus.eu/dhus';

  /**
   * Search for Sentinel-1 images over area
   * Requires free Copernicus account
   */
  async searchImages(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }, date: Date) {
    // OData API query
    const footprint = `POLYGON((${bounds.west} ${bounds.south},${bounds.east} ${bounds.south},${bounds.east} ${bounds.north},${bounds.west} ${bounds.north},${bounds.west} ${bounds.south}))`;

    const query = `platformname:Sentinel-1 AND producttype:GRD AND footprint:"Intersects(${footprint})"`;

    // Return image IDs for download
    return { query, message: 'Use SNAP or Python to process SAR imagery for ship detection' };
  }

  /**
   * Alternative: Use Google Earth Engine (free)
   */
  getGEEExample() {
    return `
// Google Earth Engine JavaScript example
var sentinel1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(geometry)
  .filterDate('2026-01-01', '2026-02-01')
  .filter(ee.Filter.eq('instrumentMode', 'IW'));

// Ship detection algorithm
var detectShips = function(image) {
  var vv = image.select('VV');
  var ships = vv.gt(-15); // Bright targets
  return ships;
};

Map.addLayer(sentinel1.map(detectShips));
`;
  }
}

/**
 * Hybrid Free Strategy
 * Combine multiple free sources for best coverage
 */
export class FreeAISAggregator {
  private aisstream: AISStreamClient;
  private norwegian: NorwegianAISClient;

  constructor(aisstreamApiKey: string) {
    this.aisstream = new AISStreamClient(aisstreamApiKey);
    this.norwegian = new NorwegianAISClient();
  }

  /**
   * Get vessels from all free sources
   */
  async getVessels(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) {
    const sources = await Promise.allSettled([
      this.aisstream.getVesselsInArea(bounds),
      this.isNorwegianWaters(bounds) ? this.norwegian.getRealtimeStream() : null
    ]);

    // Merge and deduplicate by MMSI
    const vessels = new Map();

    sources.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        const data = Array.isArray(result.value) ? result.value : result.value.data || [];
        data.forEach((vessel: any) => {
          vessels.set(vessel.MMSI || vessel.mmsi, vessel);
        });
      }
    });

    return Array.from(vessels.values());
  }

  private isNorwegianWaters(bounds: any): boolean {
    // Rough check for Norwegian economic zone
    return bounds.north > 55 && bounds.north < 81 &&
           bounds.west > -5 && bounds.east < 35;
  }
}

/**
 * Example Usage
 */
export async function exampleUsage() {
  // 1. AISStream.io (truly free - just register for API key)
  const aisstream = new AISStreamClient('YOUR_FREE_API_KEY');
  const vessels = await aisstream.getVesselsInArea({
    north: 60,
    south: 50,
    east: 10,
    west: 0
  });

  // 2. Norwegian AIS (no registration!)
  const norwegian = new NorwegianAISClient();
  const norwegianVessels = await norwegian.getRealtimeStream();

  // 3. Combined approach (best coverage)
  const aggregator = new FreeAISAggregator('YOUR_AISSTREAM_API_KEY');
  const allVessels = await aggregator.getVessels({
    north: 60,
    south: 50,
    east: 10,
    west: 0
  });

  console.log(`Found ${allVessels.length} vessels from free sources`);
}
