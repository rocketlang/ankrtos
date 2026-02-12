# 🎨 Vyomo Adaptive AI - Web Dashboard Guide

## 🌐 How to Access

### Step 1: Ensure Services are Running
```bash
ankr-ctl status vyomo-api vyomo-web
```

### Step 2: Open in Browser
```
http://localhost:3011/adaptive-ai
```

Or if accessing remotely:
```
http://YOUR_SERVER_IP:3011/adaptive-ai
```

---

## 📸 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  🧠 Vyomo Adaptive AI                                                │
│  Self-evolving trading intelligence • 52.4% Win Rate • +126% Returns │
│                                                                       │
│  Symbol: [NIFTY ▼] [BANKNIFTY] [RELIANCE]                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ╔═══════════════════════════════════════════════════════════╗      │
│  ║                    📈 BUY                                  ║      │
│  ║  PROCEED CONFIDENTLY                           89%        ║      │
│  ║                                              Confidence    ║      │
│  ║  ┌─────────────────────────────────────────────────────┐  ║      │
│  ║  │ Strong uptrend with high buy signal consensus.     │  ║      │
│  ║  │ Low volatility indicates stable conditions.        │  ║      │
│  ║  └─────────────────────────────────────────────────────┘  ║      │
│  ║                                                            ║      │
│  ║  Entry: ₹22,050  Target: ₹22,300  Stop: ₹21,900          ║      │
│  ║  Position: 85%   R:R 1:2.5                                ║      │
│  ╚═══════════════════════════════════════════════════════════╝      │
│                                                                       │
│  ⚡ Conflict Analysis                                                │
│  ┌──────────────┬──────────────┬──────────────┐                     │
│  │ Contra Score │ Favor Score  │  Net Score   │                     │
│  │     20       │     160      │     +140     │                     │
│  └──────────────┴──────────────┴──────────────┘                     │
│  PROCEED CONFIDENTLY: Favorable signals (160) far outweigh          │
│  contra (20). STRONG consensus with 80% confidence.                  │
│                                                                       │
│  📊 Algorithm Consensus                                              │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐     │
│  │ Buy Signals  │ Sell Signals │ Avg Conf     │ Conflict     │     │
│  │     22       │      10      │    80%       │    31%       │     │
│  └──────────────┴──────────────┴──────────────┴──────────────┘     │
│                                                                       │
│  🌡️ Market Conditions                                               │
│  Trend: STRONG_UP  │  Volatility: HIGH  │  Volume: NORMAL           │
│  ✅ Favorable conditions  │  ⚠️ Watch: Extreme volatility            │
│                                                                       │
│  🕐 Time Analysis                                                    │
│  Current: Market Hours  │  Win Rate: 55%  │  Status: Optimized      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Dashboard Features

### 1. **Main Recommendation Card** (Top)

**Color-coded by action:**
- 🟢 **BUY** - Green background with TrendingUp icon
- 🔴 **SELL** - Red background with TrendingDown icon
- ⚪ **DO_NOTHING** - Gray background with Shield icon

**Shows:**
- Action (BUY/SELL/DO_NOTHING)
- Confidence percentage (0-100%)
- Resolution (PROCEED_CONFIDENT, PROCEED_CAUTIOUS, etc.)
- AI reasoning (why this recommendation)
- Execution details (Entry, Target, Stop Loss, Position Size, Risk/Reward)

### 2. **Conflict Analysis** (Middle)

**Three score cards:**
- **Contra Score** (Red) - Signals against the recommendation
- **Favor Score** (Green) - Signals supporting the recommendation
- **Net Score** (Blue) - Difference (Favor - Contra)

**Explanation text:**
- Plain English explanation of the conflict analysis
- Risk warnings if present
- Confidence adjustment rationale

### 3. **Algorithm Consensus** (Bottom Left)

**Voting breakdown:**
- Buy Signals count
- Sell Signals count
- Average Confidence across all algorithms
- Conflict Rate (disagreement percentage)

### 4. **Market Conditions** (Bottom Center)

**Real-time market state:**
- **Trend**: STRONG_UP, UP, SIDEWAYS, DOWN, STRONG_DOWN
- **Volatility**: LOW, NORMAL, HIGH, EXTREME
- **Volume**: LOW, NORMAL, HIGH
- **Favorable**: ✅ or ❌
- **Concerns**: List of warnings

### 5. **Time Analysis** (Bottom Right)

**Session-based metrics:**
- Current Session (Morning, Midday, Afternoon, etc.)
- Win Rate for current time period
- Optimization status
- Best algorithms for current time

---

## 🎨 Color Scheme

