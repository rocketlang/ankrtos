// eca-zone-checker.ts
// ECA / High-Risk Zone geometry service.
// Pure functions for detecting whether vessel positions or route segments
// intersect Emission Control Areas and other restricted maritime zones.
// No DB or Prisma dependency.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface ZonePolygon {
  id: string;
  name: string;
  code: string;
  /** Array of [lat, lon] coordinate pairs defining the polygon boundary. */
  polygon: [number, number][];
}

export interface RouteZoneIntersection {
  zone: ZonePolygon;
  entryPoint: GeoPoint;
  exitPoint: GeoPoint;
  segmentIndex: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EARTH_RADIUS_NM = 3440.065;

// ---------------------------------------------------------------------------
// Default ECA Zone Polygons (approximate but realistic boundaries)
// ---------------------------------------------------------------------------

/**
 * Pre-defined polygon data for the major Emission Control Areas.
 * Coordinates are [lat, lon] pairs forming closed polygons.
 * These are simplified approximations suitable for route-level checks;
 * for official compliance, use IMO / flag-state published coordinates.
 */
export const ECA_ZONES_DEFAULT: ZonePolygon[] = [
  {
    id: 'eca-baltic-seca',
    name: 'Baltic Sea SECA',
    code: 'BALTIC_SECA',
    polygon: [
      [53.5, 9.0],    // Kiel, Germany
      [54.5, 10.0],   // Fehmarn Belt
      [55.0, 12.5],   // Southern Sweden
      [55.5, 13.0],   // Malmo approach
      [56.0, 12.5],   // Oresund north
      [57.7, 11.8],   // Gothenburg approach
      [58.0, 11.0],   // Skagerrak south
      [57.5, 8.0],    // Jutland west coast
      [59.0, 10.5],   // Oslo Fjord
      [60.5, 19.0],   // Aland Sea
      [65.0, 25.0],   // Gulf of Bothnia north
      [64.0, 21.0],   // Kvarken
      [60.0, 26.5],   // Gulf of Finland east
      [59.5, 28.0],   // Near St. Petersburg
      [59.0, 24.0],   // Tallinn
      [57.5, 20.0],   // Gotland east
      [56.0, 19.5],   // South of Gotland
      [55.0, 17.0],   // Bornholm area
      [54.0, 14.0],   // Pomeranian Bay
      [53.5, 14.5],   // Szczecin approach
      [53.5, 9.0],    // Close polygon back to Kiel
    ],
  },
  {
    id: 'eca-north-sea-seca',
    name: 'North Sea SECA',
    code: 'NORTH_SEA_SECA',
    polygon: [
      [48.5, -5.0],   // Brest, France
      [49.0, -2.0],   // Channel Islands
      [50.5, -1.5],   // Isle of Wight
      [51.0, 1.5],    // Dover Strait
      [51.5, 3.5],    // Belgian coast
      [53.5, 6.5],    // German Bight
      [55.0, 8.0],    // Danish west coast
      [57.5, 8.0],    // Jutland north
      [58.0, 11.0],   // Skagerrak
      [62.0, 5.0],    // Norwegian coast (Alesund)
      [62.0, -1.0],   // North Sea offshore
      [60.5, -1.5],   // Shetland
      [58.0, -5.0],   // Pentland Firth
      [56.0, -6.0],   // Scottish west coast
      [54.0, -6.0],   // Irish Sea north
      [51.5, -6.0],   // Irish Sea south
      [50.0, -6.0],   // Cornwall
      [48.5, -5.0],   // Close polygon
    ],
  },
  {
    id: 'eca-north-america',
    name: 'North American ECA',
    code: 'NA_ECA',
    polygon: [
      // US East Coast + Canada Atlantic + Gulf of Mexico (200nm offshore approx)
      [30.0, -81.5],  // Jacksonville, FL
      [32.0, -79.0],  // Charleston, SC
      [34.5, -75.5],  // Cape Hatteras, NC
      [37.0, -74.5],  // Virginia Beach, VA
      [39.5, -73.0],  // Atlantic City, NJ
      [40.5, -72.5],  // Long Island, NY
      [41.5, -69.5],  // Cape Cod, MA
      [43.5, -67.0],  // Maine coast
      [45.0, -64.5],  // Bay of Fundy
      [47.0, -60.0],  // Cape Breton, NS
      [49.0, -58.0],  // Newfoundland south
      [51.0, -56.0],  // Newfoundland east
      [51.0, -52.0],  // 200nm offshore
      [47.0, -55.0],  // Offshore NS
      [43.5, -62.0],  // Offshore Maine
      [40.0, -67.5],  // Offshore NJ
      [36.0, -70.0],  // Offshore Virginia
      [32.0, -74.0],  // Offshore Carolinas
      [28.0, -77.0],  // Offshore Florida east
      [25.0, -79.5],  // Florida Keys east
      [24.5, -82.0],  // Florida Keys south
      [25.5, -84.0],  // Gulf of Mexico - FL west
      [27.5, -84.5],  // Tampa approach
      [29.0, -85.0],  // Florida panhandle
      [30.0, -88.0],  // Mobile, AL
      [29.5, -91.0],  // Louisiana coast
      [28.5, -93.5],  // Texas-Louisiana border
      [27.5, -96.5],  // Corpus Christi, TX
      [26.0, -97.0],  // Brownsville, TX (southern limit)
      [25.0, -97.5],  // 200nm boundary south
      [25.0, -93.0],  // 200nm offshore Gulf
      [25.5, -87.0],  // 200nm offshore Gulf central
      [24.0, -83.0],  // 200nm south of Keys
      [24.0, -80.0],  // 200nm east of Keys
      [28.0, -79.0],  // Offshore Florida east
      [30.0, -81.5],  // Close polygon
    ],
  },
  {
    id: 'eca-us-caribbean',
    name: 'US Caribbean ECA',
    code: 'USCAR_ECA',
    polygon: [
      // Puerto Rico and US Virgin Islands (200nm offshore)
      [20.0, -68.0],  // East of USVI
      [19.5, -67.0],  // Southeast of PR
      [18.0, -65.0],  // South of USVI
      [17.5, -66.0],  // South of PR
      [17.5, -68.0],  // Southwest of PR
      [18.0, -68.5],  // Mona Passage south
      [18.5, -68.5],  // West of PR
      [19.0, -68.5],  // Northwest of PR
      [19.5, -67.5],  // North of PR
      [20.0, -66.5],  // North offshore
      [20.0, -65.0],  // Northeast offshore
      [20.0, -64.0],  // East offshore
      [19.0, -63.5],  // Southeast offshore
      [17.5, -64.0],  // South offshore USVI
      [17.0, -65.5],  // South offshore
      [17.0, -67.0],  // South offshore PR
      [17.0, -69.0],  // Southwest offshore
      [18.0, -69.5],  // West offshore
      [19.5, -69.0],  // Northwest offshore
      [20.0, -68.0],  // Close polygon
    ],
  },
  {
    id: 'eca-mediterranean-seca',
    name: 'Mediterranean SECA (2025+)',
    code: 'MED_SECA',
    polygon: [
      // Entire Mediterranean basin (simplified outline)
      [36.0, -5.5],   // Gibraltar
      [36.5, -2.0],   // Almeria, Spain
      [38.0, 0.0],    // Valencia coast
      [41.0, 1.5],    // Barcelona
      [43.0, 3.5],    // Marseille
      [43.5, 7.5],    // Nice / Monaco
      [44.0, 9.5],    // Genoa
      [42.0, 11.5],   // West coast Italy
      [41.0, 13.0],   // Naples approach
      [38.0, 15.5],   // Strait of Messina
      [37.0, 15.5],   // Sicily east
      [36.5, 14.5],   // Sicily south
      [35.5, 12.5],   // Malta Channel
      [33.0, 11.5],   // Gulf of Gabes, Tunisia
      [32.5, 13.0],   // Tripoli approach
      [32.0, 20.0],   // Benghazi area
      [31.5, 25.0],   // Libya-Egypt border
      [31.0, 29.5],   // Alexandria, Egypt
      [31.5, 32.5],   // Port Said approach
      [33.0, 35.5],   // Levant coast (Lebanon)
      [35.0, 36.0],   // Turkey south coast
      [36.5, 35.0],   // Iskenderun, Turkey
      [37.0, 30.0],   // Antalya, Turkey
      [37.0, 27.5],   // Aegean south (Rhodes)
      [38.0, 24.0],   // Aegean central
      [40.0, 25.0],   // Dardanelles approach
      [40.5, 27.0],   // Sea of Marmara
      [39.5, 23.5],   // Thessaloniki approach
      [38.5, 20.0],   // Ionian Sea
      [40.0, 19.0],   // Albania coast
      [42.5, 18.0],   // Dubrovnik
      [44.5, 14.0],   // Rijeka / northern Adriatic
      [45.5, 13.5],   // Trieste
      [44.5, 12.5],   // Venice / Ravenna
      [42.0, 16.5],   // Bari area
      [40.0, 18.5],   // Otranto strait
      [39.0, 17.0],   // Calabria
      [38.5, 16.0],   // Toe of Italy
      [37.5, 13.0],   // Sicily west
      [37.5, 10.0],   // Tunis approach
      [37.0, 8.0],    // Algeria east
      [36.5, 3.0],    // Algiers
      [35.5, -1.0],   // Morocco / Algeria border
      [35.5, -5.0],   // Tangier
      [36.0, -5.5],   // Close polygon at Gibraltar
    ],
  },
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Haversine distance between two points in nautical miles.
 */
function haversineDistanceNm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);

