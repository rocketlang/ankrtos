# EverPure - Water Quality IoT Platform

## AI-Powered Water Monitoring & Purification Intelligence

**Live Demo:** everpure.ankr.in

---

# Slide 1: The Problem

## India's Water Crisis

| Pain Point | Impact |
|------------|--------|
| **Contaminated Water** | 70% groundwater contaminated |
| **No Monitoring** | Water quality unknown at home |
| **Reactive Maintenance** | Purifiers serviced only when fail |
| **Trust Deficit** | Consumers don't trust purifier companies |
| **No Data** | No historical quality tracking |
| **Compliance Gap** | Industrial discharge unmonitored |

> **200,000 deaths annually** due to waterborne diseases

---

# Slide 2: The Solution

## EverPure - Smart Water Intelligence

**IoT sensors + AI analytics for water quality monitoring**

```
┌─────────────────────────────────────────────────────────────────┐
│                        EVERPURE                                  │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   IoT SENSORS                            │   │
│   │                                                         │   │
│   │   ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐   │   │
│   │   │  TDS  │ │  pH   │ │Turbid │ │ Temp  │ │ Flow  │   │   │
│   │   │ Sensor│ │ Sensor│ │ Sensor│ │ Sensor│ │ Sensor│   │   │
│   │   └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘   │   │
│   │       └─────────┴─────────┴─────────┴─────────┘         │   │
│   │                         │                               │   │
│   │                         ▼                               │   │
│   │              ┌─────────────────────┐                   │   │
│   │              │    AI ANALYTICS     │                   │   │
│   │              │  Pattern Detection  │                   │   │
│   │              │  Predictive Alerts  │                   │   │
│   │              │  Maintenance AI     │                   │   │
│   │              └─────────────────────┘                   │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│        ⛓️ DocChain: Quality records on blockchain               │
│        🎤 Voice: "पानी की quality कैसी है?"                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

# Slide 3: Market Opportunity

## Water Industry in India

| Segment | Size | Growth |
|---------|------|--------|
| **Water Purifiers** | $2.5B | 15% CAGR |
| **Industrial Water** | $3B | 12% CAGR |
| **IoT Sensors** | $500M | 25% CAGR |
| **Water Testing** | $200M | 18% CAGR |

### Why Now?
- Water quality awareness increasing
- IoT costs have dropped 80%
- Government pushing Jal Jeevan Mission
- Industrial compliance tightening

---

# Slide 4: IoT Sensor Suite

## Comprehensive Water Monitoring

### Sensors Available

| Sensor | Parameter | Range | Accuracy |
|--------|-----------|-------|----------|
| **TDS** | Dissolved solids | 0-2000 ppm | ±2% |
| **pH** | Acidity/Alkalinity | 0-14 | ±0.1 |
| **Turbidity** | Cloudiness | 0-1000 NTU | ±5% |
| **Temperature** | Water temp | 0-80°C | ±0.5°C |
| **Flow** | Volume/rate | 0-50 L/min | ±3% |
| **ORP** | Oxidation potential | -999 to +999 mV | ±5mV |
| **Chlorine** | Residual chlorine | 0-10 ppm | ±0.1 |
| **Conductivity** | EC | 0-20000 µS/cm | ±2% |

### Hardware

```
┌─────────────────────────────────────────┐
│     EVERPURE SENSOR HUB                 │
│                                         │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐   │
│  │ TDS │  │ pH  │  │Turbid│  │Temp │   │
│  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘   │
│     └────────┴────────┴────────┘       │
│                  │                      │
│           ┌──────▼──────┐              │
│           │   ESP32     │              │
│           │  + WiFi     │              │
│           │  + LoRa     │              │
│           └─────────────┘              │
│                                         │
│  Power: Solar + Battery backup         │
│  Connectivity: WiFi, 4G, LoRaWAN       │
│  Price: ₹4,999 (basic) - ₹15,000 (pro) │
│                                         │
└─────────────────────────────────────────┘
```

---

# Slide 5: AI Analytics

## Intelligence From Data

### AI Capabilities

| Feature | Description |
|---------|-------------|
| **Anomaly Detection** | Spot unusual patterns |
| **Trend Analysis** | Quality over time |
| **Predictive Alerts** | Warn before problems |
| **Maintenance AI** | Filter change prediction |
| **Contamination Tracking** | Source identification |
| **Usage Analytics** | Consumption patterns |

### Example: Predictive Maintenance

```
Filter Health Analysis:
- Current TDS out: 45 ppm
- Original performance: 35 ppm
- Degradation rate: 2 ppm/week
- Current filter age: 5 months
- Remaining capacity: ~3 weeks

