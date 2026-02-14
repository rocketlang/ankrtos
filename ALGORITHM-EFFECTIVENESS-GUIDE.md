# Data-Driven Algorithm Selection Guide

## 🎯 The Right Approach: Test, Measure, Decide

You're absolutely correct - we CANNOT arbitrarily reduce 27 algorithms to 12 without data. We must be **scientific and evidence-based**.

---

## 📊 3-Step Process

### Step 1: Fetch Real NIFTY/Options Data

```bash
cd /root/ankr-labs-nx/packages/vyomo-anomaly-agent

# Fetch 1 year of real NSE data
npx ts-node src/backtest/fetch-nse-data.ts
```

**What it fetches:**
- NIFTY 50 historical data (Yahoo Finance)
- Options chain data (NSE API)
- India VIX data
- 1 year = ~250 trading days = ~97,500 minute-level data points

**Output:**
- `data/real-market-data.json` - Raw market data
- `data/labeled-anomalies.csv` - Template for ground truth (you fill this in)

---

### Step 2: Label Ground Truth (Optional but Recommended)

Edit `data/labeled-anomalies.csv` and add known anomalies:

```csv
# date,symbol,type,severity,reason
2024-02-01,NIFTY,PRICE_SPIKE,CRITICAL,Budget announcement
2024-03-15,BANKNIFTY,VOLUME_SURGE,WARNING,Expiry day surge
2024-06-04,NIFTY,PRICE_DROP,CRITICAL,Election results
2024-07-23,NIFTY,PRICE_SPIKE,WARNING,RBI policy announcement
2024-09-10,BANKNIFTY,IV_SPIKE,WARNING,Geopolitical tensions
```

**Why label?**
- Gives us **ground truth** to measure accuracy
- Without labels: We use heuristics (less reliable)
- With labels: We get **true precision/recall**

**Where to find anomalies:**
- News archives (Economic Times, Moneycontrol)
- Your own trading logs
- Historical alert logs
- Known market events (Budget, RBI meetings, elections)

---

### Step 3: Run Backtest with ALL 27 Algorithms

```bash
# Run the full effectiveness analysis
npx ts-node src/backtest/run-backtest-real.ts
```

**What it does:**
1. ✅ Loads real market data
2. ✅ Runs ALL 27 algorithms
3. ✅ Tracks each algorithm's performance:
   - True Positives (caught real anomalies)
   - False Positives (false alarms)
   - False Negatives (missed anomalies)
   - Precision, Recall, F1 Score
   - Cost/benefit analysis
4. ✅ Generates recommendation: KEEP / TUNE / REMOVE