  const sinHalfDLat = Math.sin(dLat / 2);
  const sinHalfDLon = Math.sin(dLon / 2);

  const h =
    sinHalfDLat * sinHalfDLat +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) *
    sinHalfDLon * sinHalfDLon;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_NM * c;
}

/**
 * Linear interpolation between two GeoPoints by fraction t in [0, 1].
 */
function interpolatePoint(a: GeoPoint, b: GeoPoint, t: number): GeoPoint {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lon: a.lon + (b.lon - a.lon) * t,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Determine whether a point lies inside a polygon using the ray-casting algorithm.
 *
 * A ray is cast from the test point in the +lon direction. Each polygon edge
 * crossing toggles the inside/outside state. An odd number of crossings means
 * the point is inside.
 *
 * @param point - The geographic point to test
 * @param polygon - Array of [lat, lon] vertices defining the polygon; the last
 *                  vertex is implicitly connected to the first
 * @returns true if the point is inside the polygon
 */
export function isPointInPolygon(
  point: GeoPoint,
  polygon: [number, number][],
): boolean {
  if (polygon.length < 3) {
    return false;
  }

  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const yi = polygon[i][0]; // lat
    const xi = polygon[i][1]; // lon
    const yj = polygon[j][0];
    const xj = polygon[j][1];

    const intersects =
      (yi > point.lat) !== (yj > point.lat) &&
      point.lon < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Find all zones that contain the given point.
 *
 * @param point - The geographic point to test
 * @param zones - Array of zone polygons to check against
 * @returns Array of matching ZonePolygon objects
 */
export function findMatchingZones(
  point: GeoPoint,
  zones: ZonePolygon[],
): ZonePolygon[] {
  return zones.filter((zone) => isPointInPolygon(point, zone.polygon));
}

/**
 * Check which zones a route (defined by an ordered list of waypoints) passes
 * through. For each zone intersection, the entry point, exit point, and the
 * segment index where entry occurred are returned.
 *
 * The algorithm walks each segment, sampling at small increments to detect
 * transitions into and out of each zone. A finer sampling step yields more
 * accurate entry/exit points at the cost of performance.
 *
 * @param waypoints - Ordered array of route waypoints
 * @param zones - Array of zone polygons to check against
 * @returns Array of zone intersection records
 */
export function checkRouteZones(
  waypoints: GeoPoint[],
  zones: ZonePolygon[],
): RouteZoneIntersection[] {
  if (waypoints.length < 2) {
    return [];
  }

  const results: RouteZoneIntersection[] = [];
  const SAMPLE_STEPS = 50; // sub-divisions per segment

  for (const zone of zones) {
    let insideZone = isPointInPolygon(waypoints[0], zone.polygon);
    let entryPoint: GeoPoint | null = insideZone ? waypoints[0] : null;
    let entrySegmentIndex: number = insideZone ? 0 : -1;

    for (let seg = 0; seg < waypoints.length - 1; seg++) {
      const segStart = waypoints[seg];
      const segEnd = waypoints[seg + 1];

      for (let step = 1; step <= SAMPLE_STEPS; step++) {
        const t = step / SAMPLE_STEPS;
        const samplePoint = interpolatePoint(segStart, segEnd, t);
        const nowInside = isPointInPolygon(samplePoint, zone.polygon);

        if (!insideZone && nowInside) {
          // Entering the zone
          entryPoint = samplePoint;
          entrySegmentIndex = seg;
          insideZone = true;
        } else if (insideZone && !nowInside) {
          // Exiting the zone
          results.push({
            zone,
            entryPoint: entryPoint!,
            exitPoint: samplePoint,
            segmentIndex: entrySegmentIndex,
          });
          entryPoint = null;
          insideZone = false;
        }
      }
    }

    // If the route ends while still inside the zone, use the last waypoint as exit
    if (insideZone && entryPoint) {
      results.push({
        zone,
        entryPoint,
        exitPoint: waypoints[waypoints.length - 1],
        segmentIndex: entrySegmentIndex,
      });
    }
  }

  return results;
}

/**
 * Calculate the total distance (in nautical miles) that a route spends within
 * a given polygon zone. Uses the Haversine formula for great-circle segment
 * distances and samples each segment to determine which portions fall inside.
 *
 * @param waypoints - Ordered array of route waypoints
 * @param polygon - The zone polygon boundary as [lat, lon] pairs
 * @returns Distance in nautical miles spent within the zone
 */
export function calculateDistanceInZone(
  waypoints: GeoPoint[],
  polygon: [number, number][],
): number {
  if (waypoints.length < 2) {
    return 0;
  }

  const SAMPLE_STEPS = 100; // higher resolution for distance calc
  let totalDistanceNm = 0;

  for (let seg = 0; seg < waypoints.length - 1; seg++) {
    const segStart = waypoints[seg];
    const segEnd = waypoints[seg + 1];

    let prevPoint = segStart;
    let prevInside = isPointInPolygon(segStart, polygon);

    for (let step = 1; step <= SAMPLE_STEPS; step++) {
      const t = step / SAMPLE_STEPS;
      const currentPoint = interpolatePoint(segStart, segEnd, t);
      const currentInside = isPointInPolygon(currentPoint, polygon);

      // Count distance for sub-segments where both endpoints are inside,
      // or approximate half the distance when crossing a boundary.
      if (prevInside && currentInside) {
        totalDistanceNm += haversineDistanceNm(prevPoint, currentPoint);
      } else if (prevInside || currentInside) {
        // Boundary crossing: approximate by counting half the sub-segment
        totalDistanceNm += haversineDistanceNm(prevPoint, currentPoint) / 2;
      }

      prevPoint = currentPoint;
      prevInside = currentInside;
    }
  }

  return Math.round(totalDistanceNm * 100) / 100;
}
