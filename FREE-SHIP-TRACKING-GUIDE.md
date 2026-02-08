# Free Global Ship Tracking Guide 🚢

## Zero-Cost Solutions for Maritime Position Data

### Quick Start Options

#### Option 1: AISHub (Easiest)
```bash
# 1. Register free account at https://www.aishub.net
# 2. Get your username
# 3. Use API:

curl "http://data.aishub.net/ws.php?username=YOUR_USERNAME&format=1&output=json&compress=0"
```

**Limits:** Reasonable fair-use policy, suitable for most projects

#### Option 2: Norwegian Government Data (No Registration!)
```bash
# Direct API access - NLOD 2.0 open license
curl "https://kystdatahuset.no/ws/ais/latest"

# Or TCP stream for real-time:
nc ais.kystverket.no 5631
```

**Coverage:** Norwegian waters, Arctic (Svalbard, Jan Mayen)

#### Option 3: Sentinel-1 SAR (Detect Dark Vessels!)
```bash
# Free Copernicus account: https://scihub.copernicus.eu

# Access via:
# 1. Copernicus Open Access Hub
# 2. Google Earth Engine (free)
# 3. AWS Open Data: s3://sentinel-s1-l1c/
```

**Bonus:** Sentinel-1C (launched Dec 2024) has built-in AIS receiver!

---

## Comparison Table

| Source | Cost | Coverage | Real-time | Dark Ships | Registration |
|--------|------|----------|-----------|------------|--------------|
| AISHub | FREE | Global | Yes | No | Free account |
| Norwegian AIS | FREE | Nordic/Arctic | Yes | No | None! |
| Sentinel-1 SAR | FREE | Global | ~12hr delay | **YES** | Free account |
| VesselFinder | FREE (limited) | Global | Yes | No | Free account |
| DIY RTL-SDR | $25 hardware | Local (40km) | Yes | No | None |

---

## Implementation for Mari8x

### 1. Add AISHub Integration
```typescript
// backend/src/services/free-ais-sources.ts already created!

import { AISHubClient } from './services/free-ais-sources';

const client = new AISHubClient(process.env.AISHUB_USERNAME);
const vessels = await client.getVesselsInArea({
  north: 60, south: 50, east: 10, west: 0
});
```

### 2. Environment Variables
```bash
# Add to .env
AISHUB_USERNAME=your_free_username
ENABLE_NORWEGIAN_AIS=true
ENABLE_SENTINEL_SAR=false  # Optional: for dark vessel detection
```

### 3. Hybrid Approach (Best Free Strategy)
```typescript
import { FreeAISAggregator } from './services/free-ais-sources';

const aggregator = new FreeAISAggregator(process.env.AISHUB_USERNAME);
const allVessels = await aggregator.getVessels(bounds);
// Automatically combines AISHub + Norwegian sources
```

---

## Advanced: SAR Ship Detection (100% Free)

### Using Google Earth Engine (Recommended)
```javascript
// Free GEE account: https://earthengine.google.com

var sentinel1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(yourArea)
  .filterDate('2026-01-01', '2026-02-08')
  .filter(ee.Filter.eq('instrumentMode', 'IW'));

// Detect bright targets (ships)
var ships = sentinel1.select('VV').map(function(img) {
  return img.gt(-15).selfMask();
});

Map.addLayer(ships, {palette: 'red'}, 'Detected Ships');
```

### Using Python + SNAP Toolbox
```python
# Free ESA SNAP software: https://step.esa.int/main/download/snap-download/

from sentinelsat import SentinelAPI

# Free Copernicus credentials
api = SentinelAPI('username', 'password', 'https://scihub.copernicus.eu/dhus')

# Search Sentinel-1 images
products = api.query(area_footprint,
                     date=('20260101', '20260208'),
                     platformname='Sentinel-1',
                     producttype='GRD')

# Download and process with SNAP for ship detection
```

---

## DIY Hardware (One-time $25 investment)

### RTL-SDR AIS Receiver
```bash
# Buy: RTL-SDR USB dongle (~$25 on Amazon)
# Software: All free

# Install rtl-ais (Linux/Mac)
sudo apt install rtl-sdr rtl-ais

# Capture AIS
rtl_ais -n

# Feed to AISHub (get premium access in return!)
rtl_ais | nc feed.aishub.net 1234
```

**Benefits:**
- Capture local AIS (ships within 40-60km)
- Contribute to AISHub network → get better access
- Own your data source

---

## Free Data Sources Summary

### 1. **AISHub** ⭐ (Best for Mari8x)
- Registration: https://www.aishub.net
- API Docs: https://www.aishub.net/api
- Coverage: Global aggregated AIS
- Cost: **FREE**

### 2. **Norwegian Coastal Administration** ⭐ (No registration!)
- Access: https://www.kystverket.no/en/sea-transport-and-ports/ais/access-to-ais-data/
- API: https://kystdatahuset.no/ws/swagger/index.html
- Coverage: Norwegian EEZ, Arctic
- License: NLOD 2.0 (open data)
- Cost: **FREE**

### 3. **Sentinel-1 SAR** (Dark vessel detection)
- Hub: https://scihub.copernicus.eu/dhus
- GEE: https://earthengine.google.com
- AWS: s3://sentinel-s1-l1c/
- Coverage: Global, all-weather
- Cost: **FREE**

### 4. **BarentsWatch** (Arctic focus)
- Access: https://www.barentswatch.no
- Coverage: Norwegian Arctic, Barents Sea
- Cost: **FREE**

---

## Recommended Setup for Mari8x

```bash
# 1. Register AISHub (2 minutes)
# 2. Add to .env:
echo "AISHUB_USERNAME=your_username" >> apps/ankr-maritime/backend/.env

# 3. Use the free-ais-sources.ts integration (already created)
# 4. Optional: Add Sentinel-1 for dark vessel analytics
```

### Expected Coverage
- **AISHub:** Global real-time positions
- **Norwegian AIS:** High-density Nordic/Arctic data
- **Sentinel-1:** Bi-weekly dark vessel detection (12-hour latency)

### Cost: $0/month 🎉

---

## Sources
- [AISHub Free API](https://www.aishub.net/api)
- [Norwegian Coastal Administration AIS](https://www.kystverket.no/en/sea-transport-and-ports/ais/access-to-ais-data/)
- [Sentinel-1 Maritime Monitoring](https://sentinels.copernicus.eu/web/sentinel/user-guides/sentinel-1-sar/applications/maritime-monitoring)
- [Copernicus Open Data Policy](https://www.copernicus.eu/en/access-data/copernicus-services-data-policy)

---

## Next Steps

1. **Immediate:** Register AISHub free account (2 min)
2. **Today:** Test Norwegian AIS API (no registration needed!)
3. **This week:** Integrate into Mari8x using `free-ais-sources.ts`
4. **Optional:** Explore Sentinel-1 SAR for dark vessel detection

Need help with any of these? Let me know!
