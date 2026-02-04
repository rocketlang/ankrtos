# Free & Open-Source Vessel Databases

**Date**: February 1, 2026

---

## ✅ **FREE Vessel Data Sources (MMSI, IMO, Ship Names, Owners)**

### **1. AISstream.io** ⭐ **BEST FOR REAL-TIME**

**API**: https://aisstream.io
**Cost**: **FREE** (unlimited)
**Your API Key**: `a41cdb7961c35208fa4adfda7bf70702308968bd`

**What you get:**
- ✅ **MMSI** - 9-digit identifier (primary)
- ✅ **IMO Number** - 7-digit unique ship ID
- ✅ **Ship Name** - Current vessel name
- ✅ **Callsign** - Radio callsign
- ✅ **Ship Type** - AIS vessel type code (cargo, tanker, etc.)
- ✅ **Destination** - Current voyage destination
- ✅ **Real-time Position** - Lat/lon, speed, heading
- ✅ **Dimensions** - Length, beam, draft

**Coverage**: Global (300+ messages/second)

**Limitations**:
- ❌ No historical owner data
- ❌ No beneficial owner / UBO data
- ❌ No build year, shipyard, flag (can derive flag from MMSI)

**How to use:**
```typescript
// ShipStaticData message includes:
{
  ImoNumber: 9234567,
  Name: "PACIFIC DREAM",
  CallSign: "VRXY4",
  Type: 70, // Cargo vessel
  Destination: "SINGAPORE",
  Dimension: { A: 150, B: 15, C: 25, D: 10 } // Ship dimensions
}
```

---

### **2. MarineTraffic Public API** ⚠️ **LIMITED FREE TIER**

**Website**: https://www.marinetraffic.com/en/ais-api-services
**Cost**: Free tier = 50 API calls/month, then $19/month

**What you get:**
- ✅ MMSI, IMO, Ship Name, Callsign
- ✅ Ship Type, Flag, Year Built
- ✅ Current Position
- ⚠️ Owner/Manager (limited on free tier)

**Pro**: Well-documented REST API
**Con**: Very limited free tier

---

### **3. VesselFinder** ⚠️ **FREE WEBSITE, NO API**

**Website**: https://www.vesselfinder.com
**Cost**: FREE for website browsing, API costs $99/month

**What you get (manual lookup only):**
- ✅ MMSI, IMO, Name
- ✅ Owner, Manager
- ✅ Build Year, Shipyard
- ✅ Current Position

**How to use**: Manual search only, no programmatic access

---

### **4. FleetMon** ⚠️ **FREE WEBSITE, NO API**

**Website**: https://www.fleetmon.com
**Cost**: FREE for browsing, API costs €99/month

**What you get:**
- ✅ MMSI, IMO, Name, Callsign
- ✅ Owner, Flag, Year Built
- ✅ Position History

**Limitation**: No free API

---

### **5. ShipSpotting.com** ✅ **FREE COMMUNITY DATABASE**

**Website**: https://www.shipspotting.com
**Cost**: **FREE** (crowdsourced)

**What you get:**
- ✅ IMO Number
- ✅ Ship Name
- ✅ Photos, technical details
- ⚠️ No API, manual lookup only

---

### **6. Equasis (EU Commission)** ✅ **FREE OFFICIAL DATABASE**

**Website**: https://www.equasis.org
**Cost**: **FREE** (registration required)

**What you get:**
- ✅ IMO Number ⭐
- ✅ Ship Name, Flag
- ✅ Owner/Manager ⭐ **BEST FOR OWNERS**
- ✅ Build Year, Shipyard
- ✅ Classification Society
- ✅ Safety/Inspection Records

**Pro**: Official EU data, very reliable
**Con**: Manual lookup only, no bulk API

**How to use:**
1. Register at https://www.equasis.org/EquasisWeb/public/Registration
2. Search by IMO number
3. Get full ownership chain

---

### **7. ITU Ship Station Database** ✅ **FREE CALLSIGN LOOKUP**

**Website**: https://www.itu.int/mmsapp/
**Cost**: **FREE**

**What you get:**
- ✅ MMSI, Callsign
- ✅ Ship Name
- ✅ Flag State
- ⚠️ No ownership info

---

### **8. IHS Markit (Sea-web)** ❌ **PAID ONLY**

**Cost**: $10,000+/year
**What you get**: Everything (owners, UBOs, financials, etc.)

---

## 🔧 **DIY: Build Your Own Database**

### **Strategy 1: Combine AISstream + Equasis**

1. **AISstream**: Get MMSI + IMO from real-time AIS
2. **Equasis scraping**: Use IMO to look up ownership

```typescript
// Pseudo-code
const vessel = aisStreamService.getVesselByMMSI('367123456');
const imo = vessel.imoNumber; // e.g., 9234567

// Scrape Equasis (requires login)
const owner = await scrapeEquasis(imo);
// Returns: { owner: "Maersk Line", manager: "...", flag: "DK" }
```

