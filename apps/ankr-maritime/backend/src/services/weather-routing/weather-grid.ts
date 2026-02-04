/**
 * Weather Grid System
 * Phase 5: TIER 2 - Weather Routing Engine
 *
 * Features:
 * - Weather data grid (lat/lon mesh)
 * - Wind/wave interpolation
 * - Forecast timeline (24h, 48h, 72h)
 * - Adverse weather detection
 */

import { weatherAPIClient as weatherApiClient } from '../ml/weather-api-client.js';

export interface WeatherGridPoint {
  lat: number;
  lon: number;
  timestamp: Date;
  windSpeed: number;
  windDirection: number;
  waveHeight: number;
  seaState: string;
  visibility: number;
  weatherCode: number;
  severity: 'calm' | 'moderate' | 'rough' | 'severe';
}

export interface WeatherGrid {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  resolution: number; // degrees (e.g., 0.5 = 30 nautical miles)
  timestamp: Date;
  forecastHours: number;
  points: WeatherGridPoint[];
}

export interface RouteWeatherForecast {
  route: Array<{ lat: number; lon: number }>;
  forecasts: WeatherGridPoint[][];
  maxWindSpeed: number;
  maxWaveHeight: number;
  adverseWeather: AdverseWeatherAlert[];
}

export interface AdverseWeatherAlert {
  location: { lat: number; lon: number };
  timestamp: Date;
  type: 'high_wind' | 'high_waves' | 'storm' | 'fog' | 'ice';
  severity: 'moderate' | 'severe' | 'extreme';
  description: string;
  recommendation: string;
}

class WeatherGridSystem {
  private cache = new Map<string, { data: WeatherGrid; expiry: Date }>();
  private cacheLifetime = 6 * 60 * 60 * 1000; // 6 hours

