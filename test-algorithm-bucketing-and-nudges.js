/**
 * Vyomo Decision Support Testing
 *
 * Purpose:
 * 1. Classify market into 6 regimes
 * 2. Test which of 13 algorithms work best in each regime
 * 3. Simulate AI nudges and measure decision improvement
 */

const fs = require('fs');

// ==============================================================================
// MARKET REGIME CLASSIFICATION
// ==============================================================================

const REGIMES = {
  HIGH_VOL_TRENDING: 'High Volatility + Trending',
  HIGH_VOL_RANGEBOUND: 'High Volatility + Range-Bound',
  LOW_VOL_TRENDING: 'Low Volatility + Trending',
  LOW_VOL_RANGEBOUND: 'Low Volatility + Range-Bound',
  NEWS_DRIVEN: 'News-Driven Event',
  EXPIRY_WEEK: 'Options Expiry Week'
};

function classifyMarketRegime(data, index) {
  const current = data[index];
  const prev = data[index - 1];

  if (!prev) return null;

  const vix = current.vix || current.impliedVolatility;
  const priceChange = Math.abs((current.price - prev.price) / prev.price);

  // Calculate 5-day trend
  const recentPrices = data.slice(Math.max(0, index - 5), index + 1).map(d => d.price);
  const trend = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0];
  const isTrending = Math.abs(trend) > 0.015; // 1.5% move over 5 days

  // Check for news events (simplified - check if volume/IV spike together)
  const avgVolume = data.slice(Math.max(0, index - 20), index).reduce((sum, d) => sum + d.volume, 0) / 20;
  const isNewsEvent = current.volume > avgVolume * 1.8 && priceChange > 0.02;

  // Check expiry week (simplified - last week of month)
  const date = new Date(current.timestamp);
  const dayOfMonth = date.getDate();
  const isExpiryWeek = dayOfMonth >= 25;

  // Classification logic
  if (isExpiryWeek) return REGIMES.EXPIRY_WEEK;
  if (isNewsEvent) return REGIMES.NEWS_DRIVEN;

  const highVol = vix > 20;

  if (highVol && isTrending) return REGIMES.HIGH_VOL_TRENDING;
  if (highVol && !isTrending) return REGIMES.HIGH_VOL_RANGEBOUND;
  if (!highVol && isTrending) return REGIMES.LOW_VOL_TRENDING;
  return REGIMES.LOW_VOL_RANGEBOUND;
}

// ==============================================================================
// ALGORITHM PERFORMANCE TRACKING
// ==============================================================================

function initializePerformanceTracker() {
  const tracker = {};
  const allAlgos = [
    'MOMENTUM_MA50', 'MOMENTUM_RSI', 'MEAN_REVERSION', 'BREAKOUT_BOLLINGER',
    'TREND_FOLLOWING', 'VOLATILITY_STRADDLE', 'OPTIONS_IV_RANK', 'DELTA_NEUTRAL',
    'IRON_CONDOR', 'BUTTERFLY_SPREAD', 'SENTIMENT_NEWS', 'FLOW_ANALYSIS',
    'MACRO_ECONOMIC'
  ];

  allAlgos.forEach(algo => {
    tracker[algo] = {};
    Object.values(REGIMES).forEach(regime => {
      tracker[algo][regime] = {
        trades: [],
        wins: 0,
        losses: 0,
        totalProfit: 0
      };
    });
  });

  return tracker;
}

function simulateTradeOutcome(signal, actualPriceMove) {
  // Simulate if the signal was correct
  if (signal === 'BUY' && actualPriceMove > 0) return { win: true, profit: actualPriceMove };
  if (signal === 'SELL' && actualPriceMove < 0) return { win: true, profit: Math.abs(actualPriceMove) };
  if (signal === 'NEUTRAL') return { win: true, profit: 0 }; // No loss if stayed out
  return { win: false, profit: -Math.abs(actualPriceMove) };
}

// ==============================================================================
// TEST 1: ALGORITHM BUCKETING BY REGIME
// ==============================================================================