PREDICTION: Filter change needed in 18-22 days
Recommended action: Schedule service in 2 weeks
Cost savings: ₹500 (vs emergency service)
```

---

# Slide 6: Real-Time Dashboard

## Monitor Everything

### Dashboard View

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVERPURE DASHBOARD                            │
│                                                                  │
│   WATER QUALITY NOW                                             │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│   │   TDS: 45  │  │  pH: 7.2   │  │ Turbid: 0.5│               │
│   │   ppm ✅   │  │   ✅       │  │  NTU ✅    │               │
│   └────────────┘  └────────────┘  └────────────┘               │
│                                                                  │
│   TODAY'S CONSUMPTION                                           │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │    25L                                                  │   │
│   │    ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░           │   │
│   │    Target: 50L                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   QUALITY TREND (7 days)                                        │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  TDS ──────────────────────────────────────────────     │   │
│   │    50 ─┐                                                │   │
│   │    45 ─┤    ╱╲__╱╲__╱╲__╱╲                             │   │
│   │    40 ─┴───────────────────────────────────────────     │   │
│   │         Mon  Tue  Wed  Thu  Fri  Sat  Sun               │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ALERTS: ⚠️ Filter change due in 18 days                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

# Slide 7: Voice Interface

## Ask About Your Water (Hindi)

### Voice Commands

```
User (Hindi): "पानी की quality कैसी है?"
                              ↓
EverPure: "आपके पानी का TDS 45 है जो safe है।
          pH 7.2 है, bilkul normal।
          Filter की condition अच्छी है,
          अगला service 18 दिन बाद।"

───────────────────────────────────────────

User: "आज कितना पानी use हुआ?"
                              ↓
EverPure: "आज अभी तक 25 liter पानी use हुआ।
          Average daily use 40 liter है।
          इस महीने ₹350 electricity लगी है।"
