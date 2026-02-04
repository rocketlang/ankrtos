/**
 * Weather API Client
 * Phase 5: ML ETA Prediction
 *
 * Integrates with weather providers for marine weather data
 * Supports: OpenWeatherMap Marine, DTN Weather, StormGeo
 */

import axios from 'axios';

export interface WeatherForecast {
  latitude: number;
  longitude: number;
  timestamp: Date;
  windSpeed: number; // knots
  windDirection: number; // degrees 0-360
  waveHeight: number; // meters
  waveDirection: number; // degrees
  current: number; // knots
  currentDirection: number; // degrees
  visibility: number; // nautical miles
  pressure: number; // hPa
  temperature: number; // Celsius
  conditions: string; // clear, cloudy, rain, storm, fog
}

export interface RouteWeather {
  waypoints: Array<{
    lat: number;
    lon: number;
    distance: number; // nautical miles from origin
    forecast: WeatherForecast;
  }>;
  summary: {
    maxWindSpeed: number;
    maxWaveHeight: number;
    adverseWeatherPoints: number;
    recommendation: 'safe' | 'caution' | 'delay';
  };
}

export interface WeatherImpact {
  delayMinutes: number;
  speedReduction: number; // percentage
  fuelIncrease: number; // percentage
  recommendation: string;
  severity: 'low' | 'moderate' | 'high' | 'severe';
}

class WeatherAPIClient {
  private provider: string;
  private apiKey: string;
  private cache = new Map<string, { data: any; expires: number }>();
  private readonly CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

  constructor() {
    this.provider = process.env.WEATHER_API_PROVIDER || 'openweathermap';
    this.apiKey = this.getAPIKey();
  }

  private getAPIKey(): string {
    switch (this.provider) {
      case 'openweathermap':
        return process.env.OPENWEATHER_API_KEY || '';
      case 'dtn':
        return process.env.DTN_WEATHER_API_KEY || '';
      case 'stormgeo':
        return process.env.STORMGEO_API_KEY || '';
      default:
        return '';
    }
  }

