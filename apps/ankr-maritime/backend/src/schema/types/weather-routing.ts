/**
 * Weather Routing GraphQL Schema
 * Phase 5: TIER 2 - Weather Routing Engine
 */

import { builder } from '../builder.js';
import { routeOptimizer } from '../../services/weather-routing/route-optimizer.js';
import { weatherGridSystem } from '../../services/weather-routing/weather-grid.js';

// ========================================
// INPUT TYPES
// ========================================

const PortInputType = builder.inputType('PortInput', {
  fields: (t) => ({
    lat: t.float({ required: true }),
    lon: t.float({ required: true }),
    name: t.string(),
    unlocode: t.string(),
  }),
});

const RouteRequestInput = builder.inputType('RouteRequestInput', {
  fields: (t) => ({
    from: t.field({ type: PortInputType, required: true }),
    to: t.field({ type: PortInputType, required: true }),
    etd: t.field({ type: 'DateTime', required: true }),
    vesselSpeed: t.float({ required: true }),
    vesselType: t.string({ required: true }),
    fuelConsumptionRate: t.float({ required: true }),
    fuelPrice: t.float({ defaultValue: 500 }),
  }),
});

// ========================================
// OBJECT TYPES
// ========================================

const RoutePointType = builder.objectRef<{
  lat: number;
  lon: number;
  eta: Date;
  weather?: any;
}>('RoutePoint').implement({
  fields: (t) => ({
    lat: t.exposeFloat('lat'),
    lon: t.exposeFloat('lon'),
    eta: t.expose('eta', { type: 'DateTime' }),
    weather: t.field({ type: 'JSON', nullable: true, resolve: (p) => p.weather }),
  }),
});

const RouteSavingsType = builder.objectRef<{
  fuelSaved: number;
  costSaved: number;
  timeDifference: number;
}>('RouteSavings').implement({
  fields: (t) => ({
    fuelSaved: t.exposeFloat('fuelSaved'),
    costSaved: t.exposeFloat('costSaved'),
    timeDifference: t.exposeFloat('timeDifference'),
  }),
});

const RouteAlternativeType = builder.objectRef<{
  id: string;
  name: string;
  waypoints: any[];
  totalDistance: number;
  estimatedDuration: number;
  fuelConsumption: number;
  weatherRisk: 'low' | 'medium' | 'high';
  maxWaveHeight: number;
  maxWindSpeed: number;
  averageSpeed: number;
  recommendation: string;
  savings?: any;
}>('RouteAlternative').implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    name: t.exposeString('name'),
    waypoints: t.field({
      type: [RoutePointType],
      resolve: (r) => r.waypoints,
    }),
    totalDistance: t.exposeFloat('totalDistance'),
    estimatedDuration: t.exposeFloat('estimatedDuration'),
    fuelConsumption: t.exposeFloat('fuelConsumption'),
    weatherRisk: t.exposeString('weatherRisk'),
    maxWaveHeight: t.exposeFloat('maxWaveHeight'),
    maxWindSpeed: t.exposeFloat('maxWindSpeed'),
    averageSpeed: t.exposeFloat('averageSpeed'),
    recommendation: t.exposeString('recommendation'),
    savings: t.field({
      type: RouteSavingsType,
      nullable: true,
      resolve: (r) => r.savings,
    }),
  }),
});

const WeatherGridPointType = builder.objectRef<{
  lat: number;
  lon: number;
  timestamp: Date;
  windSpeed: number;
  windDirection: number;
  waveHeight: number;
  seaState: string;
  visibility: number;
  severity: string;
}>('WeatherGridPoint').implement({
  fields: (t) => ({
    lat: t.exposeFloat('lat'),
    lon: t.exposeFloat('lon'),
    timestamp: t.expose('timestamp', { type: 'DateTime' }),
    windSpeed: t.exposeFloat('windSpeed'),
    windDirection: t.exposeFloat('windDirection'),
    waveHeight: t.exposeFloat('waveHeight'),
    seaState: t.exposeString('seaState'),
    visibility: t.exposeFloat('visibility'),
    severity: t.exposeString('severity'),
  }),
});

