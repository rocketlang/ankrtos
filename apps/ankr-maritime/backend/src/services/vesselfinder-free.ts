/**
 * VesselFinder FREE Public Data
 * No registration needed - works immediately!
 *
 * Coverage: Global (including Arabian Sea)
 * Limitations: Rate limited, public data only
 */

export async function getVesselFinderPublicData(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}) {
  try {
    // VesselFinder public vessels-on-map endpoint
    const url = 'https://www.vesselfinder.com/api/pub/vesselsonmap';

    const params = new URLSearchParams({
      bbox: `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`,
      zoom: '7',
      mmsi: '0',
      show_names: '1',
      Fleet: '',
      vtypes: '0'
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Mari8x/1.0)',
        'Accept': '*/*',
        'Referer': 'https://www.vesselfinder.com/'
      }
    });

    if (!response.ok) {
      console.error(`VesselFinder error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    // Parse VesselFinder format: [MMSI, LAT, LON, SPEED, COURSE, HEADING, TIMESTAMP, SHIPNAME, SHIPTYPE, ...]
    const vessels = data.map((v: any) => ({
      mmsi: v[0]?.toString(),
      lat: v[1],
      lon: v[2],
      speed: v[3],
      course: v[4],
      heading: v[5],
      timestamp: new Date(v[6] * 1000), // Unix timestamp
      name: v[7] || `Vessel ${v[0]}`,
      type: v[8],
      source: 'vesselfinder_public'
    })).filter((v: any) => v.mmsi && v.lat && v.lon);

    console.log(`✅ VesselFinder: ${vessels.length} vessels found`);
    return vessels;

  } catch (error) {
    console.error('VesselFinder API failed:', error);
    return [];
  }
}

/**
 * Test Arabian Sea coverage RIGHT NOW
 */
export async function testArabianSeaVesselFinder() {
  console.log('🌊 Testing Arabian Sea coverage with VesselFinder...\n');

  const arabianSea = {
    north: 25,    // Pakistan
    south: 5,     // Lakshadweep
    east: 75,     // Indian coast
    west: 50      // Oman
  };

  const vessels = await getVesselFinderPublicData(arabianSea);

  console.log(`
📊 Arabian Sea Coverage (VesselFinder):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total vessels: ${vessels.length}

Sample vessels:
${vessels.slice(0, 5).map(v =>
  `  • ${v.name} (${v.mmsi}) - ${v.lat.toFixed(2)},${v.lon.toFixed(2)} @ ${v.speed}kts`
).join('\n')}

✅ Arabian Sea is ${vessels.length > 0 ? 'NOW VISIBLE' : 'still empty (try larger area)'}!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  return vessels;
}