**Output:**
```
reports/algorithm-effectiveness.json

╔════════════════════════════════════════════════════════════════╗
║          ALGORITHM EFFECTIVENESS REPORT                        ║
╚════════════════════════════════════════════════════════════════╝

📊 SUMMARY
─────────────────────────────────────────────────────────────────
Total Algorithms:      27
Overall Accuracy:      87.45%
Total Net Value:       ₹2,45,000

Recommendations:
  ✅ KEEP:    15 algorithms  (56%)
  ⚠️  TUNE:   8 algorithms   (30%)
  ❌ REMOVE:  4 algorithms   (14%)

🏆 TOP 5 PERFORMERS
─────────────────────────────────────────────────────────────────
1. PRICE_SPIKE           F1: 92.3%  Value: ₹85,000
2. VOLUME_SURGE          F1: 88.7%  Value: ₹62,000
3. REVENGE_TRADING       F1: 85.1%  Value: ₹48,000
4. IV_SPIKE              F1: 82.4%  Value: ₹35,000
5. OVERTRADING           F1: 79.8%  Value: ₹28,000

⚠️  BOTTOM 5 PERFORMERS
─────────────────────────────────────────────────────────────────
1. NEWS_SENTIMENT        F1: 45.2%  Value: -₹15,000  ❌ REMOVE
2. FEAR_GREED            F1: 48.7%  Value: -₹8,000   ❌ REMOVE
3. TIME_ANOMALY          F1: 52.3%  Value: ₹2,000    ⚠️  TUNE
4. PUT_CALL_RATIO        F1: 56.8%  Value: ₹5,000    ⚠️  TUNE
5. WIN_STREAK_ESCALATION F1: 58.1%  Value: ₹7,000    ⚠️  TUNE

💡 RECOMMENDATIONS

❌ REMOVE THESE 4 ALGORITHMS:
  • NEWS_SENTIMENT
    Reason: F1 Score 45.2% (target: >50%), negative net value
  • FEAR_GREED
    Reason: Too many false positives, negative ROI
  • THETA_DECAY
    Reason: Low recall (35%), missing most anomalies
  • STRADDLE
    Reason: F1 Score 48%, not effective enough

⚠️  TUNE THESE 8 ALGORITHMS:
  • TIME_ANOMALY
    - Precision too low (62%) - reduce false positives
    - Suggestion: Increase detection threshold
  • PUT_CALL_RATIO
    - Recall too low (58%) - catching fewer anomalies
    - Suggestion: Decrease threshold or widen window
  • IV_SKEW
    - F1: 65% - needs threshold adjustment
  [... more details ...]

✅ KEEP THESE 15 ALGORITHMS:
  • PRICE_SPIKE (F1: 92.3%)
  • VOLUME_SURGE (F1: 88.7%)
  • REVENGE_TRADING (F1: 85.1%)
  • IV_SPIKE (F1: 82.4%)
  [... 11 more ...]

🚀 NEXT STEPS
1. Remove 4 ineffective algorithms
2. Tune 8 algorithms for better performance
3. Collect more labeled data for validation
4. Re-run backtest after tuning
5. Monitor production performance for 1-2 weeks
6. Iterate based on real production results
```

---

## 📈 Expected Results

Based on typical scenarios, you'll likely find:

### Scenario A: Most Algorithms Work (Good)
```
✅ KEEP:   18-20 algorithms (67-74%)
⚠️  TUNE:  5-7 algorithms   (19-26%)
❌ REMOVE: 2-4 algorithms   (7-15%)

Action: Minor cleanup, mostly tuning
Result: 23-25 effective algorithms
```

### Scenario B: Mixed Results (Normal)
```
✅ KEEP:   12-15 algorithms (44-56%)
⚠️  TUNE:  8-10 algorithms  (30-37%)
❌ REMOVE: 4-7 algorithms   (15-26%)

Action: Remove worst, tune middle, keep best
Result: 18-20 effective algorithms after tuning
```

### Scenario C: Many Don't Work (Bad Data/Thresholds)
```
✅ KEEP:   8-10 algorithms  (30-37%)
⚠️  TUNE:  10-12 algorithms (37-44%)
❌ REMOVE: 7-9 algorithms   (26-33%)

Action: Major tuning needed OR wrong thresholds
Result: Need to investigate WHY so many fail
```

---

## 🎯 Decision Matrix

| F1 Score | Precision | Recall | Net Value | Decision |
|----------|-----------|--------|-----------|----------|
| >75% | >70% | >70% | Positive | ✅ **KEEP** |
| 50-75% | <70% | Any | Positive | ⚠️  **TUNE** (Fix precision) |
| 50-75% | Any | <70% | Positive | ⚠️  **TUNE** (Fix recall) |
| <50% | Any | Any | Negative | ❌ **REMOVE** |
| <50% | Any | Any | Positive but <₹10k | ❌ **REMOVE** (Not worth it) |

**Cost Assumptions:**
- True Positive (catch real anomaly): **+₹10,000** saved
- False Positive (false alarm): **-₹500** wasted time
- False Negative (miss anomaly): **-₹50,000** loss

---

## 🔧 How to Tune Algorithms

### Problem 1: Low Precision (Too Many False Positives)

**Symptoms:**
- Algorithm fires too often
- Most alerts are false alarms
- Precision <70%

**Solutions:**
```typescript
// Increase threshold
OLD: threshold: 3.0  // 3 sigma
NEW: threshold: 3.5  // 3.5 sigma (fewer triggers)

// Narrow window
OLD: windowSize: 100
NEW: windowSize: 50  // More sensitive to recent changes

// Add confirmation
if (anomalyScore > threshold && volumeAlsoAnomalous) {
  // Only trigger if multiple signals agree
}
```