```

### Powered by @ankr/swayam + @ankr/i18n

---

# Slide 8: DocChain Integration

## Blockchain Quality Records

### What Gets Anchored

| Record | Frequency | Purpose |
|--------|-----------|---------|
| Quality readings | Hourly | Compliance proof |
| Maintenance logs | Per service | Warranty claims |
| Filter changes | Per event | Audit trail |
| Alert history | Per event | Dispute resolution |
| Calibration | Per event | Accuracy proof |

### Use Cases
- **Residential**: Prove water quality to guests
- **Commercial**: Compliance documentation
- **Industrial**: Regulatory reporting
- **Legal**: Evidence in disputes

---

# Slide 9: Applications

## Use Cases Across Segments

### Residential
- Home water purifier monitoring
- Filter change alerts
- Quality history

### Commercial
- Office building water
- Restaurant compliance
- Hotel guest assurance

### Industrial
- Effluent monitoring
- Regulatory compliance
- Process water quality

### Municipal
- Distribution network
- Leak detection
- Quality assurance

---

# Slide 10: Technology Stack

## IoT + Cloud Architecture

### Hardware
| Component | Technology |
|-----------|------------|
| MCU | ESP32-S3 |
| Sensors | Analog + I2C |
| Connectivity | WiFi, 4G, LoRa |
| Power | Solar + Li-ion |

### Cloud
| Component | Technology |
|-----------|------------|
| IoT Gateway | MQTT, AWS IoT |
| Database | TimescaleDB |
| Analytics | Python, TensorFlow |
| API | Fastify, GraphQL |

### Mobile
| Component | Technology |
|-----------|------------|
| Framework | React Native |
| Voice | Swayam SDK |
| Offline | SQLite |

---

# Slide 11: Competitive Analysis

## EverPure vs Competition

| Feature | EverPure | Kent | Livpure | Aquaguard |
|---------|----------|------|---------|-----------|
| IoT Monitoring | ✅ Full | Basic | Basic | ❌ No |
| AI Predictions | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Voice (Hindi) | ✅ 11 langs | ❌ No | ❌ No | ❌ No |
| Blockchain | ✅ DocChain | ❌ No | ❌ No | ❌ No |
| Open Platform | ✅ API | ❌ Closed | ❌ Closed | ❌ Closed |
| Multi-sensor | ✅ 8 types | 1-2 | 1-2 | 1-2 |

### Our Moat
1. **Open IoT platform** (not locked to one brand)
2. **AI predictions** for maintenance
3. **Blockchain records** for compliance
4. **Voice in 11 languages**

---

# Slide 12: Revenue Model

## Hardware + SaaS

### Hardware
| Product | Price | Margin |
|---------|-------|--------|
| Basic Hub | ₹4,999 | 40% |
| Pro Hub | ₹9,999 | 45% |
| Industrial | ₹24,999 | 50% |

### SaaS Subscription
| Tier | Price | Features |
|------|-------|----------|
| Free | ₹0/mo | Basic monitoring |
| Home | ₹149/mo | AI + alerts |
| Business | ₹499/mo | Multi-device + API |
| Enterprise | Custom | On-prem + SLA |

### Additional Revenue
- Filter sales (commission)
- Service bookings (commission)
- Data insights (B2B)

---

# Slide 13: Unit Economics

## Hardware + Recurring

### Per-Device Economics
| Metric | Value |
|--------|-------|
| Hardware revenue | ₹7,500 avg |
| Hardware margin | ₹3,000 (40%) |
| Annual SaaS | ₹1,800 |
| SaaS margin | ₹1,500 (83%) |
| **Year 1 profit/device** | **₹4,500** |
| **LTV (3 years)** | **₹9,000** |

### At Scale (100K Devices)
| Metric | Value |
|--------|-------|
| Hardware (one-time) | ₹30 Cr |
| SaaS (annual) | ₹15 Cr |
| Filter commissions | ₹3 Cr |
| **Total Revenue** | **₹48 Cr** |

---

# Slide 14: Investment Ask

## Standalone Seed Round: $1 Million

### Use of Funds
| Category | Allocation | Purpose |
|----------|------------|---------|
| **Hardware R&D** | 30% ($300K) | Sensor development, prototyping |
| **Software Platform** | 25% ($250K) | AI analytics, cloud platform |
| **Patents & IP** | 15% ($150K) | IoT water monitoring IP |
| **Manufacturing** | 20% ($200K) | Production setup, BOM optimization |
| **Marketing** | 10% ($100K) | Consumer & industrial awareness |

### Patents Strategy
| Patent Area | Status | Value |
|-------------|--------|-------|
| **AI Water Quality Prediction** | Filing | Core innovation |
| **Multi-Sensor Fusion Algorithm** | Filing | Accuracy moat |
| **Voice-First IoT Control** | Filing | Hindi commands |
| **Blockchain Quality Anchoring** | Filing | DocChain compliance |

### Milestones (18 months)
- 25,000 devices deployed
- 10,000 SaaS subscribers
- ₹8 Cr revenue
- Industrial partnerships
- 3 patents filed

---

# Slide 15: Summary

## EverPure Investment Highlights

| Factor | Strength |
|--------|----------|
| **Market** | $2.5B+ water purifier market |
| **Product** | IoT + AI + Blockchain |
| **Hardware** | 8 sensor types |
| **Voice** | 11 Indian languages |
| **Recurring** | SaaS + commissions |
| **Ecosystem** | Part of ANKR Universe |

### The Vision
**Every drop of water in India is monitored by EverPure**

---

# Thank You

## Pure Water, Pure Trust

**EverPure - AI-Powered Water Intelligence**

**Try Now:** everpure.ankr.in

---

**Capt. Anil Sharma**
Founder & CEO

📱 +91 7506926394
📧 capt.anil.sharma@powerpbox.org
🌐 ankr.in

---

*Confidential - For Investor Use Only*
*January 2026*
*Part of ANKR Universe*
