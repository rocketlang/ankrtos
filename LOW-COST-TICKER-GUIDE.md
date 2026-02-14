# Low-Cost Ticker Data for Vyomo AI Agent

## Free Options (₹0/month)

### 1. **NSE India Official (BEST for Indian Markets)**
```bash
# Live data - NO API KEY NEEDED
curl "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY"

# Historical Bhavcopy (EOD)
curl "https://archives.nseindia.com/content/historical/EQUITIES/2026/FEB/cm13FEB2026bhav.csv.zip"
```

**Pros:** Official, accurate, free
**Cons:** Rate limited, needs proper headers
**Cost:** ₹0

### 2. **Zerodha Kite Connect (CHEAPEST API)**
```
Plan: Kite Connect API
Cost: ₹2,000/month (one-time ₹2,000 setup)
Features:
- Live tick-by-tick data
- WebSocket streaming
- Historical data API
- Order placement
```

**Best for:** Production use
**Signup:** https://kite.trade
**Cost:** ₹2,000/month

### 3. **Alice Blue API**
```
Plan: Alice Blue API
Cost: ₹999/month (one-time ₹4,000)
Features:
- Live streaming quotes
- Historical data
- Lower cost than Kite
```

**Best for:** Budget-conscious
**Signup:** https://ant.aliceblueonline.com
**Cost:** ₹999/month

### 4. **Upstox API**
```
Plan: Upstox API
Cost: FREE for customers (just open trading account)
Features:
- WebSocket live data
- Historical OHLC data
- Market depth
```

**Best for:** If you're already trading with Upstox
**Signup:** https://upstox.com/developer
**Cost:** ₹0 (with trading account)

### 5. **Finnhub (International)**
```
Plan: Free tier
Cost: ₹0
Features:
- 60 API calls/minute
- Real-time US stocks
- Indian indices (limited)
```

**Code:**
```javascript
const API_KEY = 'free_key'; // Sign up at finnhub.io
fetch(`https://finnhub.io/api/v1/quote?symbol=^NSEI&token=${API_KEY}`)
```

**Cost:** ₹0 (free tier) or $60/month (pro)

---

## Recommended Setup for Your Use Case

### **Option A: Development/Testing (₹0)**
```javascript
// Use NSE Official + Web Scraping
const fetchNiftyData = async () => {
  const response = await fetch('https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY', {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json'
    }
  });
  return response.json();
};
```

**Pros:** Free, no setup
**Cons:** Rate limited, requires scraping

### **Option B: Production (₹999-2000/month)**
```javascript
// Use Alice Blue or Kite Connect
import { AliceBlue } from 'alice_blue';

const alice = new AliceBlue({
  apiKey: 'YOUR_API_KEY',
  userId: 'YOUR_USER_ID'
});

// Subscribe to live ticks
alice.subscribe(['NSE:NIFTY 50'], 'tick', (tick) => {
  console.log('Live price:', tick.ltp);
});
```

**Pros:** Reliable, official, WebSocket streaming
**Cons:** Paid

### **Option C: Paper Trading (₹0)**
```javascript
// Use Alpaca Paper Trading (US markets)
// Or simulate with NSE historical data

const paperTrade = {
  capital: 100000,
  trades: [],

  async getPrice() {
    // Fetch from NSE or use cached data
    return await fetchNiftyData();
  }
};
```

**Pros:** No cost, no risk
**Cons:** Not real-time, simulated

---

## Implementation for Vyomo

### Step 1: Add Ticker Service

```typescript
// src/data/ticker-service.ts
export class TickerService {
  private provider: 'NSE' | 'KITE' | 'ALICE' | 'UPSTOX';

  async getLiveQuote(symbol: string): Promise<Quote> {
    switch (this.provider) {
      case 'NSE':
        return this.fetchFromNSE(symbol);
      case 'KITE':
        return this.fetchFromKite(symbol);
      case 'ALICE':
        return this.fetchFromAlice(symbol);
      default:
        throw new Error('Invalid provider');
    }
  }

  private async fetchFromNSE(symbol: string) {
    const url = `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`;
    // ... implementation
  }
}
```

### Step 2: Integrate with Backtester

```typescript
// src/backtest/live-data-fetcher.ts
import { TickerService } from '../data/ticker-service';

export class LiveDataFetcher {
  private ticker: TickerService;

  async fetchForPaperTrading() {
    const quote = await this.ticker.getLiveQuote('NIFTY');

    // Feed to paper trading system
    await paperTradingEngine.processQuote(quote);

    // Generate AI recommendation
    const recommendation = await aiEngine.analyzeAndRecommend(quote);

    return recommendation;
  }
}
```

---

## My Recommendation

**Phase 1 (Now):** Use NSE Official API (Free)
- Good enough for paper trading
- No cost
- Build proof of concept

**Phase 2 (Production):** Upgrade to Alice Blue (₹999/month)
- Reliable live data
- WebSocket streaming
- Official API with support
- Cheaper than Kite

**Phase 3 (Scale):** Kite Connect (₹2,000/month)
- Industry standard
- Best documentation
- Most reliable
- Worth it when you have paying users

---

## Quick Start Code

```typescript
// Install
npm install axios

// Fetch NSE data (Free)
import axios from 'axios';

async function fetchNiftyLive() {
  try {
    const response = await axios.get(
      'https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.nseindia.com/'
        }
      }
    );

    const niftyPrice = response.data.records.underlyingValue;
    const vix = response.data.filtered.PE[0].IV; // Implied Volatility

    return {
      price: niftyPrice,
      vix,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error fetching NSE data:', error);
    throw error;
  }
}

// Usage
const data = await fetchNiftyLive();
console.log(`NIFTY: ₹${data.price}, VIX: ${data.vix}`);
```

---

## Summary

| Provider | Cost/Month | Setup | Best For |
|----------|-----------|-------|----------|
| NSE Official | ₹0 | Easy | Development |
| Upstox API | ₹0* | Medium | If you trade there |
| Alice Blue | ₹999 | Medium | Production (budget) |
| Kite Connect | ₹2,000 | Easy | Production (premium) |
| Finnhub | ₹0-$60 | Easy | US markets |

**My pick:** Start with NSE (free), upgrade to Alice Blue (₹999) when ready for production.

---

## Next Steps

1. Test NSE API with the code above
2. Integrate with your existing backtester
3. Run 30-day paper trading campaign
4. Show proof to users
5. Upgrade to Alice Blue for production

**Total cost to start: ₹0**
**Total cost for production: ₹999/month**
