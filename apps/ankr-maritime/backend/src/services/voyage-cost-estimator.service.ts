/**
 * VOYAGE COST ESTIMATOR SERVICE
 * Calculate voyage costs from journey data
 */

import { HybridVesselTracker } from './hybrid-vessel-tracker.js';
import { prisma } from '../lib/prisma.js';

interface VesselInfo {
  mmsi: string;
  name: string | null;
  type: string;
  dwt: number | null;
  grt: number | null;
}

interface CostPrices {
  bunkerPriceIfo: number; // USD per metric ton
  bunkerPriceMgo: number; // USD per metric ton
}

interface ConsumptionRates {
  seaIfo: number; // MT per day at sea
  portIfo: number; // MT per day in port
  mgo: number; // MT per day (compliance fuel)
}

export class VoyageCostEstimatorService {
  /**
   * Estimate voyage cost from journey data
   */
  async estimateFromJourney(
    mmsi: string,
    daysBack: number,
    prices: CostPrices
  ): Promise<any | null> {
    try {
      // Get journey data
      const tracker = new HybridVesselTracker();
      const journey = await tracker.getVesselJourney(mmsi, daysBack);

      if (!journey) {
        console.log(`[Cost Estimator] No journey data for ${mmsi}`);
        return null;
      }

      // Get vessel details
      const vessel = await prisma.vessel.findFirst({
        where: { mmsi },
        select: {
          mmsi: true,
          name: true,
          type: true,
          dwt: true,
          grt: true,
        },
      });

      if (!vessel) {
        console.log(`[Cost Estimator] Vessel ${mmsi} not found`);
        return null;
      }

      // Calculate distances
      const totalDistanceNm = this.calculateTotalDistance(journey.segments);

      // Time breakdown
      const portDays = journey.portVisits.reduce((sum: number, pv: any) => sum + pv.duration, 0) / 24;
      const totalDurationHrs = journey.stats.totalDuration;
      const seaDays = (totalDurationHrs - portDays * 24) / 24;

      // Bunker consumption (vessel type averages)
      const consumption = this.getConsumptionRates(vessel.type, vessel.dwt);
      const bunkerCost =
        seaDays * consumption.seaIfo * prices.bunkerPriceIfo +
        portDays * consumption.portIfo * prices.bunkerPriceIfo +
        (seaDays + portDays) * consumption.mgo * prices.bunkerPriceMgo;

      // Port costs
      const portCosts = await this.estimatePortCosts(journey.portVisits, vessel);

      // Canal fees (if applicable)
      const canalFees = await this.estimateCanalFees(journey.segments, vessel);

      // Total
      const totalCosts = bunkerCost + portCosts + canalFees;

      console.log(`[Cost Estimator] ${vessel.name || mmsi}:`);
      console.log(`  Distance: ${totalDistanceNm.toFixed(0)} nm`);
      console.log(`  Sea days: ${seaDays.toFixed(1)}, Port days: ${portDays.toFixed(1)}`);
      console.log(`  Bunker: $${bunkerCost.toFixed(0)}, Ports: $${portCosts.toFixed(0)}, Canals: $${canalFees.toFixed(0)}`);
      console.log(`  Total: $${totalCosts.toFixed(0)}`);

      return {
        journeyId: `${mmsi}-${daysBack}d`,
        vessel: {
          mmsi: vessel.mmsi,
          name: vessel.name,
          type: vessel.type,
          dwt: vessel.dwt,
        },
        totalDistanceNm,
        totalDurationHrs,
        seaDaysAtSpeed: seaDays,
        portDays,
        bunkerCostUsd: bunkerCost,
        portCostsUsd: portCosts,
        canalFeesUsd: canalFees,
        totalCostsUsd: totalCosts,
        breakdown: {
          bunker: {
            seaIfo: seaDays * consumption.seaIfo * prices.bunkerPriceIfo,
            portIfo: portDays * consumption.portIfo * prices.bunkerPriceIfo,
            mgo: (seaDays + portDays) * consumption.mgo * prices.bunkerPriceMgo,
          },
          ports: portCosts,
          canals: canalFees,
        },
      };
    } catch (error) {
      console.error('[Cost Estimator] Error:', error);
      return null;
    }
  }

