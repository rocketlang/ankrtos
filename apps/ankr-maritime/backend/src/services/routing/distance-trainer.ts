/**
 * Mari8XOSRM - Distance Training Model
 *
 * Trains a model to predict actual sailed distances from great circle distances
 * using real AIS route data. This creates charterer-grade accurate estimates.
 *
 * Week 2, Task 2.1: Build Distance Training Model
 */

import { PrismaClient } from '@prisma/client';
import { createChildLogger } from '../../utils/logger';

const logger = createChildLogger({ module: 'distance-trainer' });

interface RouteFeatures {
  // Geographic features
  greatCircleNm: number;
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  latDelta: number;
  lonDelta: number;

  // Route characteristics
  vesselType: string;
  routeType: string;

  // Computed features
  isHighLatitude: boolean; // Above 60° or below -60°
  crossesEquator: boolean;
  isCoastal: boolean;
  hasChokepoints: boolean;
}

interface TrainingExample {
  features: RouteFeatures;
  actualDistanceNm: number;
  distanceFactor: number;
}

interface ModelWeights {
  // Base model
  baseIntercept: number;
  baseGCCoefficient: number;

  // Vessel type adjustments
  vesselTypeFactors: Map<string, number>;

  // Route type adjustments
  routeTypeFactors: Map<string, number>;

  // Geographic adjustments
  highLatitudeFactor: number;
  coastalFactor: number;
  chokepointFactor: number;

  // Model metadata
  trainingCount: number;
  avgError: number;
  maxError: number;
  r2Score: number;
}

export class DistanceTrainer {
  constructor(private prisma: PrismaClient) {}

  /**
   * Train the distance model on extracted routes
   */
  async train(): Promise<ModelWeights> {
    logger.info('🎓 Starting distance model training...');

    // Load training data
    const routes = await this.loadTrainingData();
    logger.info(`Loaded ${routes.length} training examples`);

    if (routes.length < 5) {
      throw new Error('Insufficient training data. Need at least 5 routes.');
    }

    // Extract features
    const examples = routes.map(route => this.extractFeatures(route));

    // Train model using linear regression with feature engineering
    const weights = await this.trainModel(examples);

    // Validate model
    const validation = this.validateModel(examples, weights);
    logger.info(`Model validation: ${JSON.stringify(validation)}`);

    // Save model to database (as JSON)
    await this.saveModel(weights);

    logger.info('✅ Training complete!');
    return weights;
  }

  /**
   * Load extracted routes for training
   */
  private async loadTrainingData() {
    const routes = await this.prisma.extractedAISRoute.findMany({
      where: {
        qualityScore: { gte: 0.7 }, // Only high-quality routes
        actualSailedNm: { gt: 5 }, // Exclude very short routes
      },
      include: {
        originPort: {
          select: {
            latitude: true,
            longitude: true,
            name: true,
          },
        },
        destPort: {
          select: {
            latitude: true,
            longitude: true,
            name: true,
          },
        },
      },
      orderBy: { qualityScore: 'desc' },
    });

    return routes;
  }

  /**
   * Extract features from a route for model training
   */
  private extractFeatures(route: any): TrainingExample {
    const startLat = route.originPort.latitude;
    const startLon = route.originPort.longitude;
    const endLat = route.destPort.latitude;
    const endLon = route.destPort.longitude;

    const latDelta = Math.abs(endLat - startLat);
    const lonDelta = Math.abs(endLon - startLon);

    const isHighLatitude = Math.abs(startLat) > 60 || Math.abs(endLat) > 60;
    const crossesEquator = (startLat > 0 && endLat < 0) || (startLat < 0 && endLat > 0);
    const isCoastal = route.routeType === 'COASTAL';
    const hasChokepoints = route.viaPoints && route.viaPoints.length > 0;

    return {
      features: {
        greatCircleNm: route.greatCircleNm,
        startLat,
        startLon,
        endLat,
        endLon,
        latDelta,
        lonDelta,
        vesselType: route.vesselType,
        routeType: route.routeType,
        isHighLatitude,
        crossesEquator,
        isCoastal,
        hasChokepoints,
      },
      actualDistanceNm: route.actualSailedNm,
      distanceFactor: route.distanceFactor,
    };
  }

