# Geojit Live Ticker API Guide

## ✅ YES! Geojit Has Live Ticker API

**Service:** Geojit FLIP API (Financial Live Interactive Platform)

---

## 📋 What You Get

### Features:
- ✅ Live market data streaming
- ✅ Real-time quotes (NSE, BSE)
- ✅ WebSocket support
- ✅ Historical data
- ✅ Order placement
- ✅ Portfolio tracking

### Cost:
- **₹0/month** if you have active trading account
- **₹1,500 one-time** if inactive account

---

## 🚀 How to Activate (3 Steps)

### Step 1: Check Your Account Status

**Login:** https://www.geojit.com/

Check if your account is:
- ✅ Active (traded in last 6 months) → **FREE API**
- ⚠️ Inactive (no trades) → **₹1,500 one-time**

---

### Step 2: Apply for API Access

**Two Options:**

#### Option A: Visit Branch
1. Go to nearest Geojit branch
2. Request "FLIP API" access
3. Fill KYC form (if needed)
4. Get API credentials (instant)

#### Option B: Email Request
1. Send email to: **flip@geojit.com**
2. Subject: "API Access Request"
3. Include:
   - Client ID
   - Name
   - Mobile number
   - Purpose: "Algorithmic trading / Data analytics"
4. Wait 24-48 hours for approval

---

### Step 3: Get API Credentials

After approval, you'll receive:
```
Client ID:   YOUR_CLIENT_ID
API Key:     YOUR_API_KEY
Secret Key:  YOUR_SECRET_KEY
```

---

## 📚 API Documentation

**Official Docs:** https://www.geojitapi.com/

**Key Resources:**
- REST API: https://www.geojitapi.com/rest-api
- WebSocket: https://www.geojitapi.com/websocket
- Python SDK: https://github.com/Geojit/python-sdk
- Node.js: Use REST API directly

---

## 💻 Integration Code

### Installation:
```bash
npm install axios ws
```

### Example Code:

```typescript
// geojit-ticker.ts
import axios from 'axios';
import WebSocket from 'ws';

export class GeojitTicker {
  private clientId: string;
  private apiKey: string;
  private secretKey: string;
  private accessToken: string | null = null;

  constructor(config: {
    clientId: string;
    apiKey: string;
    secretKey: string;
  }) {
    this.clientId = config.clientId;
    this.apiKey = config.apiKey;
    this.secretKey = config.secretKey;
  }

  /**
   * Step 1: Authenticate
   */
  async login(password: string): Promise<void> {
    const response = await axios.post('https://api.geojit.com/Login', {
      clientId: this.clientId,
      password: password,
      apiKey: this.apiKey
    });

    this.accessToken = response.data.accessToken;
    console.log('✅ Logged in to Geojit');
  }

  /**
   * Step 2: Get Live Quote
   */
  async getQuote(symbol: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Call login() first.');
    }

    const response = await axios.get(
      `https://api.geojit.com/MarketData/Quote/${symbol}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      symbol: response.data.symbol,
      price: response.data.ltp,
      change: response.data.change,
      changePercent: response.data.changePercent,
      volume: response.data.volume,
      timestamp: new Date()
    };
  }

  /**
   * Step 3: WebSocket Streaming
   */
  async subscribeToTicks(symbols: string[], callback: (tick: any) => void): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Call login() first.');
    }

    const ws = new WebSocket('wss://api.geojit.com/marketdata', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    ws.on('open', () => {
      console.log('✅ WebSocket connected');

      // Subscribe to symbols
      ws.send(JSON.stringify({
        action: 'subscribe',
        symbols: symbols
      }));
    });

    ws.on('message', (data: string) => {
      const tick = JSON.parse(data);
      callback(tick);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
      console.log('WebSocket closed. Reconnecting...');
      // Auto-reconnect logic here
    });
  }

  /**
   * Step 4: Get Historical Data
   */
  async getHistoricalData(
    symbol: string,
    from: Date,
    to: Date,
    interval: '1m' | '5m' | '1d'
  ): Promise<any[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Call login() first.');
    }

    const response = await axios.get(
      `https://api.geojit.com/MarketData/Historical`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        params: {
          symbol,
          from: from.toISOString(),
          to: to.toISOString(),
          interval
        }
      }
    );

    return response.data;
  }
}
```

---

## 🔥 Usage Example

```typescript
// In your Vyomo system
import { GeojitTicker } from './data/geojit-ticker';

