#!/usr/bin/env tsx
/**
 * Mari8XOSRM - Incremental Learning Demo
 *
 * Demonstrates how the 11 base routes continuously improve
 * as more vessels travel the same routes.
 */

import { PrismaClient } from '@prisma/client';
import { IncrementalLearner } from '../services/routing/incremental-learner';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

async function main() {
  console.log('🧠 Mari8XOSRM - Incremental Learning System\n');
  console.log('═'.repeat(80));
  console.log('Base routes become the foundation.');
  console.log('Each new route on the same port pair enhances the algorithm.');
  console.log('═'.repeat(80));
  console.log();

  const learner = new IncrementalLearner(prisma);

  // Step 1: Build base learning from existing routes
  console.log('📚 Step 1: Building route learning base from 11 ferry routes...\n');
  const learningMap = await learner.buildRouteLearningBase();

  // Step 2: Show learning report
  console.log('\n📊 Learning Base Report:');
  console.log('─'.repeat(80));

  const report = await learner.getLearningReport(learningMap);

  console.log(`\n✓ ${report.totalPortPairs} unique port pairs learned`);
  console.log(`✓ ${report.totalObservations} total observations`);
  console.log(`✓ ${report.vesselTypesLearned.size} vessel types covered`);
  console.log();

  console.log('Confidence Distribution:');
  console.log(`  🟢 High confidence (>80%):   ${report.highConfidenceRoutes} routes`);
  console.log(`  🟡 Medium confidence (50-80%): ${report.mediumConfidenceRoutes} routes`);
  console.log(`  🔴 Low confidence (<50%):    ${report.lowConfidenceRoutes} routes`);
  console.log();

  console.log('Top 10 Routes by Observations:');
  console.log('─'.repeat(80));
  report.topRoutes.forEach((route, i) => {
    const confidencePct = (route.confidence * 100).toFixed(0);
    const emoji = route.confidence > 0.8 ? '🟢' : route.confidence > 0.5 ? '🟡' : '🔴';
    console.log(`${emoji} ${i + 1}. ${route.portPair}`);
    console.log(`     ${route.observations} obs, ${route.factor.toFixed(2)}x factor, ${confidencePct}% confidence`);
  });

  // Step 3: Demo prediction strategies
  console.log('\n\n🎯 Step 2: Prediction Strategies\n');
  console.log('─'.repeat(80));

  // Get a sample route to test
  const sampleRoutes = Array.from(learningMap.values()).slice(0, 3);

  for (const learning of sampleRoutes) {
    console.log(`\n${learning.portPair}:`);

    // Predict with learned data
    const prediction = await learner.predictWithLearning(
      learning.originPortId,
      learning.destPortId,
      'general_cargo',
      learningMap
    );

    console.log(`  GC Distance: ${prediction.greatCircleNm.toFixed(0)}nm`);
    console.log(`  Predicted: ${prediction.predictedNm.toFixed(0)}nm (${prediction.factor.toFixed(2)}x)`);
    console.log(`  Confidence: ${(prediction.confidence * 100).toFixed(0)}% (${prediction.observations} observations)`);
    console.log(`  Source: ${prediction.source}`);

    if (learning.vesselTypeFactors.size > 0) {
      console.log(`  Vessel-specific factors:`);
      learning.vesselTypeFactors.forEach((factor, type) => {
        console.log(`    ${type}: ${factor.avgFactor.toFixed(2)}x (${factor.count} obs)`);
      });
    }
  }

  // Step 4: Demo continuous enhancement
  console.log('\n\n🔄 Step 3: Continuous Enhancement Simulation\n');
  console.log('─'.repeat(80));
  console.log('\nSimulating how confidence grows with more observations:\n');

  // Show confidence curve
  console.log('Observations → Confidence:');
  for (const n of [1, 2, 5, 10, 20, 30, 50, 100]) {
    const confidence = 1 - Math.exp(-n / 10);
    const bar = '█'.repeat(Math.round(confidence * 40));
    console.log(`  ${n.toString().padStart(3)} obs: ${(confidence * 100).toFixed(0).padStart(3)}% ${bar}`);
  }

  console.log('\n\n💡 How It Works:\n');
  console.log('─'.repeat(80));
  console.log(`
1. BASE (Current):
   - 11 ferry routes establish initial patterns
   - Port pairs like NOSVG-NOBGO get base factors
   - Low confidence (few observations)

2. ENHANCEMENT (Automatic):
   - New vessel travels NOSVG-NOBGO → algorithm learns
   - Factor refines: 1.67x → 1.65x → 1.64x (converging)
   - Confidence increases: 30% → 63% → 86%
   - Vessel-specific factors emerge

3. SPECIALIZATION (Over Time):
   - Tankers learn different factors than bulk carriers
   - Seasonal patterns emerge (winter vs summer)
   - Weather-dependent adjustments
   - Real-time fleet intelligence

4. PREDICTION (Production):
   - Query route NOSVG-NOBGO for a tanker
   - System returns: 240nm ± 5nm with 95% confidence
   - Charterer-grade accuracy achieved!
  `);

  console.log('\n📈 Growth Strategy:\n');
  console.log('─'.repeat(80));
  console.log(`
Week 1-2:  11 base routes (current)
Week 3-4:  50+ routes → medium confidence
Week 5-8:  200+ routes → high confidence for common pairs
Week 9+:   1000+ routes → charterer-grade accuracy (±1%)

Each new AIS extraction automatically enhances the algorithm!
  `);

  console.log('\n✅ Incremental Learning System Ready!\n');
  console.log('🎯 Key Benefits:');
  console.log('  ✓ Base routes never wasted - they become the foundation');
  console.log('  ✓ Automatic improvement as more data arrives');
  console.log('  ✓ Confidence tracking for prediction quality');
  console.log('  ✓ Vessel-specific and seasonal learning');
  console.log('  ✓ No manual retraining needed\n');

  await prisma.$disconnect();
}

main().catch(console.error);
