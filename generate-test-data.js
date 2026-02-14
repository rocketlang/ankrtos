/**
 * Generate Realistic Test Data with Known Anomalies
 * Based on actual NIFTY patterns from 2024
 */

const fs = require('fs');
const path = require('path');

function generateRealisticNIFTYData() {
  console.log('📊 Generating realistic NIFTY data with known anomalies...\n');

  const data = [];
  const startDate = new Date('2024-01-01');
  const basePrice = 21500;
  let price = basePrice;

  // Known events (ground truth for testing)
  const knownEvents = {
    '2024-02-01': { type: 'SPIKE', magnitude: 800, reason: 'Budget day surge' },
    '2024-03-15': { type: 'DROP', magnitude: -600, reason: 'Global market selloff' },
    '2024-06-04': { type: 'SPIKE', magnitude: 1200, reason: 'Election results rally' },
    '2024-07-23': { type: 'SPIKE', magnitude: 500, reason: 'RBI policy positive' },
    '2024-09-10': { type: 'DROP', magnitude: -700, reason: 'Geopolitical tensions' },
    '2024-10-15': { type: 'SPIKE', magnitude: 600, reason: 'Q2 earnings beat' },
    '2024-12-05': { type: 'SPIKE', magnitude: 400, reason: 'FII buying surge' }
  };

  for (let day = 0; day < 365; day++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);
    const dateStr = date.toISOString().split('T')[0];

    // Normal random walk
    const dailyChange = (Math.random() - 0.5) * 150;

    // Check for known events
    const event = knownEvents[dateStr];
    const eventImpact = event ? event.magnitude : 0;

    // Apply changes
    price = price + dailyChange + eventImpact;
    price = Math.max(19000, Math.min(25000, price));

    // Volume surge on event days
    const baseVolume = 1000000;
    const volumeMultiplier = event ? 2.5 : (1 + Math.random() * 0.3);
    const volume = baseVolume * volumeMultiplier;

    // IV spike on event days
    const baseIV = 15;
    const ivSpike = event ? 8 : 0;
    const iv = baseIV + Math.random() * 5 + ivSpike;

    data.push({
      timestamp: date,
      symbol: 'NIFTY',
      price: Math.round(price * 100) / 100,
      volume: Math.round(volume),
      openInterest: Math.round(2000000 + Math.random() * 500000),
      impliedVolatility: Math.round(iv * 100) / 100,
      bidAskSpread: Math.round((0.5 + Math.random() * 2) * 100) / 100,
      algorithmSignals: generateAlgorithmSignals(event),
      vix: Math.round((baseIV + Math.random() * 8 + (event ? 5 : 0)) * 100) / 100,
      marketPhase: 'TRADING',
      // Ground truth
      isAnomaly: !!event,
      anomalyType: event?.type,
      anomalyReason: event?.reason
    });
  }

  console.log(`✓ Generated ${data.length} days of data`);
  console.log(`✓ Included ${Object.keys(knownEvents).length} known anomalies\n`);

  return { data, knownEvents };
}

function generateAlgorithmSignals(event) {
  // 13 algorithm signals
  const algorithms = [
    'IV_SKEW', 'VEGA_HEDGING', 'GAMMA_SCALPING', 'STRADDLE',
    'DELTA_NEUTRAL', 'THETA_DECAY', 'VEGA_RISK',
    'ORDER_FLOW', 'VOLUME_PROFILE', 'PUT_CALL_RATIO',
    'FEAR_GREED', 'VIX_ANALYSIS', 'NEWS_SENTIMENT'
  ];

  return algorithms.map(algo => {
    let confidence;
    let signal;

    if (event) {
      // On anomaly days, create some disagreement
      const agree = Math.random() > 0.4; // 60% agreement
      signal = event.type === 'SPIKE' ? (agree ? 'BUY' : 'SELL') : (agree ? 'SELL' : 'BUY');
      confidence = 60 + Math.random() * 30;
    } else {
      // Normal days, more consensus
      const options = ['BUY', 'SELL', 'NEUTRAL'];
      signal = options[Math.floor(Math.random() * 3)];
      confidence = 70 + Math.random() * 20;
    }

    return {
      algorithm: algo,
      signal,
      confidence: Math.round(confidence * 10) / 10,
      reason: `${algo} analysis`
    };
  });
}

function createLabels(knownEvents) {
  const lines = [
    '# Labeled Anomalies (Ground Truth)',
    '# Format: date,symbol,type,severity,reason',
    '# This file contains KNOWN anomalies for testing algorithm effectiveness',
    ''
  ];

  Object.entries(knownEvents).forEach(([date, event]) => {
    const severity = Math.abs(event.magnitude) > 700 ? 'CRITICAL' : 'WARNING';
    const type = event.type === 'SPIKE' ? 'PRICE_SPIKE' : 'PRICE_DROP';
    lines.push(`${date},NIFTY,${type},${severity},${event.reason}`);
  });

  return lines.join('\n');
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║          GENERATING REALISTIC TEST DATA                       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const { data, knownEvents } = generateRealisticNIFTYData();

  // Save data
  const outputDir = path.join(__dirname, 'ankr-labs-nx/packages/vyomo-anomaly-agent/data');
  const dataPath = path.join(outputDir, 'real-market-data.json');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  console.log(`✅ Saved ${data.length} data points to:`);
  console.log(`   ${dataPath}\n`);

  // Save ground truth labels
  const labelPath = path.join(outputDir, 'labeled-anomalies.csv');
  fs.writeFileSync(labelPath, createLabels(knownEvents));

  console.log(`📝 Saved ${Object.keys(knownEvents).length} labeled anomalies to:`);
  console.log(`   ${labelPath}\n`);

  // Print summary
  console.log('📊 DATA SUMMARY');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log(`Total Days:        ${data.length}`);
  console.log(`Date Range:        ${data[0].timestamp.split('T')[0]} to ${data[data.length-1].timestamp.split('T')[0]}`);
  console.log(`Price Range:       ₹${Math.min(...data.map(d => d.price)).toFixed(2)} - ₹${Math.max(...data.map(d => d.price)).toFixed(2)}`);
  console.log(`Known Anomalies:   ${Object.keys(knownEvents).length}`);
  console.log('');

  console.log('🎯 KNOWN ANOMALIES (Ground Truth)');
  console.log('─────────────────────────────────────────────────────────────────');
  Object.entries(knownEvents).forEach(([date, event]) => {
    console.log(`${date}  ${event.type.padEnd(6)}  ${(event.magnitude > 0 ? '+' : '') + event.magnitude.toString().padEnd(6)}  ${event.reason}`);
  });
  console.log('');

  console.log('🚀 Next Step: Run algorithm effectiveness analysis');
  console.log('   This will test ALL 27 algorithms against this data\n');
}

main().catch(console.error);
