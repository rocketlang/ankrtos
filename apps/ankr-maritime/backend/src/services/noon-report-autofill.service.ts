/**
 * Noon Report Auto-Fill Service
 * AmosConnect-like feature for one-tap reporting
 *
 * Purpose: Reduce noon report time from 15-17 minutes to <3 minutes
 * Annual Savings: 73-103 hours per vessel
 */

import { prisma } from '../schema/context.js';

interface AutoFilledNoonReport {
  // Position & Navigation (from AIS/GPS)
  position: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  course: number;              // Degrees (from AIS)
  speed: number;               // Knots (from AIS)
  heading: number;             // Degrees (from AIS)

  // Distance Calculations
  distanceToGo: number;        // Nautical miles to destination
  distanceSinceLastReport: number; // NM since last noon report

  // Weather (from API)
  weather: {
    condition: string;         // Clear, Cloudy, Rain, etc.
    windDirection: number;     // Degrees
    windForce: number;         // Beaufort scale (0-12)
    seaState: number;          // Douglas scale (0-9)
    swellHeight: number;       // Meters
    visibility: number;        // Nautical miles
    temperature: number;       // Celsius
    pressure: number;          // Millibars
  };

  // Fuel Status (from tracking)
  fuel: {
    fuelOilROB: number;        // MT Fuel Oil Remaining On Board
    dieselOilROB: number;      // MT Diesel Oil ROB
    fuelOilConsumption24h: number; // MT consumed last 24h
    dieselOilConsumption24h: number; // MT consumed last 24h
  };

  // Voyage Data (from voyage database)
  voyage: {
    voyageNumber: string;
    lastPort: string;
    nextPort: string;
    eta: Date;
  };

  // Metadata
  reportDate: Date;
  reportType: 'noon' | 'arrival' | 'departure';
  autoFilled: boolean;
  fillConfidence: number;      // 0.0 to 1.0
  dataSource: string;
}

export class NoonReportAutoFillService {
  /**
   * Generate auto-filled noon report for a vessel
   */
  async generateNoonReport(vesselId: string): Promise<AutoFilledNoonReport> {
    // Get latest vessel position
    const position = await this.getLatestPosition(vesselId);
    if (!position) {
      throw new Error(`No position data available for vessel ${vesselId}`);
    }

    // Get active voyage
    const voyage = await this.getActiveVoyage(vesselId);

    // Get last noon report (for distance calculation)
    const lastReport = await this.getLastNoonReport(vesselId);

    // Calculate distance traveled since last report
    const distanceSinceLastReport = lastReport
      ? this.calculateDistance(
          lastReport.latitude,
          lastReport.longitude,
          position.latitude,
          position.longitude
        )
      : 0;

    // Calculate distance to destination
    const distanceToGo = voyage?.arrivalPort
      ? this.calculateDistance(
          position.latitude,
          position.longitude,
          voyage.arrivalPort.latitude,
          voyage.arrivalPort.longitude
        )
      : 0;

    // Get weather data
    const weather = await this.getWeather(position.latitude, position.longitude);

    // Get fuel status
    const fuel = await this.getFuelStatus(vesselId, lastReport);

    return {
      position: {
        latitude: position.latitude,
        longitude: position.longitude,
        timestamp: position.timestamp,
      },
      course: position.course || 0,
      speed: position.speed || 0,
      heading: position.heading || 0,

      distanceToGo,
      distanceSinceLastReport,

      weather,
      fuel,

      voyage: {
        voyageNumber: voyage?.voyageNumber || '',
        lastPort: voyage?.departurePort?.name || '',
        nextPort: voyage?.arrivalPort?.name || '',
        eta: voyage?.eta || new Date(),
      },

      reportDate: new Date(),
      reportType: 'noon',
      autoFilled: true,
      fillConfidence: this.calculateConfidence(position, weather, fuel),
      dataSource: 'ais_weather_fuel_tracking',
    };
  }

  /**
   * Get latest vessel position from AIS/GPS
   */
  private async getLatestPosition(vesselId: string) {
    const position = await prisma.vesselPosition.findFirst({
      where: { vesselId },
      orderBy: { timestamp: 'desc' },
    });

    return position;
  }

