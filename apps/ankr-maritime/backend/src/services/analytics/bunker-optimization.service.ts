/**
 * Bunker Cost Optimization Service
 * AI-powered bunker procurement and consumption optimization
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export interface BunkerOptimizationInput {
  vesselId: string;
  voyageId?: string;
  currentPosition: { lat: number; lon: number };
  destinationPort: string;
  remainingDistance: number; // nautical miles
  estimatedSpeed: number; // knots
  currentROB: number; // metric tons
  fuelType: 'VLSFO' | 'LSMGO' | 'MGO' | 'IFO380' | 'IFO180';
}

export interface BunkerPort {
  portId: string;
  portName: string;
  unlocode: string;
  location: { lat: number; lon: number };
  distanceFromRoute: number; // nautical miles
  deviationTime: number; // hours
  deviationCost: number; // USD
  fuelPrice: number; // USD per MT
  availability: boolean;
  minQuantity: number; // MT
  maxQuantity: number; // MT
  leadTime: number; // hours
  suppliers: number; // count
  reputationScore: number; // 0-100
}

export interface OptimizationRecommendation {
  strategy: 'NO_BUNKER' | 'ENROUTE_BUNKER' | 'DESTINATION_BUNKER' | 'MULTI_PORT';
  totalCost: number; // USD
  savings: number; // USD vs baseline
  savingsPercent: number;
  confidence: number; // 0-1

  // Bunker plan
  bunkerPorts: Array<{
    port: BunkerPort;
    quantity: number; // MT
    cost: number; // USD
    timing: Date;
    priority: 'PRIMARY' | 'BACKUP';
  }>;

  // Risk factors
  risks: Array<{
    type: 'PRICE_VOLATILITY' | 'QUALITY' | 'DELAY' | 'AVAILABILITY';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    mitigation: string;
  }>;

  // Speed optimization
  speedOptimization?: {
    recommendedSpeed: number; // knots
    currentSpeed: number;
    fuelSavings: number; // MT
    costSavings: number; // USD
    timeImpact: number; // hours
  };
}

export interface BunkerMarketData {
  portId: string;
  fuelType: string;
  price: number; // USD per MT
  date: Date;
  priceChange24h: number; // percent
  priceChange7d: number; // percent
  volatility: number; // standard deviation
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export class BunkerOptimizationService {
  /**
   * Generate optimal bunker procurement recommendation
   */
  async optimizeBunkerProcurement(
    input: BunkerOptimizationInput,
    organizationId: string
  ): Promise<OptimizationRecommendation> {
    // Get vessel details
    const vessel = await prisma.vessel.findFirst({
      where: { id: input.vesselId, organizationId },
    });

    if (!vessel) {
      throw new Error('Vessel not found');
    }

    // Calculate fuel requirement
    const fuelConsumptionRate = vessel.fuelConsumption || 25; // MT/day
    const estimatedDays = input.remainingDistance / (input.estimatedSpeed * 24);
    const requiredFuel = fuelConsumptionRate * estimatedDays;
    const fuelShortfall = Math.max(0, requiredFuel - input.currentROB);

    // If sufficient fuel, no bunker needed
    if (fuelShortfall <= 5) {
      return this.createNoBunkerRecommendation(input, requiredFuel);
    }

    // Get bunker ports along route
    const bunkerPorts = await this.findBunkerPortsAlongRoute(
      input.currentPosition,
      input.destinationPort,
      input.fuelType,
      fuelShortfall
    );

    // Get current market prices
    const marketData = await this.getBunkerMarketData(
      bunkerPorts.map((p) => p.portId),
      input.fuelType
    );

    // Calculate baseline (bunker at destination)
    const baseline = this.calculateBaselineCost(
      input.destinationPort,
      fuelShortfall,
      marketData
    );

    // Evaluate different strategies
    const strategies = [
      await this.evaluateEnrouteBunkering(bunkerPorts, fuelShortfall, marketData, baseline),
      await this.evaluateMultiPortBunkering(bunkerPorts, fuelShortfall, marketData, baseline),
      await this.evaluateSpeedOptimization(input, vessel, fuelShortfall, baseline),
    ];

    // Select best strategy
    const bestStrategy = strategies.reduce((best, current) =>
      current.savings > best.savings ? current : best
    );

    // Add risk assessment
    bestStrategy.risks = this.assessRisks(bestStrategy, marketData, bunkerPorts);

    return bestStrategy;
  }

  /**
   * Get real-time bunker prices at multiple ports
   */
  async getBunkerPrices(
    portIds: string[],
    fuelType: string
  ): Promise<BunkerMarketData[]> {
    // In production, integrate with Ship & Bunker API, Bunker Index, etc.
    const prices = await prisma.bunkerPrice.findMany({
      where: {
        portId: { in: portIds },
        fuelType,
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: { date: 'desc' },
      take: portIds.length,
    });

    return prices.map((p) => ({
      portId: p.portId,
      fuelType: p.fuelType,
      price: p.price,
      date: p.date,
      priceChange24h: p.priceChange24h || 0,
      priceChange7d: p.priceChange7d || 0,
      volatility: p.volatility || 0,
      trend: this.determineTrend(p.priceChange24h || 0, p.priceChange7d || 0),
    }));
  }

  /**
   * Forecast bunker price for next N days
   */
  async forecastBunkerPrice(
    portId: string,
    fuelType: string,
    daysAhead: number
  ): Promise<{ date: Date; predictedPrice: number; confidence: number }[]> {
    // Get historical prices
    const historicalPrices = await prisma.bunkerPrice.findMany({
      where: { portId, fuelType },
      orderBy: { date: 'desc' },
      take: 30,
    });

    if (historicalPrices.length < 7) {
      return []; // Not enough data
    }

    // Simple moving average forecast (in production, use ARIMA/LSTM)
    const prices = historicalPrices.map((p) => p.price);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const stdDev = Math.sqrt(
      prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length
    );

    // Generate forecast
    const forecast = [];
    for (let i = 1; i <= daysAhead; i++) {
      const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      const predictedPrice = avgPrice + (Math.random() - 0.5) * stdDev; // Random walk
      const confidence = Math.max(0.3, 1 - i * 0.05); // Confidence decreases with time

      forecast.push({ date, predictedPrice, confidence });
    }

    return forecast;
  }

  /**
   * Compare bunker costs across ports
   */
  async compareBunkerCosts(
    portIds: string[],
    fuelType: string,
    quantity: number
  ): Promise<
    Array<{
      portId: string;
      portName: string;
      price: number;
      totalCost: number;
      priceRank: number;
      qualityRating: number;
      availability: boolean;
    }>
  > {
    const ports = await prisma.port.findMany({
      where: { id: { in: portIds } },
    });

    const prices = await this.getBunkerPrices(portIds, fuelType);

    const comparison = ports.map((port) => {
      const priceData = prices.find((p) => p.portId === port.id);
      const price = priceData?.price || 0;

      return {
        portId: port.id,
        portName: port.name,
        price,
        totalCost: price * quantity,
        priceRank: 0, // Will be calculated below
        qualityRating: Math.random() * 30 + 70, // 70-100 (mock)
        availability: true,
      };
    });

    // Rank by price
    comparison.sort((a, b) => a.price - b.price);
    comparison.forEach((item, index) => {
      item.priceRank = index + 1;
    });

    return comparison;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private createNoBunkerRecommendation(
    input: BunkerOptimizationInput,
    requiredFuel: number
  ): OptimizationRecommendation {
    return {
      strategy: 'NO_BUNKER',
      totalCost: 0,
      savings: 0,
      savingsPercent: 0,
      confidence: 0.95,
      bunkerPorts: [],
      risks: [
        {
          type: 'AVAILABILITY',
          severity: 'LOW',
          description: 'Sufficient fuel on board',
          mitigation: 'No action required',
        },
      ],
    };
  }

  private async findBunkerPortsAlongRoute(
    currentPos: { lat: number; lon: number },
    destination: string,
    fuelType: string,
    minQuantity: number
  ): Promise<BunkerPort[]> {
    // In production, use route optimization API to find ports along route
    // For now, get major bunker ports within reasonable distance

    const ports = await prisma.port.findMany({
      where: {
        unlocode: { in: ['SGSIN', 'AEFUJ', 'USHOU', 'NLRTM', 'GBLGP'] }, // Major bunker hubs
      },
      take: 10,
    });

    return ports.map((port) => {
      const distance = this.calculateDistance(currentPos, {
        lat: port.latitude,
        lon: port.longitude,
      });

      return {
        portId: port.id,
        portName: port.name,
        unlocode: port.unlocode,
        location: { lat: port.latitude, lon: port.longitude },
        distanceFromRoute: distance * 0.1, // Assume 10% deviation
        deviationTime: (distance * 0.1) / 15, // 15 knots
        deviationCost: (distance * 0.1 * 500) / 24, // $500/day bunker cost
        fuelPrice: 600 + Math.random() * 100, // $600-700/MT (mock)
        availability: true,
        minQuantity: 50,
        maxQuantity: 2000,
        leadTime: 24,
        suppliers: Math.floor(Math.random() * 10) + 5,
        reputationScore: Math.random() * 20 + 80,
      };
    });
  }

  private async getBunkerMarketData(
    portIds: string[],
    fuelType: string
  ): Promise<Map<string, BunkerMarketData>> {
    const prices = await this.getBunkerPrices(portIds, fuelType);
    const map = new Map<string, BunkerMarketData>();
    prices.forEach((p) => map.set(p.portId, p));
    return map;
  }

  private calculateBaselineCost(
    destinationPort: string,
    quantity: number,
    marketData: Map<string, BunkerMarketData>
  ): number {
    const destPrice = marketData.get(destinationPort)?.price || 650; // Default $650/MT
    return quantity * destPrice;
  }

  private async evaluateEnrouteBunkering(
    bunkerPorts: BunkerPort[],
    quantity: number,
    marketData: Map<string, BunkerMarketData>,
    baseline: number
  ): Promise<OptimizationRecommendation> {
    // Find cheapest port enroute
    const cheapest = bunkerPorts.reduce((best, port) =>
      port.fuelPrice < best.fuelPrice ? port : best
    );

    const bunkering Cost = cheapest.fuelPrice * quantity + cheapest.deviationCost;
    const savings = baseline - bunkeringCost;

    return {
      strategy: 'ENROUTE_BUNKER',
      totalCost: bunkeringCost,
      savings: Math.max(0, savings),
      savingsPercent: (savings / baseline) * 100,
      confidence: 0.85,
      bunkerPorts: [
        {
          port: cheapest,
          quantity,
          cost: bunkeringCost,
          timing: new Date(Date.now() + cheapest.deviationTime * 60 * 60 * 1000),
          priority: 'PRIMARY',
        },
      ],
      risks: [],
    };
  }

  private async evaluateMultiPortBunkering(
    bunkerPorts: BunkerPort[],
    quantity: number,
    marketData: Map<string, BunkerMarketData>,
    baseline: number
  ): Promise<OptimizationRecommendation> {
    // Split bunkering across 2 cheapest ports
    const sorted = [...bunkerPorts].sort((a, b) => a.fuelPrice - b.fuelPrice);
    const port1 = sorted[0];
    const port2 = sorted[1];

    if (!port1 || !port2) {
      return this.evaluateEnrouteBunkering(bunkerPorts, quantity, marketData, baseline);
    }

    const qty1 = Math.floor(quantity * 0.6);
    const qty2 = quantity - qty1;

    const cost1 = port1.fuelPrice * qty1 + port1.deviationCost;
    const cost2 = port2.fuelPrice * qty2 + port2.deviationCost;
    const totalCost = cost1 + cost2;
    const savings = baseline - totalCost;

    return {
      strategy: 'MULTI_PORT',
      totalCost,
      savings: Math.max(0, savings),
      savingsPercent: (savings / baseline) * 100,
      confidence: 0.75,
      bunkerPorts: [
        {
          port: port1,
          quantity: qty1,
          cost: cost1,
          timing: new Date(Date.now() + port1.deviationTime * 60 * 60 * 1000),
          priority: 'PRIMARY',
        },
        {
          port: port2,
          quantity: qty2,
          cost: cost2,
          timing: new Date(Date.now() + (port1.deviationTime + 48) * 60 * 60 * 1000),
          priority: 'BACKUP',
        },
      ],
      risks: [],
    };
  }

  private async evaluateSpeedOptimization(
    input: BunkerOptimizationInput,
    vessel: any,
    requiredFuel: number,
    baseline: number
  ): Promise<OptimizationRecommendation> {
    // Slow steaming to reduce fuel consumption
    const currentSpeed = input.estimatedSpeed;
    const optimizedSpeed = currentSpeed * 0.9; // 10% slower
    const fuelSavings = requiredFuel * 0.2; // ~20% fuel savings from 10% speed reduction
    const costSavings = fuelSavings * 650; // Assume $650/MT

    return {
      strategy: 'NO_BUNKER',
      totalCost: baseline - costSavings,
      savings: costSavings,
      savingsPercent: (costSavings / baseline) * 100,
      confidence: 0.9,
      bunkerPorts: [],
      risks: [],
      speedOptimization: {
        recommendedSpeed: optimizedSpeed,
        currentSpeed,
        fuelSavings,
        costSavings,
        timeImpact: (input.remainingDistance / optimizedSpeed - input.remainingDistance / currentSpeed),
      },
    };
  }

  private assessRisks(
    recommendation: OptimizationRecommendation,
    marketData: Map<string, BunkerMarketData>,
    bunkerPorts: BunkerPort[]
  ): Array<{
    type: 'PRICE_VOLATILITY' | 'QUALITY' | 'DELAY' | 'AVAILABILITY';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    mitigation: string;
  }> {
    const risks = [];

    // Check price volatility
    recommendation.bunkerPorts.forEach((bp) => {
      const market = marketData.get(bp.port.portId);
      if (market && market.volatility > 50) {
        risks.push({
          type: 'PRICE_VOLATILITY' as const,
          severity: 'MEDIUM' as const,
          description: `High price volatility at ${bp.port.portName} (±${market.volatility.toFixed(0)}%)`,
          mitigation: 'Consider locking price via forward contract',
        });
      }
    });

    // Check quality concerns
    recommendation.bunkerPorts.forEach((bp) => {
      if (bp.port.reputationScore < 70) {
        risks.push({
          type: 'QUALITY' as const,
          severity: 'HIGH' as const,
          description: `Low supplier reputation at ${bp.port.portName}`,
          mitigation: 'Request fuel quality certificate and sample testing',
        });
      }
    });

    return risks;
  }

  private calculateDistance(
    pos1: { lat: number; lon: number },
    pos2: { lat: number; lon: number }
  ): number {
    // Haversine formula
    const R = 3440.065; // Earth radius in nautical miles
    const dLat = ((pos2.lat - pos1.lat) * Math.PI) / 180;
    const dLon = ((pos2.lon - pos1.lon) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pos1.lat * Math.PI) / 180) *
        Math.cos((pos2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private determineTrend(change24h: number, change7d: number): 'UP' | 'DOWN' | 'STABLE' {
    if (change24h > 2 || change7d > 5) return 'UP';
    if (change24h < -2 || change7d < -5) return 'DOWN';
    return 'STABLE';
  }
}

export const bunkerOptimizationService = new BunkerOptimizationService();
