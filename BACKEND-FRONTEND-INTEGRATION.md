# Vyomo Blackbox - Complete Backend & Frontend Integration

Full-stack implementation with backend API and unified single-page application frontend.

**Created by: Powerp Box IT Solutions Pvt Ltd**

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (HTML/CSS/JavaScript)                             │
│  ┌──────────────┬──────────────┬──────────────┬───────────┐│
│  │ Dashboard    │ Trading Demo │ Scanner      │ AI Insights││
│  │ (index.html) │ (demo.html)  │(scanner.html)│(ai.html)  ││
│  │              │              │              │           ││
│  │ • API Health │ • Get Signal │ • Scan Market│ • Ask AI  ││
│  │ • Metrics    │ • Watchlist  │ • Filter     │ • Chat    ││
│  │ • Endpoints  │ • Examples   │ • Sort       │ • Insights││
│  └──────┬───────┴──────┬───────┴──────┬───────┴─────┬─────┘│
│         │              │              │             │       │
└─────────┼──────────────┼──────────────┼─────────────┼───────┘
          │              │              │             │
          │ HTTP GET/POST Requests                    │
          ▼              ▼              ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│  FASTIFY SERVER (TypeScript/Bun)                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ MIDDLEWARE                                              ││
│  │ • CORS (cross-origin requests)                          ││
│  │ • Static Files (@fastify/static) → Serve HTML           ││
│  │ • Rate Limiting (protect from abuse)                    ││
│  │ • Auth (API key for protected endpoints)                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ PUBLIC ROUTES (No Auth)                                 ││
│  │ GET  /                      → index.html (Dashboard)    ││
│  │ GET  /demo.html             → Trading Demo              ││
│  │ GET  /scanner.html          → Market Scanner            ││
│  │ GET  /ai-insights.html      → AI Insights               ││
│  │ GET  /about.html            → About Page                ││
│  │ GET  /health                → Health Check              ││
│  │ GET  /api/signals/:symbol   → Single Signal (Demo)      ││
│  │ POST /api/scan              → Market Scan (Demo)        ││
│  │ POST /api/ai/query          → AI Query (Demo)           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ PROTECTED ROUTES (API Key Required)                     ││
│  │ POST /api/v1/signals        → Full Trading Signals      ││
│  │ GET  /api/v1/info           → Algorithm Info            ││
│  │ GET  /api/v1/usage          → Usage Stats               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ALGORITHM ENGINE                                        ││
│  │ • analyzeMarketData() → Run blackbox algorithms         ││
│  │ • generateMockCandles() → Demo data generation          ││
│  │ • Consensus calculation → Weighted signals              ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│  DATABASE (PostgreSQL - Optional)                            │
│  • Market data (OHLCV)                                       │
│  • User accounts                                             │
│  • Trading history                                           │
│  • Fallback to mock data if unavailable                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
vyomo-algo-blackbox/
├── src/
│   ├── server.ts              # Main backend server (UPDATED)
│   ├── algorithms/
│   │   └── runner.ts          # Trading algorithms
│   ├── auth/
│   │   └── api-keys.ts        # Authentication
│   ├── database/
│   │   └── client.ts          # Database connector
│   ├── config/
│   │   └── ankr-ports.ts      # ANKR port config
│   └── types/
│       └── index.ts           # TypeScript types
│
├── public/                     # Frontend (NEW)
│   └── index.html             # Unified SPA (all features in one page)
│
├── package.json               # Dependencies (UPDATED)
├── .env                       # Environment config
└── README.md                  # Documentation
```

---

## 🔧 Backend Changes Made

### 1. **Added Dependencies** (package.json)
```json
"@fastify/static": "^6.12.0"  // Serve HTML files
```

### 2. **Server Updates** (src/server.ts)

#### Imports Added:
```typescript
import fastifyStatic from '@fastify/static'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
```

#### Static File Serving:
```typescript
await server.register(fastifyStatic, {
  root: join(__dirname, '../public'),
  prefix: '/'
})
```

#### Updated Auth Middleware:
```typescript
// Skip auth for public pages and static assets
const publicPaths = [
  '/health',
  '/',
  '/index.html',
  '/demo.html',
  '/about.html',
  '/scanner.html',
  '/ai-insights.html',
  '/api/signals/' // Allow GET for demo
]
```

#### New Demo Endpoints:

**1. Single Symbol Signal (GET /api/signals/:symbol)**
```typescript
// Used by demo.html
// Returns: action, confidence, price, target, risk
GET /api/signals/AAPL
```

**2. Market Scanner (POST /api/scan)**
```typescript
// Used by scanner.html
// Returns: scanned count, results with signals
POST /api/scan
Body: { signal: 'BUY', minConfidence: 70 }
```

**3. AI Query (POST /api/ai/query)**
```typescript
// Used by ai-insights.html
// Returns: AI-generated insights
POST /api/ai/query
Body: { question: 'Should I buy AAPL?' }
```

---

## 🌐 Frontend - Unified Single-Page Application

### **One Landing Page** (index.html)
**Route:** `http://localhost:4445/` (or `https://vyomo.in/`)

