# 🔍 Maritime Time Series Analysis - Document Finder

## Quick Access Links

All documents are now published and searchable:

### 📍 Local File Paths

```bash
# Core Documentation
/root/MATHEMATICAL-EQUIVALENCE-VYOMO-MARI8X.md
/root/MARI8X-VYOMO-TIMESERIES-INTEGRATION.md
/root/MARITIME-TIMESERIES-PACKAGE-SUMMARY.md
/root/CAUSAL-TIMESERIES-OPTIONS-TRADING.md

# Package Files
/root/ankr-labs-nx/packages/maritime-timeseries/README.md
/root/ankr-labs-nx/packages/maritime-timeseries/src/

# Published (Web Accessible)
/var/www/ankr-landing/project/documents/maritime-timeseries/
```

---

## 🔎 How to Find These Documents

### Method 1: Direct File Access
```bash
# Read any document
cat /root/MATHEMATICAL-EQUIVALENCE-VYOMO-MARI8X.md

# Open in editor
code /root/CAUSAL-TIMESERIES-OPTIONS-TRADING.md

# List all
ls -lh /root/*MARI*md /root/*CAUSAL*md /root/*VYOMO*md
```

### Method 2: Search by Content
```bash
# Find causality-related content
grep -r "Granger causality" /root/*.md

# Find regime detection
grep -r "regime detection" /root/*.md

# Find trading strategies
grep -r "options trading" /root/*.md
```

### Method 3: Web Access (if nginx running)
```
https://ankr.in/project/documents/maritime-timeseries/INDEX.md
https://ankr.in/project/documents/maritime-timeseries/MATHEMATICAL-EQUIVALENCE-VYOMO-MARI8X.md
https://ankr.in/project/documents/maritime-timeseries/CAUSAL-TIMESERIES-OPTIONS-TRADING.md
```

---

## 📚 Documents Summary

### 1. **MATHEMATICAL-EQUIVALENCE-VYOMO-MARI8X.md** (23 KB)
**What you'll learn**:
- Proof that Vyomo algorithms work on AIS data
- Formula comparisons (options ↔ maritime)
- HMM, compression, percentile calculations
- Executable code examples

**Key formula**:
```
deviation(x) = |x - μ| / σ
// Works for both IV and vessel speed!
```

### 2. **MARI8X-VYOMO-TIMESERIES-INTEGRATION.md** (24 KB)
**What you'll learn**:
- Integration architecture
- 3 detailed use cases
- Database optimization
- Step-by-step implementation

**Key use case**:
```
Use Case 1: Vessel Speed Regime Detection
Use Case 2: Port Congestion Prediction
Use Case 3: Route Deviation Anomaly
```

### 3. **MARITIME-TIMESERIES-PACKAGE-SUMMARY.md** (9 KB)
**What you'll learn**:
- What was built (1,293 LOC)
- Package structure
- Build status
- Next steps

**Quick stats**:
```
14 TypeScript files
20+ tests
✅ Built successfully
Ready for integration
```

### 4. **CAUSAL-TIMESERIES-OPTIONS-TRADING.md** (30 KB)
**What you'll learn**:
- Why 100% prediction is impossible
- Granger causality tests (code included)
- VAR models for multiple time series
- Structural Causal Models
- Complete trading bot
- Risk management

**Key insight**:
```
Correlation: "IV is high → will decrease" (52% accuracy)
Causation: "FII sold ₹800 Cr → IV rises in 2 days" (68% accuracy)
```

### 5. **PACKAGE-README.md** (12 KB)
**What you'll learn**:
- Installation & usage
- API reference
- Code examples
- Performance tips

**Quick start**:
```typescript
import { createAISRegimeAdapter } from '@ankr/maritime-timeseries'
const adapter = createAISRegimeAdapter(prisma)
const analysis = await adapter.analyzeVesselRegime('vessel-id')
```

---

## 🎯 Quick Search Queries

Want to find something specific? Use these searches:

```bash
# Causality
grep -n "Granger causality" /root/CAUSAL-TIMESERIES-OPTIONS-TRADING.md

# Regime detection
grep -n "classifyRegime" /root/MATHEMATICAL-EQUIVALENCE-VYOMO-MARI8X.md

# Trading strategies
grep -n "risk management" /root/CAUSAL-TIMESERIES-OPTIONS-TRADING.md

# Code examples
grep -n "function\|class\|interface" /root/*.md

# Performance
grep -n "performance\|speed\|memory" /root/MARI8X-VYOMO-TIMESERIES-INTEGRATION.md
```

---

## 💡 Common Questions → Document

| Question | Document | Section |
|----------|----------|---------|
| "How do algorithms work on both domains?" | MATHEMATICAL-EQUIVALENCE | Section 1-7 |
| "How to integrate with Mari8x?" | INTEGRATION | Section 3 |
| "What was actually built?" | PACKAGE-SUMMARY | All |
| "How to use the package?" | PACKAGE-README | API Reference |
| "Can I predict 100%?" | CAUSAL-TIMESERIES | Section "Can We Achieve 100%" |
| "Granger causality code?" | CAUSAL-TIMESERIES | Line 45-120 |
| "VAR model example?" | CAUSAL-TIMESERIES | Line 180-290 |
| "Full trading bot?" | CAUSAL-TIMESERIES | Line 800-1200 |

---

## 🚀 Next Steps

1. **Read Documents**:
   ```bash
   # Start here
   cat /root/MARITIME-TIMESERIES-PACKAGE-SUMMARY.md

   # Then deep dive
   less /root/MATHEMATICAL-EQUIVALENCE-VYOMO-MARI8X.md
   ```

2. **Try the Package**:
   ```bash
   cd /root/ankr-labs-nx/packages/maritime-timeseries
   npm install
   npx tsx examples/basic-usage.ts
   ```

3. **Implement Causal Analysis**:
   ```bash
   # Copy code from CAUSAL-TIMESERIES doc
   # Sections: Granger tests, VAR models
   ```

---

## 📞 Can't Find Something?

**Search all documents**:
```bash
# Find any keyword
grep -r "your-keyword" /root/*MARI*.md /root/*CAUSAL*.md /root/*VYOMO*.md

# List all maritime/vyomo docs
ls -lh /root | grep -E "MARI|VYOMO|CAUSAL|MARITIME"

# Show file sizes
du -h /root/*.md | sort -h | tail -20
```

**Or use this quick reference**:
```bash
# All documents in one view
ls -lh /var/www/ankr-landing/project/documents/maritime-timeseries/
```

---

**Created**: 2026-02-11
**Status**: ✅ All documents published and accessible
**Total Size**: ~98 KB of documentation
