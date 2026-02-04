# ANKR Platform Capabilities

**Document Purpose:** Reference guide for collaboration discussions
**Date:** January 2026
**Sources:** ankr.in, swayam.ankr.in, baniai.io

---

## 1. Company Overview

### ANKR Labs
- **Mission:** "Saathi to a Billion Indians" - democratizing AI access for India's non-English speaking population
- **Parent Company:** PowerPBox IT Solutions Pvt Ltd
- **Location:** Gurgaon, Haryana
- **Founded/Led by:** Captain Anil Sharma
- **Philosophy:** Voice-first, multilingual, affordable AI for the common Indian

### Key Stats
| Metric | Value |
|--------|-------|
| NPM Packages | 164 (135 libraries, 29 apps) |
| TypeScript Files | 11,578 |
| AI Providers Integrated | 17 |
| Languages Supported | 22 Indian languages |
| Tools Discovered | 294 |
| Tools Integrated | 40+ |

### Target Pricing
- **Common Man Pricing:** ₹500/month
- **vs. Enterprise Standard:** ₹50,000+/month
- **Approach:** Free-tier AI provider prioritization

---

## 2. Product Portfolio

### 2.1 SWAYAM (स्वयं) - AI Companion
**URL:** https://swayam.ankr.in

**What it is:** Flagship multilingual conversational AI platform

**Core Capabilities:**
- Multilingual AI (Hindi, Tamil, Telugu, 20+ languages)
- Voice-first interaction (no typing required)
- 100+ integrated tools across domains
- Multiple personas for different use cases

**Personas:**
| Persona | Target User |
|---------|-------------|
| Business Saathi | SME owners, entrepreneurs |
| Driver Saathi | Truck drivers, fleet operators |
| Compliance Saathi | Accountants, tax filers |
| General Assistant | Everyone |

**Technical Infrastructure:**
- 13/17 LLM providers active
- Free providers: Groq (157ms), Cerebras, SambaNova, LongCat
- Paid: OpenAI, Anthropic, DeepSeek, Mistral
- Capacity: 50K+ requests/day from free providers
- BYOK (Bring Your Own Keys) supported

**Self-Evolution Features:**
- Tool Scanner (auto-discovers new tools)
- Auto Integrator (connects tools to platform)
- Vibe Coder (AI code generation)
- Voice command support

**Domain Coverage:**
| Domain | Capabilities |
|--------|--------------|
| Coding | React/Node.js app generation |
| Compliance | GST returns, government forms |
| Logistics | Vehicle tracking, route optimization |
| Government | Aadhaar, DigiLocker, ULIP integration |
| Finance | EMI calculations, UPI, BBPS |

---

### 2.2 BANI (बानी) - Voice Translation
**URL:** https://baniai.io

**What it is:** Real-time voice translation with voice cloning

**Tagline:** "Speak Hindi, be heard in Tamil — in YOUR voice"

**Core Features:**
- **Sub-500ms latency** - near-instantaneous translation
- **22 Indian languages** supported
- **Voice cloning** - maintains speaker's voice characteristics

**Languages Supported:**
Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu + 10 more

**How it Works:**
```
1. Speaker talks in native language
2. Real-time AI translation (no delays)
3. Output in listener's language, speaker's voice
```

**Use Cases:**
| Industry | Application |
|----------|-------------|
| Healthcare | Doctor-patient across languages |
| Call Centers | Native language support |
| Government | Accessible citizen services |
| Families | Relatives speaking different languages |

**Access:** Free demo, no signup required

---

### 2.3 WowTruck 2.0 - Transport Management
**What it is:** AI-powered fleet management system

**Features:**
- GPS fleet tracking
- Route optimization
- Voice AI for drivers (Driver Saathi)
- Fuel management
- Trip documentation

---

### 2.4 FreightBox - Freight Forwarding
**URL:** https://freightbox.org

**What it is:** End-to-end freight forwarding platform

**Capabilities:**
- Ocean/Air/Multimodal logistics
- Blockchain-based documentation
- Rate management
- Shipment tracking
- Customs documentation

---

### 2.5 ComplyMitra - Compliance Automation
**URL:** https://complymitra.in

**What it is:** Automated compliance filing platform

**Compliance Types:**
- GST (returns, reconciliation)
- Income Tax
- EPF/ESI
- MCA filings
- TDS

---

### 2.6 DODD-WMS - Warehouse Management
**What it is:** Full-featured warehouse management system

**Modules:**
- Inventory management
- Receiving/Putaway
- Picking/Packing
- Shipping
- Reporting/Analytics

**Integration:** ERP, IoT sensors, TMS, e-commerce

---

### 2.7 SunoSunao - Voice Preservation
**URL:** https://sunosunao.ankr.in

