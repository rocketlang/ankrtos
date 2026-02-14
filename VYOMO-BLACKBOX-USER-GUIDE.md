# Vyomo Blackbox API - Complete User Guide

**Version:** 1.0.0
**Package:** @vyomo/algo-blackbox
**Type:** Backend API Service (No Frontend Included)

---

## 📦 What's Included in the Download

The Vyomo Blackbox API is a **backend-only REST API service** for trading algorithms. It does NOT include a frontend web interface.

### Package Contents

```
vyomo-blackbox.tar.gz
├── src/                          # Source code
│   ├── server.ts                 # Main API server
│   ├── algorithms/runner.ts      # Trading algorithm engine
│   ├── database/client.ts        # Database connector
│   ├── auth/api-keys.ts          # API authentication
│   ├── config/ankr-ports.ts      # ANKR port configuration
│   └── types/index.ts            # TypeScript types
├── examples/
│   └── nodejs-client.ts          # Example client code
├── docker/                       # Docker deployment configs
├── docs/                         # Additional documentation
├── quick-start.sh                # Automated setup script
├── package.json                  # Dependencies and scripts
├── .env                          # Environment configuration
└── Documentation files:
    ├── README.md
    ├── CLIENT-SETUP-GUIDE.md
    ├── CLIENT-INSTALL-INSTRUCTIONS.md
    ├── QUICKSTART.md
    ├── ANKR-INTEGRATION.md
    └── REMOTE-ACCESS-SUMMARY.md
```

### What's NOT Included

❌ **No Frontend/Web UI** - This is a headless API service
❌ **No Trading Dashboard** - You must build your own or use API directly
❌ **No Charts/Visualization** - Backend only, data via JSON API
❌ **No Database** - You must provide PostgreSQL connection

---

## 🎯 What This API Does

The Vyomo Blackbox API is a **trading algorithm engine** that:

✅ Analyzes market data using proprietary algorithms
✅ Generates trading signals (BUY/SELL/HOLD)
✅ Provides confidence scores and risk metrics
✅ Serves data via REST API endpoints
✅ Supports multiple trading instruments
✅ Offers real-time and historical analysis

### Use Cases

1. **Integrate with Your Trading Platform** - Call API from your existing system
2. **Build Custom Frontend** - Create web/mobile app that consumes this API
3. **Automated Trading Bots** - Use signals for algorithmic trading
4. **Research & Backtesting** - Analyze historical trading data
5. **Multi-Client Architecture** - One API serving multiple frontends

---

## 🚀 Installation Methods

### Method 1: One-Liner Install (Recommended)

```bash
curl -fsSL https://vyomo.in/install/YOUR_API_KEY | bash
```

This will:
- Download the package (excluding node_modules, .git, bun.lock)
- Extract to `~/vyomo-blackbox`
- Guide you through setup

### Method 2: Manual Download

```bash
# 1. Get JWT token
TOKEN=$(curl -s -X POST https://vyomo.in/api/auth \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "YOUR_API_KEY"}' | jq -r '.token')

# 2. Download archive
curl -H "Authorization: Bearer $TOKEN" \
  https://vyomo.in/api/download/vyomo-blackbox \
  --output vyomo-blackbox.tar.gz

# 3. Extract
tar -xzf vyomo-blackbox.tar.gz
cd vyomo-blackbox
```

---

## ⚙️ Configuration

### 1. Environment Variables

Edit `.env` file:

```bash
# Server Configuration
PORT=4445                          # API port (use ANKR allocated port)
NODE_ENV=production                # production or development
HOST=0.0.0.0                      # Listen on all interfaces

# Database (REQUIRED - You must provide PostgreSQL)
DATABASE_URL=postgresql://user:pass@localhost:5432/vyomo_db

# Authentication
API_KEY_SALT=your-secret-salt-here  # Change this!

# Rate Limiting
RATE_LIMIT_MAX=100                 # Requests per window
RATE_LIMIT_WINDOW=60000            # Window in ms (60 seconds)
```

### 2. Database Setup (REQUIRED)

The API requires PostgreSQL. You must:

```sql
-- Create database
CREATE DATABASE vyomo_db;

-- Connect and create tables (run migrations if provided)
-- Or the API will auto-create tables on first run
```

### 3. ANKR Integration (If Deploying on ANKR System)

The API automatically reads port from ANKR config:

```bash
# Port auto-detected from: ~/.ankr/config/ports.json
# Key: ai.vyomoBlackbox
# Default: 4445
```

No hardcoding needed!

---

## 🏃 Running the API

### Quick Start (Automated)

```bash
./quick-start.sh
```

This script:
1. Checks dependencies (Bun runtime)
2. Installs packages
3. Validates configuration
4. Starts the server with PM2
5. Shows you the API endpoints

