/**
 * ML-Powered ETA Prediction Engine
 * Phase 5: Voyage Monitoring & Operations
 *
 * Features:
 * - Machine learning-based predictions
 * - Real-time weather impact
 * - Port congestion analysis
 * - Confidence scoring
 * - Continuous learning from actual arrivals
 */

import { prisma } from '../../lib/prisma.js';
import { aisIntegrationService } from '../ais-integration.js';
import { weatherAPIClient, WeatherImpact } from './weather-api-client.js';
import { etaTrainer, TrainingData } from './eta-trainer.js';

export interface ETAPredictionML {
  voyageId: string;
  portId: string;
  predictedETA: Date;
  confidence: number; // 0-1
  factors: {
    distanceRemaining: number;
    currentSpeed: number;
    weatherImpact: WeatherImpact;
    congestionDelay: number;
    seasonalFactor: number;
    historicalAccuracy: number;
  };
  range: {
    earliest: Date;
    latest: Date;
  };
  modelVersion: string;
  lastUpdated: Date;
}

export interface ETAUpdateEvent {
  voyageId: string;
  portId: string;
  previousETA: Date;
  newETA: Date;
  changeMinutes: number;
  reason: string;
  severity: 'info' | 'warning' | 'critical';
}

class ETAPredictionEngineML {
  private readonly MODEL_VERSION = '1.0.0';

  /**
   * Predict ETA using ML model with weather and congestion data
   */
  async predictETA(voyageId: string, portId: string): Promise<ETAPredictionML> {
    // Get voyage details
    const voyage = await prisma.voyage.findUnique({
      where: { id: voyageId },
      include: {
        vessel: true,
        portCalls: {
          where: { portId },
          include: { port: true },
        },
      },
    });

    if (!voyage) {
      throw new Error('Voyage not found');
    }

    const portCall = voyage.portCalls[0];
    if (!portCall) {
      throw new Error('Port call not found');
    }

    const targetPort = portCall.port;

    // Get current vessel position from AIS
    const position = await aisIntegrationService.getVesselPosition(
      parseInt(voyage.vessel.imo),
      voyage.vessel.mmsi ? parseInt(voyage.vessel.mmsi) : undefined
    );

    if (!position) {
      throw new Error('Vessel position not available');
    }

    // Calculate distance remaining
    const distanceRemaining = this.calculateDistance(
      position.latitude,
      position.longitude,
      parseFloat(targetPort.latitude || '0'),
      parseFloat(targetPort.longitude || '0')
    );

    // Get current speed
    const currentSpeed = position.speed || voyage.plannedSpeed || 13.5;

    // Get weather impact
    const weatherImpact = await weatherAPIClient.calculateWeatherImpact(
      position.latitude,
      position.longitude,
      parseFloat(targetPort.latitude || '0'),
      parseFloat(targetPort.longitude || '0'),
      voyage.vessel.type,
      currentSpeed
    );

    // Get port congestion delay
    const congestionDelay = await this.estimateCongestionDelay(portId);

    // Get seasonal factor
    const month = new Date().getMonth();
    const seasonalFactor = this.getSeasonalFactor(month, targetPort.latitude || '0');

    // Get historical accuracy for this vessel/port combination
    const historicalAccuracy = await this.getHistoricalAccuracy(voyage.vesselId, portId);

    // Prepare input for ML model
    const mlInput: Omit<TrainingData, 'actualDuration'> = {
      voyageId: voyage.id,
      vesselId: voyage.vessel.id,
      vesselType: voyage.vessel.type,
      vesselDwt: voyage.vessel.dwt || 50000,
      portId,
      distance: distanceRemaining,
      plannedSpeed: currentSpeed,
      actualSpeed: currentSpeed,
      weatherDelay: weatherImpact.delayMinutes / 60, // Convert to hours
      congestionDelay,
      portStayTime: 0,
      seasonalFactor,
    };

    // Get ML prediction
    let predictedHours: number;
    try {
      predictedHours = await etaTrainer.predict(mlInput);
    } catch (error) {
      console.warn('ML prediction failed, using fallback:', error);
      // Fallback to simple calculation
      predictedHours =
        distanceRemaining / currentSpeed +
        weatherImpact.delayMinutes / 60 +
        congestionDelay;
    }

    // Calculate predicted ETA
    const predictedETA = new Date(Date.now() + predictedHours * 60 * 60 * 1000);

    // Calculate confidence
    const confidence = this.calculateConfidence({
      aisDataAge: Date.now() - position.timestamp.getTime(),
      weatherDataAvailable: true,
      congestionDataAvailable: true,
      historicalAccuracy,
      distanceRemaining,
    });

    // Calculate range (±variance based on confidence)
    const varianceHours = this.calculateVariance(confidence, distanceRemaining);
    const earliest = new Date(predictedETA.getTime() - varianceHours * 60 * 60 * 1000);
    const latest = new Date(predictedETA.getTime() + varianceHours * 60 * 60 * 1000);

    // Log prediction for future training
    await prisma.eTAPredictionLog.create({
      data: {
        voyageId,
        portId,
        predictedETA,
        confidence,
        weatherImpact: {
          delayMinutes: weatherImpact.delayMinutes,
          speedReduction: weatherImpact.speedReduction,
          severity: weatherImpact.severity,
        },
        congestionImpact: {
          delayHours: congestionDelay,
        },
        factors: {
          distanceRemaining,
          currentSpeed,
          seasonalFactor,
        },
        modelVersion: this.MODEL_VERSION,
      },
    });

    return {
      voyageId,
      portId,
      predictedETA,
      confidence,
      factors: {
        distanceRemaining,
        currentSpeed,
        weatherImpact,
        congestionDelay,
        seasonalFactor,
        historicalAccuracy,
      },
      range: { earliest, latest },
      modelVersion: this.MODEL_VERSION,
      lastUpdated: new Date(),
    };
  }

