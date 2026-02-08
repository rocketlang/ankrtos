/**
 * Free Satellite AIS Data Scraper
 * Uses publicly available sources (no API key needed!)
 *
 * Sources:
 * 1. VesselFinder public pages (web scraping - use carefully!)
 * 2. MarineTraffic public map data
 * 3. FleetMon public data
 *
 * Note: These are scrapers, not official APIs
 * Use GFW API when you get the key!
 */

import { JSDOM } from 'jsdom';

/**
 * Scrape VesselFinder public map for Arabian Sea
 * NO API key needed - uses public website data
 */
export async function scrapeVesselFinderPublic(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}) {
  const vessels: any[] = [];

  try {
    // VesselFinder public map URL
    const url = `https://www.vesselfinder.com/api/pub/vesselsonmap`;

    const params = new URLSearchParams({
      bbox: `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`,
      zoom: '8',
      mmsi: '0',
      show_names: '1',
      Fleet: '',
      vtypes: '0'
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.vesselfinder.com/'
      }
    });

    if (response.ok) {
      const data = await response.json();

      // VesselFinder returns array of vessels
      if (Array.isArray(data)) {
        data.forEach((v: any) => {
          vessels.push({
            mmsi: v.MMSI || v[0],
            lat: v.LAT || v[1],
            lon: v.LON || v[2],
            speed: v.SPEED || v[3],
            course: v.COURSE || v[4],
            name: v.SHIPNAME || v[5],
            timestamp: new Date(),
            source: 'vesselfinder_public'
          });
        });
      }

      console.log(`✅ VesselFinder public: ${vessels.length} vessels`);
    }
  } catch (error) {
    console.error('VesselFinder scraping failed:', error);
  }

  return vessels;
}

/**
 * Scrape MarineTraffic public map
 * Use sparingly - respect their ToS!
 */
export async function scrapeMarineTrafficPublic(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}) {
  const vessels: any[] = [];

  try {
    // MarineTraffic public API endpoint (limited free access)
    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLon = (bounds.east + bounds.west) / 2;

    const url = `https://www.marinetraffic.com/vesselDetails/latestPosition/latlon:${centerLat},${centerLon}/zoom:8`;

    // Note: MarineTraffic has strong anti-scraping measures
    // This is just an example - they require API subscription for serious use

    console.warn('⚠️  MarineTraffic requires API subscription for reliable access');
  } catch (error) {
    console.error('MarineTraffic scraping failed:', error);
  }

  return vessels;
}

/**
 * Fallback: Use AISHub if you set up a receiver or contribute
 */
export async function getAISHubData(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}, username?: string) {
  if (!username) {
    console.warn('⚠️  AISHub requires username (get by contributing AIS data)');
    return [];
  }

  const url = 'http://data.aishub.net/ws.php';
  const params = new URLSearchParams({
    username,
    format: '1',
    output: 'json',
    compress: '0',
    latmin: bounds.south.toString(),
    latmax: bounds.north.toString(),
    lonmin: bounds.west.toString(),
    lonmax: bounds.east.toString()
  });

  try {
    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    if (data.ERROR) {
      console.error('AISHub error:', data.ERROR);
      return [];
    }

    return (data as any[]).map((v: any) => ({
      mmsi: v.MMSI,
      lat: v.LATITUDE,
      lon: v.LONGITUDE,
      speed: v.SOG,
      course: v.COG,
      name: v.NAME,
      timestamp: new Date(v.TIME * 1000),
      source: 'aishub'
    }));
  } catch (error) {
    console.error('AISHub failed:', error);
    return [];
  }
}

/**
 * BEST APPROACH: Download GFW CSV and import
 * This avoids rate limits and API restrictions
 */
export async function importGFWCSV(csvFilePath: string) {
  const fs = require('fs');
  const csv = require('csv-parser');

  const vessels: any[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row: any) => {
        vessels.push({
          mmsi: row.mmsi || row.MMSI,
          lat: parseFloat(row.lat || row.latitude),
          lon: parseFloat(row.lon || row.longitude),
          speed: parseFloat(row.speed_knots || row.speed),
          course: parseFloat(row.course || row.heading),
          name: row.shipname || row.vessel_name,
          timestamp: new Date(row.timestamp || row.date),
          source: 'gfw_csv'
        });
      })
      .on('end', () => {
        console.log(`✅ Imported ${vessels.length} vessels from GFW CSV`);
        resolve(vessels);
      })
      .on('error', reject);
  });
}

/**
 * Recommended approach for Arabian Sea coverage
 */
export async function getArabianSeaCoverage() {
  const arabianSea = {
    north: 25,
    south: 5,
    east: 75,
    west: 50
  };

  console.log('🌊 Fetching Arabian Sea coverage from multiple sources...\n');

  // Try VesselFinder public (most reliable free source)
  const vesselfinderData = await scrapeVesselFinderPublic(arabianSea);

  console.log(`
📊 Arabian Sea Coverage Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━
VesselFinder: ${vesselfinderData.length} vessels

✅ Next steps:
1. Register at GFW: https://globalfishingwatch.org/our-apis/
2. Download Indian Ocean CSV from data portal
3. Import CSV using importGFWCSV()
━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  return vesselfinderData;
}
