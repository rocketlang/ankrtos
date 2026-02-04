/**
 * Well-to-Wake GraphQL Schema
 * Phase 22: Carbon & Sustainability - Well-to-Wake Analysis
 */

import { builder } from '../builder.js';
import {
  calculateWellToWake,
  compareFuels,
  calculateVoyageWellToWake,
  getAvailableFuels,
  type WellToWakeResult,
  type FuelComparisonResult,
} from '../../services/well-to-wake-calculator.js';

// ========================================
// INPUT TYPES
// ========================================

const WellToWakeInput = builder.inputType('WellToWakeInput', {
  fields: (t) => ({
    fuelType: t.string({ required: true }),
    fuelConsumedMt: t.float({ required: true }),
    includeTransport: t.boolean({ defaultValue: true }),
  }),
});

const FuelComparisonInput = builder.inputType('FuelComparisonInput', {
  fields: (t) => ({
    fuelTypes: t.stringList({ required: true }),
    fuelConsumedMt: t.float({ required: true }),
    includeTransport: t.boolean({ defaultValue: true }),
  }),
});

const VoyageWellToWakeInput = builder.inputType('VoyageWellToWakeInput', {
  fields: (t) => ({
    fuelType: t.string({ required: true }),
    dailyConsumptionMt: t.float({ required: true }),
    voyageDays: t.float({ required: true }),
    includeTransport: t.boolean({ defaultValue: true }),
  }),
});

// ========================================
// OBJECT TYPES
// ========================================

const EmissionBreakdown = builder.objectRef<{
  extraction: number;
  refining: number;
  transport: number;
  combustion: number;
}>('EmissionBreakdown').implement({
  fields: (t) => ({
    extraction: t.exposeFloat('extraction'),
    refining: t.exposeFloat('refining'),
    transport: t.exposeFloat('transport'),
    combustion: t.exposeFloat('combustion'),
  }),
});

const WellToWake = builder.objectRef<WellToWakeResult>('WellToWake').implement({
  fields: (t) => ({
    fuelType: t.exposeString('fuelType'),
    fuelConsumedMt: t.exposeFloat('fuelConsumedMt'),

    // Well-to-Tank (upstream)
    wttEmissionsMt: t.exposeFloat('wttEmissionsMt', {
      description: 'Upstream emissions from fuel production (mt CO2eq)',
    }),
    wttIntensity: t.exposeFloat('wttIntensity', {
      description: 'Well-to-Tank intensity (gCO2eq/MJ)',
    }),

    // Tank-to-Wake (combustion)
    ttwEmissionsMt: t.exposeFloat('ttwEmissionsMt', {
      description: 'Combustion emissions (mt CO2eq)',
    }),
    ttwIntensity: t.exposeFloat('ttwIntensity', {
      description: 'Tank-to-Wake intensity (gCO2eq/MJ)',
    }),

    // Well-to-Wake (total)
    wtwEmissionsMt: t.exposeFloat('wtwEmissionsMt', {
      description: 'Total lifecycle emissions (mt CO2eq)',
    }),
    wtwIntensity: t.exposeFloat('wtwIntensity', {
      description: 'Well-to-Wake intensity (gCO2eq/MJ)',
    }),

    // Breakdown
    breakdown: t.expose('breakdown', {
      type: EmissionBreakdown,
      description: 'Detailed emission breakdown by stage',
    }),

    // Comparison
    vsHFO: t.exposeFloat('vsHFO', {
      description: 'Percentage difference vs HFO (negative = better)',
    }),
    vsVLSFO: t.exposeFloat('vsVLSFO', {
      description: 'Percentage difference vs VLSFO (negative = better)',
    }),

    // Energy metrics
    energyContentMJ: t.exposeFloat('energyContentMJ', {
      description: 'Energy content (MJ per mt)',
    }),
    totalEnergyMJ: t.exposeFloat('totalEnergyMJ', {
      description: 'Total energy consumed (MJ)',
    }),
  }),
});

const FuelComparison = builder.objectRef<FuelComparisonResult>('FuelComparison').implement({
  fields: (t) => ({
    fuels: t.expose('fuels', {
      type: [WellToWake],
      description: 'Fuel analysis results sorted by WTW emissions (best to worst)',
    }),
    bestFuel: t.exposeString('bestFuel', {
      description: 'Fuel with lowest WTW emissions',
    }),
    worstFuel: t.exposeString('worstFuel', {
      description: 'Fuel with highest WTW emissions',
    }),
    potentialSavingsMt: t.exposeFloat('potentialSavingsMt', {
      description: 'Emission savings if switching from worst to best (mt CO2eq)',
    }),
    potentialSavingsPercent: t.exposeFloat('potentialSavingsPercent', {
      description: 'Percentage emission reduction if switching',
    }),
  }),
});

const AvailableFuel = builder.objectRef<{
  fuelType: string;
  category: string;
  wttIntensity: number;
  ttwFactor: number;
  energyContent: number;
}>('AvailableFuel').implement({
  fields: (t) => ({
    fuelType: t.exposeString('fuelType'),
    category: t.exposeString('category', {
      description: 'Fuel category (Fossil, Alternative, Biofuel, Synthetic)',
    }),
    wttIntensity: t.exposeFloat('wttIntensity', {
      description: 'Well-to-Tank intensity (gCO2eq/MJ)',
    }),
    ttwFactor: t.exposeFloat('ttwFactor', {
      description: 'Tank-to-Wake factor (mt CO2 per mt fuel)',
    }),
    energyContent: t.exposeFloat('energyContent', {
      description: 'Energy content (MJ per mt)',
    }),
  }),
});

// ========================================
// QUERIES
// ========================================

builder.queryFields((t) => ({
  /**
   * Calculate well-to-wake emissions for a specific fuel consumption
   */
  calculateWellToWake: t.field({
    type: WellToWake,
    args: {
      input: t.arg({ type: WellToWakeInput, required: true }),
    },
    description: 'Calculate complete lifecycle emissions (WTW) for a fuel',
    resolve: async (root, args) => {
      return calculateWellToWake(args.input);
    },
  }),

  /**
   * Compare multiple fuels for the same consumption scenario
   */
  compareFuels: t.field({
    type: FuelComparison,
    args: {
      input: t.arg({ type: FuelComparisonInput, required: true }),
    },
    description: 'Compare WTW emissions across multiple fuels',
    resolve: async (root, args) => {
      const { fuelTypes, fuelConsumedMt, includeTransport } = args.input;
      return compareFuels(fuelTypes, fuelConsumedMt, includeTransport);
    },
  }),

  /**
   * Calculate well-to-wake emissions for a voyage
   */
  calculateVoyageWellToWake: t.field({
    type: WellToWake,
    args: {
      input: t.arg({ type: VoyageWellToWakeInput, required: true }),
    },
    description: 'Calculate WTW emissions for a specific voyage',
    resolve: async (root, args) => {
      return calculateVoyageWellToWake(args.input);
    },
  }),

  /**
   * Get all available fuels with their WTW characteristics
   */
  availableFuels: t.field({
    type: [AvailableFuel],
    description: 'List all supported fuels with their emission characteristics',
    resolve: async () => {
      return getAvailableFuels();
    },
  }),
}));

// ========================================
// MUTATIONS
// ========================================

// No mutations needed for now - calculations are stateless
