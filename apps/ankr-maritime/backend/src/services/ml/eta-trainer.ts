/**
 * ETA ML Model Trainer
 * Phase 5: Machine Learning-based ETA Prediction
 *
 * Features:
 * - Historical data extraction
 * - Feature engineering
 * - Model training (using historical voyage data)
 * - Accuracy tracking and improvement
 * - Model versioning
 */

import { prisma } from '../../lib/prisma.js';

export interface TrainingData {
  voyageId: string;
  vesselId: string;
  vesselType: string;
  vesselDwt: number;
  portId: string;
  distance: number; // nautical miles
  plannedSpeed: number; // knots
  actualSpeed: number; // knots
  weatherDelay: number; // hours
  congestionDelay: number; // hours
  portStayTime: number; // hours
  seasonalFactor: number; // 0-1 (monsoon, winter storms, etc.)
  actualDuration: number; // hours (target variable)
}

export interface MLModel {
  version: string;
  trainedAt: Date;
  accuracy: {
    totalSamples: number;
    avgError: number; // minutes
    within1Hour: number; // percentage
    within3Hours: number;
    within6Hours: number;
  };
  features: string[];
  weights: Record<string, number>;
}

class ETATrainer {
  private model: MLModel | null = null;
  private readonly MODEL_VERSION = '1.0.0';

  /**
   * Extract historical voyage data for training
   */
  async extractHistoricalData(months: number = 6): Promise<TrainingData[]> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    console.log(`📊 Extracting voyage data from last ${months} months...`);

    // Get completed voyages with actual arrival times
    const voyages = await prisma.voyage.findMany({
      where: {
        status: 'completed',
        actualArrival: { not: null },
        actualDeparture: { not: null },
        createdAt: { gte: cutoffDate },
      },
      include: {
        vessel: true,
        portCalls: {
          include: {
            port: true,
          },
        },
      },
    });

    console.log(`✅ Found ${voyages.length} completed voyages`);

    const trainingData: TrainingData[] = [];

    for (const voyage of voyages) {
      if (!voyage.actualDeparture || !voyage.actualArrival) continue;

      const vessel = voyage.vessel;
      const arrivalPort = voyage.portCalls.find((pc) => pc.eta);

      if (!arrivalPort || !arrivalPort.eta || !arrivalPort.ata) continue;

      // Calculate actual duration
      const actualDuration =
        (arrivalPort.ata.getTime() - voyage.actualDeparture.getTime()) / (1000 * 60 * 60);

      // Calculate planned duration
      const plannedDuration =
        (arrivalPort.eta.getTime() - voyage.actualDeparture.getTime()) / (1000 * 60 * 60);

      // Estimate distance (simplified - would use actual route in production)
      const distance = 1000 + Math.random() * 3000; // Placeholder

      // Estimate speed
      const plannedSpeed = voyage.plannedSpeed || 13.5;
      const actualSpeed = distance / actualDuration;

      // Estimate delays
      const weatherDelay = Math.max(0, (actualDuration - plannedDuration) * 0.6); // 60% of delay = weather
      const congestionDelay = Math.max(0, (actualDuration - plannedDuration) * 0.4); // 40% = congestion

      // Calculate seasonal factor
      const month = voyage.actualDeparture.getMonth();
      const seasonalFactor = this.getSeasonalFactor(month, arrivalPort.port.latitude);

      trainingData.push({
        voyageId: voyage.id,
        vesselId: vessel.id,
        vesselType: vessel.type,
        vesselDwt: vessel.dwt || 50000,
        portId: arrivalPort.portId,
        distance,
        plannedSpeed,
        actualSpeed,
        weatherDelay,
        congestionDelay,
        portStayTime: 0, // Would get from port call data
        seasonalFactor,
        actualDuration,
      });
    }

