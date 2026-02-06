# Real Maritime Data Sources - No Hallucinations

## ✅ Current REAL Data Status

**Ports**: 1,365 real ports (manually curated + scraped)
**Tariffs**: 45 real tariffs (scraped from actual port websites)
**AIS Data**: 41M+ real position records (from AISstream.io)

---

## 🌍 Real Port Data Sources

### 1. UN/LOCODE (Official - 20,000+ ports)

**Source**: United Nations Economic Commission for Europe (UNECE)
**URL**: https://unece.org/trade/cefact/unlocode-code-list-country-and-territory
**Data**: Official UN location codes for ports, airports, rail terminals

**Download**:
```bash
# Download latest UN/LOCODE CSV files
wget https://unece.org/fileadmin/DAM/cefact/locode/2023-2_UNLOCODE_CodeListPart1.csv
wget https://unece.org/fileadmin/DAM/cefact/locode/2023-2_UNLOCODE_CodeListPart2.csv
wget https://unece.org/fileadmin/DAM/cefact/locode/2023-2_UNLOCODE_CodeListPart3.csv

# Import script needed to parse CSV and insert into database
```

**Format**:
- Country Code
- Location Code (UNLOCODE)
- Location Name
- Subdivision
- Function (1=Port, 2=Rail, 3=Road, 4=Airport, etc.)
- Coordinates (some entries)
- Remarks

---

### 2. World Port Index (WPI) - NGA

**Source**: National Geospatial-Intelligence Agency (NGA)
**URL**: https://msi.nga.mil/Publications/WPI
**Data**: 3,800+ ports worldwide with detailed information

**Download**:
```bash
# Available formats: CSV, Shapefile, KML
wget https://msi.nga.mil/api/publications/download?key=16694273/SFH00000/WPI.zip

# Extract and parse
unzip WPI.zip
# Import WPI.csv into database
```

**Data Fields**:
- Port Name
- UNLOCODE
- Country
- Latitude/Longitude
- Harbor Size (S/M/L)
- Channel Depth
- Cargo Pier Depth
- Facilities (container, oil, repairs, etc.)
- Pilotage
- Tugs available
- Supply information

---

### 3. OpenStreetMap / OpenSeaMap (Crowdsourced - Real)

**Source**: OpenStreetMap Contributors
**URL**: https://www.openseamap.org/
**API**: Overpass API

**Query Example** (Real data):
```bash
curl -X POST https://overpass-api.de/api/interpreter \
  --data '[out:json];
  node["seamark:type"~"harbour|berth|anchorage"](18.85,72.75,19.05,73.0);
  out body;' > mumbai_port_osm.json
```

**What You Get**:
- Berth locations (real GPS coordinates)
- Anchorage zones
- Navigation aids (lights, buoys)
- Port boundaries
- Terminals

---

## 💰 Real Port Tariff Sources

### 1. Port Authority Websites (Official)

**India - Major Ports**:
- JNPT: https://www.jnport.gov.in/Tariff
- Mumbai Port: https://mumbaiport.gov.in/en/tariff-schedule
- Chennai Port: https://www.chennaiport.gov.in/content/tariff
- Cochin Port: https://www.cochinport.gov.in/Tariff.aspx
- Visakhapatnam: https://www.vizagport.com/tariff.php

**Middle East**:
- Jebel Ali (DP World): https://www.dpworld.com/en/uae/jebel-ali/tariffs
- Dubai Ports: https://www.dpa.gov.ae/en/tariff
- Abu Dhabi Ports: https://www.adports.ae/who-we-are/tariffs/

**Singapore**:
- MPA Singapore: https://www.mpa.gov.sg/port-marine-ops/marine-services/port-charges

**Europe**:
- Rotterdam: https://www.portofrotterdam.com/en/shipping/port-tariffs
- Hamburg: https://www.hamburg-port-authority.de/en/port-charges/

---

### 2. Automated Scraping Strategy (Real Data Only)