---

### **Strategy 2: MMSI → Flag Derivation**

The first 3 digits of MMSI = **MID (Maritime Identification Digit)** = Country

**Examples:**
- `211xxxxxx` = Germany
- `636xxxxxx` = Liberia
- `538xxxxxx` = Marshall Islands
- `477xxxxxx` = Hong Kong
- `413xxxxxx` = China

**Full list**: https://en.wikipedia.org/wiki/Maritime_identification_digits

**Code:**
```typescript
function getCountryFromMMSI(mmsi: string): string {
  const mid = mmsi.substring(0, 3);
  const midMap: Record<string, string> = {
    '211': 'Germany',
    '636': 'Liberia',
    '538': 'Marshall Islands',
    '477': 'Hong Kong',
    '413': 'China',
    '367': 'United States',
    // ... add more
  };
  return midMap[mid] || 'Unknown';
}
```

---

### **Strategy 3: Web Scraping Vessel Databases**

**Target sites** (manual scraping, respect robots.txt):
- VesselFinder
- FleetMon
- Equasis (requires login)

**Tools**:
- Puppeteer / Playwright for browser automation
- Cheerio for HTML parsing

**Legal**: Check terms of service, respect rate limits

---

## 📊 **Comparison Table**

| Source | MMSI | IMO | Name | Owner | API | Cost |
|--------|------|-----|------|-------|-----|------|
| **AISstream.io** | ✅ | ✅ | ✅ | ❌ | ✅ WebSocket | **FREE** |
| **Equasis** | ❌ | ✅ | ✅ | ✅ | ❌ | **FREE** (manual) |
| **MarineTraffic** | ✅ | ✅ | ✅ | ⚠️ | ✅ REST | $19/mo |
| **VesselFinder** | ✅ | ✅ | ✅ | ✅ | ❌ | FREE (manual) |
| **FleetMon** | ✅ | ✅ | ✅ | ✅ | ❌ | FREE (manual) |
| **IHS Sea-web** | ✅ | ✅ | ✅ | ✅ | ✅ | $10K+/yr |

---

## 🎯 **Recommended Approach for Mari8X**

### **Phase 1: AISstream Only (Already Implemented ✅)**

- Capture MMSI, IMO, Ship Name, Ship Type from AIS
- Store in Vessel table
- **Cost**: $0/month

### **Phase 2: Add Equasis Scraper (DIY)**

- When new IMO discovered via AIS → scrape Equasis
- Store owner/manager in Vessel table
- **Cost**: $0/month + development time

### **Phase 3: Add MarineTraffic (Optional)**

- For 50 special vessels/month on free tier
- Or upgrade to $19/month for 1,000 vessels
- **Cost**: $19/month

---

## 💡 **Sample Code: Equasis Scraper**

```typescript
import puppeteer from 'puppeteer';

async function scrapeEquasis(imo: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // 1. Login to Equasis
  await page.goto('https://www.equasis.org/EquasisWeb/public/HomePage');
  await page.type('#userId', process.env.EQUASIS_USERNAME!);
  await page.type('#password', process.env.EQUASIS_PASSWORD!);
  await page.click('button[type=submit]');

  // 2. Search by IMO
  await page.goto(`https://www.equasis.org/EquasisWeb/restricted/ShipSearch?fs=Search&P_IMO=${imo}`);

  // 3. Extract data
  const owner = await page.$eval('.owner', el => el.textContent);
  const manager = await page.$eval('.manager', el => el.textContent);
  const flag = await page.$eval('.flag', el => el.textContent);

  await browser.close();

  return { owner, manager, flag };
}
```

---

## 🚀 **Next Steps for Mari8X**

1. ✅ **AISstream Integration** - DONE (already configured)
2. ⏳ **Flag Derivation** - Add MID → Country mapping
3. ⏳ **Equasis Integration** - Build scraper for ownership data
4. ⏳ **Vessel Enrichment Job** - Daily job to enrich vessel data
5. ⏳ **GraphQL API** - Expose vessel data in queries

---

## 📚 **Additional Resources**

- **ITU MID List**: https://www.itu.int/en/ITU-R/terrestrial/fmd/Pages/mid.aspx
- **IMO Number Verification**: https://gisis.imo.org/
- **AIS Message Types**: https://gpsd.gitlab.io/gpsd/AIVDM.html
- **MMSI Format**: https://en.wikipedia.org/wiki/Maritime_Mobile_Service_Identity

---

**Summary**: Use **AISstream (FREE)** for real-time MMSI/IMO/Name, add **Equasis scraper (FREE)** for ownership data. No need to pay for expensive databases.

**Total Cost**: **$0/month** 🎉

---

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