const AdverseWeatherAlertType = builder.objectRef<{
  location: { lat: number; lon: number };
  timestamp: Date;
  type: string;
  severity: string;
  description: string;
  recommendation: string;
}>('AdverseWeatherAlert').implement({
  fields: (t) => ({
    location: t.field({ type: 'JSON', resolve: (a) => a.location }),
    timestamp: t.expose('timestamp', { type: 'DateTime' }),
    type: t.exposeString('type'),
    severity: t.exposeString('severity'),
    description: t.exposeString('description'),
    recommendation: t.exposeString('recommendation'),
  }),
});

const RouteWeatherForecastType = builder.objectRef<{
  route: any[];
  forecasts: any[][];
  maxWindSpeed: number;
  maxWaveHeight: number;
  adverseWeather: any[];
}>('RouteWeatherForecast').implement({
  fields: (t) => ({
    route: t.field({ type: 'JSON', resolve: (f) => f.route }),
    forecasts: t.field({
      type: [[WeatherGridPointType]],
      resolve: (f) => f.forecasts,
    }),
    maxWindSpeed: t.exposeFloat('maxWindSpeed'),
    maxWaveHeight: t.exposeFloat('maxWaveHeight'),
    adverseWeather: t.field({
      type: [AdverseWeatherAlertType],
      resolve: (f) => f.adverseWeather,
    }),
  }),
});

// ========================================
// QUERIES
// ========================================

builder.queryFields((t) => ({
  /**
   * Calculate weather-optimized routes
   */
  calculateWeatherRoutes: t.field({
    type: [RouteAlternativeType],
    args: {
      request: t.arg({ type: RouteRequestInput, required: true }),
    },
    resolve: async (root, args) => {
      const request = {
        from: args.request.from,
        to: args.request.to,
        etd: args.request.etd,
        vesselSpeed: args.request.vesselSpeed,
        vesselType: args.request.vesselType,
        fuelConsumptionRate: args.request.fuelConsumptionRate,
        fuelPrice: args.request.fuelPrice,
      };

      return await routeOptimizer.calculateRoutes(request);
    },
  }),

  /**
   * Get weather forecast for a specific route
   */
  routeWeatherForecast: t.field({
    type: RouteWeatherForecastType,
    args: {
      waypoints: t.arg({ type: 'JSON', required: true }), // Array of {lat, lon}
      forecastIntervals: t.arg.intList({ defaultValue: [0, 24, 48, 72] }),
    },
    resolve: async (root, args) => {
      const waypoints = args.waypoints as Array<{ lat: number; lon: number }>;
      return await weatherGridSystem.getRouteWeatherForecast(
        waypoints,
        args.forecastIntervals || [0, 24, 48, 72]
      );
    },
  }),

  /**
   * Get weather grid for an area
   */
  weatherGrid: t.field({
    type: 'JSON',
    args: {
      north: t.arg.float({ required: true }),
      south: t.arg.float({ required: true }),
      east: t.arg.float({ required: true }),
      west: t.arg.float({ required: true }),
      resolution: t.arg.float({ defaultValue: 0.5 }),
      forecastHours: t.arg.int({ defaultValue: 72 }),
    },
    resolve: async (root, args) => {
      const bounds = {
        north: args.north,
        south: args.south,
        east: args.east,
        west: args.west,
      };

      const grid = await weatherGridSystem.createGrid(
        bounds,
        args.resolution,
        args.forecastHours
      );

      return {
        bounds: grid.bounds,
        resolution: grid.resolution,
        timestamp: grid.timestamp,
        forecastHours: grid.forecastHours,
        pointsCount: grid.points.length,
        points: grid.points,
      };
    },
  }),
}));

// ========================================
// MUTATIONS
// ========================================

builder.mutationFields((t) => ({
  /**
   * Clear weather grid cache (admin only)
   */
  clearWeatherCache: t.field({
    type: 'Boolean',
    authScopes: { admin: true },
    resolve: async () => {
      weatherGridSystem.clearCache();
      return true;
    },
  }),
}));
