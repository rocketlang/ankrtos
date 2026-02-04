import { builder } from '../builder.js';
import {
  calculateCanalTransitCost,
  calculateTimeBreakdown,
  calculateTceBackward,
  calculateSensitivityAnalysis,
  type VoyageEstimateBaseInput,
} from '../../services/voyage-estimate-enhanced.js';

const VoyageEstimateInput = builder.inputType('VoyageEstimateInput', {
  fields: (t) => ({
    vesselDwt: t.float({ required: true }),
    cargoQuantity: t.float({ required: true }),
    freightRate: t.float({ required: true }),
    freightUnit: t.string({ required: true }), // per_mt, lumpsum
    currency: t.string({ defaultValue: 'USD' }),
    seaDistanceNm: t.float({ required: true }),
    speedKnots: t.float({ defaultValue: 13.5 }),
    // Bunker costs
    bunkerPriceIfo: t.float({ defaultValue: 450 }), // USD/MT IFO 380
    bunkerPriceMgo: t.float({ defaultValue: 850 }), // USD/MT MGO
    consumptionSeaIfo: t.float({ defaultValue: 32 }), // MT/day at sea
    consumptionPortIfo: t.float({ defaultValue: 4 }), // MT/day in port
    consumptionMgo: t.float({ defaultValue: 2 }), // MT/day MGO
    // Port costs
    loadPortDa: t.float({ defaultValue: 45000 }),
    dischargePortDa: t.float({ defaultValue: 55000 }),
    // Time
    loadDays: t.float({ defaultValue: 3 }),
    dischargeDays: t.float({ defaultValue: 4 }),
    // Commission
    brokerCommPct: t.float({ defaultValue: 1.25 }),
    addressCommPct: t.float({ defaultValue: 3.75 }),
    // Extras
    canalDues: t.float({ defaultValue: 0 }),
    insurance: t.float({ defaultValue: 0 }),
    miscCosts: t.float({ defaultValue: 5000 }),
  }),
});

const VoyageEstimateResult = builder.objectRef<{
  // Revenue
  grossRevenue: number;
  brokerComm: number;
  addressComm: number;
  netRevenue: number;
  // Voyage details
  seaDays: number;
  portDays: number;
  totalDays: number;
  // Bunker costs
  bunkerIfoSea: number;
  bunkerIfoPort: number;
  bunkerMgo: number;
  totalBunkerCost: number;
  // Port costs
  loadPortCost: number;
  dischargePortCost: number;
  totalPortCost: number;
  // Other costs
  canalDues: number;
  insurance: number;
  miscCosts: number;
  // Result
  totalCosts: number;
  netResult: number;
  tce: number; // Time Charter Equivalent (USD/day)
  currency: string;
}>('VoyageEstimateResult');

VoyageEstimateResult.implement({
  fields: (t) => ({
    grossRevenue: t.exposeFloat('grossRevenue'),
    brokerComm: t.exposeFloat('brokerComm'),
    addressComm: t.exposeFloat('addressComm'),
    netRevenue: t.exposeFloat('netRevenue'),
    seaDays: t.exposeFloat('seaDays'),
    portDays: t.exposeFloat('portDays'),
    totalDays: t.exposeFloat('totalDays'),
    bunkerIfoSea: t.exposeFloat('bunkerIfoSea'),
    bunkerIfoPort: t.exposeFloat('bunkerIfoPort'),
    bunkerMgo: t.exposeFloat('bunkerMgo'),
    totalBunkerCost: t.exposeFloat('totalBunkerCost'),
    loadPortCost: t.exposeFloat('loadPortCost'),
    dischargePortCost: t.exposeFloat('dischargePortCost'),
    totalPortCost: t.exposeFloat('totalPortCost'),
    canalDues: t.exposeFloat('canalDues'),
    insurance: t.exposeFloat('insurance'),
    miscCosts: t.exposeFloat('miscCosts'),
    totalCosts: t.exposeFloat('totalCosts'),
    netResult: t.exposeFloat('netResult'),
    tce: t.exposeFloat('tce'),
    currency: t.exposeString('currency'),
  }),
});