### Manual Start

```bash
# Install dependencies
bun install

# Development mode (with hot reload)
bun run dev

# Production mode
bun run src/server.ts

# With PM2 (recommended for production)
pm2 start src/server.ts --name vyomo-algo --interpreter bun
pm2 save
```

### Docker Deployment

```bash
# Build image
docker build -f docker/Dockerfile -t vyomo-algo-blackbox .

# Run container
docker-compose -f docker/docker-compose.yml up -d
```

---

## 📡 API Endpoints

Once running, the API exposes these endpoints:

### Health & Status

```bash
GET /health
# Response: { "status": "ok", "uptime": 1234.56 }
```

### Trading Signals

```bash
GET /api/signals/:symbol
# Example: GET /api/signals/AAPL

POST /api/signals/batch
# Body: { "symbols": ["AAPL", "GOOGL", "MSFT"] }
```

### Historical Data

```bash
GET /api/history/:symbol?timeframe=1d&limit=100
```

### Algorithm Status

```bash
GET /api/algorithms
# Lists available algorithms and their status
```

### Authentication

All endpoints require API key authentication:

```bash
curl -H "X-API-Key: your-client-api-key" \
  http://localhost:4445/api/signals/AAPL
```

---

## 🔧 Integration Examples

### Example 1: Node.js Client

```javascript
const API_BASE = 'http://localhost:4445'
const API_KEY = 'your-client-api-key'

async function getTradingSignal(symbol) {
  const response = await fetch(`${API_BASE}/api/signals/${symbol}`, {
    headers: { 'X-API-Key': API_KEY }
  })
  return await response.json()
}

const signal = await getTradingSignal('AAPL')
console.log(signal)
// {
//   symbol: 'AAPL',
//   action: 'BUY',
//   confidence: 0.87,
//   price: 185.50,
//   timestamp: '2026-02-14T12:00:00Z'
// }
```

### Example 2: Python Client

```python
import requests

API_BASE = 'http://localhost:4445'
API_KEY = 'your-client-api-key'

def get_signal(symbol):
    response = requests.get(
        f'{API_BASE}/api/signals/{symbol}',
        headers={'X-API-Key': API_KEY}
    )
    return response.json()

signal = get_signal('AAPL')
print(signal)
```

### Example 3: Frontend Integration (React)

```javascript
// You would build your own frontend that calls this API

const VyomoClient = {
  baseUrl: 'http://localhost:4445',
  apiKey: 'your-client-api-key',

  async getSignal(symbol) {
    const res = await fetch(`${this.baseUrl}/api/signals/${symbol}`, {
      headers: { 'X-API-Key': this.apiKey }
    })
    return res.json()
  }
}

// In your React component:
function TradingDashboard() {
  const [signal, setSignal] = useState(null)

  useEffect(() => {
    VyomoClient.getSignal('AAPL').then(setSignal)
  }, [])

  return (
    <div>
      {signal && (
        <div>
          Action: {signal.action}
          Confidence: {signal.confidence}
        </div>
      )}
    </div>
  )
}
```

---

## 🏗️ Building Your Own Frontend

Since this package is **backend-only**, you need to build your own frontend. Options:

### Option 1: Simple HTML/JS Dashboard

```html
<!DOCTYPE html>
<html>
<head>
    <title>Trading Dashboard</title>
</head>
<body>
    <h1>Vyomo Trading Signals</h1>
    <div id="signals"></div>

    <script>
        const API_KEY = 'your-client-api-key'

        fetch('http://localhost:4445/api/signals/AAPL', {
            headers: { 'X-API-Key': API_KEY }
        })
        .then(r => r.json())
        .then(data => {
            document.getElementById('signals').innerHTML =
                `Action: ${data.action} | Confidence: ${data.confidence}`
        })
    </script>
</body>
</html>
```

### Option 2: React/Vue/Angular App

Create a modern SPA that:
- Fetches data from the Vyomo API
- Displays signals in charts/tables
- Provides user controls
- Handles authentication
- Shows real-time updates (via polling or WebSockets)

### Option 3: Mobile App (React Native/Flutter)

Build native mobile apps that consume the API.

### Option 4: Use with Existing Trading Platform

Integrate the API into your existing trading system:
- Call API before placing trades
- Use signals in your risk management
- Log signals for backtesting

---

## 🔐 Security Considerations

### API Key Management

```bash
# Generate secure API keys for your clients
openssl rand -hex 32

# Add to src/auth/api-keys.ts:
export const validApiKeys = new Set([
  'client1-key-here',
  'client2-key-here',
])
```

### Production Checklist

