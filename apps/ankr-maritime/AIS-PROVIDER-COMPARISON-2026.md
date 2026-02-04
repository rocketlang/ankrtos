# AIS Provider Comparison & Setup Guide (2026)

**Date**: February 1, 2026
**Status**: ✅ Simulated AIS ready, real AIS pending

---

## 🔍 **Market Reality Check (2026)**

The AIS API market has shifted significantly:
- **VesselFinder**: ❌ No self-serve API (credit-based, email required)
- **Spire Maritime**: ❌ Enterprise only (>$10K/month, acquired by Kpler)
- **MarineTraffic**: ⚠️ Custom quotes only (owned by Kpler since 2023)
- **Datalastic**: ✅ **Self-serve with clear pricing** (BEST OPTION!)

---

## 🏆 **RECOMMENDED: Datalastic**

### **Why Datalastic?**
✅ **Self-serve signup** - instant access
✅ **Lowest entry price** - $20 first month
✅ **Clear pricing** - no sales calls needed
✅ **RESTful API** - easy integration
✅ **Historical + Real-time data**

### **Pricing:**
| Feature | First Month | Ongoing |
|---------|------------|---------|
| **Trial** | **$20** | $100/month |
| API Access | ✅ Yes | ✅ Yes |
| Real-time AIS | ✅ Yes | ✅ Yes |
| Historical Data | ✅ Yes | ✅ Yes |
| Owner/Operator | ❓ TBD | ❓ TBD |

### **Immediate Action:**
1. **Sign up:** https://datalastic.com/pricing/
2. **Pay $20** for first month trial
3. **Get API key**
4. **Test with Mari8X** (integration ready!)
5. **Continue at $100/month** or cancel

---

## 🔄 **Alternative: MarineTraffic (via Kpler)**

### **Status:**
- ✅ You've requested API access
- ⏳ Waiting for custom quote
- 📧 Expect reply within 1-3 business days

### **Expected Pricing (based on 2025 data):**
- **Standard Plan**: ~$100-300/month (50,000 calls/day)
- **Professional Plan**: ~$500-1,000/month (unlimited calls)
- ✅ **Owner/Operator data included** (confirmed)

### **Pros:**
- Most comprehensive AIS coverage (terrestrial + satellite)
- Includes owner/operator/manager data
- Industry standard (used by major shipping companies)

### **Cons:**
- Custom pricing (no self-serve)
- Sales process (1-2 weeks)
- Higher cost

---

## 🚀 **Mari8X AIS Integration Status**

### **✅ COMPLETE - Simulated AIS Service**

I've built a **production-ready simulated AIS service** for immediate use:

**Features:**
- ✅ 4 simulated vessels with realistic routes
- ✅ Owner/Operator data included
- ✅ Position updates every 5 minutes
- ✅ Historical tracks (7 days)
- ✅ Search by vessel name/IMO/MMSI
- ✅ Fleet positions
- ✅ Realistic speed variations

**Simulated Fleet:**
1. **PACIFIC DREAM** (Bulk Carrier, 82,000 DWT)
   - Route: Singapore → Chennai
   - Owner: Pacific Shipping Limited
   - Operator: Global Maritime Operations Ltd

2. **ATLANTIC VOYAGER** (Container Ship, 150,000 DWT)
   - Route: Rotterdam → New York
   - Owner: Atlantic Container Lines
   - Operator: Global Shipping Corp

3. **ARABIAN STAR** (Tanker, 320,000 DWT)
   - Route: Jebel Ali → Singapore
   - Owner: Middle East Tankers LLC
   - Operator: Gulf Shipping Co

4. **ASIAN PIONEER** (Bulk Carrier, 180,000 DWT)
   - Route: Shanghai → Busan
   - Owner: Singapore Bulk Carriers
   - Operator: Asia Pacific Shipping

---

## 🧪 **Test Simulated AIS NOW**

### **1. Check Configuration:**

```bash
cat /root/apps/ankr-maritime/backend/.env | grep AIS
```

Should show:
```
ENABLE_AIS=true
AIS_MODE=simulated
```

### **2. Start Mari8X Backend:**

```bash
cd /root/apps/ankr-maritime/backend
npm run dev
```

### **3. Test GraphQL Queries:**

Open GraphiQL at: `http://localhost:4051/graphql`

**Get vessel position:**
```graphql
query {
  vesselPosition(imo: 9000001) {
    latitude
    longitude
    speed
    course
    heading
    timestamp
    owner
    operator
    technicalManager
    commercialManager
  }
}
```

**Get fleet positions:**
```graphql
query {
  fleetPositions {
    vesselName
    latitude
    longitude
    speed
    owner
    operator
    timestamp
  }
}
```

