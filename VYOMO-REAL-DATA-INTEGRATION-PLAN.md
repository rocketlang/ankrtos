# Vyomo Real Data Integration Plan

**Date**: 2026-02-11
**Priority**: HIGH
**Status**: 🔄 IN PROGRESS

---

## Overview

Replace mock data generators with real market data sources for production-ready Vyomo platform.

---

## Data Sources Required

### 1. NSE Option Chain API (Iron Condor)
**What we need**:
- Live option chain data for NIFTY, BANKNIFTY, FINNIFTY
- Strike prices with premiums (LTP, bid, ask)
- Greeks (delta, gamma, theta, vega)
- Implied Volatility (IV)
- Open Interest (OI) and volume
- Expiry dates

**Potential Sources**:
- ✅ **NSE Official API**: https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY
  - FREE, official, real-time
  - Rate limits: ~10 requests/minute
  - Requires cookies/headers for anti-bot

- ✅ **Upstox API**: https://upstox.com/developer/api-documentation
  - Paid (₹2000/month)
  - Reliable, official broker API
  - 250 requests/second

- ✅ **Zerodha Kite Connect**: https://kite.trade/docs/connect/v3/
  - ₹2000/month
  - Most popular in India
  - Historical + live data

**Recommended**: Start with NSE Official API (FREE) → Upgrade to Upstox/Zerodha for production

---

### 2. Real-Time Market Data (Intraday Signals)
**What we need**:
- Live spot prices (NIFTY, BANKNIFTY, FINNIFTY)
- 5-minute candles (OHLCV)
- Intraday volume and IV changes
- Support/resistance levels
- Market depth data

**Potential Sources**:
- ✅ **NSE Real-Time API**: https://www.nseindia.com/api/quote-equity?symbol=NIFTY
  - FREE, 5-second updates
  - Spot price, day high/low, volume

- ✅ **Upstox WebSocket**: Real-time market data feed
  - Live ticks, order book, market depth
  - 1-tick latency

- ✅ **TradingView**: https://www.tradingview.com/rest-api-spec/
  - Charting + technical indicators
  - Free tier available

**Recommended**: NSE Real-Time API + Upstox WebSocket for sub-second data

---

### 3. Fundamental Data (Equity Screener)
**What we need**:
- P/E, P/B, P/S ratios
- Market cap, debt-to-equity
- ROE, ROA, profit margins
- Promoter holding, FII/DII data
- Revenue/profit growth (YoY, QoQ)
- Sector and industry classification

**Potential Sources**:
- ✅ **Screener.in API**: https://www.screener.in/
  - Most comprehensive Indian stock fundamentals
  - FREE for basic data
  - Can scrape or use unofficial API

- ✅ **Tickertape API**: https://www.tickertape.in/
  - Clean UI, good fundamentals
  - FREE tier with rate limits
  - GraphQL API available

- ✅ **NSE Corporate Info**: https://www.nseindia.com/companies-listing/corporate-filings
  - Official quarterly results
  - FREE but needs parsing

- ✅ **MoneyControl**: https://www.moneycontrol.com/
  - Comprehensive data
  - Can be scraped

**Recommended**: Screener.in (primary) + Tickertape (backup) + NSE (official validation)

---

## Implementation Plan

### Phase 1: NSE Option Chain Integration (Week 1)
**Goal**: Replace Iron Condor mock data with live NSE option chain

**Tasks**:
1. ✅ Create `packages/data-fetchers/src/nse/option-chain.ts`
   - Fetch option chain from NSE API
   - Handle cookies/headers for anti-bot
   - Parse response to OptionChain format
   - Implement caching (5-minute TTL)

2. ✅ Add rate limiting
   - Max 10 requests/minute per symbol
   - Queue requests if rate limit hit
   - Exponential backoff on 429 errors

3. ✅ Update `strategies.resolver.ts`
   - Replace `generateMockOptionChain()` with `fetchNSEOptionChain()`
   - Add error handling (fallback to mock on failure)
   - Cache results in Redis (5-min expiry)

4. ✅ Test with live data
   - Verify all strikes returned
   - Validate Greeks calculations
   - Check Iron Condor recommendations