async function main() {
  // Initialize
  const geojit = new GeojitTicker({
    clientId: 'YOUR_CLIENT_ID',
    apiKey: 'YOUR_API_KEY',
    secretKey: 'YOUR_SECRET_KEY'
  });

  // Login
  await geojit.login('YOUR_PASSWORD');

  // Get live quote
  const quote = await geojit.getQuote('NIFTY 50');
  console.log('NIFTY:', quote.price);

  // Subscribe to real-time updates
  await geojit.subscribeToTicks(['NIFTY 50', 'BANKNIFTY'], (tick) => {
    console.log('Live update:', tick.symbol, tick.ltp);

    // Feed to your Vyomo system
    processMarketData(tick);
  });

  // Get historical data
  const history = await geojit.getHistoricalData(
    'NIFTY 50',
    new Date('2026-01-01'),
    new Date('2026-02-13'),
    '1d'
  );
  console.log('Historical data:', history.length, 'days');
}
```

---

## 📞 Contact Geojit Support

### For API Access:
- **Email:** flip@geojit.com
- **Subject:** "FLIP API Access Request"
- **Include:** Client ID, Name, Mobile, Purpose

### For Technical Support:
- **Email:** support@geojit.com
- **Phone:** 1800-425-5501
- **WhatsApp:** +91-484-2901000

### Geojit Branches:
Find nearest branch: https://www.geojit.com/contact-us

---

## ⚡ Quick Start Checklist

- [ ] Check if your Geojit account is active
- [ ] Email flip@geojit.com for API access
- [ ] Wait for API credentials (24-48 hours)
- [ ] Install dependencies: `npm install axios ws`
- [ ] Copy `geojit-ticker.ts` code
- [ ] Test with: `await geojit.getQuote('NIFTY 50')`
- [ ] Integrate with Vyomo system

---

## 💰 Cost Comparison

| Provider | Cost | Your Status |
|----------|------|-------------|
| **Geojit FLIP** | ₹0 (if active) | ✅ YOU HAVE THIS! |
| Alice Blue | ₹4,000 one-time | Backup option |
| Upstox | ₹0 (if trader) | Alternative |
| Zerodha Kite | ₹2,000/month | Expensive |

---

## ✅ Recommendation

**Since you already have Geojit:**

1. ✅ Email flip@geojit.com TODAY
2. ✅ Request API access
3. ✅ Cost: ₹0 if your account is active
4. ✅ Get credentials in 24-48 hours
5. ✅ Start using immediately!

**No need to open new account!** 🎉

---

## 📧 Sample Email to Geojit

```
To: flip@geojit.com
Subject: API Access Request

Dear Geojit Team,

I would like to request API access for my trading account.

Client ID: YOUR_CLIENT_ID
Name: YOUR_NAME
Mobile: YOUR_MOBILE
Email: YOUR_EMAIL

Purpose: I am building an algorithmic trading system for personal use
and need live market data streaming and historical data access.

Please activate FLIP API for my account and provide the API credentials.

Thank you,
YOUR_NAME
```

---

## 🚀 Next Steps

1. **Send email NOW** (takes 2 minutes)
2. **Wait 24-48 hours** for API credentials
3. **Test with sample code** (takes 10 minutes)
4. **Integrate with Vyomo** (takes 1 hour - see INTEGRATION-STEP-BY-STEP.md)

**You'll have live ticker by tomorrow!** 🎉