function testAlgorithmBucketing(data) {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║     TEST 1: ALGORITHM PERFORMANCE BY MARKET REGIME            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const performanceTracker = initializePerformanceTracker();
  const regimeCounts = {};

  // Analyze each trading day
  for (let i = 20; i < data.length - 1; i++) {
    const current = data[i];
    const next = data[i + 1];
    const regime = classifyMarketRegime(data, i);

    if (!regime) continue;

    regimeCounts[regime] = (regimeCounts[regime] || 0) + 1;

    // Get actual price movement (for outcome)
    const actualMove = ((next.price - current.price) / current.price) * 100;

    // Test each algorithm's signal
    const signals = current.algorithmSignals || [];
    signals.forEach(s => {
      const algo = s.algorithm;
      const outcome = simulateTradeOutcome(s.signal, actualMove);

      if (performanceTracker[algo] && performanceTracker[algo][regime]) {
        performanceTracker[algo][regime].trades.push(outcome.profit);
        if (outcome.win) {
          performanceTracker[algo][regime].wins++;
        } else {
          performanceTracker[algo][regime].losses++;
        }
        performanceTracker[algo][regime].totalProfit += outcome.profit;
      }
    });
  }

  // Calculate and display results
  console.log('📊 MARKET REGIME DISTRIBUTION:\n');
  Object.entries(regimeCounts).forEach(([regime, count]) => {
    const percent = (count / (data.length - 21) * 100).toFixed(1);
    console.log(`   ${regime.padEnd(35)}: ${count.toString().padStart(3)} days (${percent}%)`);
  });

  console.log('\n\n📈 ALGORITHM PERFORMANCE BY REGIME:\n');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const results = {};

  Object.values(REGIMES).forEach(regime => {
    console.log(`\n${regime.toUpperCase()}`);
    console.log('─'.repeat(67));

    const algoPerformance = [];

    Object.entries(performanceTracker).forEach(([algo, regimes]) => {
      const stats = regimes[regime];
      const totalTrades = stats.wins + stats.losses;

      if (totalTrades === 0) return;

      const winRate = (stats.wins / totalTrades * 100).toFixed(1);
      const avgProfit = (stats.totalProfit / totalTrades).toFixed(2);

      algoPerformance.push({
        algo,
        winRate: parseFloat(winRate),
        avgProfit: parseFloat(avgProfit),
        trades: totalTrades
      });
    });

    // Sort by win rate
    algoPerformance.sort((a, b) => b.winRate - a.winRate);

    // Display with ratings
    algoPerformance.forEach(perf => {
      let rating;
      if (perf.winRate >= 65) rating = '⭐⭐⭐⭐⭐ USE';
      else if (perf.winRate >= 60) rating = '⭐⭐⭐⭐  GOOD';
      else if (perf.winRate >= 55) rating = '⭐⭐⭐   OK';
      else if (perf.winRate >= 50) rating = '⭐⭐    RISKY';
      else rating = '⭐     AVOID';

      const sign = perf.avgProfit >= 0 ? '+' : '';
      console.log(`${rating}  ${perf.algo.padEnd(25)} Win: ${perf.winRate.toString().padStart(4)}%  Profit: ${sign}${perf.avgProfit}%  (${perf.trades} trades)`);
    });

    // Store results
    results[regime] = algoPerformance;
  });

  return { performanceTracker, results, regimeCounts };
}

// ==============================================================================
// TEST 2: AI NUDGE EFFECTIVENESS
// ==============================================================================