  /**
   * Train the model using multiple linear regression
   */
  private async trainModel(examples: TrainingExample[]): Promise<ModelWeights> {
    logger.info('Training linear regression model...');

    // Calculate base model (simple: actual = baseIntercept + baseGC * greatCircle)
    const { intercept, coefficient } = this.linearRegression(
      examples.map(e => e.features.greatCircleNm),
      examples.map(e => e.actualDistanceNm)
    );

    logger.info(`Base model: actual = ${intercept.toFixed(2)} + ${coefficient.toFixed(4)} * GC`);

    // Calculate vessel type factors (how much each vessel type deviates from base)
    const vesselTypeFactors = new Map<string, number>();
    const vesselTypes = [...new Set(examples.map(e => e.features.vesselType))];

    for (const vesselType of vesselTypes) {
      const typeExamples = examples.filter(e => e.features.vesselType === vesselType);
      const avgFactor = typeExamples.reduce((sum, e) => sum + e.distanceFactor, 0) / typeExamples.length;
      vesselTypeFactors.set(vesselType, avgFactor);
      logger.info(`  ${vesselType}: ${avgFactor.toFixed(3)}x factor`);
    }

    // Calculate route type factors
    const routeTypeFactors = new Map<string, number>();
    const routeTypes = [...new Set(examples.map(e => e.features.routeType))];

    for (const routeType of routeTypes) {
      const typeExamples = examples.filter(e => e.features.routeType === routeType);
      const avgFactor = typeExamples.reduce((sum, e) => sum + e.distanceFactor, 0) / typeExamples.length;
      routeTypeFactors.set(routeType, avgFactor);
      logger.info(`  ${routeType}: ${avgFactor.toFixed(3)}x factor`);
    }

    // Calculate geographic factors
    const highLatExamples = examples.filter(e => e.features.isHighLatitude);
    const highLatitudeFactor = highLatExamples.length > 0
      ? highLatExamples.reduce((sum, e) => sum + e.distanceFactor, 0) / highLatExamples.length
      : 1.0;

    const coastalExamples = examples.filter(e => e.features.isCoastal);
    const coastalFactor = coastalExamples.length > 0
      ? coastalExamples.reduce((sum, e) => sum + e.distanceFactor, 0) / coastalExamples.length
      : 1.0;

    const chokepointExamples = examples.filter(e => e.features.hasChokepoints);
    const chokepointFactor = chokepointExamples.length > 0
      ? chokepointExamples.reduce((sum, e) => sum + e.distanceFactor, 0) / chokepointExamples.length
      : 1.0;

    logger.info(`Geographic factors:`);
    logger.info(`  High latitude: ${highLatitudeFactor.toFixed(3)}x`);
    logger.info(`  Coastal: ${coastalFactor.toFixed(3)}x`);
    logger.info(`  Chokepoints: ${chokepointFactor.toFixed(3)}x`);

    // Calculate model accuracy
    const predictions = examples.map(e => this.predictWithWeights(e.features, {
      baseIntercept: intercept,
      baseGCCoefficient: coefficient,
      vesselTypeFactors,
      routeTypeFactors,
      highLatitudeFactor,
      coastalFactor,
      chokepointFactor,
      trainingCount: examples.length,
      avgError: 0,
      maxError: 0,
      r2Score: 0,
    }));

    const errors = examples.map((e, i) => Math.abs(predictions[i] - e.actualDistanceNm));
    const avgError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    const maxError = Math.max(...errors);

    // Calculate R² score
    const mean = examples.reduce((sum, e) => sum + e.actualDistanceNm, 0) / examples.length;
    const totalSS = examples.reduce((sum, e) => sum + Math.pow(e.actualDistanceNm - mean, 2), 0);
    const residualSS = examples.reduce((sum, e, i) => sum + Math.pow(e.actualDistanceNm - predictions[i], 2), 0);
    const r2Score = 1 - (residualSS / totalSS);

    return {
      baseIntercept: intercept,
      baseGCCoefficient: coefficient,
      vesselTypeFactors,
      routeTypeFactors,
      highLatitudeFactor,
      coastalFactor,
      chokepointFactor,
      trainingCount: examples.length,
      avgError,
      maxError,
      r2Score,
    };
  }

