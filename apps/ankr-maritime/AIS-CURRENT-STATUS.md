# AIS Current Status Report
**Date**: Feb 2, 2026  
**Service**: AISstream.io (FREE tier)

---

## 📊 Current Statistics

### Vessel Coverage
- **Total Vessels**: 16,878
- **With AIS Positions**: 15,326 (90.8%)
- **Without AIS**: 1,552 (9.2%)

### Position Data
- **Total Position Records**: 6,242,875
- **Last 24 Hours**: 6,060,900 positions
- **Active Vessels (24h)**: 14,680

### Enrichment Status
- **Enriched (ownership data)**: 78 vessels (0.46%)
- **Need Enrichment**: 16,800 vessels (99.54%)

---

## 🌊 AIS Service Configuration

**Provider**: AISstream.io  
**Tier**: FREE  
**Status**: ✅ RUNNING (in ankr-maritime-backend)  
**API Key**: Configured  
**Mode**: Production  

**What We Get (FREE tier)**:
- ✅ Real-time position (lat/lon)
- ✅ Speed over ground
- ✅ Course over ground
- ✅ Heading
- ✅ MMSI
- ✅ Vessel name
- ✅ Global coverage

**What We DON'T Get (FREE tier)**:
- ❌ Draught (0% coverage)
- ❌ Navigation status (0% coverage)
- ❌ Rate of turn (0% coverage)
- ❌ Position accuracy (0% coverage)
- ❌ Maneuver indicator (0% coverage)
- ❌ Dimension fields (0% coverage)
- ❌ Vessel ownership data

---

## 🎯 Coverage by Feature

| Feature | Status | Coverage |
|---------|--------|----------|
| Position Tracking | ✅ Working | 90.8% vessels |
| Basic AIS Fields | ✅ Working | 100% of positions |
| Priority 1 Fields | ❌ Not available | 0% |
| Ownership Data | ❌ Not available | 0.46% (manual only) |

---

## 💰 Upgrade Options

### Option 1: VesselFinder API (Pending Response)
**Status**: Email sent, waiting for quote  
**Potential Coverage**:
- ✅ AIS positions
- ✅ Priority 1 fields (if available)
- ✅ Vessel ownership (if available - ASKED IN EMAIL)
- ⏱️ Awaiting Alex's response on pricing

**Advantages**:
- Single API for everything
- Already in contact
- Can negotiate bulk pricing

---

### Option 2: MarineTraffic API
**Cost**: $73/month (Startup plan)  
**Coverage**:
- ✅ Extended AIS fields (Priority 1)
- ✅ Vessel ownership data
- ✅ Real-time positions
- ✅ Vessel particulars

**Advantages**:
- Known pricing
- Comprehensive data
- Can start immediately
- Solves both AIS + ownership needs

---

### Option 3: Keep Free + Add Ownership API
**Cost**: $0 for AIS, $X for ownership only  
**Strategy**:
- Keep AISstream.io FREE for basic positions
- Add separate ownership API (if VesselFinder/others offer it)

**Advantages**:
- Lower cost
- Already have position tracking working
- Only pay for missing data

**Disadvantages**:
- No Priority 1 AIS fields
- Need two API integrations

---

## 📈 Growth Metrics

**Position Growth Rate**:
- Current: 6.2M positions
- Daily: ~6M new positions
- Weekly: ~42M positions
- Monthly: ~180M positions

**Vessel Growth**:
- Started: ~17,000 vessels (previous session)
- Current: 16,878 vessels
- Growth: Stable (automatic discovery via AIS)

**Active Fleet**:
- 14,680 vessels transmitted in last 24h
- 87% of tracked vessels are active

---

## 🎯 Immediate Priorities

### Priority 1: Get Ownership Data
**Goal**: Enrich 16,800 vessels  
**Options**:
1. Wait for VesselFinder response (cheapest if they have it)
2. Sign up for MarineTraffic API ($73/mo)
3. Build manual Equasis CSV import

**Recommendation**: Wait 24-48h for VesselFinder, then go with MarineTraffic if no response

### Priority 2: Decide on Priority 1 AIS Fields
**Need**: Draught, nav status, rate of turn for advanced routing  
**Options**:
1. Included in VesselFinder (if available)
2. Included in MarineTraffic ($73/mo)
3. Live without them (acceptable for MVP)

**Recommendation**: 
- If doing freight/routing: Need Priority 1 fields
- If doing basic tracking only: FREE AISstream is fine

---

## 💡 Recommendations

**Scenario A: Budget Available ($73/month)**
→ Sign up for MarineTraffic API immediately
→ Solves both ownership + Priority 1 AIS
→ Can enrich all 16,800 vessels in 1-2 hours

**Scenario B: Keep Costs Low**
→ Wait for VesselFinder pricing
→ If expensive: Keep FREE AISstream
→ Manual Equasis enrichment for ownership (CSV import)
→ Accept no Priority 1 fields for now

**Scenario C: Hybrid (Recommended)**
→ Wait for VesselFinder response (48h max)
→ If good pricing: Use VesselFinder for everything
→ If expensive: MarineTraffic for critical needs
→ Keep FREE AISstream as backup

---

## 🚀 Next Steps

**Immediate (Today)**:
- ✅ Sent email to VesselFinder
- ⏳ Waiting for response

**Within 48 Hours**:
- Review VesselFinder pricing
- Make decision: VesselFinder vs MarineTraffic vs Manual

**Within 1 Week**:
- Implement chosen ownership solution
- Enrich 16,800 vessels
- Test Priority 1 fields (if upgraded)

---

## 📞 Contact Info

**VesselFinder**: Alex Stoykov <info@vesselfinder.com>  
**Status**: Email sent Jan 31, 2026  
**Next**: Awaiting pricing and capabilities

**Current AIS**: AISstream.io (FREE)  
**Status**: Working perfectly for basic tracking  
**Limitation**: No Priority 1 fields, no ownership data

