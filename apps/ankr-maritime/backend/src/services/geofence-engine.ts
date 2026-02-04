/**
 * Geofence Calculation Engine
 *
 * Pure business-logic module for geospatial geofence calculations.
 * Provides Haversine distance, point-in-circle, point-in-polygon (ray casting),
 * ETA estimation, and geofence event detection for vessel tracking.
 */

const EARTH_RADIUS_NM = 3440.065

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate the great-circle distance between two points using the Haversine formula.
 * @param lat1 - Latitude of point 1 in decimal degrees
 * @param lon1 - Longitude of point 1 in decimal degrees
 * @param lat2 - Latitude of point 2 in decimal degrees
 * @param lon2 - Longitude of point 2 in decimal degrees
 * @returns Distance in nautical miles
 */
export function haversineDistanceNm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_NM * c
}

/**
 * Determine whether a point falls within a circle defined by center + radius.
 * Uses the Haversine formula to compute the great-circle distance.
 * @param pointLat - Latitude of the test point
 * @param pointLon - Longitude of the test point
 * @param centerLat - Latitude of the circle center
 * @param centerLon - Longitude of the circle center
 * @param radiusNm - Radius of the circle in nautical miles
 * @returns true if the point is within (or on) the circle boundary
 */
export function isPointInCircle(
  pointLat: number,
  pointLon: number,
  centerLat: number,
  centerLon: number,
  radiusNm: number
): boolean {
  const distance = haversineDistanceNm(pointLat, pointLon, centerLat, centerLon)
  return distance <= radiusNm
}

/**
 * Determine whether a point lies inside a polygon using the ray-casting algorithm.
 * A ray is cast from the test point to the right (+x direction). The number of
 * polygon edge crossings determines inside/outside status (odd = inside).
 * @param pointLat - Latitude of the test point
 * @param pointLon - Longitude of the test point
 * @param polygon - Array of vertices (lat/lon) defining the polygon; last vertex is implicitly connected to the first
 * @returns true if the point is inside the polygon
 */
export function isPointInPolygon(
  pointLat: number,
  pointLon: number,
  polygon: { lat: number; lon: number }[]
): boolean {
  if (polygon.length < 3) {
    return false
  }

  let inside = false
  const n = polygon.length

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const yi = polygon[i].lat
    const xi = polygon[i].lon
    const yj = polygon[j].lat
    const xj = polygon[j].lon

    const intersects =
      yi > pointLat !== yj > pointLat &&
      pointLon < ((xj - xi) * (pointLat - yi)) / (yj - yi) + xi

    if (intersects) {
      inside = !inside
    }
  }

  return inside
}

/**
 * Check whether a vessel position falls inside a geofence.
 * Dispatches to circle or polygon check based on the fence type.
 * @param vessel - Current vessel position
 * @param fence - Geofence definition (circle or polygon)
 * @returns true if the vessel is within the geofence
 */
export function checkVesselInGeofence(
  vessel: { lat: number; lon: number },
  fence: {
    fenceType: string
    centerLat: number
    centerLon: number
    radiusNm: number
    polygonCoords?: { lat: number; lon: number }[]
  }
): boolean {
  if (fence.fenceType === 'polygon' && fence.polygonCoords && fence.polygonCoords.length >= 3) {
    return isPointInPolygon(vessel.lat, vessel.lon, fence.polygonCoords)
  }

  // Default to circle geofence
  return isPointInCircle(
    vessel.lat,
    vessel.lon,
    fence.centerLat,
    fence.centerLon,
    fence.radiusNm
  )
}

/**
 * Calculate the estimated time of arrival from one point to another at a given speed.
 * @param currentLat - Current latitude
 * @param currentLon - Current longitude
 * @param destLat - Destination latitude
 * @param destLon - Destination longitude
 * @param speedKnots - Vessel speed in knots (nautical miles per hour)
 * @returns Object containing distance, ETA in hours, and projected arrival Date
 */
export function calculateETA(
  currentLat: number,
  currentLon: number,
  destLat: number,
  destLon: number,
  speedKnots: number
): { distanceNm: number; etaHours: number; etaDate: Date } {
  const distanceNm = haversineDistanceNm(currentLat, currentLon, destLat, destLon)

  if (speedKnots <= 0) {
    return {
      distanceNm,
      etaHours: Infinity,
      etaDate: new Date(8640000000000000) // max date
    }
  }

  const etaHours = distanceNm / speedKnots
  const etaDate = new Date(Date.now() + etaHours * 3600 * 1000)

  return { distanceNm, etaHours, etaDate }
}

/**
 * Detect geofence entry and exit events by comparing a vessel's current position
 * against its previous position for a set of geofences.
 *
 * Logic:
 * - If the vessel is now inside a fence but was previously outside (or had no previous
 *   position), an "entry" event is emitted when alertOnEntry is true.
 * - If the vessel is now outside a fence but was previously inside, an "exit" event
 *   is emitted when alertOnExit is true.
 *
 * @param vesselId - Identifier of the vessel (included for context; not used in calc)
 * @param currentPos - Current lat/lon of the vessel
 * @param previousPos - Previous lat/lon of the vessel, or null if first report
 * @param fences - Array of geofence definitions with alert preferences
 * @returns Array of geofence events (entry/exit) detected in this position update
 */
export function detectGeofenceEvents(
  vesselId: string,
  currentPos: { lat: number; lon: number },
  previousPos: { lat: number; lon: number } | null,
  fences: Array<{
    id: string
    fenceType: string
    centerLat: number
    centerLon: number
    radiusNm: number
    polygonCoords?: { lat: number; lon: number }[]
    alertOnEntry: boolean
    alertOnExit: boolean
  }>
): Array<{ geofenceId: string; eventType: 'entry' | 'exit' }> {
  const events: Array<{ geofenceId: string; eventType: 'entry' | 'exit' }> = []

  for (const fence of fences) {
    const isCurrentlyInside = checkVesselInGeofence(currentPos, fence)

    const wasPreviouslyInside =
      previousPos !== null ? checkVesselInGeofence(previousPos, fence) : false

    // Entry: was outside (or no previous pos), now inside
    if (isCurrentlyInside && !wasPreviouslyInside && fence.alertOnEntry) {
      events.push({ geofenceId: fence.id, eventType: 'entry' })
    }

    // Exit: was inside, now outside
    if (!isCurrentlyInside && wasPreviouslyInside && fence.alertOnExit) {
      events.push({ geofenceId: fence.id, eventType: 'exit' })
    }
  }

  return events
}
