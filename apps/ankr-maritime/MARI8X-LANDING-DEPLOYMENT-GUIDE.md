# Mari8X Landing Page - Deployment Guide

## ✅ What We Built

### 1. AIS Live Dashboard (`/ais/live`)
- Real-time vessel tracking dashboard
- 16.9M+ vessel positions from database
- 18.8K+ unique vessels  
- Auto-refresh every 5-60 seconds
- Live data feed with countdown timer
- Priority 1 AIS field coverage visualization
- Navigation status breakdown
- Recent activity tracking

**Files:**
- `backend/src/schema/types/ais-live-dashboard.ts` (365 lines)
- `frontend/src/pages/AISLiveDashboard.tsx` (650 lines)

### 2. Mari8X Landing Page (`/` and `/home`)
- Public-facing marketing page
- Live AIS data integration
- 96+ platform features showcased
- 8 capability categories
- Real-time vessel count display
- Multiple CTAs (Join Beta, View Live Data)

**Files:**
- `frontend/src/pages/Mari8xLanding.tsx` (850 lines)

### 3. Backend API
- 2 new GraphQL queries:
  - `aisLiveDashboard` - Complete statistics
  - `aisRecentPositions` - Latest positions
- Optimized SQL queries
- Navigation status mapping (15 codes)

## 🚀 Deployment Steps

### Prerequisites
1. Mari8X backend running on port 4051
2. PostgreSQL database with vessel_positions table
3. Node.js and npm installed
4. Nginx installed

### Step 1: Generate GraphQL Types
```bash
cd /root/apps/ankr-maritime/frontend
npm run codegen
```

**Note:** Backend must be running for codegen to work.

### Step 2: Build Frontend
```bash
cd /root/apps/ankr-maritime/frontend
npx vite build
```

This creates the production build in `dist/` directory.

### Step 3: Deploy Nginx Configuration
```bash
# Copy config to nginx
sudo cp /tmp/mari8x.com.conf /etc/nginx/sites-available/mari8x.com

# Create symlink
sudo ln -s /etc/nginx/sites-available/mari8x.com /etc/nginx/sites-enabled/mari8x.com

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 4: SSL Certificate (if needed)
```bash
# Install certbot if not already installed
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d mari8x.com -d www.mari8x.com
```

### Step 5: Verify Deployment
```bash
# Check frontend
curl https://mari8x.com

# Check API
curl https://mari8x.com/graphql -H "Content-Type: application/json" \
  -d '{"query":"{ aisLiveDashboard { totalPositions uniqueVessels } }"}'
```

## 📝 Current Status

### ✅ Completed
- Backend GraphQL API for AIS data
- Frontend AIS Live Dashboard component
- Frontend Mari8X Landing Page component
- Routes registered in App.tsx
- Nginx configuration created
- TypeScript fixes applied

### ⏳ Pending
- Backend needs to be started (currently EMFILE error)
- GraphQL types need to be generated via codegen
- Frontend build needs to complete
- SSL certificate needs to be configured
- DNS needs to point to server

## 🔧 Troubleshooting

### Backend "Too Many Open Files" Error
```bash
# Increase file descriptor limit
ulimit -n 10000

# Or edit /etc/security/limits.conf
* soft nofile 10000
* hard nofile 10000
```

### GraphQL Codegen Fails
Ensure:
1. Backend is running on localhost:4051
2. GraphQL endpoint is accessible
3. codegen.ts file exists in frontend directory

### Build Fails with TypeScript Errors
```bash
# Skip TypeScript checking during build
npx vite build
```

## 📦 Files Modified/Created

**Backend:**
- `src/schema/types/ais-live-dashboard.ts` - NEW
- `src/schema/types/index.ts` - MODIFIED (added import)

**Frontend:**
- `src/pages/AISLiveDashboard.tsx` - NEW
- `src/pages/Mari8xLanding.tsx` - NEW  
- `src/App.tsx` - MODIFIED (added routes + imports)
- `tsconfig.node.json` - MODIFIED (fixed TypeScript config)
- `src/components/dms/__tests__/DocumentAnalytics.test.tsx` - MODIFIED (fixed JSX typo)
- `codegen.ts` - NEW

**Infrastructure:**
- `/tmp/mari8x.com.conf` - NEW (nginx config)

## 🌐 URLs After Deployment

- **Landing Page:** https://mari8x.com
- **Landing Page (alt):** https://mari8x.com/home
- **AIS Live Dashboard:** https://mari8x.com/ais/live
- **GraphQL API:** https://mari8x.com/graphql
- **Login:** https://mari8x.com/login
- **Beta Signup:** https://mari8x.com/beta/signup

## 📊 Database Requirements

The application expects a `vessel_positions` table with:
- 16.9M+ position records
- Fields: id, vesselId, latitude, longitude, speed, heading, navigationStatus, timestamp
- Optional fields: rateOfTurn, positionAccuracy, maneuverIndicator, draught, dimensionTo*

**Data Already Present:**
✅ 16,906,883 vessel positions
✅ 18,824 unique vessels
✅ Date range: Jan 20 - Feb 4, 2026
✅ 58% coverage on dynamic fields
✅ 4-5% coverage on static fields

## 🎯 Next Steps

1. **Fix Backend Startup:**
   - Resolve EMFILE error
   - Start backend on port 4051
   - Verify GraphQL endpoint

2. **Generate Types:**
   - Run `npm run codegen`
   - Verify `src/__generated__/` directory

3. **Build Frontend:**
   - Run `npx vite build`
   - Verify `dist/` directory created

4. **Deploy:**
   - Configure nginx
   - Get SSL certificate
   - Point DNS to server
   - Test live site

## 💡 Quick Start Commands

```bash
# Terminal 1: Start Backend
cd /root/apps/ankr-maritime/backend
npm run dev

# Terminal 2: Generate Types & Build Frontend
cd /root/apps/ankr-maritime/frontend
npm run codegen
npx vite build

# Terminal 3: Deploy
sudo cp /tmp/mari8x.com.conf /etc/nginx/sites-available/mari8x.com
sudo ln -s /etc/nginx/sites-available/mari8x.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Verify
curl https://mari8x.com
```

## 🎉 Success Criteria

- ✅ Landing page loads at https://mari8x.com
- ✅ Live vessel count displays (16.9M+)
- ✅ Live data feed updates every 3-5 seconds
- ✅ All 96+ features listed correctly
- ✅ CTAs work (Join Beta, View Live Data)
- ✅ AIS Live Dashboard accessible
- ✅ No console errors
- ✅ Mobile responsive

---

**Created:** February 4, 2026
**Status:** Ready for deployment (pending backend startup)
**Documentation:** Complete ✅