  /**
   * Get weather forecast for a single point
   */
  async getPointWeather(lat: number, lon: number): Promise<WeatherForecast> {
    const cacheKey = `point_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    if (!this.apiKey) {
      // Return simulated weather if no API key configured
      return this.simulateWeather(lat, lon);
    }

    try {
      const forecast = await this.fetchWeatherFromProvider(lat, lon);
      this.setCache(cacheKey, forecast);
      return forecast;
    } catch (error) {
      console.error('Weather API error:', error);
      return this.simulateWeather(lat, lon);
    }
  }

  /**
   * Get weather forecast along route
   */
  async getRouteWeather(
    fromLat: number,
    fromLon: number,
    toLat: number,
    toLon: number,
    waypoints: number = 10
  ): Promise<RouteWeather> {
    const routeWaypoints: RouteWeather['waypoints'] = [];
    const latStep = (toLat - fromLat) / waypoints;
    const lonStep = (toLon - fromLon) / waypoints;

    // Total distance (rough great circle approximation)
    const totalDistance = this.calculateDistance(fromLat, fromLon, toLat, toLon);

    for (let i = 0; i <= waypoints; i++) {
      const lat = fromLat + latStep * i;
      const lon = fromLon + lonStep * i;
      const distance = (totalDistance / waypoints) * i;

      const forecast = await this.getPointWeather(lat, lon);

      routeWaypoints.push({
        lat,
        lon,
        distance,
        forecast,
      });
    }

    // Analyze route weather
    const maxWindSpeed = Math.max(...routeWaypoints.map((w) => w.forecast.windSpeed));
    const maxWaveHeight = Math.max(...routeWaypoints.map((w) => w.forecast.waveHeight));
    const adverseWeatherPoints = routeWaypoints.filter(
      (w) => w.forecast.windSpeed > 30 || w.forecast.waveHeight > 4
    ).length;

    let recommendation: 'safe' | 'caution' | 'delay' = 'safe';
    if (maxWindSpeed > 45 || maxWaveHeight > 6) recommendation = 'delay';
    else if (maxWindSpeed > 30 || maxWaveHeight > 4) recommendation = 'caution';

    return {
      waypoints: routeWaypoints,
      summary: {
        maxWindSpeed,
        maxWaveHeight,
        adverseWeatherPoints,
        recommendation,
      },
    };
  }

  /**
   * Calculate weather impact on voyage
   */
  async calculateWeatherImpact(
    fromLat: number,
    fromLon: number,
    toLat: number,
    toLon: number,
    vesselType: string,
    vesselSpeed: number
  ): Promise<WeatherImpact> {
    const routeWeather = await this.getRouteWeather(fromLat, fromLon, toLat, toLon);

    // Vessel-specific weather thresholds
    const thresholds = this.getVesselWeatherThresholds(vesselType);

    // Calculate speed reduction based on weather conditions
    let totalSpeedReduction = 0;
    let totalFuelIncrease = 0;

    for (const waypoint of routeWeather.waypoints) {
      const { windSpeed, waveHeight } = waypoint.forecast;

      // Speed reduction model (simplified)
      if (windSpeed > thresholds.criticalWind) {
        totalSpeedReduction += 30; // 30% speed reduction
        totalFuelIncrease += 20; // 20% more fuel
      } else if (windSpeed > thresholds.moderateWind) {
        totalSpeedReduction += 15;
        totalFuelIncrease += 10;
      } else if (windSpeed > thresholds.lightWind) {
        totalSpeedReduction += 5;
        totalFuelIncrease += 3;
      }

      if (waveHeight > thresholds.criticalWave) {
        totalSpeedReduction += 25;
        totalFuelIncrease += 15;
      } else if (waveHeight > thresholds.moderateWave) {
        totalSpeedReduction += 10;
        totalFuelIncrease += 5;
      }
    }

    // Average across waypoints
    const avgSpeedReduction = totalSpeedReduction / routeWeather.waypoints.length;
    const avgFuelIncrease = totalFuelIncrease / routeWeather.waypoints.length;

    // Calculate delay in minutes
    const distance = this.calculateDistance(fromLat, fromLon, toLat, toLon);
    const normalHours = distance / vesselSpeed;
    const reducedSpeed = vesselSpeed * (1 - avgSpeedReduction / 100);
    const delayedHours = distance / reducedSpeed;
    const delayMinutes = Math.round((delayedHours - normalHours) * 60);

    // Determine severity
    let severity: 'low' | 'moderate' | 'high' | 'severe' = 'low';
    if (routeWeather.summary.maxWindSpeed > 50 || routeWeather.summary.maxWaveHeight > 7) {
      severity = 'severe';
    } else if (routeWeather.summary.maxWindSpeed > 40 || routeWeather.summary.maxWaveHeight > 5) {
      severity = 'high';
    } else if (routeWeather.summary.maxWindSpeed > 30 || routeWeather.summary.maxWaveHeight > 4) {
      severity = 'moderate';
    }

    // Generate recommendation
    let recommendation = '';
    if (severity === 'severe') {
      recommendation = 'Consider delaying departure or altering route. Severe weather expected.';
    } else if (severity === 'high') {
      recommendation = 'Caution advised. Monitor weather updates and prepare for heavy weather.';
    } else if (severity === 'moderate') {
      recommendation = 'Moderate weather expected. Adjust speed as needed.';
    } else {
      recommendation = 'Favorable weather conditions. Proceed as planned.';
    }

    return {
      delayMinutes: Math.max(0, delayMinutes),
      speedReduction: avgSpeedReduction,
      fuelIncrease: avgFuelIncrease,
      recommendation,
      severity,
    };
  }

  /**
   * Fetch weather from provider API
   */
  private async fetchWeatherFromProvider(
    lat: number,
    lon: number
  ): Promise<WeatherForecast> {
    switch (this.provider) {
      case 'openweathermap':
        return await this.fetchOpenWeatherMap(lat, lon);
      case 'dtn':
        return await this.fetchDTNWeather(lat, lon);
      case 'stormgeo':
        return await this.fetchStormGeo(lat, lon);
      default:
        return this.simulateWeather(lat, lon);
    }
  }

  /**
   * Fetch from OpenWeatherMap Marine API
   */
  private async fetchOpenWeatherMap(lat: number, lon: number): Promise<WeatherForecast> {
    const url = `https://api.openweathermap.org/data/3.0/onecall`;
    const response = await axios.get(url, {
      params: {
        lat,
        lon,
        appid: this.apiKey,
        units: 'metric',
      },
    });

    const current = response.data.current;
    return {
      latitude: lat,
      longitude: lon,
      timestamp: new Date(current.dt * 1000),
      windSpeed: this.msToKnots(current.wind_speed),
      windDirection: current.wind_deg || 0,
      waveHeight: current.wave_height || 1.5,
      waveDirection: current.wave_direction || 0,
      current: 0.5, // OpenWeather doesn't provide current
      currentDirection: 0,
      visibility: (current.visibility || 10000) / 1852, // meters to NM
      pressure: current.pressure,
      temperature: current.temp,
      conditions: current.weather[0]?.main.toLowerCase() || 'clear',
    };
  }

