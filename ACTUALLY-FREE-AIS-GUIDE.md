# Actually Free AIS Sources (No Hardware Required) 🚢

## Reality Check ✅

Most "free" AIS providers require:
- ❌ **AISHub**: Requires you to run AIS receiver hardware and contribute data
- ❌ **MarineTraffic API**: Paid only
- ❌ **VesselFinder API**: Paid only
- ❌ **FleetMon**: Paid only

## Truly Free Options (Just API Key Registration)

### 1. **AISStream.io** ⭐ (BEST - Global Coverage)

**What it is:**
- Free WebSocket API for **global real-time AIS data**
- No hardware required - just register for free API key
- Backed by open-source community

**Setup:**
```bash
# 1. Register at https://aisstream.io (free account)
# 2. Get your API key from dashboard
# 3. Done! No hardware needed
```

**Limits:**
- Free tier: Real-time global AIS stream
- Unlimited messages (fair use policy)
- Filter by MMSI, bounding box, message type

**Example:**
```javascript
const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

ws.on('open', () => {
  ws.send(JSON.stringify({
    APIKey: 'YOUR_FREE_API_KEY',
    BoundingBoxes: [[[bounds.west, bounds.south], [bounds.east, bounds.north]]],
    FilterMessageTypes: ['PositionReport']
  }));
});

ws.on('message', (data) => {
  const vessel = JSON.parse(data);
  console.log('Ship position:', vessel);
});
```

**Links:**
- Website: https://aisstream.io
- Docs: https://aisstream.io/documentation
- GitHub Examples: https://github.com/aisstream/example

---

### 2. **Norwegian Coastal Administration** (Nordic/Arctic)

**What it is:**
- 100% free government open data
- No registration, no API key needed
- Norwegian waters + Svalbard + Jan Mayen

**Setup:**
```bash
# Literally just use it - no signup!
curl "https://kystdatahuset.no/ws/ais/latest"
```

**Coverage:**
- Norwegian economic zone
- Arctic regions (Svalbard, Jan Mayen, Barents Sea)
- High quality, official government data

**License:** NLOD 2.0 (Norwegian License for Open Government Data)

**Links:**
- Website: https://www.kystverket.no/en/sea-transport-and-ports/ais/access-to-ais-data/
- API Docs: https://kystdatahuset.no/ws/swagger/index.html
- Ably Hub: https://ably.com/hub/kystverket/ais

---

### 3. **Sentinel-1 SAR** (Detect Dark Vessels)

**What it is:**
- EU satellite imagery (free for everyone)
- Detects ships **without AIS** (dark vessels)
- All-weather, day/night capability

**Setup:**
```bash
# Register free Copernicus account
# https://scihub.copernicus.eu
```

**Access Methods:**
- Copernicus Open Access Hub
- Google Earth Engine (free)
- AWS Open Data: `s3://sentinel-s1-l1c/`

**NEW:** Sentinel-1C (launched Dec 2024) has built-in AIS receiver!

---

## Comparison: Free vs "Free"

| Provider | Actually Free? | Hardware Needed? | Coverage | Real-time |
|----------|---------------|------------------|----------|-----------|
| **AISStream.io** | ✅ YES | ❌ No | Global | ✅ Yes |
| **Norwegian AIS** | ✅ YES | ❌ No | Nordic/Arctic | ✅ Yes |
| **Sentinel-1 SAR** | ✅ YES | ❌ No | Global | ~12hr delay |
| AISHub | ❌ No* | ✅ Yes (RTL-SDR) | Global | Yes |
| MarineTraffic API | ❌ Paid | ❌ No | Global | Yes |
| VesselFinder API | ❌ Paid | ❌ No | Global | Yes |

*AISHub requires you to contribute data from your own AIS receiver

---

## Implementation for Mari8x

### Quick Start (5 minutes)

```bash
# 1. Register at aisstream.io (2 min)
open https://aisstream.io

# 2. Add to .env
echo "AISSTREAM_API_KEY=your_api_key" >> apps/ankr-maritime/backend/.env

# 3. Install WebSocket client
cd apps/ankr-maritime/backend
npm install ws
```

### Code Integration

I've already created `free-ais-sources.ts` with:

```typescript
import { AISStreamClient, FreeAISAggregator } from './services/free-ais-sources';

// Option 1: Just AISStream.io (global coverage)
const client = new AISStreamClient(process.env.AISSTREAM_API_KEY);
const vessels = await client.getVesselsInArea({
  north: 60, south: 50, east: 10, west: 0
});

// Option 2: Hybrid (AISStream + Norwegian for best coverage)
const aggregator = new FreeAISAggregator(process.env.AISSTREAM_API_KEY);
const allVessels = await aggregator.getVessels(bounds);
```

---

## Real-Time WebSocket Example

```typescript
import { AISStreamClient } from './services/free-ais-sources';

const client = new AISStreamClient(process.env.AISSTREAM_API_KEY);

// Stream all vessels in Indian Ocean
const ws = client.createStream({
  bbox: [[40, -30], [100, 25]]  // [[west, south], [east, north]]
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);

  if (msg.Message?.PositionReport) {
    console.log({
      mmsi: msg.MetaData.MMSI,
      name: msg.MetaData.ShipName,
      lat: msg.Message.PositionReport.Latitude,
      lon: msg.Message.PositionReport.Longitude,
      speed: msg.Message.PositionReport.Sog,
      course: msg.Message.PositionReport.Cog
    });
  }
});
```

---

## Why AISStream.io is Actually Free

Unlike AISHub (which requires hardware contribution), AISStream.io:

1. **Open-source community project**
2. **Aggregates data from contributors** (but doesn't require you to be one)
3. **Free tier for everyone** (not just contributors)
4. **GitHub-hosted examples** and active community
5. **No credit card required**

It's like how OSM is free to use, even if you don't contribute map data.

---

## Next Steps

### Immediate (Today):
1. Register at https://aisstream.io (2 minutes)
2. Get API key from dashboard
3. Add to Mari8x `.env`

### This Week:
```bash
# Install dependencies
cd apps/ankr-maritime/backend
npm install ws @types/ws

# Test the integration
npm run test-aisstream  # (we can create this)
```

### Optional Enhancements:
- Add Norwegian AIS for Nordic region density
- Integrate Sentinel-1 SAR for dark vessel detection
- Cache frequently accessed areas in Redis

---

## Cost Comparison

| Solution | Setup Cost | Monthly Cost | Coverage |
|----------|-----------|--------------|----------|
| **AISStream.io** | $0 | $0 | Global ✅ |
| **Norwegian AIS** | $0 | $0 | Nordic/Arctic |
| RTL-SDR + AISHub | $25 | $0 | Local 40km |
| MarineTraffic API | $0 | $500+ | Global |
| Kpler/S&P Global | $0 | $1000s+ | Global |

**Winner: AISStream.io** 🏆

---

## Resources

- **AISStream.io**: https://aisstream.io
- **Documentation**: https://aisstream.io/documentation
- **GitHub Examples**: https://github.com/aisstream/example
- **Norwegian AIS**: https://www.kystverket.no/en/sea-transport-and-ports/ais/access-to-ais-data/
- **Copernicus Sentinel-1**: https://scihub.copernicus.eu

---

Ready to integrate AISStream.io into Mari8x? It's truly free! 🌊
