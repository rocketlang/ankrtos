# AIS Data Sources for Landlocked Locations

**Issue**: DIY AIS receivers need line-of-sight to ships (VHF radio, ~30-50nm range)
**Solution**: Use internet-based AIS data sources instead!

---

## ❌ Why DIY AIS Receiver Won't Work Inland

### Technical Limitations

**AIS Frequency**: 161.975 MHz and 162.025 MHz (VHF Marine Band)
**Range**: Line-of-sight only
- At sea level: 20-30 nautical miles
- With elevated antenna: 40-50 nautical miles
- **Inland/landlocked: 0 nautical miles** (no ships to receive from!)

**Physics**:
- VHF signals don't travel through terrain
- Need direct line of sight to vessel
- Mountains, buildings block signals
- Even 50km from coast = probably no signal

### Permissions

**Receiving AIS** (passive listening):
- ✅ Generally **NO LICENSE required** in most countries
- AIS is broadcast publicly for safety
- Like receiving FM radio - anyone can listen
- India: No license needed for reception

**But**:
- ⚠️ Some countries restrict radio receivers near military/sensitive areas
- ✅ For internet-based AIS: Zero restrictions

---

## ✅ Best Solutions for Landlocked Locations

### Option 1: AISHub Free API ⭐ RECOMMENDED

**Website**: https://www.aishub.net/
**Cost**: FREE (with registration)
**Coverage**: Global (crowdsourced from 1000+ receivers worldwide)

**API Access**:
```bash
# Register at AISHub.net, get API key
API_KEY="your_key_here"

# Get vessels in area (Mumbai port, 50km radius)
curl "http://data.aishub.net/ws.php?username=YOUR_USERNAME&format=1&output=json&compress=0&latmin=18.5&latmax=19.5&lonmin=72.3&lonmax=73.3"
```

**Pros**:
- ✅ Free
- ✅ Global coverage
- ✅ Real-time
- ✅ No hardware needed
- ✅ No permissions needed

**Cons**:
- ⚠️ Limited to ~500 API calls/month free tier
- ⚠️ 1-minute update delay
- ⚠️ Non-commercial use only

**Perfect For**: Development, testing, small-scale deployment

### Option 2: MarineTraffic Free API

**Website**: https://www.marinetraffic.com/
**Cost**: FREE tier (100 calls/month)
**Coverage**: Global

**API**:
```bash
# Free tier: 100 API calls/month
# Get vessel positions
curl "https://services.marinetraffic.com/api/exportvessels/v:5/YOUR_API_KEY/protocol:json"
```

**Pros**:
- ✅ Free tier available
- ✅ Excellent coverage
- ✅ Good documentation

**Cons**:
- ⚠️ Only 100 calls/month free
- ⚠️ Need to upgrade for serious use ($49-$199/month)

### Option 3: Spire Maritime API (Commercial)

**Website**: https://spire.com/maritime/
**Cost**: ~$500-2,000/month
**Coverage**: Global (satellite AIS)

**Why Satellite AIS?**:
- Covers oceanic areas (no land-based receivers)
- Real-time global coverage
- High reliability

**Pros**:
- ✅ Best coverage (satellite + terrestrial)
- ✅ Oceanic coverage
- ✅ High reliability
- ✅ Historical data included

**Cons**:
- ❌ Expensive
- ❌ Overkill for development

**Perfect For**: Production deployment at scale

### Option 4: Hybrid Approach ⭐ RECOMMENDED FOR PRODUCTION

**Phase 1 (Development)**: AISHub Free
- Learn, experiment, build algorithms
- 500 API calls/month = 16 calls/day
- Enough for single route testing

**Phase 2 (Beta)**: MarineTraffic Basic ($49/month)
- 10,000 API calls/month
- Can cover 50-100 users
- Still affordable

**Phase 3 (Production)**: Spire Maritime or MarineTraffic Pro
- Unlimited calls
- Global coverage
- Historical data
- SLA guarantees

---

## 🎯 Recommended Setup for Mari8X

### For Development (Now)

```typescript
// backend/src/services/ais/aishub-client.ts

import axios from 'axios';

interface AISHubConfig {
  username: string;
  format: '1';  // JSON
}

export class AISHubClient {
  private baseUrl = 'http://data.aishub.net/ws.php';
  private config: AISHubConfig;

  constructor(username: string) {
    this.config = {
      username,
      format: '1'
    };
  }

  async getVesselsInArea(bounds: {
    latMin: number;
    latMax: number;
    lonMin: number;
    lonMax: number;
  }): Promise<AISPosition[]> {
    const params = {
      username: this.config.username,
      format: this.config.format,
      output: 'json',
      compress: '0',
      latmin: bounds.latMin,
      latmax: bounds.latMax,
      lonmin: bounds.lonMin,
      lonmax: bounds.lonMax
    };

    const response = await axios.get(this.baseUrl, { params });

    return response.data[0] || [];  // AISHub returns array of positions
  }

  async getVesselByMMSI(mmsi: number): Promise<AISPosition | null> {
    const params = {
      username: this.config.username,
      format: this.config.format,
      output: 'json',
      compress: '0',
      mmsi: mmsi
    };

    const response = await axios.get(this.baseUrl, { params });

    return response.data[0]?.[0] || null;
  }
}

// Usage
const aisClient = new AISHubClient('YOUR_USERNAME');

// Get all vessels near Mumbai (50km radius)
const vessels = await aisClient.getVesselsInArea({
  latMin: 18.5,
  latMax: 19.5,
  lonMin: 72.3,
  lonMax: 73.3
});

console.log(`Found ${vessels.length} vessels near Mumbai`);
```