- ✅ Change default API_KEY_SALT in .env
- ✅ Use HTTPS reverse proxy (Nginx/Cloudflare)
- ✅ Enable rate limiting
- ✅ Set up PostgreSQL with proper credentials
- ✅ Use environment variables (never commit .env)
- ✅ Set NODE_ENV=production
- ✅ Enable firewall rules
- ✅ Regular backups of database

---

## 📊 Monitoring & Logs

### PM2 Monitoring

```bash
# View status
pm2 status vyomo-algo

# View logs
pm2 logs vyomo-algo

# Real-time monitoring
pm2 monit
```

### Application Logs

```bash
# Check server logs
tail -f /var/log/vyomo-algo.log

# Check error logs
tail -f /var/log/vyomo-algo-error.log
```

### Health Checks

```bash
# Automated health check
curl http://localhost:4445/health

# Add to cron for monitoring
*/5 * * * * curl -f http://localhost:4445/health || systemctl restart vyomo-algo
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :4445

# Use a different port in .env
PORT=4446
```

### Database Connection Failed

```bash
# Verify PostgreSQL is running
systemctl status postgresql

# Test connection
psql -h localhost -U vyomo_user -d vyomo_db

# Check DATABASE_URL in .env
```

### API Returns 401 Unauthorized

```bash
# Verify API key is correct
# Check src/auth/api-keys.ts for valid keys

# Test with curl
curl -H "X-API-Key: your-key" http://localhost:4445/api/signals/AAPL
```

### Dependency Issues

```bash
# Clear and reinstall
rm -rf node_modules bun.lock
bun install

# Or use npm
npm ci
```

---

## 📞 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  YOUR FRONTEND (You Build This)                    │
│  - Web App (React/Vue/Angular)                      │
│  - Mobile App (React Native/Flutter)                │
│  - Trading Bot                                       │
│  - Excel/Python Script                              │
└─────────────────┬───────────────────────────────────┘
                  │ HTTP/HTTPS
                  │ (REST API Calls)
                  ▼
┌─────────────────────────────────────────────────────┐
│  VYOMO BLACKBOX API (This Package)                 │
│  ┌─────────────────────────────────────────────┐   │
│  │ Fastify Server (src/server.ts)              │   │
│  │  - API Endpoints                            │   │
│  │  - Authentication                           │   │
│  │  - Rate Limiting                            │   │
│  └─────────────┬───────────────────────────────┘   │
│                │                                     │
│  ┌─────────────▼───────────────────────────────┐   │
│  │ Algorithm Engine (src/algorithms/runner.ts) │   │
│  │  - Trading Signals                          │   │
│  │  - Pattern Recognition                      │   │
│  │  - Risk Analysis                            │   │
│  └─────────────┬───────────────────────────────┘   │
└────────────────┼─────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  POSTGRESQL DATABASE (You Provide)                 │
│  - Market Data                                      │
│  - Trading History                                  │
│  - User Accounts                                    │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Update Process

When new versions are released:

```bash
# 1. Backup current installation
cp -r ~/vyomo-blackbox ~/vyomo-blackbox.backup

# 2. Download new version
curl -fsSL https://vyomo.in/install/YOUR_API_KEY | bash

# 3. Migrate configuration
cp ~/vyomo-blackbox.backup/.env ~/vyomo-blackbox/.env

# 4. Restart service
pm2 restart vyomo-algo
```

---

## 📚 Additional Resources

- **README.md** - Overview and quick start
- **CLIENT-SETUP-GUIDE.md** - Detailed setup instructions
- **ANKR-INTEGRATION.md** - ANKR-specific configuration
- **examples/nodejs-client.ts** - Sample client implementation

---

## ❓ FAQ

**Q: Is there a web interface included?**
A: No. This is a backend API only. You must build your own frontend or use the API directly from your trading system.

**Q: Can I use this without a database?**
A: No. PostgreSQL is required for the API to function.

**Q: What if I don't want to build a frontend?**
A: You can use the API directly via curl, Postman, or integrate it into existing trading platforms/bots.

**Q: Is the algorithm code visible?**
A: The trading algorithms are proprietary blackbox implementations. You get the API interface, not the algorithm source code.

**Q: Can multiple clients use one API instance?**
A: Yes! The API supports multiple API keys for different clients/applications.

**Q: What about real-time data feeds?**
A: The API processes data you provide via the database. You need to feed market data into PostgreSQL separately.

---

## 📄 License

**PROPRIETARY** - This software is licensed for authorized clients only.

---

## 🚨 Important Notes

1. **No Frontend Included** - You MUST build your own UI or use API programmatically
2. **Database Required** - PostgreSQL installation is mandatory
3. **API Keys** - Manage your own client API keys in the source code
4. **Market Data** - You must provide your own market data pipeline
5. **Production Use** - Follow security best practices for production deployment

---

**Support:** For issues or questions about the API, contact your Vyomo representative.

**Last Updated:** 2026-02-14
