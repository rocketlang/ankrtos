# 🗺️ AIS Coverage Areas - Mari8X

## Current Coverage Status

### ✅ **Active Coverage Regions:**

1. **Middle East / Persian Gulf** 🌟
   - **Vessels:** 163 active vessels
   - **Location:** Dubai, UAE area (25°N, 55°E)
   - **Coverage:** Excellent
   - **Use Cases:** Oil tankers, container ships, general cargo
   - **Map Default:** Now centered here for best first impression!

2. **Global Scattered Coverage**
   - **Vessels:** ~100 vessels globally
   - **Regions:** San Francisco Bay (USA), various coastal areas
   - **Coverage:** Limited, depends on shore-based AIS receivers

### ❌ **Limited/No Coverage:**

- **Bay of Bengal:** Currently 0 vessels (receivers may be offline or no recent traffic)
- **Open Ocean:** Very limited (requires satellite AIS, which is sparse)
- **Remote Regions:** No coverage without nearby receivers

## Why Coverage Varies:

AIS data depends on **receiver locations**:

### **Shore-Based Receivers:**
- ✅ High coverage near busy ports (Dubai, Singapore, European ports)
- ✅ Coastal shipping lanes
- ❌ Limited range (~40-60 nautical miles from coast)

### **Satellite AIS:**
- ✅ Global coverage possible
- ❌ Expensive and less frequent updates
- ❌ May have gaps in polar regions

### **Ship-Based Relay:**
- ✅ Ships can relay AIS signals
- ❌ Only works in dense shipping areas

## Map Configuration

**Default View:**
- **Center:** Middle East/Persian Gulf (25°N, 55°E)
- **Zoom Level:** 5 (regional view)
- **Why:** Best coverage area with 163 active vessels

**Coverage Indicators:**
- Info text shows: "Best coverage: Bay of Bengal & Middle East"
- Auto-adapts: Shows 0 vessels gracefully in empty regions
- Viewport-based: Always queries current visible area

## How to Explore Coverage:

1. **Start:** Map opens on Middle East (best coverage)
2. **Pan west:** Check Mediterranean, Suez Canal
3. **Pan east:** Check Indian Ocean, Straits of Malacca
4. **Pan globally:** See where AIS receivers are active

**Empty regions = No error!** Just shows 0 vessels.

## Data Characteristics

**Current Dataset:**
- **Total Positions:** 56M+ AIS positions tracked
- **Time Window:** Last 6 hours of active vessels
- **Active Vessels:** Varies by region (0-163+ per viewport)
- **Update Frequency:** Every 30 seconds

**Best Coverage Times:**
- **Daytime:** More vessels active in busy ports
- **Peak Hours:** 08:00-18:00 local time in shipping regions
- **Seasonal:** May vary based on shipping seasons

## User Experience Design

### **Graceful Degradation:**
✅ Empty regions show 0 vessels (no error message)
✅ Sparse regions stay at 500 vessel limit (efficient)
✅ Dense regions expand to 1000 vessels (adaptive)

### **Discovery Mode:**
✅ Pan to explore different regions
✅ Viewport updates show new vessels
✅ Info text shows current vessel count
✅ No frustration from "no data" errors

## Future Coverage Expansion

**Potential Enhancements:**
1. **Satellite AIS Integration:** Global coverage
2. **More Shore Receivers:** Bay of Bengal, Southeast Asia
3. **Historical Playback:** Show traffic patterns over time
4. **Coverage Map Overlay:** Show receiver locations
5. **Data Freshness Indicator:** Show last update time

## Current Status: ✅ OPTIMIZED

**Map now:**
- Opens on Middle East (163 vessels visible!)
- Auto-adapts to coverage density
- Handles empty regions gracefully
- Encourages exploration via pan/zoom

**Next Steps:**
- Monitor coverage in Bay of Bengal
- Consider satellite AIS for global coverage
- Track which regions users explore most
