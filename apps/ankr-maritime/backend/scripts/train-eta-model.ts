#!/usr/bin/env tsx
/**
 * Train ETA Prediction ML Model
 *
 * Usage:
 *   tsx scripts/train-eta-model.ts [months]
 *
 * Example:
 *   tsx scripts/train-eta-model.ts 6  # Train on last 6 months
 */

import { etaTrainer } from '../src/services/ml/eta-trainer.js';

async function main() {
  const months = parseInt(process.argv[2] || '6');

  console.log('🚀 ETA ML Model Training Script');
  console.log('================================\n');
  console.log(`Training on last ${months} months of voyage data...\n`);

  try {
    // Extract historical data
    console.log('📊 Step 1: Extracting historical voyage data...');
    const data = await etaTrainer.extractHistoricalData(months);

    if (data.length === 0) {
      console.log('⚠️  No training data available.');
      console.log('💡 Tip: Complete some voyages with actual arrival times to train the model.\n');
      process.exit(0);
    }

    console.log(`✅ Extracted ${data.length} training samples\n`);

    // Train model
    console.log('🤖 Step 2: Training ML model...');
    const model = await etaTrainer.trainModel(data);

    console.log('\n✅ Model Training Complete!');
    console.log('==========================\n');
    console.log('📈 Model Statistics:');
    console.log(`   Version: ${model.version}`);
    console.log(`   Trained: ${model.trainedAt.toISOString()}`);
    console.log(`   Samples: ${model.accuracy.totalSamples}`);
    console.log(`   Avg Error: ${model.accuracy.avgError.toFixed(1)} minutes`);
    console.log(`   Within 1h: ${model.accuracy.within1Hour.toFixed(1)}%`);
    console.log(`   Within 3h: ${model.accuracy.within3Hours.toFixed(1)}%`);
    console.log(`   Within 6h: ${model.accuracy.within6Hours.toFixed(1)}%`);
    console.log('\n🎯 Target Accuracy: 80%+ within 3 hours');

    if (model.accuracy.within3Hours >= 80) {
      console.log('✅ Model meets target accuracy!\n');
    } else {
      console.log('⚠️  Model below target. More training data needed.\n');
    }

    console.log('💡 The model will improve automatically as more voyages are completed.\n');
  } catch (error: any) {
    console.error('❌ Training failed:', error.message);
    process.exit(1);
  }
}

main();