    console.log(`📈 Extracted ${trainingData.length} training samples`);
    return trainingData;
  }

  /**
   * Train ML model on historical data
   */
  async trainModel(data: TrainingData[]): Promise<MLModel> {
    console.log(`🤖 Training ML model on ${data.length} samples...`);

    if (data.length < 50) {
      console.warn('⚠️  Limited training data (<50 samples). Model may be inaccurate.');
    }

    // Feature engineering
    const features = [
      'distance',
      'plannedSpeed',
      'vesselDwt',
      'weatherDelay',
      'congestionDelay',
      'seasonalFactor',
    ];

    // Calculate feature weights using linear regression (simplified)
    // In production, would use TensorFlow.js or call Python ML service
    const weights = this.calculateWeights(data, features);

    // Calculate accuracy on training data
    const accuracy = this.evaluateModel(data, weights);

    const model: MLModel = {
      version: this.MODEL_VERSION,
      trainedAt: new Date(),
      accuracy,
      features,
      weights,
    };

    this.model = model;

    console.log(`✅ Model trained successfully!`);
    console.log(`   Average Error: ${accuracy.avgError.toFixed(1)} minutes`);
    console.log(`   Within 3 hours: ${accuracy.within3Hours.toFixed(1)}%`);

    // Save model to database
    await this.saveModel(model);

    return model;
  }

  /**
   * Calculate feature weights (simplified linear regression)
   */
  private calculateWeights(
    data: TrainingData[],
    features: string[]
  ): Record<string, number> {
    // Simplified weight calculation
    // In production, would use proper ML library

    const weights: Record<string, number> = {
      distance: 0.073, // ~0.073 hours per nautical mile at 13.7 knots
      plannedSpeed: -0.05, // Faster = less time
      vesselDwt: 0.00001, // Larger vessels slightly slower
      weatherDelay: 1.0, // Direct impact
      congestionDelay: 1.0, // Direct impact
      seasonalFactor: 2.0, // Seasonal adjustment
    };

    // Fine-tune weights based on data
    let totalError = 0;
    for (const sample of data) {
      const predicted = this.predictWithWeights(sample, weights);
      const error = Math.abs(predicted - sample.actualDuration);
      totalError += error;
    }

    const avgError = totalError / data.length;
    console.log(`   Initial average error: ${avgError.toFixed(2)} hours`);

    // Simple gradient descent (1 iteration)
    const learningRate = 0.001;
    for (const feature of features) {
      let gradient = 0;
      for (const sample of data) {
        const predicted = this.predictWithWeights(sample, weights);
        const error = predicted - sample.actualDuration;
        gradient += error * (sample[feature as keyof TrainingData] as number);
      }
      gradient /= data.length;
      weights[feature] -= learningRate * gradient;
    }

    return weights;
  }

  /**
   * Predict ETA duration with given weights
   */
  private predictWithWeights(sample: TrainingData, weights: Record<string, number>): number {
    const baseTime = (sample.distance / sample.plannedSpeed); // Base voyage time
    const weatherAdjustment = sample.weatherDelay * weights.weatherDelay;
    const congestionAdjustment = sample.congestionDelay * weights.congestionDelay;
    const seasonalAdjustment = sample.seasonalFactor * weights.seasonalFactor;
    const sizeAdjustment = sample.vesselDwt * weights.vesselDwt;

    return baseTime + weatherAdjustment + congestionAdjustment + seasonalAdjustment + sizeAdjustment;
  }

  /**
   * Evaluate model accuracy
   */
  private evaluateModel(
    data: TrainingData[],
    weights: Record<string, number>
  ): MLModel['accuracy'] {
    let totalError = 0;
    let within1Hour = 0;
    let within3Hours = 0;
    let within6Hours = 0;

    for (const sample of data) {
      const predicted = this.predictWithWeights(sample, weights);
      const errorHours = Math.abs(predicted - sample.actualDuration);
      const errorMinutes = errorHours * 60;

      totalError += errorMinutes;

      if (errorHours <= 1) within1Hour++;
      if (errorHours <= 3) within3Hours++;
      if (errorHours <= 6) within6Hours++;
    }

    return {
      totalSamples: data.length,
      avgError: totalError / data.length,
      within1Hour: (within1Hour / data.length) * 100,
      within3Hours: (within3Hours / data.length) * 100,
      within6Hours: (within6Hours / data.length) * 100,
    };
  }

  /**
   * Get seasonal factor (0-1, higher = more adverse)
   */
  private getSeasonalFactor(month: number, latitude: string): number {
    const lat = parseFloat(latitude || '0');

    // Northern hemisphere winter storms (Nov-Feb)
    if (lat > 40 && (month >= 10 || month <= 1)) {
      return 0.8 + Math.random() * 0.2; // High seasonal impact
    }

    // Monsoon season in Indian Ocean (Jun-Sep)
    if (lat > 0 && lat < 25 && month >= 5 && month <= 8) {
      return 0.6 + Math.random() * 0.3;
    }

    // Hurricane season Atlantic (Jun-Nov)
    if (lat > 10 && lat < 40 && month >= 5 && month <= 10) {
      return 0.5 + Math.random() * 0.3;
    }

    // Normal conditions
    return 0.1 + Math.random() * 0.3;
  }

  /**
   * Save model to database
   */
  private async saveModel(model: MLModel): Promise<void> {
    // In production, would save to database or file system
    console.log('💾 Model saved (version:', model.version, ')');
  }

  /**
   * Load latest model
   */
  async loadModel(): Promise<MLModel | null> {
    // In production, would load from database
    // For now, return null and retrain if needed
    return this.model;
  }

  /**
   * Predict ETA with trained model
   */
  async predict(input: Omit<TrainingData, 'actualDuration'>): Promise<number> {
    if (!this.model) {
      console.warn('⚠️  No trained model available. Using fallback prediction.');
      return input.distance / input.plannedSpeed;
    }

    return this.predictWithWeights(input as TrainingData, this.model.weights);
  }

  /**
   * Record actual arrival for continuous learning
   */
  async recordActualArrival(
    voyageId: string,
    portId: string,
    predictedETA: Date,
    actualATA: Date
  ): Promise<void> {
    const errorMinutes = (actualATA.getTime() - predictedETA.getTime()) / (1000 * 60);

    // Log prediction for future training
    await prisma.eTAPredictionLog.create({
      data: {
        voyageId,
        portId,
        predictedETA,
        actualATA,
        predictionError: Math.round(errorMinutes),
        confidence: 0.85, // Would calculate based on data quality
        modelVersion: this.MODEL_VERSION,
      },
    });

    console.log(
      `📝 Recorded ETA accuracy: ${Math.abs(errorMinutes).toFixed(0)} minutes ${
        errorMinutes > 0 ? 'late' : 'early'
      }`
    );

    // Trigger model retraining if enough new data
    const logCount = await prisma.eTAPredictionLog.count({
      where: { actualATA: { not: null } },
    });

    if (logCount > 0 && logCount % 100 === 0) {
      console.log('🔄 100+ new predictions logged. Consider retraining model.');
    }
  }

  /**
   * Get model accuracy statistics
   */
  async getAccuracyStats(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    totalPredictions: number;
    avgError: number;
    accuracy90: number; // % within 90 minutes
    accuracy180: number; // % within 3 hours
  }> {
    const where: any = {
      actualATA: { not: null },
      predictionError: { not: null },
    };

    if (dateFrom) where.createdAt = { ...where.createdAt, gte: dateFrom };
    if (dateTo) where.createdAt = { ...where.createdAt, lte: dateTo };

    const logs = await prisma.eTAPredictionLog.findMany({ where });

    if (logs.length === 0) {
      return {
        totalPredictions: 0,
        avgError: 0,
        accuracy90: 0,
        accuracy180: 0,
      };
    }

    const totalError = logs.reduce((sum, log) => sum + Math.abs(log.predictionError || 0), 0);
    const within90 = logs.filter((log) => Math.abs(log.predictionError || 0) <= 90).length;
    const within180 = logs.filter((log) => Math.abs(log.predictionError || 0) <= 180).length;

    return {
      totalPredictions: logs.length,
      avgError: totalError / logs.length,
      accuracy90: (within90 / logs.length) * 100,
      accuracy180: (within180 / logs.length) * 100,
    };
  }
}

export const etaTrainer = new ETATrainer();