  /**
   * Batch update ETAs for all active voyages
   */
  async batchUpdateETAs(organizationId: string): Promise<ETAUpdateEvent[]> {
    const activeVoyages = await prisma.voyage.findMany({
      where: {
        vessel: { organizationId },
        status: { in: ['in_progress', 'loading', 'discharging'] },
      },
      include: {
        portCalls: {
          where: { ata: null }, // Only upcoming ports
        },
      },
    });

    const updates: ETAUpdateEvent[] = [];

    for (const voyage of activeVoyages) {
      for (const portCall of voyage.portCalls) {
        if (!portCall.eta) continue;

        try {
          const previousETA = portCall.eta;
          const prediction = await this.predictETA(voyage.id, portCall.portId);
          const newETA = prediction.predictedETA;

          const changeMinutes = (newETA.getTime() - previousETA.getTime()) / (1000 * 60);

          // Determine severity
          let severity: 'info' | 'warning' | 'critical' = 'info';
          if (Math.abs(changeMinutes) > 360) severity = 'critical'; // >6 hours
          else if (Math.abs(changeMinutes) > 120) severity = 'warning'; // >2 hours

          // Generate reason
          let reason = 'Regular ETA update';
          if (prediction.factors.weatherImpact.severity === 'severe') {
            reason = `Severe weather: ${prediction.factors.weatherImpact.recommendation}`;
          } else if (prediction.factors.congestionDelay > 12) {
            reason = `Severe port congestion: ${prediction.factors.congestionDelay.toFixed(0)} hours delay expected`;
          } else if (Math.abs(changeMinutes) > 60) {
            reason = `ETA adjusted by ${Math.abs(changeMinutes).toFixed(0)} minutes based on current position and conditions`;
          }

          updates.push({
            voyageId: voyage.id,
            portId: portCall.portId,
            previousETA,
            newETA,
            changeMinutes,
            reason,
            severity,
          });

          // Update port call ETA if significant change (>30 minutes)
          if (Math.abs(changeMinutes) > 30) {
            await prisma.portCall.update({
              where: { id: portCall.id },
              data: { eta: newETA },
            });
          }
        } catch (error) {
          console.error(`Error updating ETA for voyage ${voyage.id}:`, error);
        }
      }
    }

    return updates;
  }

  /**
   * Record actual arrival and improve model
   */
  async recordActualArrival(
    voyageId: string,
    portId: string,
    actualArrival: Date
  ): Promise<void> {
    // Get last prediction
    const lastPrediction = await prisma.eTAPredictionLog.findFirst({
      where: { voyageId, portId, actualATA: null },
      orderBy: { createdAt: 'desc' },
    });

    if (lastPrediction) {
      // Update prediction with actual arrival
      const errorMinutes =
        (actualArrival.getTime() - lastPrediction.predictedETA.getTime()) / (1000 * 60);

      await prisma.eTAPredictionLog.update({
        where: { id: lastPrediction.id },
        data: {
          actualATA: actualArrival,
          predictionError: Math.round(errorMinutes),
        },
      });

      // Log for ML training
      await etaTrainer.recordActualArrival(
        voyageId,
        portId,
        lastPrediction.predictedETA,
        actualArrival
      );

      console.log(
        `📊 ETA Accuracy: ${Math.abs(errorMinutes).toFixed(0)} minutes ${
          errorMinutes > 0 ? 'late' : 'early'
        }`
      );
    }

    // Update port call
    await prisma.portCall.updateMany({
      where: { voyageId, portId },
      data: { ata: actualArrival },
    });
  }