**Files to modify**:
- Create: `packages/data-fetchers/src/nse/option-chain.ts`
- Create: `packages/data-fetchers/src/cache/redis-cache.ts`
- Modify: `apps/vyomo-api/src/resolvers/strategies.resolver.ts`
- Modify: `apps/vyomo-api/src/services/market-data.service.ts` (create if not exists)

---

### Phase 2: Real-Time Market Data (Week 2)
**Goal**: Replace Intraday mock data with live NSE + WebSocket data

**Tasks**:
1. ✅ Create `packages/data-fetchers/src/nse/real-time.ts`
   - Fetch live spot prices
   - Get intraday volume and IV
   - Calculate support/resistance from day high/low

2. ✅ Add WebSocket support
   - Upstox WebSocket for live ticks
   - Subscribe to NIFTY, BANKNIFTY, FINNIFTY
   - Emit updates via GraphQL subscriptions

3. ✅ Generate 5-minute candles
   - Aggregate ticks into 5-min OHLCV
   - Store last 100 candles in Redis
   - Calculate RSI, MACD from candles

4. ✅ Update `strategies.resolver.ts`
   - Replace `generateMockMarketData()` with `fetchLiveMarketData()`
   - Replace `generateMockCandles()` with `getCandlesFromCache()`
   - Add WebSocket subscription resolver

**Files to modify**:
- Create: `packages/data-fetchers/src/nse/real-time.ts`
- Create: `packages/data-fetchers/src/websocket/upstox.ts`
- Create: `apps/vyomo-api/src/subscriptions/market-data.subscription.ts`
- Modify: `apps/vyomo-api/src/resolvers/strategies.resolver.ts`
- Modify: `apps/vyomo-api/src/schema/index.ts` (add subscriptions)

---

### Phase 3: Fundamental Data Integration (Week 3)
**Goal**: Replace Equity Screener mock data with real fundamentals

**Tasks**:
1. ✅ Create `packages/data-fetchers/src/screener/fundamentals.ts`
   - Scrape Screener.in for stock fundamentals
   - Parse P/E, P/B, ROE, debt ratios
   - Get promoter/FII holding data

2. ✅ Create `packages/data-fetchers/src/tickertape/api.ts`
   - Use Tickertape GraphQL API
   - Fetch market cap, sector, industry
   - Get revenue/profit growth

3. ✅ Build unified stock database
   - Combine Screener + Tickertape data
   - Store in PostgreSQL `stocks` table
   - Update daily via cron job

4. ✅ Update `strategies.resolver.ts`
   - Replace `generateMockStockData()` with `fetchStocksFromDB()`
   - Add real-time technical data (RSI, MACD from NSE)
   - Combine fundamental + technical for screening

**Files to modify**:
- Create: `packages/data-fetchers/src/screener/fundamentals.ts`
- Create: `packages/data-fetchers/src/tickertape/api.ts`
- Create: `apps/vyomo-api/src/cron/update-stocks.ts`
- Create: `apps/vyomo-api/prisma/migrations/XXX_create_stocks_table.sql`
- Modify: `apps/vyomo-api/src/resolvers/strategies.resolver.ts`

---

## Database Schema

### Stocks Table
```sql
CREATE TABLE stocks (
  symbol VARCHAR(20) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  sector VARCHAR(50),
  industry VARCHAR(100),

  -- Fundamentals
  market_cap DECIMAL(15, 2),
  pe_ratio DECIMAL(10, 2),
  pb_ratio DECIMAL(10, 2),
  ps_ratio DECIMAL(10, 2),
  roe DECIMAL(10, 2),
  roa DECIMAL(10, 2),
  debt_to_equity DECIMAL(10, 2),
  current_ratio DECIMAL(10, 2),
  dividend_yield DECIMAL(10, 2),

  -- Growth metrics
  revenue_growth_yoy DECIMAL(10, 2),
  profit_growth_yoy DECIMAL(10, 2),
  revenue_growth_qoq DECIMAL(10, 2),
  profit_growth_qoq DECIMAL(10, 2),

  -- Ownership
  promoter_holding DECIMAL(5, 2),
  fii_holding DECIMAL(5, 2),
  dii_holding DECIMAL(5, 2),

  -- Metadata
  last_updated TIMESTAMP DEFAULT NOW(),
  data_source VARCHAR(50),

  INDEX idx_sector (sector),
  INDEX idx_pe_ratio (pe_ratio),
  INDEX idx_market_cap (market_cap)
);
```