**Architecture:** Tab-based SPA - all features on ONE page with NO page reloads

**5 Sections (Tabs):**

### 1. **Dashboard Tab**
**Backend Calls:**
```javascript
// Health check
fetch('/health')
```

**What it shows:**
- Real-time API status
- Performance metrics
- Quick stats
- Platform features overview

---

### 2. **Trading Demo Tab**

**Backend Calls:**
```javascript
// Get signal for symbol
fetch(`/api/signals/${symbol}`)

// Response:
{
  symbol: 'AAPL',
  action: 'BUY',
  confidence: 0.87,
  price: 185.50,
  target: 195.20,
  risk: 'Low'
}
```

**What it shows:**
- Interactive signal generator
- Quick watchlist
- Integration code examples
- Visual recommendations

---

### 3. **Market Scanner Tab**

**Backend Calls:**
```javascript
// Scan market with filters
fetch('/api/scan', {
  method: 'POST',
  body: JSON.stringify({
    signal: 'BUY',
    minConfidence: 70
  })
})

// Response:
{
  scanned: 2847,
  found: 15,
  results: [
    { symbol: 'AAPL', signal: 'BUY', confidence: 92, ... },
    ...
  ]
}
```

**What it shows:**
- Multi-symbol scanning
- Advanced filters
- Results table
- Live stats

---

### 4. **AI Insights Tab**

**Backend Calls:**
```javascript
// Ask AI question
fetch('/api/ai/query', {
  method: 'POST',
  body: JSON.stringify({
    question: 'Should I buy AAPL?'
  })
})

// Response:
{
  question: '...',
  answer: '...',
  confidence: 0.85
}
```

**What it shows:**
- Natural language chat
- AI-powered analysis
- Question suggestions
- Rich responses

---

### 5. **About Tab**

**Backend Calls:** None (static content)

**What it shows:**
- Value proposition
- How it helps users
- Use cases
- Performance metrics
- Creator attribution (Powerp Box IT Solutions Pvt Ltd)

---

## 🚀 How to Run

### 1. Install Dependencies
```bash
cd /root/vyomo-algo-blackbox
bun install
```

This installs:
- fastify
- @fastify/cors
- @fastify/rate-limit
- @fastify/static (NEW!)
- pg (PostgreSQL)

### 2. Start Server
```bash
# Development mode
bun run src/server.ts

# Production with PM2
pm2 start src/server.ts --name vyomo-algo --interpreter bun
```

### 3. Access Frontend
Open browser:
```
http://localhost:4445/              → Unified Landing Page
  (Tab Navigation: Dashboard | Demo | Scanner | AI | About)
```

---

## 🔐 Authentication Flow

### Public Pages (No Auth):
- All HTML pages (`/*.html`)
- Demo API endpoints (`/api/signals/:symbol`, `/api/scan`, `/api/ai/query`)
- Health check (`/health`)

**Users can:**
- Browse all pages
- Test demos with mock data
- See how the API works
- Copy integration examples

### Protected API (Auth Required):
- Production endpoints (`/api/v1/*`)
- Require `X-API-Key` header
- Rate limited per tier
- Real data processing

**Users need:**
- Valid API key
- Header: `X-API-Key: demo-vyomo-2026`

---

## 📊 Data Flow Example

### User Visits Trading Demo:

1. **Browser** → `GET http://localhost:4445/demo.html`
2. **Server** → Serves `public/demo.html` (no auth)
3. **User** → Enters "AAPL" and clicks "Get Signal"
4. **JavaScript** → `fetch('/api/signals/AAPL')`
5. **Server** → Generates mock candles for AAPL
6. **Server** → Runs algorithm analysis
7. **Server** → Returns signal: `{ action: 'BUY', confidence: 87% }`
8. **JavaScript** → Displays result with color coding
9. **User** → Sees BUY recommendation with 87% confidence

---

## 🎨 Frontend-Backend Integration Points

### Status Dashboard ↔ Backend
```javascript
// Frontend calls
fetch('/health')

// Backend returns
{
  status: 'ok',
  version: '1.0.0',
  uptime: 12345.67,
  timestamp: '2026-02-14T...'
}
```

