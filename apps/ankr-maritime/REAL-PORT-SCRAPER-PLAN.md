# Real Port Tariff Scraper - Implementation Plan

**Target Ports - Phase 1 (First 8 ports):**
1. Mumbai Port (India) - Mumbai Port Trust
2. Kandla (India) - Deendayal Port Authority
3. Mundra (India) - Adani Mundra Port
4. Colombo (Sri Lanka) - Sri Lanka Ports Authority
5. Singapore - Maritime and Port Authority of Singapore (MPA)
6. Jebel Ali (UAE) - DP World
7. Jeddah (Saudi Arabia) - Saudi Ports Authority
8. Fujairah (UAE) - Fujairah Ports

**Growth Rate:** 10 additional ports per day

---

## **📋 ARCHITECTURE**

### **1. Port Scraper Framework**

```typescript
interface PortScraperConfig {
  portId: string;
  portName: string;
  unlocode: string;
  country: string;
  scraperType: 'html' | 'pdf' | 'api' | 'excel';
  sourceUrl: string;
  selectors?: {
    chargeType?: string;
    amount?: string;
    currency?: string;
    unit?: string;
    vesselType?: string;
  };
  pdfConfig?: {
    tableStart?: string;
    tableEnd?: string;
    columns: string[];
  };
}

interface ScrapedTariff {
  chargeType: string;
  amount: number;
  currency: string;
  unit: string;
  vesselType?: string;
  notes?: string;
  sourceUrl: string;
  scrapedAt: Date;
}
```

### **2. Database Schema Update**

Add `dataSource` tracking:

```prisma
model PortTariff {
  id            String    @id @default(cuid())
  portId        String
  chargeType    String
  amount        Float
  currency      String    @default("USD")
  unit          String    @default("per_grt")
  notes         String?
  vesselType    String?
  sizeRangeMin  Float?
  sizeRangeMax  Float?

  // NEW: Data source tracking
  dataSource    String    @default("REAL_SCRAPED") // REAL_SCRAPED | SIMULATED | API
  sourceUrl     String?   // URL where data was scraped from
  scrapedAt     DateTime? // When it was scraped

  effectiveFrom DateTime  @default(now())
  effectiveTo   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  port Port @relation(fields: [portId], references: [id])

  @@map("port_tariffs")
}
```

---

## **🔍 PORT RESEARCH RESULTS**

### **1. Mumbai Port Trust**
- **Website:** https://www.mumbaiport.gov.in/
- **Tariff Location:** Tariff Book (PDF)
- **Format:** PDF tables
- **Update Frequency:** Annually
- **Scraping Strategy:** PDF parser with table extraction

### **2. Kandla (Deendayal Port)**
- **Website:** https://deendayalport.gov.in/
- **Tariff Location:** Scale of Rates (PDF)
- **Format:** PDF tables
- **Update Frequency:** Annual revisions
- **Scraping Strategy:** PDF parser

### **3. Mundra Port (Adani)**
- **Website:** https://www.adaniports.com/
- **Tariff Location:** Requires contact/login
- **Format:** Not publicly available
- **Scraping Strategy:** API integration or manual entry

### **4. Colombo Port**
- **Website:** https://www.slpa.lk/
- **Tariff Location:** Port Tariff section
- **Format:** HTML tables / PDF
- **Update Frequency:** Regular updates
- **Scraping Strategy:** HTML parser + PDF fallback

### **5. Singapore MPA**
- **Website:** https://www.mpa.gov.sg/
- **Tariff Location:** Port Dues & Charges
- **Format:** HTML tables
- **Update Frequency:** Quarterly
- **Scraping Strategy:** HTML parser (well-structured)

### **6. Jebel Ali (DP World)**
- **Website:** https://www.dpworld.com/
- **Tariff Location:** Customer portal (restricted)
- **Format:** Proprietary
- **Scraping Strategy:** API integration or manual entry

### **7. Jeddah Port**
- **Website:** https://www.ports.gov.sa/
- **Tariff Location:** Tariff guide (PDF/HTML)
- **Format:** PDF/HTML
- **Scraping Strategy:** Hybrid parser

### **8. Fujairah Port**
- **Website:** https://fujairahports.ae/
- **Tariff Location:** Tariff section
- **Format:** PDF
- **Scraping Strategy:** PDF parser

---

## **🛠️ IMPLEMENTATION STRATEGY**

### **Phase 1: Framework (Day 1)**
1. Create base scraper class
2. Implement PDF parser (using pdf-parse or pdfjs)
3. Implement HTML parser (using cheerio)
4. Add dataSource field to schema
5. Create scraper registry

### **Phase 2: First 8 Ports (Days 2-3)**
1. Mumbai - PDF scraper
2. Kandla - PDF scraper
3. Mundra - Manual/API (placeholder)
4. Colombo - HTML scraper
5. Singapore - HTML scraper
6. Jebel Ali - Manual/API (placeholder)
7. Jeddah - Hybrid scraper
8. Fujairah - PDF scraper

### **Phase 3: Expansion (Days 4+)**
- 10 new ports per day
- Prioritize publicly available data
- Focus on major shipping routes

---

## **📦 DEPENDENCIES NEEDED**

```json
{
  "dependencies": {
    "pdf-parse": "^1.1.1",        // PDF parsing
    "cheerio": "^1.0.0-rc.12",    // HTML parsing
    "axios": "^1.6.0",            // HTTP requests
    "puppeteer": "^21.0.0",       // Headless browser for dynamic content
    "xlsx": "^0.18.0",            // Excel parsing
    "sharp": "^0.33.0"            // Image processing (for PDF tables)
  }
}
```

---

## **🎯 SCRAPING STANDARDS**

### **Ethics & Compliance:**
- ✅ Respect robots.txt
- ✅ Rate limiting: 1 request per 5 seconds per port
- ✅ User-agent identification
- ✅ Cache results (refresh every 30 days)
- ✅ Store source URL for attribution
- ✅ Only scrape publicly available data

### **Data Quality:**
- ✅ Validate amounts are numeric
- ✅ Normalize currency codes (ISO 4217)
- ✅ Standardize charge types
- ✅ Include effective dates
- ✅ Mark uncertain data with notes

### **Error Handling:**
- ✅ Log all scraping attempts
- ✅ Retry failed scrapes (max 3 attempts)
- ✅ Alert on structure changes
- ✅ Fallback to previous data if scrape fails

---

## **📊 EXPECTED OUTCOMES**

### **Week 1:**
- 8 ports with real tariff data
- Framework tested and stable
- 10 ports/day pipeline established

### **Month 1:**
- ~300 ports with real data
- Automated scraping for supported formats
- Manual entry workflow for restricted ports

### **Month 3:**
- 800+ ports (complete target)
- Full automation where possible
- Regular update schedule

---

## **🔄 UPDATE SCHEDULE**

- **Daily:** New port additions (10/day)
- **Weekly:** Refresh high-priority ports
- **Monthly:** Full refresh of all ports
- **Quarterly:** Validate data accuracy

---

*Ready to start implementation!*