### Option Chain Cache
```sql
CREATE TABLE option_chain_cache (
  symbol VARCHAR(20),
  expiry DATE,
  strike DECIMAL(10, 2),
  option_type VARCHAR(2), -- 'CE' or 'PE'

  ltp DECIMAL(10, 2),
  bid DECIMAL(10, 2),
  ask DECIMAL(10, 2),
  volume INTEGER,
  oi INTEGER,
  iv DECIMAL(10, 4),

  delta DECIMAL(10, 6),
  gamma DECIMAL(10, 6),
  theta DECIMAL(10, 6),
  vega DECIMAL(10, 6),

  cached_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (symbol, expiry, strike, option_type),
  INDEX idx_expiry (expiry),
  INDEX idx_cached_at (cached_at)
);
```

---

## Caching Strategy

### Redis Keys
```typescript
// Option chain cache (5 minutes)
`option-chain:${symbol}:${expiry}` → OptionChain

// Market data cache (10 seconds)
`market-data:${symbol}` → IntradayMarketData

// 5-min candles cache (24 hours)
`candles:${symbol}:${date}` → Candle[]

// Stock fundamentals cache (24 hours)
`stock-fundamentals:${symbol}` → FundamentalData
```

---

## Rate Limiting

### NSE API
- Max 10 requests/minute per endpoint
- Use token bucket algorithm
- Fallback to cache if rate limited

### Screener.in
- Max 60 requests/hour
- Batch requests where possible
- Update stocks sequentially

### Upstox/Zerodha
- 250 requests/second (paid tier)
- WebSocket for real-time (no rate limit)

---

## Error Handling

### Fallback Strategy
1. Try primary data source (e.g., NSE)
2. If fails, try cache (Redis)
3. If cache miss, try secondary source (Upstox)
4. If all fail, use mock data + warning log

### Circuit Breaker
- After 5 consecutive failures, open circuit for 60 seconds
- Use cached/mock data during circuit open
- Attempt recovery after timeout

---

## Monitoring

### Metrics to Track
- API response times (p50, p95, p99)
- Cache hit rates
- Data freshness (age of cached data)
- Error rates by data source
- Rate limit hits

### Alerts
- Option chain data >5 min old
- Market data API down >1 min
- Cache hit rate <80%
- Error rate >5%

---

## Cost Estimate

### Monthly Costs

| Service | Free Tier | Paid Tier | Recommended |
|---------|-----------|-----------|-------------|
| NSE Official API | FREE (10/min) | N/A | FREE |
| Upstox API | N/A | ₹2,000/mo | Optional |
| Zerodha Kite | N/A | ₹2,000/mo | Optional |
| Screener.in | FREE (limited) | ₹500/mo | FREE |
| Tickertape | FREE (limited) | ₹1,000/mo | FREE |
| Redis (AWS) | FREE (1GB) | ₹500/mo | FREE |
| PostgreSQL | FREE (local) | ₹1,000/mo | FREE |

**Total Monthly Cost**: ₹0 (FREE tier) → ₹6,500 (full paid)

**Recommended Start**: FREE tier (NSE + Screener + Tickertape)

---

## Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1: Option Chain | 5 days | Live Iron Condor with NSE data |
| Phase 2: Real-Time Data | 7 days | Live Intraday signals + WebSocket |
| Phase 3: Fundamentals | 7 days | Live Equity Screener with real stocks |
| Testing & QA | 3 days | End-to-end testing with live data |
| **Total** | **22 days** | **Production-ready Vyomo** |

---

## Next Actions

1. ✅ Create `packages/data-fetchers` package
2. ✅ Implement NSE option chain fetcher
3. ✅ Add Redis caching layer
4. ✅ Update resolvers to use real data
5. ✅ Test with live NIFTY option chain

**Starting with**: Phase 1 - NSE Option Chain Integration

---

**Status**: 🚀 Ready to begin Phase 1
**Priority**: HIGH
**Assigned**: Claude Sonnet 4.5