### Trading Demo ↔ Backend
```javascript
// Frontend calls
fetch('/api/signals/AAPL')

// Backend
1. Generates mock data
2. Runs analyzeMarketData()
3. Returns simplified response
```

### Scanner ↔ Backend
```javascript
// Frontend calls
fetch('/api/scan', {
  method: 'POST',
  body: JSON.stringify({ filters })
})

// Backend
1. Loops through 20 symbols
2. Analyzes each
3. Filters by criteria
4. Returns top 15 results
```

### AI Insights ↔ Backend
```javascript
// Frontend calls
fetch('/api/ai/query', {
  method: 'POST',
  body: JSON.stringify({ question })
})

// Backend
1. Receives question
2. Generates contextual response
3. Returns formatted answer
```

---

## 🔥 Key Features Implemented

### Backend:
✅ Static file serving via @fastify/static
✅ Public routes (no auth for HTML pages)
✅ Demo API endpoints (simplified responses)
✅ Protected API endpoints (full features with auth)
✅ Mock data generation for demos
✅ CORS enabled for frontend requests
✅ Rate limiting per tier
✅ ANKR port integration (no hardcoding)

### Frontend:
✅ 5 HTML pages (dashboard, demo, scanner, AI, about)
✅ Modern dark theme
✅ Responsive design
✅ Interactive demos
✅ Real-time updates
✅ Integration code examples
✅ No build step required (pure HTML/JS)

---

## 🎯 Production Deployment

### Via ANKR Port (No Hardcoding):
```bash
# Server reads port from ~/.ankr/config/ports.json
# Key: ai.vyomoBlackbox
# Port: 4445

# Start with PM2
pm2 start src/server.ts --name vyomo-algo --interpreter bun
pm2 save
```

### Access URLs:
```
http://localhost:4445/              → Dashboard
http://localhost:4445/demo.html     → Demo
http://localhost:4445/scanner.html  → Scanner
http://localhost:4445/ai-insights.html → AI
```

### Via Nginx (Production):
```nginx
# In /etc/nginx/sites-available/vyomo.in
location / {
    proxy_pass http://localhost:4445;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}
```

**Public URL:**
```
https://vyomo.in/              → Unified Platform (all features in tabs)
```

---

## 📝 Testing

### Test Backend:
```bash
# Start server
bun run src/server.ts

# Test health
curl http://localhost:4445/health

# Test demo signal
curl http://localhost:4445/api/signals/AAPL

# Test scanner
curl -X POST http://localhost:4445/api/scan \
  -H "Content-Type: application/json" \
  -d '{"signal":"BUY","minConfidence":70}'
```

### Test Frontend:
```bash
# Open in browser
open http://localhost:4445/

# Test each page
open http://localhost:4445/demo.html
open http://localhost:4445/scanner.html
open http://localhost:4445/ai-insights.html
```

---

## ✅ Complete Feature List

### Backend API:
- ✅ Fastify server with TypeScript
- ✅ Static file serving
- ✅ CORS middleware
- ✅ Rate limiting
- ✅ API key authentication
- ✅ Mock data generation
- ✅ Algorithm engine
- ✅ Demo endpoints
- ✅ Protected endpoints
- ✅ ANKR integration

### Frontend (Unified SPA):
- ✅ Single-page application with tab navigation
- ✅ Dashboard Tab (health monitoring)
- ✅ Trading Demo Tab (signal generation)
- ✅ Market Scanner Tab (bulk screening)
- ✅ AI Insights Tab (natural language chat)
- ✅ About Tab (value proposition & creator info)

### Integration:
- ✅ Frontend calls backend APIs
- ✅ No CORS issues
- ✅ Mock data for demos
- ✅ Real algorithms
- ✅ Seamless navigation
- ✅ Consistent design

---

## 🎉 Summary

**Complete full-stack implementation:**
- ✅ Backend serves unified SPA frontend
- ✅ Frontend calls backend APIs via tabs (no page reloads)
- ✅ ONE landing page with 5 interactive sections
- ✅ 8 API endpoints (3 demo, 5 protected)
- ✅ No authentication required for demos
- ✅ Production-ready with ANKR integration
- ✅ Creator attribution (Powerp Box IT Solutions Pvt Ltd)

**Users get:**
- Seamless single-page experience
- Working examples of API usage
- Tab-based navigation (fast, no page loads)
- Clear understanding of value
- Professional trading platform interface

**Total:** Backend (TypeScript) + Unified Frontend (SPA) = Complete Platform

**Created by:** Powerp Box IT Solutions Pvt Ltd
