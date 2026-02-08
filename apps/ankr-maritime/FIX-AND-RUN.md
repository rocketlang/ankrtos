# Mari8X - Quick Fix Guide

## Problem
- Port 4051 is blocked (EADDRINUSE)
- Backend can't start fully
- GraphQL API not accessible

## Solution Options

### Option 1: Change Port in Config
```bash
# Edit backend config to use different port
cd /root/apps/ankr-maritime/backend
# Find where port 4051 is defined and change it
grep -r "4051" src/
```

### Option 2: Kill Process Using Port 4051
```bash
# Find and kill what's using 4051
lsof -ti:4051 | xargs kill -9

# Then restart backend
cd /root/apps/ankr-maritime/backend
npm run dev
```

### Option 3: Use Frontend Only (Shows Static UI)
```bash
# Frontend is already running!
# Open: http://localhost:3008
# Navigate to landing page to see the UI (data won't load without backend)
```

### Option 4: Deploy to Production (Recommended)
```bash
# Build and deploy where resources aren't limited
cd /root/apps/ankr-maritime
# Deploy to Cloudflare/Vercel/etc
```

## Current Status
✅ Frontend: http://localhost:3008 (WORKING)
❌ Backend: Port conflict on 4051
✅ Code: All 18 fun facts ready
✅ Database: PostgreSQL with 56M positions

## Quick Test
Once backend starts, test with:
```bash
curl http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ aisFunFacts { dataScale { totalPositions } } }"}'
```
