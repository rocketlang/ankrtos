/**
 * Noon Reports Enhanced GraphQL Schema
 * AmosConnect-like auto-fill features
 */

import { builder } from '../builder.js';
import { noonReportAutoFillService } from '../../services/noon-report-autofill.service.js';

// ============================================================================
// OBJECT TYPES
// ============================================================================

const PositionType = builder.simpleObject('Position', {
  fields: (t) => ({
    latitude: t.float(),
    longitude: t.float(),
    timestamp: t.field({ type: 'DateTime' }),
  }),
});

const WeatherDataType = builder.simpleObject('WeatherData', {
  fields: (t) => ({
    condition: t.string(),
    windDirection: t.int(),
    windForce: t.int(),
    seaState: t.int(),
    swellHeight: t.float(),
    visibility: t.float(),
    temperature: t.float(),
    pressure: t.int(),
  }),
});

const FuelStatusType = builder.simpleObject('FuelStatus', {
  fields: (t) => ({
    fuelOilROB: t.float(),
    dieselOilROB: t.float(),
    fuelOilConsumption24h: t.float(),
    dieselOilConsumption24h: t.float(),
  }),
});

const VoyageDataType = builder.simpleObject('VoyageData', {
  fields: (t) => ({
    voyageNumber: t.string(),
    lastPort: t.string(),
    nextPort: t.string(),
    eta: t.field({ type: 'DateTime' }),
  }),
});

const AutoFilledNoonReportType = builder.simpleObject('AutoFilledNoonReport', {
  fields: (t) => ({
    // Position & Navigation
    position: t.field({ type: PositionType }),
    course: t.float(),
    speed: t.float(),
    heading: t.float(),

    // Distance
    distanceToGo: t.float(),
    distanceSinceLastReport: t.float(),

    // Weather
    weather: t.field({ type: WeatherDataType }),

    // Fuel
    fuel: t.field({ type: FuelStatusType }),

    // Voyage
    voyage: t.field({ type: VoyageDataType }),

    // Metadata
    reportDate: t.field({ type: 'DateTime' }),
    reportType: t.string(),
    autoFilled: t.boolean(),
    fillConfidence: t.float(),
    dataSource: t.string(),
  }),
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Generate auto-filled noon report for a vessel
 */
builder.queryField('generateNoonReport', (t) =>
  t.field({
    type: AutoFilledNoonReportType,
    args: {
      vesselId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      const report = await noonReportAutoFillService.generateNoonReport(args.vesselId);
      return report as any;
    },
  })
);

/**
 * Get auto-fill preview (what data is available)
 */
builder.queryField('noonReportPreview', (t) =>
  t.field({
    type: 'JSON',
    args: {
      vesselId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args) => {
      try {
        const report = await noonReportAutoFillService.generateNoonReport(args.vesselId);

        return {
          available: true,
          confidence: report.fillConfidence,
          dataAvailable: {
            position: !!report.position,
            weather: !!report.weather,
            fuel: !!report.fuel,
            voyage: !!report.voyage,
          },
          previewData: {
            currentPosition: `${report.position.latitude.toFixed(4)}, ${report.position.longitude.toFixed(4)}`,
            speed: `${report.speed.toFixed(1)} kts`,
            course: `${report.course.toFixed(0)}°`,
            weather: report.weather.condition,
            windForce: `BF${report.weather.windForce}`,
            distanceSinceLastReport: `${report.distanceSinceLastReport.toFixed(1)} NM`,
            distanceToGo: `${report.distanceToGo.toFixed(1)} NM`,
            fuelOilROB: `${report.fuel.fuelOilROB.toFixed(1)} MT`,
          },
        };
      } catch (error: any) {
        return {
          available: false,
          error: error.message,
          dataAvailable: {
            position: false,
            weather: false,
            fuel: false,
            voyage: false,
          },
        };
      }
    },
  })
);

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Save auto-filled noon report (with optional manual edits)
 */
builder.mutationField('saveNoonReport', (t) =>
  t.field({
    type: 'JSON',
    args: {
      vesselId: t.arg.string({ required: true }),
      voyageId: t.arg.string({ required: true }),
      reportData: t.arg({ type: 'JSON', required: true }),
    },
    resolve: async (_root, args) => {
      const result = await noonReportAutoFillService.saveNoonReport(
        args.vesselId,
        args.voyageId,
        args.reportData as any
      );

      return result;
    },
  })
);

/**
 * Calculate time saved statistics
 */
builder.queryField('noonReportTimeSavings', (t) =>
  t.field({
    type: 'JSON',
    resolve: () => {
      // Statistics for time savings
      const manualTimeMinutes = 16; // Average manual entry time
      const autoFillTimeMinutes = 3; // Time to review and submit auto-filled
      const timeSavedMinutes = manualTimeMinutes - autoFillTimeMinutes;

      const reportsPerMonth = 30; // ~1 per day
      const reportsPerYear = 365;

      const monthlyTimeSavedHours = (timeSavedMinutes * reportsPerMonth) / 60;
      const annualTimeSavedHours = (timeSavedMinutes * reportsPerYear) / 60;

      // Cost savings (Master time @ $75/hour)
      const masterHourlyRate = 75;
      const annualCostSavings = annualTimeSavedHours * masterHourlyRate;

      return {
        manualTimeMinutes,
        autoFillTimeMinutes,
        timeSavedMinutes,
        timeSavedPercentage: Math.round((timeSavedMinutes / manualTimeMinutes) * 100),

        monthlyTimeSavedHours: Math.round(monthlyTimeSavedHours * 10) / 10,
        annualTimeSavedHours: Math.round(annualTimeSavedHours * 10) / 10,

        annualCostSavings: Math.round(annualCostSavings),

        description: `Save ${timeSavedMinutes} minutes per report (${Math.round((timeSavedMinutes / manualTimeMinutes) * 100)}% reduction)`,
        impact: `${annualTimeSavedHours} hours saved per year = $${Math.round(annualCostSavings).toLocaleString()} value`,
      };
    },
  })
);