builder.queryField('calculateVoyageEstimate', (t) =>
  t.field({
    type: VoyageEstimateResult,
    args: { input: t.arg({ type: VoyageEstimateInput, required: true }) },
    resolve: (_root, { input }) => {
      const i = input;
      const currency = i.currency ?? 'USD';

      // Revenue
      const grossRevenue = i.freightUnit === 'lumpsum' ? i.freightRate : i.freightRate * i.cargoQuantity;
      const brokerComm = grossRevenue * (i.brokerCommPct ?? 1.25) / 100;
      const addressComm = grossRevenue * (i.addressCommPct ?? 3.75) / 100;
      const netRevenue = grossRevenue - brokerComm - addressComm;

      // Time
      const seaDays = i.seaDistanceNm / ((i.speedKnots ?? 13.5) * 24);
      const portDays = (i.loadDays ?? 3) + (i.dischargeDays ?? 4);
      const totalDays = seaDays + portDays;

      // Bunker
      const bunkerIfoSea = seaDays * (i.consumptionSeaIfo ?? 32) * (i.bunkerPriceIfo ?? 450);
      const bunkerIfoPort = portDays * (i.consumptionPortIfo ?? 4) * (i.bunkerPriceIfo ?? 450);
      const bunkerMgo = totalDays * (i.consumptionMgo ?? 2) * (i.bunkerPriceMgo ?? 850);
      const totalBunkerCost = bunkerIfoSea + bunkerIfoPort + bunkerMgo;

      // Port costs
      const loadPortCost = i.loadPortDa ?? 45000;
      const dischargePortCost = i.dischargePortDa ?? 55000;
      const totalPortCost = loadPortCost + dischargePortCost;

      // Others
      const canalDues = i.canalDues ?? 0;
      const insurance = i.insurance ?? 0;
      const miscCosts = i.miscCosts ?? 5000;

      const totalCosts = totalBunkerCost + totalPortCost + canalDues + insurance + miscCosts;
      const netResult = netRevenue - totalCosts;
      const tce = totalDays > 0 ? netResult / totalDays : 0;

      return {
        grossRevenue: Math.round(grossRevenue),
        brokerComm: Math.round(brokerComm),
        addressComm: Math.round(addressComm),
        netRevenue: Math.round(netRevenue),
        seaDays: Math.round(seaDays * 10) / 10,
        portDays,
        totalDays: Math.round(totalDays * 10) / 10,
        bunkerIfoSea: Math.round(bunkerIfoSea),
        bunkerIfoPort: Math.round(bunkerIfoPort),
        bunkerMgo: Math.round(bunkerMgo),
        totalBunkerCost: Math.round(totalBunkerCost),
        loadPortCost,
        dischargePortCost,
        totalPortCost,
        canalDues,
        insurance,
        miscCosts,
        totalCosts: Math.round(totalCosts),
        netResult: Math.round(netResult),
        tce: Math.round(tce),
        currency,
      };
    },
  }),
);

// ────────────────────────────────────────────────────────────
//  Enhanced Voyage Estimate – Canal Transit Cost
// ────────────────────────────────────────────────────────────

const CanalTransitInput = builder.inputType('CanalTransitInput', {
  fields: (t) => ({
    canal: t.string({ required: true }), // 'suez' | 'panama' | 'kiel'
    vesselGrt: t.float({ required: true }),
    vesselNrt: t.float({ required: true }),
    vesselType: t.string({ required: true }),
    cargoQuantity: t.float(),
    laden: t.boolean({ required: true }),
  }),
});

const CanalTransitResultType = builder.objectRef<{ cost: number; transitTimeHours: number; details: string }>('CanalTransitResult');
CanalTransitResultType.implement({
  fields: (t) => ({
    cost: t.exposeFloat('cost'),
    transitTimeHours: t.exposeFloat('transitTimeHours'),
    details: t.exposeString('details'),
  }),
});

builder.queryField('calculateCanalTransitCost', (t) =>
  t.field({
    type: CanalTransitResultType,
    args: { input: t.arg({ type: CanalTransitInput, required: true }) },
    resolve: (_root, { input }) =>
      calculateCanalTransitCost({
        canal: input.canal as 'suez' | 'panama' | 'kiel',
        vesselGrt: input.vesselGrt,
        vesselNrt: input.vesselNrt,
        vesselType: input.vesselType,
        cargoQuantity: input.cargoQuantity ?? undefined,
        laden: input.laden,
      }),
  }),
);

// ────────────────────────────────────────────────────────────
//  Enhanced Voyage Estimate – Time Breakdown
// ────────────────────────────────────────────────────────────

const TimeBreakdownInput = builder.inputType('TimeBreakdownInput', {
  fields: (t) => ({
    seaDistanceNm: t.float({ required: true }),
    speedKnots: t.float({ required: true }),
    loadDays: t.float({ required: true }),
    dischargeDays: t.float({ required: true }),
    waitingDays: t.float(),
  }),
});

const TimeBreakdownResultType = builder.objectRef<{ seaDays: number; portDays: number; canalDays: number; waitingDays: number; totalDays: number }>('TimeBreakdownResult');
TimeBreakdownResultType.implement({
  fields: (t) => ({
    seaDays: t.exposeFloat('seaDays'),
    portDays: t.exposeFloat('portDays'),
    canalDays: t.exposeFloat('canalDays'),
    waitingDays: t.exposeFloat('waitingDays'),
    totalDays: t.exposeFloat('totalDays'),
  }),
});