### Environment Variables

```bash
# .env
AISHUB_USERNAME=your_aishub_username
MARINETRAFFIC_API_KEY=your_key_here  # For future upgrade
```

---

## 📊 Data Collection Strategy

### Cron Job (Collect Every Hour)

```typescript
// backend/src/workers/ais-collector.ts

import { CronJob } from 'cron';
import { AISHubClient } from '../services/ais/aishub-client';
import { prisma } from '../lib/prisma';

const aisClient = new AISHubClient(process.env.AISHUB_USERNAME!);

// Areas to monitor (Indian Ocean focus)
const monitoringAreas = [
  { name: 'Mumbai', latMin: 18.5, latMax: 19.5, lonMin: 72.3, lonMax: 73.3 },
  { name: 'JNPT', latMin: 18.7, latMax: 19.2, lonMin: 72.7, lonMax: 73.2 },
  { name: 'Chennai', latMin: 12.8, latMax: 13.3, lonMin: 80.0, lonMax: 80.5 },
  { name: 'Singapore', latMin: 1.0, latMax: 1.5, lonMin: 103.6, lonMax: 104.1 },
  // Add more areas
];

// Run every hour
const aisCollectionJob = new CronJob('0 * * * *', async () => {
  console.log('🛰️ Collecting AIS data...');

  for (const area of monitoringAreas) {
    try {
      const vessels = await aisClient.getVesselsInArea(area);

      console.log(`📡 ${area.name}: ${vessels.length} vessels`);

      // Store in database
      for (const vessel of vessels) {
        await prisma.aisPosition.upsert({
          where: {
            mmsi_timestamp: {
              mmsi: vessel.MMSI,
              timestamp: new Date(vessel.TIME * 1000)
            }
          },
          create: {
            mmsi: vessel.MMSI,
            lat: vessel.LATITUDE,
            lon: vessel.LONGITUDE,
            sog: vessel.SOG,
            cog: vessel.COG,
            heading: vessel.HEADING,
            timestamp: new Date(vessel.TIME * 1000),
            navStatus: vessel.NAVSTAT
          },
          update: {}  // No update if exists
        });
      }

    } catch (error) {
      console.error(`❌ Error collecting ${area.name}:`, error);
    }
  }

  console.log('✅ AIS collection complete');
});

// Start the job
aisCollectionJob.start();
```

### Monitoring Dashboard

Track your AIS data collection:

```sql
-- How much data do we have?
SELECT
  DATE(timestamp) as date,
  COUNT(*) as positions,
  COUNT(DISTINCT mmsi) as unique_vessels
FROM ais_positions
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Which areas are we covering?
SELECT
  CASE
    WHEN lat BETWEEN 18.5 AND 19.5 AND lon BETWEEN 72.3 AND 73.3 THEN 'Mumbai'
    WHEN lat BETWEEN 18.7 AND 19.2 AND lon BETWEEN 72.7 AND 73.2 THEN 'JNPT'
    WHEN lat BETWEEN 12.8 AND 13.3 AND lon BETWEEN 80.0 AND 80.5 THEN 'Chennai'
    ELSE 'Other'
  END as area,
  COUNT(*) as positions,
  COUNT(DISTINCT mmsi) as vessels
FROM ais_positions
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY area
ORDER BY positions DESC;
```

---

## 💰 Cost Comparison

| Solution | Setup Cost | Monthly Cost | Coverage | Best For |
|----------|------------|--------------|----------|----------|
| **DIY Receiver (at coast)** | $100 | $0 | 30-50nm | Coastal datacenter |
| **DIY Receiver (inland)** | $100 | $0 | 0nm ❌ | Not viable |
| **AISHub Free** | $0 | $0 | Global | Development |
| **MarineTraffic Basic** | $0 | $49 | Global | Beta/Small scale |
| **MarineTraffic Pro** | $0 | $199 | Global | Medium scale |
| **Spire Maritime** | $0 | $500-2000 | Global + Oceanic | Production/Scale |

---

## 🎯 Recommendation for Mari8X

### Phase 1 (Months 1-3): Development
**Use**: AISHub Free API
**Cost**: $0
**Reason**: Perfect for learning, algorithm development, testing

### Phase 2 (Months 4-6): Beta
**Use**: MarineTraffic Basic ($49/month)
**Cost**: $49/month
**Reason**: Can support 50-100 beta users

### Phase 3 (Months 7-12): Production
**Use**: Spire Maritime or MarineTraffic Pro
**Cost**: $500-2000/month
**Reason**: Scale to 1000+ users, SLA guarantees

---

## 📝 Getting Started Checklist

### Week 1: Setup
- [ ] Register at AISHub.net (free)
- [ ] Get API credentials
- [ ] Test API with Mumbai area
- [ ] Verify you can get position data

### Week 2: Integration
- [ ] Create AISHub client service
- [ ] Set up cron job (hourly collection)
- [ ] Store positions in database
- [ ] Verify data accumulation

### Week 3: Analysis
- [ ] 1 week of data = ~1000+ positions
- [ ] Identify common vessels
- [ ] Start building vessel registry
- [ ] Begin track assembly

**By Month 3**: Enough data to discover first routes! 🎉

---

## ✅ Final Answer

**Q: Can we use DIY AIS receiver inland/landlocked?**
**A**: No - VHF signals need line-of-sight to ships. Use AISHub Free API instead (global, free, no hardware needed)!

**Q: Do we need permissions for AIS data?**
**A**: No - receiving AIS is legal everywhere. Using internet APIs has zero restrictions.

**Recommended**: Start with AISHub Free API today, upgrade to MarineTraffic when ready for production.