### Problem 2: Low Recall (Missing Too Many Anomalies)

**Symptoms:**
- Algorithm doesn't catch real issues
- Recall <70%

**Solutions:**
```typescript
// Decrease threshold
OLD: threshold: 3.0
NEW: threshold: 2.5  // More sensitive

// Widen window
OLD: windowSize: 50
NEW: windowSize: 100  // Capture more history

// Multiple detection methods
if (zScore > 2.5 || percentile > 95 || rollingMean > threshold) {
  // Trigger on any method
}
```

### Problem 3: Conflicting Signals

**Symptoms:**
- Algorithm disagrees with others
- Category alignment low

**Solutions:**
```typescript
// Add ensemble voting
const signals = [algo1(), algo2(), algo3()];
const majority = signals.filter(s => s === 'ANOMALY').length > 2;

if (majority) {
  // Only trigger if majority agrees
}
```

---

## 📁 File Structure

```
vyomo-anomaly-agent/
├── data/
│   ├── real-market-data.json          # Real NSE data (auto-generated)
│   └── labeled-anomalies.csv          # Ground truth (you fill this)
├── reports/
│   └── algorithm-effectiveness.json   # Full analysis report
└── src/backtest/
    ├── fetch-nse-data.ts              # Step 1: Fetch real data
    └── run-backtest-real.ts           # Step 2: Analyze effectiveness
```

---

## 🚀 Action Plan

### Today:
1. ✅ Fetch real NIFTY data: `npx ts-node src/backtest/fetch-nse-data.ts`
2. ⚠️  Label 20-30 known anomalies in `data/labeled-anomalies.csv` (optional)
3. ✅ Run effectiveness analysis: `npx ts-node src/backtest/run-backtest-real.ts`

### This Week:
4. Review report: `reports/algorithm-effectiveness.json`
5. Remove algorithms marked as REMOVE
6. Tune algorithms marked as TUNE
7. Re-run backtest to validate improvements

### Next 2 Weeks:
8. Deploy to staging with tuned algorithms
9. Collect production data
10. Add more labeled anomalies
11. Re-run analysis monthly
12. Iterate based on real results

---

## 💡 Key Insights

### Why This Approach Works:
- ✅ **Data-driven** - not guesswork
- ✅ **Measurable** - clear metrics
- ✅ **Iterative** - improves over time
- ✅ **Cost-aware** - considers ROI

### Why Random Cutting Doesn't Work:
- ❌ Might remove best algorithms
- ❌ Might keep worst algorithms
- ❌ No way to validate decisions
- ❌ No learning or improvement

### The Scientific Method:
1. **Hypothesis**: All 27 algorithms might not be necessary
2. **Test**: Run all 27 on real data
3. **Measure**: Calculate effectiveness metrics
4. **Analyze**: Identify which work, which don't
5. **Decide**: Keep/tune/remove based on data
6. **Iterate**: Re-test after changes

---

## 🎯 Success Criteria

### Good Results:
- 18-23 algorithms remain (67-85% of original)
- Overall F1 score >80%
- Net value >₹1,00,000 per year
- <10 false positives per day

### Warning Signs:
- <12 algorithms effective (<44%)
- Overall F1 score <70%
- Net value negative
- >50 false positives per day
- → **Re-check thresholds or data quality**

---

## 🤝 Next Steps

**Run the analysis now:**
```bash
# Step 1: Fetch data (5 minutes)
npx ts-node src/backtest/fetch-nse-data.ts

# Step 2: Run analysis (10 minutes)
npx ts-node src/backtest/run-backtest-real.ts

# Step 3: Review results
cat reports/algorithm-effectiveness.json
```

**Then share results and we'll decide together:**
- Which algorithms to keep
- Which to tune (and how)
- Which to remove
- Whether we need more data
- Whether thresholds need adjustment

---

## 📞 Support

If analysis shows:
- **>85% effective** → You over-engineered slightly but it's working
- **50-85% effective** → Normal, tune and iterate
- **<50% effective** → Investigate data quality or threshold issues

**Let's be scientific about this!** 🔬

---

**Status:** Ready to run
**Next:** Execute Step 1 (fetch data) and share results