**Get vessel track (7 days):**
```graphql
query {
  vesselTrack(
    imo: 9000001
    startDate: "2026-01-25T00:00:00Z"
    endDate: "2026-02-01T00:00:00Z"
  ) {
    positions {
      latitude
      longitude
      speed
      timestamp
    }
    totalDistance
    averageSpeed
  }
}
```

---

## 🔑 **Switch to Real AIS (When API Key Arrives)**

### **For Datalastic:**

1. **Get API key** from dashboard
2. **Update `.env`:**
   ```bash
   ENABLE_AIS=true
   AIS_MODE=production
   DATALASTIC_API_KEY=your-key-here
   ```

3. **Restart backend**
4. **Test with real vessel IMO**

### **For MarineTraffic:**

1. **Receive API key** from Kpler
2. **Update `.env`:**
   ```bash
   ENABLE_AIS=true
   AIS_MODE=production
   MARINETRAFFIC_API_KEY=your-key-here
   ```

3. **Restart backend**
4. **Enjoy owner/operator data!**

---

## 💰 **Cost Comparison**

| Provider | First Month | Ongoing | Owner Data | Entry |
|----------|------------|---------|------------|-------|
| **Datalastic** | **$20** | $100/month | ❓ TBD | ✅ Self-serve |
| **MarineTraffic** | Quote | ~$100-300/month | ✅ Yes | ⏳ Sales call |
| **VesselFinder** | Email | Credit-based | ⚠️ Limited | ❌ No API plans |
| **Spire** | Quote | >$10K/month | ✅ Yes | ❌ Enterprise only |

---

## 📊 **Recommendation Strategy**

### **Phase 1: Immediate (This Week) - Datalastic**
1. ✅ **Sign up for Datalastic** ($20 trial)
2. ✅ Test real AIS integration
3. ✅ Validate owner/operator data availability
4. ✅ Demo to potential customers

### **Phase 2: Production (This Month) - MarineTraffic**
1. ⏳ Wait for MarineTraffic quote
2. ✅ Compare pricing vs Datalastic
3. ✅ If Datalastic works → continue at $100/month
4. ✅ If MarineTraffic better → switch after trial

### **Phase 3: Scale (3-6 Months)**
- If < 50 vessels: **Datalastic** ($100/month)
- If 50-200 vessels: **MarineTraffic Standard** (~$300/month)
- If 200+ vessels: **MarineTraffic Professional** (~$1,000/month)

---

## ✅ **Next Steps (Priority Order)**

### **TODAY:**
1. ✅ Test simulated AIS (commands above)
2. ✅ Sign up for Datalastic ($20 trial)
3. ✅ Run port tariff scraper (10-20 ports)

### **THIS WEEK:**
1. ⏳ Receive MarineTraffic quote
2. ✅ Configure Datalastic API key
3. ✅ Test real AIS data
4. ✅ Validate owner/operator fields

### **THIS MONTH:**
1. ✅ Choose production AIS provider
2. ✅ Complete 600 ports via daily scraping
3. ✅ Build live fleet map UI
4. ✅ Demo to first customers

---

## 🎯 **Key Insights**

### **What Changed in 2026:**
- AIS APIs moved to enterprise/custom pricing
- Self-serve plans mostly discontinued
- Datalastic emerged as affordable alternative
- Kpler consolidating market (acquired MarineTraffic + Spire)

### **Why Simulated AIS Matters:**
- ✅ Build & test all features NOW
- ✅ Demo to customers/investors
- ✅ Validate product-market fit
- ✅ Switch to real AIS when revenue justifies cost

### **Why Datalastic is Perfect for MVP:**
- **$20 risk** vs $100-300 commitment
- Test real AIS without sales calls
- Validate technical integration
- Decide on MarineTraffic after testing

---

## 📚 **References**

**Datalastic:**
- Website: https://datalastic.com/pricing/
- Pricing: $20 first month, $100 ongoing
- Features: Real-time + Historical AIS, RESTful API

**MarineTraffic (Kpler):**
- Website: https://www.marinetraffic.com/
- API Docs: https://servicedocs.marinetraffic.com/
- You've requested access (waiting for quote)

**Market Analysis:**
- [How Much Does MarineTraffic Cost (2025)](https://blogs.tradlinx.com/how-much-does-marinetraffic-cost-2025-and-what-are-you-really-getting/)
- [VesselFinder Cost Analysis](https://blogs.tradlinx.com/how-much-does-vesselfinder-cost-and-what-it-doesnt-cover-for-lsps-in-2025/)

---

**Your Command (Test Simulated AIS NOW):**
```bash
cd /root/apps/ankr-maritime/backend && npm run dev
```

Then open GraphiQL and try the queries above!

---

**Your Command (Sign Up for Datalastic):**
Visit: **https://datalastic.com/pricing/** → Pay $20 → Get API key

---

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