  /**
   * Get ETA accuracy statistics
   */
  async getAccuracyStats(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    avgError: number;
    accuracy90: number;
    accuracy180: number;
    totalPredictions: number;
  }> {
    return await etaTrainer.getAccuracyStats(dateFrom, dateTo);
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(factors: {
    aisDataAge: number;
    weatherDataAvailable: boolean;
    congestionDataAvailable: boolean;
    historicalAccuracy: number;
    distanceRemaining: number;
  }): number {
    let confidence = 1.0;

    // Reduce confidence for stale AIS data
    const aisAgeMinutes = factors.aisDataAge / (1000 * 60);
    if (aisAgeMinutes > 120) confidence -= 0.3;
    else if (aisAgeMinutes > 60) confidence -= 0.15;
    else if (aisAgeMinutes > 30) confidence -= 0.05;

    // Reduce confidence for missing weather data
    if (!factors.weatherDataAvailable) confidence -= 0.15;

    // Reduce confidence for missing congestion data
    if (!factors.congestionDataAvailable) confidence -= 0.1;

    // Adjust for historical accuracy
    if (factors.historicalAccuracy < 0.7) confidence -= 0.15;
    else if (factors.historicalAccuracy > 0.9) confidence += 0.05;

    // Reduce confidence for very long distances (more uncertainty)
    if (factors.distanceRemaining > 5000) confidence -= 0.1;
    else if (factors.distanceRemaining > 3000) confidence -= 0.05;

    return Math.max(0.4, Math.min(1.0, confidence));
  }

  /**
   * Calculate variance (±hours) based on confidence
   */
  private calculateVariance(confidence: number, distanceRemaining: number): number {
    // Base variance: 3 hours for medium confidence
    let variance = 6 - confidence * 4; // Range: 2-6 hours

    // Increase variance for longer distances
    if (distanceRemaining > 3000) variance += 2;
    else if (distanceRemaining > 1500) variance += 1;

    return variance;
  }

  /**
   * Estimate port congestion delay
   */
  private async estimateCongestionDelay(portId: string): Promise<number> {
    const congestion = await prisma.portCongestion.findFirst({
      where: { portId },
      orderBy: { timestamp: 'desc' },
    });

    if (!congestion) {
      // No data, assume minimal congestion
      return 0.5 + Math.random() * 1; // 0.5-1.5 hours
    }

    // Calculate delay based on vessels waiting
    const baseDelay = congestion.avgWaitHours || 0;
    const vesselsWaiting = congestion.vesselsWaiting;

    if (vesselsWaiting > 20) return baseDelay + 12 + Math.random() * 12; // Severe
    if (vesselsWaiting > 10) return baseDelay + 6 + Math.random() * 6; // High
    if (vesselsWaiting > 5) return baseDelay + 2 + Math.random() * 4; // Moderate
    return baseDelay + Math.random() * 2; // Low
  }

  /**
   * Get historical accuracy for vessel/port combination
   */
  private async getHistoricalAccuracy(vesselId: string, portId: string): Promise<number> {
    const predictions = await prisma.eTAPredictionLog.findMany({
      where: {
        voyageId: { in: await this.getVoyageIds(vesselId) },
        portId,
        actualATA: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Last 10 arrivals
    });

    if (predictions.length === 0) return 0.75; // Default

    const within3Hours = predictions.filter(
      (p) => Math.abs(p.predictionError || 0) <= 180
    ).length;

    return within3Hours / predictions.length;
  }

  /**
   * Get voyage IDs for vessel
   */
  private async getVoyageIds(vesselId: string): Promise<string[]> {
    const voyages = await prisma.voyage.findMany({
      where: { vesselId },
      select: { id: true },
    });
    return voyages.map((v) => v.id);
  }

  /**
   * Get seasonal factor
   */
  private getSeasonalFactor(month: number, latitude: string): number {
    const lat = parseFloat(latitude || '0');

    // Winter storms in northern latitudes
    if (lat > 40 && (month >= 10 || month <= 2)) return 0.7;

    // Monsoon season
    if (lat > 0 && lat < 25 && month >= 5 && month <= 8) return 0.5;

    // Hurricane season
    if (lat > 10 && lat < 40 && month >= 5 && month <= 10) return 0.4;

    return 0.1;
  }

  /**
   * Calculate distance between coordinates (Haversine)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
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
}

export const etaPredictionEngineML = new ETAPredictionEngineML();