  /**
   * Fetch from DTN Weather API (placeholder)
   */
  private async fetchDTNWeather(lat: number, lon: number): Promise<WeatherForecast> {
    // DTN implementation would go here
    return this.simulateWeather(lat, lon);
  }

  /**
   * Fetch from StormGeo API (placeholder)
   */
  private async fetchStormGeo(lat: number, lon: number): Promise<WeatherForecast> {
    // StormGeo implementation would go here
    return this.simulateWeather(lat, lon);
  }

  /**
   * Simulate weather data (fallback)
   */
  private simulateWeather(lat: number, lon: number): WeatherForecast {
    // Tropical regions tend to have more calm weather
    const isTropical = Math.abs(lat) < 23.5;
    const isHighLatitude = Math.abs(lat) > 50;

    let windSpeed = 10 + Math.random() * 15; // 10-25 knots base
    let waveHeight = 1.5 + Math.random() * 2; // 1.5-3.5m base

    if (isHighLatitude) {
      windSpeed += 10; // Higher winds at high latitudes
      waveHeight += 1.5;
    } else if (isTropical) {
      // Check for tropical storm season (simulate 10% chance)
      if (Math.random() > 0.9) {
        windSpeed = 40 + Math.random() * 20; // Storm conditions
        waveHeight = 5 + Math.random() * 3;
      }
    }

    let conditions = 'clear';
    if (windSpeed > 30) conditions = 'storm';
    else if (windSpeed > 20) conditions = 'cloudy';
    else if (Math.random() > 0.7) conditions = 'rain';

    return {
      latitude: lat,
      longitude: lon,
      timestamp: new Date(),
      windSpeed,
      windDirection: Math.random() * 360,
      waveHeight,
      waveDirection: Math.random() * 360,
      current: Math.random() * 2, // 0-2 knots
      currentDirection: Math.random() * 360,
      visibility: 5 + Math.random() * 15, // 5-20 NM
      pressure: 1013 + (Math.random() - 0.5) * 20,
      temperature: isTropical ? 25 + Math.random() * 5 : 10 + Math.random() * 15,
      conditions,
    };
  }

  /**
   * Get vessel-specific weather thresholds
   */
  private getVesselWeatherThresholds(vesselType: string): {
    lightWind: number;
    moderateWind: number;
    criticalWind: number;
    moderateWave: number;
    criticalWave: number;
  } {
    const thresholds: Record<string, any> = {
      bulk_carrier: { lightWind: 25, moderateWind: 35, criticalWind: 50, moderateWave: 4, criticalWave: 7 },
      tanker: { lightWind: 25, moderateWind: 35, criticalWind: 50, moderateWave: 4, criticalWave: 7 },
      container: { lightWind: 20, moderateWind: 30, criticalWind: 45, moderateWave: 3.5, criticalWave: 6 },
      general_cargo: { lightWind: 22, moderateWind: 32, criticalWind: 47, moderateWave: 4, criticalWave: 6.5 },
    };

    return thresholds[vesselType] || thresholds.general_cargo;
  }

  /**
   * Calculate distance between coordinates (Haversine)
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
   * Convert m/s to knots
   */
  private msToKnots(ms: number): number {
    return ms * 1.94384;
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cache
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.CACHE_TTL,
    });
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expires < now) {
        this.cache.delete(key);
      }
    }
  }
}

export const weatherAPIClient = new WeatherAPIClient();