**Tagline:** "Your Voice, Forever"

**Purpose:** Voice preservation/archival technology

---

### 2.8 EverPure - Organic Groceries
**URL:** https://ever-pure.in

**What it is:** Pure organic groceries e-commerce

**Products:** A2 Ghee, Honey, Spices, Organic groceries

---

## 3. Technical Architecture

### EON Memory System
- PostgreSQL with pgvector
- Retrieval-Augmented Generation (RAG)
- Persistent conversation memory
- Knowledge base indexing

### AI Infrastructure
```
┌─────────────────────────────────────────────────────────────┐
│                    SWAYAM PLATFORM                          │
├─────────────────────────────────────────────────────────────┤
│  LLM LAYER (17 Providers)                                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  Groq   │ │Cerebras │ │ OpenAI  │ │Anthropic│          │
│  │ (Free)  │ │ (Free)  │ │ (Paid)  │ │ (Paid)  │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
├─────────────────────────────────────────────────────────────┤
│  TOOL LAYER (294 Discovered, 40+ Integrated)                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │Complian-│ │ Govern- │ │ Finance │ │Logistics│          │
│  │   ce    │ │  ment   │ │         │ │         │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
├─────────────────────────────────────────────────────────────┤
│  VOICE LAYER (BANI)                                         │
│  ┌─────────────────────────────────────────────────┐       │
│  │ STT → Translation → Voice Clone → TTS           │       │
│  │ (22 languages, <500ms latency)                  │       │
│  └─────────────────────────────────────────────────┘       │
├─────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                 │
│  ┌─────────────────────────────────────────────────┐       │
│  │ PostgreSQL │ pgvector │ EON Memory │ Redis     │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### India Stack Integration
- Aadhaar (identity verification)
- DigiLocker (document access)
- ULIP (logistics data)
- UPI (payments)
- GST Network (compliance)

---

## 4. Key Differentiators

| Aspect | Traditional Enterprise | ANKR |
|--------|----------------------|------|
| **Language** | English-first | 22 Indian languages |
| **Interface** | Forms, typing | Voice-first |
| **Pricing** | ₹50K+/month | ₹500/month |
| **Literacy** | Required | Not required |
| **Connectivity** | Always-on | Offline-capable |
| **Device** | Desktop/Laptop | Mobile-PWA |

### Unique Value Props
1. **Voice-first** - Eliminates literacy barrier
2. **Vernacular** - Native language experience
3. **Affordable** - 100x cheaper than enterprise
4. **Integrated** - Multiple domains in one platform
5. **Self-evolving** - AI improves without manual updates
6. **India-native** - Built for Indian infrastructure

---

## 5. Collaboration Fit Analysis

### For Pratham (EdTech)

| ANKR Asset | Pratham Application |
|------------|---------------------|
| BANI voice translation | Regional language tutoring |
| SWAYAM AI | Intelligent Q&A, doubt solving |
| EON RAG | Course content grounding |
| Multi-persona | Student Saathi persona |

**Killer Combo:** BANI + SWAYAM + RAG = "Voice tutor in any Indian language"

### For Kuber (Trading)

| ANKR Asset | Kuber Application |
|------------|-------------------|
| AI infrastructure | Pattern discovery ML |
| Tool integration | Trading tool connections |
| Dashboard capability | Visualization |

**Value:** ANKR's AI infra for time-series pattern analysis

### For Cold Love (Warehousing)

| ANKR Asset | Cold Love Application |
|------------|----------------------|
| DODD-WMS | Inventory & operations |
| IoT capability | Temperature monitoring |
| SWAYAM | Voice commands for warehouse staff |
| Analytics | Optimization insights |

**Value:** Integrated cold chain platform with voice interface

---

## 6. Live URLs Reference

| Product | URL | Status |
|---------|-----|--------|
| Main Site | https://ankr.in | Active |
| Swayam | https://swayam.ankr.in | Active |
| BANI | https://baniai.io | Active |
| ComplyMitra | https://complymitra.in | Active |
| FreightBox | https://freightbox.org | Active |
| DODD | https://dodd-erp.org | Active |
| SunoSunao | https://sunosunao.ankr.in | Active |
| EverPure | https://ever-pure.in | Active |

---

## 7. Development Velocity

**Timeline Achievement:**
- SWAYAM core platform built in ~4 months (Aug-Dec 2025)
- 164 NPM packages
- 11,578 TypeScript files
- 294 tools discovered, 40+ integrated

**Self-Evolution Rate:**
- Tool Scanner: Active
- Auto Integrator: Active
- Vibe Coder: Active
- 30-second refresh cycles

---

*Document Version: 2.0*
*Last Updated: January 2026*
*Sources: ankr.in, swayam.ankr.in, baniai.io*