**Approach**:
1. Identify official port authority website
2. Locate tariff PDF/webpage
3. Parse using:
   - PDF extraction (for PDF tariffs)
   - HTML scraping (for web tables)
   - OCR (for scanned PDFs)
4. Verify data manually
5. Store with source URL + scrape date

**Libraries**:
```bash
npm install puppeteer pdf-parse cheerio
```

**Example Scraper**:
```typescript
// Real data scraper - no hallucination
async function scrapeMumbaiPortTariff() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate to official tariff page
  await page.goto('https://mumbaiport.gov.in/en/tariff-schedule');

  // Extract actual published tariff data
  const tariffs = await page.evaluate(() => {
    // Parse real HTML table data
    const rows = document.querySelectorAll('table.tariff-table tr');
    return Array.from(rows).map(row => ({
      chargeType: row.cells[0]?.textContent,
      amount: parseFloat(row.cells[1]?.textContent),
      unit: row.cells[2]?.textContent,
      source: 'Mumbai Port Trust',
      sourceUrl: window.location.href,
      scrapedAt: new Date()
    }));
  });

  await browser.close();
  return tariffs;
}
```

---

### 3. Maritime Data APIs (Paid but Real)

**VesselFinder API**:
- URL: https://www.vesselfinder.com/api
- Data: Real AIS + Port info + Some tariff data
- Cost: Contact for quote

**MarineTraffic API**:
- URL: https://www.marinetraffic.com/en/ais-api-services
- Data: Real AIS + Port database + Berth info
- Cost: $73/month (Startup plan)

**IHS Markit Sea-web**:
- URL: https://ihsmarkit.com/products/sea-web-maritime-reference.html
- Data: Comprehensive port + vessel + tariff database
- Cost: Enterprise (expensive but complete)

---

## 📊 How to Verify Data is Real

### ✅ Valid Real Data Indicators:
- Source URL from official port authority
- Scraped timestamp
- Matches published PDF/website
- Can be cross-verified with multiple sources

### ❌ Hallucinated Data Red Flags:
- No source URL
- dataSource = 'SIMULATED'
- Round numbers (e.g., exactly 100 ports)
- Identical patterns across different ports
- Created programmatically without scraping

---

## 🚀 Implementation Plan (Real Data Only)

### Phase 1: UN/LOCODE Import
```bash
# Download official UN/LOCODE
wget https://unece.org/fileadmin/DAM/cefact/locode/loc233csv.zip
unzip loc233csv.zip

# Parse and import (real parsing script needed)
node import-unlocode.js
```

### Phase 2: WPI Import
```bash
# Download NGA World Port Index
wget https://msi.nga.mil/api/publications/download?key=16694273/SFH00000/WPI.zip
unzip WPI.zip

# Import (real parsing script needed)
node import-wpi.js
```

### Phase 3: Tariff Scraping (Major Ports Only)
```bash
# Scrape top 50 ports from official websites
node scrape-tariffs.js --ports=top50 --verify=true
```

---

## 📝 Current Database Status

**After Cleanup**:
```sql
SELECT
  COUNT(*) as total_ports,
  COUNT(CASE WHEN "dataSource" = 'REAL_SCRAPED' THEN 1 END) as real_ports
FROM ports;
-- Result: 1,365 real ports

SELECT
  COUNT(*) as total_tariffs,
  "dataSource"
FROM port_tariffs
GROUP BY "dataSource";
-- Result: 45 real tariffs (REAL_SCRAPED)
```

---

## ✅ Next Steps to Get Real Data

1. **Download UN/LOCODE** (free, official, 20K+ ports)
2. **Download WPI** (free, official, 3,800+ ports with details)
3. **Scrape Top 50 Port Tariffs** (official port authority websites)
4. **Use MarineTraffic API** (paid but real data)
5. **OpenSeaMap Overpass Queries** (free, real crowdsourced data)

---

**Bottom Line**: No more synthetic data. Only real, verifiable sources with source URLs and timestamps.