  /**
   * Create weather grid for a geographic area
   */
  async createGrid(
    bounds: { north: number; south: number; east: number; west: number },
    resolution: number = 0.5, // 0.5 degrees ≈ 30 nautical miles
    forecastHours: number = 72
  ): Promise<WeatherGrid> {
    const cacheKey = `${bounds.north},${bounds.south},${bounds.east},${bounds.west},${resolution},${forecastHours}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > new Date()) {
      console.log('📦 Weather grid from cache');
      return cached.data;
    }

    console.log(`🌊 Creating weather grid (${resolution}° resolution)...`);

    const points: WeatherGridPoint[] = [];

    // Generate grid points
    for (let lat = bounds.south; lat <= bounds.north; lat += resolution) {
      for (let lon = bounds.west; lon <= bounds.east; lon += resolution) {
        try {
          // Fetch weather for this grid point
          const weather = await weatherApiClient.getPointWeather(lat, lon);

          const point: WeatherGridPoint = {
            lat,
            lon,
            timestamp: new Date(),
            windSpeed: weather.windSpeed,
            windDirection: weather.windDirection,
            waveHeight: weather.waveHeight,
            seaState: this.classifySeaState(weather.waveHeight),
            visibility: weather.visibility,
            weatherCode: weather.code,
            severity: this.calculateSeverity(weather.windSpeed, weather.waveHeight),
          };

          points.push(point);
        } catch (error) {
          console.warn(`Failed to fetch weather for (${lat}, ${lon}):`, error);
          // Add default point to avoid gaps
          points.push({
            lat,
            lon,
            timestamp: new Date(),
            windSpeed: 0,
            windDirection: 0,
            waveHeight: 0,
            seaState: 'calm',
            visibility: 10,
            weatherCode: 0,
            severity: 'calm',
          });
        }
      }
    }

    const grid: WeatherGrid = {
      bounds,
      resolution,
      timestamp: new Date(),
      forecastHours,
      points,
    };

    // Cache the grid
    this.cache.set(cacheKey, {
      data: grid,
      expiry: new Date(Date.now() + this.cacheLifetime),
    });

    console.log(`✅ Weather grid created with ${points.length} points`);

    return grid;
  }

  /**
   * Get weather along a route with forecast timeline
   */
  async getRouteWeatherForecast(
    route: Array<{ lat: number; lon: number }>,
    forecastIntervals: number[] = [0, 24, 48, 72] // hours
  ): Promise<RouteWeatherForecast> {
    console.log(`🌦️  Fetching weather forecast for route (${route.length} waypoints)...`);

    const forecasts: WeatherGridPoint[][] = [];
    let maxWindSpeed = 0;
    let maxWaveHeight = 0;
    const adverseWeather: AdverseWeatherAlert[] = [];

    // For each forecast interval
    for (const hours of forecastIntervals) {
      const intervalForecasts: WeatherGridPoint[] = [];

      // For each waypoint
      for (const waypoint of route) {
        try {
          const weather = await weatherApiClient.getPointWeather(waypoint.lat, waypoint.lon);

          const point: WeatherGridPoint = {
            lat: waypoint.lat,
            lon: waypoint.lon,
            timestamp: new Date(Date.now() + hours * 60 * 60 * 1000),
            windSpeed: weather.windSpeed,
            windDirection: weather.windDirection,
            waveHeight: weather.waveHeight,
            seaState: this.classifySeaState(weather.waveHeight),
            visibility: weather.visibility,
            weatherCode: weather.code,
            severity: this.calculateSeverity(weather.windSpeed, weather.waveHeight),
          };

          intervalForecasts.push(point);

          // Track maximums
          if (weather.windSpeed > maxWindSpeed) maxWindSpeed = weather.windSpeed;
          if (weather.waveHeight > maxWaveHeight) maxWaveHeight = weather.waveHeight;

          // Detect adverse weather
          if (point.severity === 'severe' || point.severity === 'rough') {
            adverseWeather.push({
              location: { lat: waypoint.lat, lon: waypoint.lon },
              timestamp: point.timestamp,
              type: this.detectWeatherType(weather),
              severity: point.severity === 'severe' ? 'severe' : 'moderate',
              description: `${point.seaState} seas with ${point.windSpeed.toFixed(1)} kt winds`,
              recommendation: this.getWeatherRecommendation(point.severity, weather.windSpeed),
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch weather for waypoint (${waypoint.lat}, ${waypoint.lon}):`, error);
        }
      }

      forecasts.push(intervalForecasts);
    }

    console.log(`✅ Route forecast complete: max wind ${maxWindSpeed.toFixed(1)} kt, max waves ${maxWaveHeight.toFixed(1)}m`);

    return {
      route,
      forecasts,
      maxWindSpeed,
      maxWaveHeight,
      adverseWeather,
    };
  }

  /**
   * Interpolate weather at a specific point from grid
   */
  interpolateWeather(grid: WeatherGrid, lat: number, lon: number): WeatherGridPoint | null {
    // Find 4 nearest grid points
    const nearbyPoints = grid.points
      .map((p) => ({
        point: p,
        distance: this.calculateDistance(lat, lon, p.lat, p.lon),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4);

    if (nearbyPoints.length === 0) return null;

    // Inverse distance weighting interpolation
    let totalWeight = 0;
    let weightedWindSpeed = 0;
    let weightedWindDirection = 0;
    let weightedWaveHeight = 0;
    let weightedVisibility = 0;

    nearbyPoints.forEach(({ point, distance }) => {
      const weight = distance === 0 ? 1 : 1 / (distance * distance);
      totalWeight += weight;

      weightedWindSpeed += point.windSpeed * weight;
      weightedWindDirection += point.windDirection * weight;
      weightedWaveHeight += point.waveHeight * weight;
      weightedVisibility += point.visibility * weight;
    });

    const interpolated: WeatherGridPoint = {
      lat,
      lon,
      timestamp: grid.timestamp,
      windSpeed: weightedWindSpeed / totalWeight,
      windDirection: weightedWindDirection / totalWeight,
      waveHeight: weightedWaveHeight / totalWeight,
      seaState: this.classifySeaState(weightedWaveHeight / totalWeight),
      visibility: weightedVisibility / totalWeight,
      weatherCode: nearbyPoints[0].point.weatherCode, // Use nearest
      severity: this.calculateSeverity(
        weightedWindSpeed / totalWeight,
        weightedWaveHeight / totalWeight
      ),
    };

    return interpolated;
  }

  /**
   * Classify sea state from wave height
   */
  private classifySeaState(waveHeight: number): string {
    if (waveHeight < 0.1) return 'calm';
    if (waveHeight < 0.5) return 'smooth';
    if (waveHeight < 1.25) return 'slight';
    if (waveHeight < 2.5) return 'moderate';
    if (waveHeight < 4) return 'rough';
    if (waveHeight < 6) return 'very rough';
    if (waveHeight < 9) return 'high';
    if (waveHeight < 14) return 'very high';
    return 'phenomenal';
  }

  /**
   * Calculate weather severity
   */
  private calculateSeverity(windSpeed: number, waveHeight: number): 'calm' | 'moderate' | 'rough' | 'severe' {
    // Combined wind and wave assessment
    if (windSpeed > 50 || waveHeight > 9) return 'severe';
    if (windSpeed > 34 || waveHeight > 6) return 'rough';
    if (windSpeed > 20 || waveHeight > 2.5) return 'moderate';
    return 'calm';
  }

  /**
   * Detect weather type from conditions
   */
  private detectWeatherType(
    weather: any
  ): 'high_wind' | 'high_waves' | 'storm' | 'fog' | 'ice' {
    if (weather.windSpeed > 50) return 'storm';
    if (weather.windSpeed > 34) return 'high_wind';
    if (weather.waveHeight > 6) return 'high_waves';
    if (weather.visibility < 2) return 'fog';
    return 'high_wind'; // default
  }

  /**
   * Get weather recommendation
   */
  private getWeatherRecommendation(severity: string, windSpeed: number): string {
    if (severity === 'severe') {
      return 'AVOID: Severe weather conditions. Consider alternative route or delay departure.';
    }
    if (severity === 'rough') {
      return 'CAUTION: Rough conditions. Reduce speed and monitor closely.';
    }
    if (severity === 'moderate') {
      return 'MONITOR: Moderate conditions. Normal operations with vigilance.';
    }
    return 'NORMAL: Favorable conditions for navigation.';
  }

  /**
   * Calculate distance between two points (Haversine)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3440.065; // Earth radius in nautical miles
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Clear cache (for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️  Weather grid cache cleared');
  }
}

export const weatherGridSystem = new WeatherGridSystem();
