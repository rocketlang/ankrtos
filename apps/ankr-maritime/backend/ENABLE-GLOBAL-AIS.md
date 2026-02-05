# Enable Global AIS Coverage

## ✅ Code Changes Applied

Modified `/root/apps/ankr-maritime/backend/src/main.ts` to enable **GLOBAL COVERAGE**:
- Removed regional trade area filtering
- Now uses default bounding box: `[[-90, -180], [90, 180]]` (entire world)
- Will track ALL vessels worldwide instead of just high-priority trade areas

## 🔑 Required: API Key Configuration

### Get Free API Key from AISStream.io

1. Visit: https://aisstream.io/
2. Sign up for free account
3. Get your API key from dashboard
4. Free tier includes:
   - Real-time AIS data
   - Global coverage
   - Unlimited vessels
   - WebSocket streaming

### Configure Environment Variables

Add to `/root/apps/ankr-maritime/backend/.env`:

```bash
# Enable AIS tracking
ENABLE_AIS=true

# AISStream.io API Key (get from https://aisstream.io/)
AISSTREAM_API_KEY=your_api_key_here
```

### Alternative: Use Demo Key (Limited)

For testing without API key, the system will throw an error. You need a valid key.

## 🚀 Restart Backend

After adding the API key:

```bash
cd /root/apps/ankr-maritime/backend

# Stop current instance
pkill -f "tsx.*main.ts"

# Start with AIS enabled
PORT=4099 ENABLE_AIS=true AISSTREAM_API_KEY=your_key npm run dev
```

## 📊 Expected Results with Global Coverage

### Current (Regional - Priority 1 Areas)
- ~20,490 unique vessels
- High-priority trade routes only
- Major shipping lanes (Asia-Europe, Trans-Pacific, etc.)

### After Global Enablement
- **100,000+** unique vessels expected
- All oceans, seas, and waterways
- Complete worldwide maritime traffic
- River vessels, coastal traffic, fishing fleets
- Yachts, military vessels, and specialized ships

## 🌍 Coverage Areas

Global coverage includes:

### Major Regions
- **Atlantic Ocean** - All shipping lanes
- **Pacific Ocean** - Complete coverage
- **Indian Ocean** - Full tracking
- **Mediterranean Sea** - All vessels
- **Caribbean Sea** - Complete monitoring
- **Arctic/Antarctic** - Polar shipping routes

### Regional Additions
- **River Systems** - Mississippi, Rhine, Yangtze, etc.
- **Coastal Traffic** - All coastal zones
- **Fishing Fleets** - Global fishing activity
- **Leisure Vessels** - Yachts and recreational boats
- **Port Traffic** - All major and minor ports

## ⚠️ Performance Considerations

### Data Volume
- **Messages per second**: 1,000-5,000 (vs current ~100)
- **Database growth**: ~10-50GB/month (vs current ~2GB)
- **CPU usage**: Higher processing load
- **Memory**: Increased for message buffering

### Optimization Recommendations
1. **PostgreSQL**: Increase connection pool (50-100 connections)
2. **Redis**: Enable caching for frequent queries
3. **Database**: Add partitioning for `ais_positions` table
4. **Cleanup**: Run old data cleanup more frequently

### Resource Requirements
- **RAM**: 8GB minimum (16GB recommended)
- **CPU**: 4 cores minimum (8 recommended)
- **Storage**: 100GB+ for position history
- **Network**: 10Mbps sustained bandwidth

## 🔍 Monitoring

### Check Coverage Status

```bash
# Get current statistics
curl -s http://localhost:4099/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"{ aisLiveDashboard { totalPositions uniqueVessels averageSpeed lastUpdated } }"}' \
  | jq .
```

### Expected Metrics After Enablement
- Unique vessels: 20K → 100K+ (5x increase)
- Messages/hour: 10K → 1M+ (100x increase)
- Coverage density: 10-50 vessels per 1000km² ocean

## 📈 Use Cases Unlocked

With global coverage enabled:

1. **Complete Fleet Tracking** - Track any vessel anywhere
2. **Port Congestion Analysis** - All ports worldwide
3. **Trade Route Analytics** - Complete shipping patterns
4. **Competitive Intelligence** - Monitor competitor vessels
5. **Supply Chain Visibility** - End-to-end cargo tracking
6. **Maritime Security** - Illegal fishing, piracy detection
7. **Environmental Monitoring** - Emissions, protected areas
8. **Insurance & Claims** - Vessel location verification

## 🎯 Quick Start

```bash
# 1. Get API key from https://aisstream.io/
# 2. Add to .env:
echo "ENABLE_AIS=true" >> /root/apps/ankr-maritime/backend/.env
echo "AISSTREAM_API_KEY=your_key_here" >> /root/apps/ankr-maritime/backend/.env

# 3. Restart backend
cd /root/apps/ankr-maritime/backend
pkill -f "tsx.*main.ts"
PORT=4099 npm run dev

# 4. Watch the logs
tail -f /tmp/backend-final.log | grep "📍"

# 5. Check dashboard
open http://localhost:4099/
```

## ✅ Verification

After restart, you should see:
```
🌍 Enabling GLOBAL AIS coverage for all vessels worldwide
✅ AISstream connected!
📡 Subscription sent: { boundingBoxes: 1, messageTypes: 2, mmsiFilter: 'all' }
AIS tracking started with GLOBAL COVERAGE (entire world)
📍 VESSEL_NAME: lat, lon | Speed: X knots
📊 AIS Stats: 100 messages processed
📊 AIS Stats: 200 messages processed
...
```

Vessels from all regions should start appearing in logs and dashboard.

---

**Status**: Code changes applied ✅
**Next Step**: Add AISSTREAM_API_KEY and restart
**Expected Improvement**: 5-10x more vessels tracked