builder.queryField('calculateTimeBreakdown', (t) =>
  t.field({
    type: TimeBreakdownResultType,
    args: { input: t.arg({ type: TimeBreakdownInput, required: true }) },
    resolve: (_root, { input }) =>
      calculateTimeBreakdown({
        seaDistanceNm: input.seaDistanceNm,
        speedKnots: input.speedKnots,
        loadDays: input.loadDays,
        dischargeDays: input.dischargeDays,
        waitingDays: input.waitingDays ?? undefined,
      }),
  }),
);

// ────────────────────────────────────────────────────────────
//  Enhanced Voyage Estimate – TCE Back-Calculation
// ────────────────────────────────────────────────────────────

const TceBackwardInput = builder.inputType('TceBackwardInput', {
  fields: (t) => ({
    targetTce: t.float({ required: true }),
    totalDays: t.float({ required: true }),
    totalCosts: t.float({ required: true }),
    brokerCommPct: t.float({ required: true }),
    addressCommPct: t.float({ required: true }),
    cargoQuantity: t.float({ required: true }),
    freightUnit: t.string({ required: true }),
  }),
});

const TceBackwardResultType = builder.objectRef<{ requiredFreightRate: number; requiredGrossRevenue: number }>('TceBackwardResult');
TceBackwardResultType.implement({
  fields: (t) => ({
    requiredFreightRate: t.exposeFloat('requiredFreightRate'),
    requiredGrossRevenue: t.exposeFloat('requiredGrossRevenue'),
  }),
});

builder.queryField('calculateTceBackward', (t) =>
  t.field({
    type: TceBackwardResultType,
    args: { input: t.arg({ type: TceBackwardInput, required: true }) },
    resolve: (_root, { input }) =>
      calculateTceBackward(input),
  }),
);

// ────────────────────────────────────────────────────────────
//  Enhanced Voyage Estimate – Sensitivity Analysis
// ────────────────────────────────────────────────────────────

const SensitivityScenarioType = builder.objectRef<{ label: string; tce: number; netResult: number; totalDays: number }>('SensitivityScenario');
SensitivityScenarioType.implement({
  fields: (t) => ({
    label: t.exposeString('label'),
    tce: t.exposeFloat('tce'),
    netResult: t.exposeFloat('netResult'),
    totalDays: t.exposeFloat('totalDays'),
  }),
});

const SensitivityResultType = builder.objectRef<{ baseTce: number; scenarios: { label: string; tce: number; netResult: number; totalDays: number }[] }>('SensitivityResult');
SensitivityResultType.implement({
  fields: (t) => ({
    baseTce: t.exposeFloat('baseTce'),
    scenarios: t.field({
      type: [SensitivityScenarioType],
      resolve: (parent) => parent.scenarios,
    }),
  }),
});

builder.queryField('calculateSensitivityAnalysis', (t) =>
  t.field({
    type: SensitivityResultType,
    args: {
      input: t.arg({ type: VoyageEstimateInput, required: true }),
      bunkerPriceVariation: t.arg.float({ defaultValue: 50 }),
      speedVariation: t.arg.float({ defaultValue: 0.5 }),
      portTimeVariation: t.arg.float({ defaultValue: 1 }),
    },
    resolve: (_root, { input, bunkerPriceVariation, speedVariation, portTimeVariation }) => {
      const baseInput: VoyageEstimateBaseInput = {
        vesselDwt: input.vesselDwt,
        cargoQuantity: input.cargoQuantity,
        freightRate: input.freightRate,
        freightUnit: input.freightUnit ?? 'per_mt',
        seaDistanceNm: input.seaDistanceNm,
        speedKnots: input.speedKnots ?? 13.5,
        bunkerPriceIfo: input.bunkerPriceIfo ?? 450,
        bunkerPriceMgo: input.bunkerPriceMgo ?? 850,
        consumptionSeaIfo: input.consumptionSeaIfo ?? 32,
        consumptionPortIfo: input.consumptionPortIfo ?? 4,
        consumptionMgo: input.consumptionMgo ?? 2,
        loadPortDa: input.loadPortDa ?? 45000,
        dischargePortDa: input.dischargePortDa ?? 55000,
        loadDays: input.loadDays ?? 3,
        dischargeDays: input.dischargeDays ?? 4,
        brokerCommPct: input.brokerCommPct ?? 1.25,
        addressCommPct: input.addressCommPct ?? 3.75,
        canalDues: input.canalDues ?? 0,
        insurance: input.insurance ?? 0,
        miscCosts: input.miscCosts ?? 5000,
      };
      return calculateSensitivityAnalysis({
        baseInput,
        variations: {
          bunkerPriceVariation: bunkerPriceVariation ?? 50,
          speedVariation: speedVariation ?? 0.5,
          portTimeVariation: portTimeVariation ?? 1,
        },
      });
    },
  }),
);