  /**
   * Get consumption rates based on vessel type and size
   */
  private getConsumptionRates(vesselType: string, dwt: number | null): ConsumptionRates {
    const normalizedType = vesselType.toLowerCase().replace(/\s+/g, '_');

    // Base rates by vessel type (MT per day)
    const baseRates: Record<string, ConsumptionRates> = {
      container: { seaIfo: 45, portIfo: 5, mgo: 2 },
      tanker: { seaIfo: 32, portIfo: 4, mgo: 2 },
      bulk_carrier: { seaIfo: 28, portIfo: 3, mgo: 1.5 },
      general_cargo: { seaIfo: 20, portIfo: 2, mgo: 1 },
      vehicle_carrier: { seaIfo: 35, portIfo: 4, mgo: 2 },
      passenger: { seaIfo: 40, portIfo: 6, mgo: 3 },
      reefer: { seaIfo: 38, portIfo: 5, mgo: 2 },
    };

    // Find matching vessel type
    let rates = baseRates.general_cargo; // Default
    for (const [key, value] of Object.entries(baseRates)) {
      if (normalizedType.includes(key)) {
        rates = value;
        break;
      }
    }

    // Adjust for vessel size (DWT)
    if (dwt) {
      const sizeFactor = dwt > 100000 ? 1.3 : dwt > 50000 ? 1.15 : dwt > 20000 ? 1.0 : 0.85;
      return {
        seaIfo: rates.seaIfo * sizeFactor,
        portIfo: rates.portIfo * sizeFactor,
        mgo: rates.mgo * sizeFactor,
      };
    }

    return rates;
  }

  /**
   * Estimate port costs from port visits
   */
  private async estimatePortCosts(portVisits: any[], vessel: VesselInfo): Promise<number> {
    let totalCost = 0;

    for (const visit of portVisits) {
      // Standard port charges estimate (simplified)
      // In production, you'd use actual tariff data from PortTariffService
      const durationDays = visit.duration / 24;

      // Estimated costs per day in port
      const portDuesPerDay = 500; // Base port dues
      const pilotage = 800; // One-time
      const towage = 600; // One-time
      const berthHire = 300 * durationDays; // Per day
      const agencyFee = 400; // One-time

      const visitCost = portDuesPerDay * durationDays + pilotage + towage + berthHire + agencyFee;
      totalCost += visitCost;

      console.log(`  Port ${visit.port}: ${durationDays.toFixed(1)} days = $${visitCost.toFixed(0)}`);
    }

    return totalCost;
  }

  /**
   * Estimate canal fees if route passes through major canals
   */
  private async estimateCanalFees(segments: any[], vessel: VesselInfo): Promise<number> {
    // Simplified canal detection based on geographic regions
    // In production, you'd use actual route analysis

    let totalFees = 0;

    // Check if route might pass through Suez Canal
    // (Red Sea to Mediterranean or vice versa)
    const suezIndicators = segments.some((seg: any) => {
      if (!seg.startPosition || !seg.endPosition) return false;
      const lat1 = seg.startPosition.lat;
      const lat2 = seg.endPosition.lat;
      const lon1 = seg.startPosition.lon;
      const lon2 = seg.endPosition.lon;

      // Rough detection: crossing around Suez region (29-31N, 32-34E)
      return (
        Math.abs(lat1 - 30) < 5 &&
        Math.abs(lon1 - 33) < 5 &&
        (Math.abs(lat2 - lat1) > 5 || Math.abs(lon2 - lon1) > 10)
      );
    });

    if (suezIndicators) {
      // Suez Canal fee estimate based on vessel size
      const suezBaseFee = 150000; // Base fee ~$150k
      const sizeFactor = vessel.dwt ? Math.min(vessel.dwt / 50000, 2) : 1;
      totalFees += suezBaseFee * sizeFactor;
      console.log(`  Suez Canal detected: $${(suezBaseFee * sizeFactor).toFixed(0)}`);
    }

    // Check if route might pass through Panama Canal
    // (Caribbean to Pacific or vice versa)
    const panamaIndicators = segments.some((seg: any) => {
      if (!seg.startPosition || !seg.endPosition) return false;
      const lat1 = seg.startPosition.lat;
      const lon1 = seg.startPosition.lon;
      const lat2 = seg.endPosition.lat;
      const lon2 = seg.endPosition.lon;

      // Rough detection: crossing around Panama region (8-10N, 79-81W)
      return (
        Math.abs(lat1 - 9) < 5 &&
        Math.abs(lon1 + 80) < 5 &&
        (Math.abs(lat2 - lat1) > 5 || Math.abs(lon2 - lon1) > 10)
      );
    });

    if (panamaIndicators) {
      // Panama Canal fee estimate based on vessel size
      const panamaBaseFee = 200000; // Base fee ~$200k
      const sizeFactor = vessel.dwt ? Math.min(vessel.dwt / 50000, 1.5) : 1;
      totalFees += panamaBaseFee * sizeFactor;
      console.log(`  Panama Canal detected: $${(panamaBaseFee * sizeFactor).toFixed(0)}`);
    }

    return totalFees;
  }

  /**
   * Calculate total distance from journey segments
   */
  private calculateTotalDistance(segments: any[]): number {
    let totalDistance = 0;

    for (const segment of segments) {
      if (segment.startPosition && segment.endPosition) {
        const distance = this.haversineDistance(
          segment.startPosition.lat,
          segment.startPosition.lon,
          segment.endPosition.lat,
          segment.endPosition.lon
        );
        totalDistance += distance;
      }
    }

    return totalDistance;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3440.065; // Earth radius in nautical miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