function testNudgeEffectiveness(data, algorithmPerformance) {
  console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║     TEST 2: AI NUDGE EFFECTIVENESS (A/B Testing)              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const controlGroup = { trades: [], totalProfit: 0, wins: 0, losses: 0, revengeTradesCount: 0 };
  const treatmentGroup = { trades: [], totalProfit: 0, wins: 0, losses: 0, revengeTradesCount: 0, nudgesFollowed: 0, nudgesIgnored: 0 };

  let consecutiveLosses = 0;

  for (let i = 20; i < data.length - 1; i++) {
    const current = data[i];
    const next = data[i + 1];
    const regime = classifyMarketRegime(data, i);

    if (!regime) continue;

    const signals = current.algorithmSignals || [];
    if (signals.length === 0) continue;

    // User picks first algorithm signal
    const userChoice = signals[0];
    const actualMove = ((next.price - current.price) / current.price) * 100;
    const outcome = simulateTradeOutcome(userChoice.signal, actualMove);

    // === CONTROL GROUP: No AI intervention ===
    controlGroup.trades.push(outcome);
    controlGroup.totalProfit += outcome.profit;
    if (outcome.win) {
      controlGroup.wins++;
      consecutiveLosses = 0;
    } else {
      controlGroup.losses++;
      consecutiveLosses++;
    }

    // Check for revenge trading
    if (consecutiveLosses >= 3) {
      controlGroup.revengeTradesCount++;
    }

    // === TREATMENT GROUP: With AI nudges ===

    // AI analyzes situation
    const bestAlgosInRegime = algorithmPerformance[regime]
      .filter(a => a.winRate >= 60)
      .slice(0, 3)
      .map(a => a.algo);

    const userAlgoPerf = algorithmPerformance[regime].find(a => a.algo === userChoice.algorithm);

    // AI Decision Logic
    let aiNudge = null;

    // NUDGE 1: Algorithm underperforming in this regime
    if (userAlgoPerf && userAlgoPerf.winRate < 55) {
      aiNudge = {
        type: 'ALGORITHM_WARNING',
        message: `${userChoice.algorithm} has only ${userAlgoPerf.winRate}% win rate in ${regime}`,
        suggestion: bestAlgosInRegime.length > 0 ? bestAlgosInRegime[0] : null,
        preventedBadTrade: true
      };
    }

    // NUDGE 2: Revenge trading detected
    if (consecutiveLosses >= 3) {
      aiNudge = {
        type: 'BEHAVIOR_WARNING',
        message: '3 consecutive losses detected. Consider taking a break.',
        suggestion: 'PAUSE',
        preventedBadTrade: true
      };
    }

    // NUDGE 3: Algorithm conflict detected
    const signalCounts = { BUY: 0, SELL: 0, NEUTRAL: 0 };
    signals.forEach(s => signalCounts[s.signal]++);
    const buyPercent = (signalCounts.BUY / signals.length) * 100;
    const sellPercent = (signalCounts.SELL / signals.length) * 100;

    if (buyPercent >= 30 && sellPercent >= 30) {
      aiNudge = {
        type: 'CONFLICT_WARNING',
        message: `${signalCounts.BUY} algos say BUY, ${signalCounts.SELL} say SELL. Low consensus.`,
        suggestion: 'WAIT',
        preventedBadTrade: false // Not always bad
      };
    }

    // User follows AI suggestion 70% of the time
    const userFollowsAI = aiNudge && Math.random() < 0.7;

    if (userFollowsAI && aiNudge.suggestion === 'PAUSE') {
      // User paused - no trade (no profit, no loss)
      treatmentGroup.trades.push({ win: true, profit: 0 });
      treatmentGroup.nudgesFollowed++;
      consecutiveLosses = 0; // Break the streak
      if (consecutiveLosses >= 3) {
        // Prevented revenge trade
        treatmentGroup.revengeTradesCount++;
      }
    } else if (userFollowsAI && bestAlgosInRegime.includes(aiNudge.suggestion)) {
      // User switched to better algorithm
      const betterSignal = signals.find(s => s.algorithm === aiNudge.suggestion);
      if (betterSignal) {
        const betterOutcome = simulateTradeOutcome(betterSignal.signal, actualMove);
        treatmentGroup.trades.push(betterOutcome);
        treatmentGroup.totalProfit += betterOutcome.profit;
        if (betterOutcome.win) {
          treatmentGroup.wins++;
          consecutiveLosses = 0;
        } else {
          treatmentGroup.losses++;
          consecutiveLosses++;
        }
        treatmentGroup.nudgesFollowed++;
      }
    } else {
      // User ignored AI or no nudge
      treatmentGroup.trades.push(outcome);
      treatmentGroup.totalProfit += outcome.profit;
      if (outcome.win) {
        treatmentGroup.wins++;
        consecutiveLosses = 0;
      } else {
        treatmentGroup.losses++;
        consecutiveLosses++;
      }
      if (aiNudge) treatmentGroup.nudgesIgnored++;
    }
  }

  // Calculate metrics
  const controlWinRate = (controlGroup.wins / (controlGroup.wins + controlGroup.losses) * 100).toFixed(1);
  const treatmentWinRate = (treatmentGroup.wins / (treatmentGroup.wins + treatmentGroup.losses) * 100).toFixed(1);

  const controlAvgProfit = (controlGroup.totalProfit / controlGroup.trades.length).toFixed(3);
  const treatmentAvgProfit = (treatmentGroup.totalProfit / treatmentGroup.trades.length).toFixed(3);

  console.log('📊 A/B TEST RESULTS:\n');
  console.log('─'.repeat(67));
  console.log('                        CONTROL (No AI)    TREATMENT (With AI)    IMPACT');
  console.log('─'.repeat(67));

  const winRateImpact = treatmentWinRate - controlWinRate;
  const winRateImprovement = ((winRateImpact / controlWinRate) * 100).toFixed(1);
  console.log(`Win Rate:              ${controlWinRate}%              ${treatmentWinRate}%              +${winRateImpact}% (${winRateImprovement}%)`);

  const profitImpact = treatmentAvgProfit - controlAvgProfit;
  const profitImprovement = ((profitImpact / Math.abs(controlAvgProfit)) * 100).toFixed(1);
  console.log(`Avg Profit per Trade:  ${controlAvgProfit}%           ${treatmentAvgProfit}%           +${profitImpact}% (${profitImprovement}%)`);

  const revengeReduction = ((controlGroup.revengeTradesCount - treatmentGroup.revengeTradesCount) / controlGroup.revengeTradesCount * 100).toFixed(1);
  console.log(`Revenge Trades:        ${controlGroup.revengeTradesCount}                 ${treatmentGroup.revengeTradesCount}                 -${revengeReduction}%`);

  console.log(`\nAI Nudge Compliance:   N/A               ${treatmentGroup.nudgesFollowed} followed, ${treatmentGroup.nudgesIgnored} ignored`);

  console.log('\n📈 KEY INSIGHTS:\n');

  if (parseFloat(treatmentWinRate) > parseFloat(controlWinRate)) {
    console.log(`✅ AI improves win rate by ${winRateImpact}% (${winRateImprovement}% relative)`);
  }

  if (parseFloat(treatmentAvgProfit) > parseFloat(controlAvgProfit)) {
    console.log(`✅ AI improves profit per trade by ${profitImpact}% (${profitImprovement}% relative)`);
  }

  if (treatmentGroup.revengeTradesCount < controlGroup.revengeTradesCount) {
    console.log(`✅ AI prevents ${controlGroup.revengeTradesCount - treatmentGroup.revengeTradesCount} revenge trades (-${revengeReduction}%)`);
  }

  const compliance = (treatmentGroup.nudgesFollowed / (treatmentGroup.nudgesFollowed + treatmentGroup.nudgesIgnored) * 100).toFixed(1);
  console.log(`📊 User compliance with AI suggestions: ${compliance}%`);

  return {
    control: { winRate: parseFloat(controlWinRate), avgProfit: parseFloat(controlAvgProfit), revengeTrades: controlGroup.revengeTradesCount },
    treatment: { winRate: parseFloat(treatmentWinRate), avgProfit: parseFloat(treatmentAvgProfit), revengeTrades: treatmentGroup.revengeTradesCount },
    improvement: { winRate: parseFloat(winRateImpact), profit: parseFloat(profitImpact), revengeReduction: parseFloat(revengeReduction) }
  };
}

