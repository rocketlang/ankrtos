# Kite + Vyomo Integration - Quick Start

## ✅ Step 1: Add Your API Keys (Choose ONE method)

### Method A: Copy Template
```bash
cd /root/ankr-labs-nx/packages/vyomo-anomaly-agent

# Copy template to .env
cp .env.template .env

# Edit with your keys
nano .env

# Replace:
# - your_api_key_here    → YOUR ACTUAL API KEY
# - your_api_secret_here → YOUR ACTUAL API SECRET

# Save: Ctrl+O, Enter, Ctrl+X
```

### Method B: Run Script
```bash
cd /root/ankr-labs-nx/packages/vyomo-anomaly-agent
./add-keys.sh

# Paste your API Key when prompted
# Paste your API Secret when prompted
```

### Method C: Manual
```bash
cd /root/ankr-labs-nx/packages/vyomo-anomaly-agent

echo 'KITE_API_KEY=YOUR_KEY_HERE' >> .env
echo 'KITE_API_SECRET=YOUR_SECRET_HERE' >> .env
echo 'KITE_REDIRECT_URL=http://127.0.0.1:4000/api/kite/callback' >> .env
```

---

## ✅ Step 2: Verify Keys Are Saved

```bash
cd /root/ankr-labs-nx/packages/vyomo-anomaly-agent

# Check if .env exists
ls -la .env

# Verify keys are there (without showing them)
grep -c "KITE_API_KEY" .env
grep -c "KITE_API_SECRET" .env

# Should output: 1 for each
```

---

## ✅ Step 3: Start the Server

```bash
cd /root/ankr-labs-nx/packages/vyomo-anomaly-agent

# Start server
npm run dev

# Or if using PM2:
pm2 start npm --name "vyomo-api" -- run dev
```

---

## ✅ Step 4: Authenticate with Kite

### Get Login URL:
```bash
curl http://localhost:4000/api/kite/login
```

You'll get:
```json
{
  "status": "success",
  "loginURL": "https://kite.zerodha.com/connect/login?api_key=xxx",
  "message": "Please visit this URL to login to Kite"
}
```

### Login:
1. **Copy the loginURL**
2. **Open in browser**
3. **Login with Zerodha credentials**
4. **You'll be redirected** to: `http://localhost:4000/api/kite/callback?request_token=xxx`
5. **See success page!**

---

## ✅ Step 5: Get Live NIFTY Data

```bash
# Get current quote
curl http://localhost:4000/api/kite/quote
```

Response:
```json
{
  "status": "success",
  "data": {
    "symbol": "NIFTY 50",
    "price": 24587.50,
    "change": 123.45,
    "changePercent": 0.51,
    "volume": 123456789,
    "vix": 12.34,
    "timestamp": "2026-02-13T23:00:00.000Z"
  }
}
```

---

## ✅ Step 6: Start WebSocket Streaming

```bash
curl -X POST http://localhost:4000/api/kite/streaming/start \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["NIFTY 50", "INDIA VIX"]}'
```

You'll see live ticks in server console:
```
📊 NIFTY 50: ₹24,587.50 (+0.51%)
📊 INDIA VIX: ₹12.34 (-0.23%)
📊 NIFTY 50: ₹24,588.00 (+0.52%)
...
```

---

## ✅ Step 7: Test Historical Data

```bash
curl "http://localhost:4000/api/kite/historical?symbol=NIFTY%2050&from=2026-01-01&to=2026-02-13&interval=day"
```

---

## 🎯 Complete Flow Test

```bash
cd /root/ankr-labs-nx/packages/vyomo-anomaly-agent

# 1. Add keys (if not done)
./add-keys.sh

# 2. Start server
npm run dev &

# 3. Wait 5 seconds
sleep 5

# 4. Get login URL
curl http://localhost:4000/api/kite/login | jq -r '.loginURL'

# 5. Copy URL, open in browser, login

# 6. After login, test quote:
curl http://localhost:4000/api/kite/quote | jq

# 7. Start streaming:
curl -X POST http://localhost:4000/api/kite/streaming/start \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["NIFTY 50"]}'

# 8. Watch live data in terminal!
```

---

## 🔍 Troubleshooting

### "Cannot read properties of null"
**Fix:** Keys not loaded. Check .env file exists and has correct keys.

### "Not authenticated"
**Fix:** Login first. Visit the loginURL and complete authentication.

### "Port 4000 already in use"
**Fix:** Kill existing process: `kill $(lsof -t -i:4000)`

### "Module not found: kiteconnect"
**Fix:** Install dependencies: `pnpm install`

---

## 📁 Files Created

```
src/data/KiteTickerService.ts   - Kite API wrapper
src/api/kite-routes.ts          - API endpoints
.env.template                   - Environment template
add-keys.sh                     - Key setup script
```

---

## 🚀 Next Steps

1. ✅ Keys added
2. ✅ Server started
3. ✅ Authenticated with Kite
4. ✅ Getting live data

**Now integrate with Vyomo AI:**
- Feed live data to anomaly detection
- Generate AI nudges
- Show to users
- Track compliance

See: `/root/INTEGRATION-STEP-BY-STEP.md` for full integration guide.

---

## 🎉 You're Done!

Kite is now integrated with Vyomo!

Live NIFTY data → Vyomo AI → Nudges → Better decisions! 🚀