  /**
   * Simple linear regression: y = a + bx
   */
  private linearRegression(x: number[], y: number[]): { intercept: number; coefficient: number } {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const coefficient = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - coefficient * sumX) / n;

    return { intercept, coefficient };
  }

  /**
   * Predict distance using trained weights
   */
  private predictWithWeights(features: RouteFeatures, weights: ModelWeights): number {
    // Base prediction
    let prediction = weights.baseIntercept + weights.baseGCCoefficient * features.greatCircleNm;

    // Apply vessel type factor
    const vesselFactor = weights.vesselTypeFactors.get(features.vesselType) || 1.0;
    prediction *= vesselFactor;

    // Apply route type factor
    const routeFactor = weights.routeTypeFactors.get(features.routeType) || 1.0;
    prediction *= (routeFactor / vesselFactor); // Normalize to avoid double-counting

    // Apply geographic adjustments
    if (features.isHighLatitude) {
      prediction *= weights.highLatitudeFactor;
    }
    if (features.isCoastal) {
      prediction *= (weights.coastalFactor / 1.0);
    }
    if (features.hasChokepoints) {
      prediction *= weights.chokepointFactor;
    }

    return prediction;
  }

  /**
   * Validate model accuracy
   */
  private validateModel(examples: TrainingExample[], weights: ModelWeights) {
    const predictions = examples.map(e => this.predictWithWeights(e.features, weights));
    const errors = examples.map((e, i) => Math.abs(predictions[i] - e.actualDistanceNm));
    const percentErrors = examples.map((e, i) => Math.abs(predictions[i] - e.actualDistanceNm) / e.actualDistanceNm * 100);

    return {
      avgError: errors.reduce((a, b) => a + b, 0) / errors.length,
      maxError: Math.max(...errors),
      avgPercentError: percentErrors.reduce((a, b) => a + b, 0) / percentErrors.length,
      maxPercentError: Math.max(...percentErrors),
      r2Score: weights.r2Score,
    };
  }

  /**
   * Save model to database
   */
  private async saveModel(weights: ModelWeights) {
    // Convert Map to plain object for JSON serialization
    const modelData = {
      baseIntercept: weights.baseIntercept,
      baseGCCoefficient: weights.baseGCCoefficient,
      vesselTypeFactors: Object.fromEntries(weights.vesselTypeFactors),
      routeTypeFactors: Object.fromEntries(weights.routeTypeFactors),
      highLatitudeFactor: weights.highLatitudeFactor,
      coastalFactor: weights.coastalFactor,
      chokepointFactor: weights.chokepointFactor,
      trainingCount: weights.trainingCount,
      avgError: weights.avgError,
      maxError: weights.maxError,
      r2Score: weights.r2Score,
      trainedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    // Store in a config/settings table or file
    // For now, log it (in production, save to database)
    logger.info('Model trained and ready for use');
    logger.info(JSON.stringify(modelData, null, 2));

    // TODO: Save to database table (e.g., routing_models or config)
  }

  /**
   * Predict actual distance for a new route
   */
  async predict(
    originLat: number,
    originLon: number,
    destLat: number,
    destLon: number,
    vesselType: string = 'general_cargo',
    routeType: string = 'DIRECT'
  ): Promise<{ predictedNm: number; greatCircleNm: number; factor: number }> {
    // Calculate great circle distance
    const greatCircleNm = this.haversineDistance(originLat, originLon, destLat, destLon);

    // For now, use simple average factor from training data
    // In production, load saved model weights
    const routes = await this.prisma.extractedAISRoute.findMany({
      where: { vesselType },
      select: { distanceFactor: true },
    });

    let factor = 1.2; // Default 20% longer
    if (routes.length > 0) {
      factor = routes.reduce((sum, r) => sum + r.distanceFactor, 0) / routes.length;
    }

    const predictedNm = greatCircleNm * factor;

    return { predictedNm, greatCircleNm, factor };
  }

  /**
   * Haversine distance calculation
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3440.065; // Earth's radius in nautical miles
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