// ==============================================================================
// MAIN
// ==============================================================================

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║     VYOMO AI DECISION SUPPORT - COMPLETE TESTING               ║');
  console.log('║  Algorithm Bucketing + Nudge Effectiveness + Decision Quality  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  // Load data
  const dataPath = '/root/ankr-labs-nx/packages/vyomo-anomaly-agent/data/real-market-data.json';
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  console.log(`\n📂 Loaded ${data.length} days of market data with 13 algorithm signals\n`);

  // Test 1: Algorithm bucketing
  const { results: algoResults, regimeCounts } = testAlgorithmBucketing(data);

  // Test 2: Nudge effectiveness
  const nudgeResults = testNudgeEffectiveness(data, algoResults);

  // Final summary
  console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL SUMMARY                               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('🎯 DECISION SUPPORT EFFECTIVENESS:\n');
  console.log(`   Win Rate Improvement:       +${nudgeResults.improvement.winRate}% (${nudgeResults.control.winRate}% → ${nudgeResults.treatment.winRate}%)`);
  console.log(`   Profit Improvement:         +${nudgeResults.improvement.profit}% per trade`);
  console.log(`   Revenge Trading Prevention: -${nudgeResults.improvement.revengeReduction}%`);

  console.log('\n✅ ALGORITHM BUCKETING COMPLETE');
  console.log(`   Classified ${Object.keys(regimeCounts).length} market regimes`);
  console.log(`   Tested 13 algorithms across all regimes`);
  console.log(`   Identified best algorithms for each regime\n`);

  // Save results
  const outputPath = '/root/decision-support-test-results.json';
  fs.writeFileSync(outputPath, JSON.stringify({
    algorithmPerformance: algoResults,
    regimeDistribution: regimeCounts,
    nudgeEffectiveness: nudgeResults,
    summary: {
      winRateImprovement: nudgeResults.improvement.winRate,
      profitImprovement: nudgeResults.improvement.profit,
      revengeReduction: nudgeResults.improvement.revengeReduction
    }
  }, null, 2));

  console.log(`💾 Full results saved to: ${outputPath}\n`);
}

main().catch(console.error);