### Action Colors
- **BUY**: Green (#10B981)
- **SELL**: Red (#EF4444)
- **DO_NOTHING**: Gray (#6B7280)

### Risk Level Colors
- **LOW**: Green (#10B981)
- **MEDIUM**: Yellow (#F59E0B)
- **HIGH**: Orange (#F97316)
- **EXTREME**: Red (#DC2626)

### Status Colors
- **Favorable**: Green background
- **Warning**: Yellow background
- **Critical**: Red background

---

## 📱 Responsive Design

### Desktop (1920x1080)
```
┌─────────────────────────────────────────────────────────────┐
│  Full 3-column layout                                        │
│  Large cards with detailed metrics                           │
│  All information visible without scrolling                   │
└─────────────────────────────────────────────────────────────┘
```

### Tablet (768x1024)
```
┌──────────────────────────────────┐
│  2-column layout                  │
│  Cards stack vertically           │
│  Slightly compressed metrics      │
└──────────────────────────────────┘
```

### Mobile (375x667)
```
┌────────────────────┐
│  Single column     │
│  Cards full width  │
│  Scrollable        │
│  Touch-friendly    │
└────────────────────┘
```

---

## 🔄 Real-time Updates

### Auto-refresh Options

**Current:** Manual refresh (reload page)

**Coming Soon:**
- WebSocket integration for real-time updates
- 5-second auto-refresh toggle
- Live price ticker
- Alert notifications

---

## 🎬 Quick Demo

### Test Different Symbols

1. **NIFTY** (Default)
   ```
   - Usually shows market-wide trends
   - Lower volatility
   - Large volume data
   ```

2. **BANKNIFTY**
   ```
   - Banking sector focus
   - Higher volatility
   - Stronger signals
   ```

3. **RELIANCE** (New!)
   ```
   - Individual stock
   - Company-specific signals
   - Different pattern detection
   ```

---

## 🛠️ Customization Options

### Add More Symbols

Edit the dropdown:
```typescript
// apps/vyomo-web/src/pages/AdaptiveAI.tsx
<select>
  <option value="NIFTY">NIFTY</option>
  <option value="BANKNIFTY">BANKNIFTY</option>
  <option value="RELIANCE">RELIANCE</option>
  <option value="TCS">TCS</option>        // Add this
  <option value="INFY">INFY</option>      // Add this
</select>
```

### Change Theme

Modify Tailwind classes:
```typescript
// Current: Purple accent
className="text-purple-600"

// Change to Blue
className="text-blue-600"
```

---

## 📊 Data Flow

```
User selects symbol
        ↓
Frontend sends GraphQL query
        ↓
Vyomo API fetches from database
        ↓
12 algorithms analyze data
        ↓
Consensus + conflict resolution
        ↓
Frontend displays recommendation
        ↓
User sees result in <1 second
```

---

## 🔍 Understanding the Display

### Example: BUY Signal

```
╔═══════════════════════════════════════════════════════════╗
║                    📈 BUY                          89%    ║
║  PROCEED CONFIDENTLY                          Confidence  ║
╚═══════════════════════════════════════════════════════════╝
```

**What this means:**
- **Action: BUY** - AI recommends buying
- **89% Confidence** - Very high certainty
- **PROCEED CONFIDENTLY** - Low risk, go ahead
- **Green color** - Positive signal

### Example: SELL Signal

```
╔═══════════════════════════════════════════════════════════╗
║                    📉 SELL                         84%    ║
║  PROCEED CAUTIOUS                             Confidence  ║
╚═══════════════════════════════════════════════════════════╝
```

**What this means:**
- **Action: SELL** - AI recommends selling
- **84% Confidence** - High certainty
- **PROCEED CAUTIOUS** - Some risk, be careful
- **Red color** - Negative signal

### Example: DO_NOTHING Signal

```
╔═══════════════════════════════════════════════════════════╗
║                    🛡️ DO_NOTHING                  45%    ║
║  AVOID - Low confidence                       Confidence  ║
╚═══════════════════════════════════════════════════════════╝
```

**What this means:**
- **Action: DO_NOTHING** - AI says wait
- **45% Confidence** - Low certainty
- **AVOID** - Too risky, stay out
- **Gray color** - Neutral/uncertain

---

## 🎓 For Beginners

### What to Look For

✅ **Good Trade Setup:**
- Confidence > 80%
- Risk Level: LOW
- Net Score > +100
- No critical warnings
- Favorable market conditions

⚠️ **Proceed with Caution:**
- Confidence 60-80%
- Risk Level: MEDIUM
- Net Score +50 to +100
- Some warnings present
- Mixed market conditions

❌ **Avoid Trading:**
- Confidence < 60%
- Risk Level: HIGH or EXTREME
- Net Score < +50
- Multiple warnings
- Unfavorable market conditions

---

## 🚀 Quick Actions

### Open Dashboard
```bash
# In your browser
http://localhost:3011/adaptive-ai
```

### Refresh Data
```
F5 or Ctrl+R (browser refresh)
```

### Switch Symbols
```
Click dropdown → Select symbol → Auto-updates
```

### Check API Health
```bash
curl http://localhost:4025/api/adaptive-ai/health
```

---

## 📸 Screenshots Locations

After opening the dashboard, you'll see:

**Top Section:**
- Big colored card with recommendation
- Confidence percentage (large)
- Entry/Target/Stop Loss prices

**Middle Section:**
- Conflict analysis with 3 score cards
- Color-coded (red/green/blue)

**Bottom Section:**
- Algorithm voting breakdown
- Market conditions grid
- Time analysis

---

## 🙏 Credits

**Vyomo Adaptive AI Web Dashboard**
© 2026 ANKR Labs
श्री गणेशाय नमः | जय गुरुजी

Built with:
- React 19
- TypeScript
- Tailwind CSS
- Tanstack Query
- Lucide Icons