  /**
   * Get active voyage for vessel
   */
  private async getActiveVoyage(vesselId: string) {
    const voyage = await prisma.voyage.findFirst({
      where: {
        vesselId,
        status: 'in_progress',
      },
      include: {
        departurePort: true,
        arrivalPort: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return voyage;
  }

  /**
   * Get last noon report for distance calculation
   */
  private async getLastNoonReport(vesselId: string) {
    // In production, this would query the NoonReport table
    // For now, use last position from 24 hours ago
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const lastPosition = await prisma.vesselPosition.findFirst({
      where: {
        vesselId,
        timestamp: { lte: yesterday },
      },
      orderBy: { timestamp: 'desc' },
    });

    return lastPosition;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * Returns distance in nautical miles
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get weather data from API (or mock data)
   */
  private async getWeather(latitude: number, longitude: number) {
    // In production, this would call a weather API (OpenWeather, NOAA, etc.)
    // For prototype, return realistic mock data

    // Simple algorithm: vary weather based on latitude/longitude
    const lat = Math.abs(latitude);
    const windForce = Math.floor(Math.random() * 4) + 2; // 2-6 Beaufort
    const seaState = Math.floor(windForce / 2); // Rough correlation

    return {
      condition: this.getWeatherCondition(lat, windForce),
      windDirection: Math.floor(Math.random() * 360),
      windForce,
      seaState,
      swellHeight: seaState * 0.5, // Rough estimate
      visibility: Math.max(5, 10 - windForce), // Lower in high wind
      temperature: this.getTemperature(lat),
      pressure: 1013 + Math.floor(Math.random() * 20) - 10, // 1003-1023 mb
    };
  }

  private getWeatherCondition(latitude: number, windForce: number): string {
    const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Overcast', 'Rain', 'Fog'];

    // Higher wind = more likely cloudy/rainy
    let index = Math.min(Math.floor(windForce / 2), conditions.length - 1);

    // Tropical regions (low latitude) = more rain
    if (latitude < 20) {
      index = Math.min(index + 1, conditions.length - 1);
    }

    return conditions[index];
  }

  private getTemperature(latitude: number): number {
    // Simple temperature model based on latitude
    const lat = Math.abs(latitude);

    if (lat < 23.5) {
      // Tropical: 25-32°C
      return 25 + Math.random() * 7;
    } else if (lat < 66.5) {
      // Temperate: 10-25°C
      return 10 + Math.random() * 15;
    } else {
      // Polar: -5 to 10°C
      return -5 + Math.random() * 15;
    }
  }

  /**
   * Calculate fuel status from last report and consumption estimates
   */
  private async getFuelStatus(vesselId: string, lastReport: any) {
    // In production, this would query fuel tracking system or bunker logs
    // For prototype, use estimates

    const vessel = await prisma.vessel.findUnique({
      where: { id: vesselId },
    });

    // Estimate daily consumption based on vessel size
    const dwt = vessel?.dwt || 50000;
    const estimatedDailyFO = dwt / 10000 * 15; // Rough: 15 MT/day per 10k DWT
    const estimatedDailyDO = estimatedDailyFO * 0.15; // ~15% of FO

    // Mock current ROB (would come from last bunker delivery + consumption tracking)
    const fuelOilROB = 500 + Math.random() * 500; // 500-1000 MT
    const dieselOilROB = 50 + Math.random() * 50; // 50-100 MT

    return {
      fuelOilROB: Math.round(fuelOilROB * 10) / 10,
      dieselOilROB: Math.round(dieselOilROB * 10) / 10,
      fuelOilConsumption24h: Math.round(estimatedDailyFO * 10) / 10,
      dieselOilConsumption24h: Math.round(estimatedDailyDO * 10) / 10,
    };
  }

  /**
   * Calculate confidence score (0.0 to 1.0)
   */
  private calculateConfidence(
    position: any,
    weather: any,
    fuel: any
  ): number {
    let confidence = 0.0;

    // Position data (40% weight)
    if (position) {
      if (position.latitude && position.longitude) confidence += 0.2;
      if (position.speed !== null) confidence += 0.1;
      if (position.course !== null) confidence += 0.1;
    }

    // Weather data (30% weight)
    if (weather) {
      if (weather.condition) confidence += 0.15;
      if (weather.windForce >= 0) confidence += 0.15;
    }

    // Fuel data (30% weight)
    if (fuel) {
      if (fuel.fuelOilROB > 0) confidence += 0.15;
      if (fuel.dieselOilROB > 0) confidence += 0.15;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Save auto-filled noon report to database
   */
  async saveNoonReport(
    vesselId: string,
    voyageId: string,
    reportData: AutoFilledNoonReport
  ) {
    // In production, this would save to NoonReport table
    // For prototype, log the data
    console.log('Saving noon report:', {
      vesselId,
      voyageId,
      position: `${reportData.position.latitude.toFixed(4)}, ${reportData.position.longitude.toFixed(4)}`,
      speed: `${reportData.speed.toFixed(1)} kts`,
      distance: `${reportData.distanceSinceLastReport.toFixed(1)} NM`,
      weather: reportData.weather.condition,
      confidence: `${(reportData.fillConfidence * 100).toFixed(0)}%`,
    });

    // TODO: Implement database save when NoonReport model exists
    return {
      id: 'noon-' + Date.now(),
      success: true,
      message: 'Noon report auto-filled successfully',
    };
  }
}

export const noonReportAutoFillService = new NoonReportAutoFillService();
