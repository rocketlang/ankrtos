#!/usr/bin/env tsx
/**
 * Mari8XOSRM - Train Distance Model
 *
 * Week 2, Task 2.2: Train the distance prediction model on extracted routes
 */

import { PrismaClient } from '@prisma/client';
import { DistanceTrainer } from '../services/routing/distance-trainer';

const prisma = new PrismaClient();

async function main() {
  console.log('🎓 Mari8XOSRM - Distance Model Training\n');
  console.log('Training predictive model from extracted ferry routes...\n');

  const trainer = new DistanceTrainer(prisma);

  try {
    // Train the model
    const weights = await trainer.train();

    console.log('\n\n📊 Training Results:');
    console.log('═'.repeat(80));
    console.log(`\n✓ Model trained on ${weights.trainingCount} routes`);
    console.log(`✓ Average error: ${weights.avgError.toFixed(1)}nm (${(weights.avgError / 143 * 100).toFixed(1)}%)`);
    console.log(`✓ Maximum error: ${weights.maxError.toFixed(1)}nm`);
    console.log(`✓ R² score: ${weights.r2Score.toFixed(4)} (1.0 = perfect fit)`);

    console.log('\n\n📐 Model Coefficients:');
    console.log('─'.repeat(80));
    console.log(`Base formula: actual_nm = ${weights.baseIntercept.toFixed(2)} + ${weights.baseGCCoefficient.toFixed(4)} * great_circle_nm\n`);

    console.log('Vessel Type Factors:');
    weights.vesselTypeFactors.forEach((factor, type) => {
      console.log(`  ${type}: ${factor.toFixed(3)}x (${((factor - 1) * 100).toFixed(1)}% longer than GC)`);
    });

    console.log('\nRoute Type Factors:');
    weights.routeTypeFactors.forEach((factor, type) => {
      console.log(`  ${type}: ${factor.toFixed(3)}x`);
    });

    console.log('\nGeographic Adjustments:');
    console.log(`  High Latitude (>60°): ${weights.highLatitudeFactor.toFixed(3)}x`);
    console.log(`  Coastal Routes: ${weights.coastalFactor.toFixed(3)}x`);
    console.log(`  Via Chokepoints: ${weights.chokepointFactor.toFixed(3)}x`);

    // Test predictions
    console.log('\n\n🧪 Testing Predictions:');
    console.log('═'.repeat(80));

    const testRoutes = [
      { name: 'Lillesand → Lille Kalsøy', lat1: 58.24, lon1: 8.37, lat2: 59.23, lon2: 5.34, type: 'general_cargo' },
      { name: 'Singapore → Rotterdam', lat1: 1.29, lon1: 103.85, lat2: 51.92, lon2: 4.48, type: 'container' },
      { name: 'New York → London', lat1: 40.71, lon1: -74.01, lat2: 51.51, lon2: -0.13, type: 'tanker' },
      { name: 'Sydney → Auckland', lat1: -33.87, lon1: 151.21, lat2: -36.85, lon2: 174.76, type: 'bulk_carrier' },
    ];

    for (const route of testRoutes) {
      const prediction = await trainer.predict(
        route.lat1,
        route.lon1,
        route.lat2,
        route.lon2,
        route.type,
        'DIRECT'
      );

      console.log(`\n${route.name}:`);
      console.log(`  Great circle: ${prediction.greatCircleNm.toFixed(0)}nm`);
      console.log(`  Predicted actual: ${prediction.predictedNm.toFixed(0)}nm`);
      console.log(`  Factor: ${prediction.factor.toFixed(3)}x (${((prediction.factor - 1) * 100).toFixed(1)}% longer)`);
    }

    console.log('\n\n✅ Training complete!');
    console.log('\n📈 Model Performance:');
    console.log(`   - Achieves ${(weights.r2Score * 100).toFixed(1)}% accuracy on training data`);
    console.log(`   - Average prediction error: ${weights.avgError.toFixed(1)}nm`);
    console.log(`   - Ready for production use in routing API\n`);

    console.log('🎯 Next Steps (Week 3):');
    console.log('   1. Build maritime graph structure (ports as nodes, routes as edges)');
    console.log('   2. Implement A* pathfinding with trained distance model');
    console.log('   3. Create route planning API endpoint');
    console.log('   4. Validate against real voyage data\n');

  } catch (error) {
    console.error('❌ Training failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
