# ANKR TeleHub for Pratham Education Foundation
## Unified Comprehensive Project Report & Technical Analysis

**Date:** February 14, 2026
**Client:** Pratham Education Foundation
**Project:** AI-Powered Telecalling & Sales Management Platform
**Prepared by:** ANKR Labs
**Status:** Requirements Finalized - Ready for Build
**Version:** 2.0 (Unified)

---

## 📋 Executive Summary

### Business Context
Pratham Education Foundation operates a 30-person sales team with telecallers facing significant operational challenges:
- **Problem 1:** Disjointed CRM and multiple disconnected databases
- **Problem 2:** Inefficient telecallers lacking real-time guidance
- **Problem 3:** No unified visibility for sales managers
- **Problem 4:** Missing field operations management (visits, closures)
- **Problem 5:** No marketing automation or campaign management

### Proposed Solution
**ANKR TeleHub** - A comprehensive AI-powered telecalling and sales command center that delivers 12 specific functional capabilities:

**Core Features (5):**
1. Lead Ingestion Manager (multi-source data import)
2. Lead Distribution Engine (intelligent routing)
3. Smart Queue (prioritized lead management)
4. Active Call HUD (real-time call interface)
5. Call Disposition System (outcome tracking)

**Automation & Logistics (4):**
6. Campaign Automation Builder (WhatsApp + Email drips)
7. Visit Scheduler (center assignment + calendar)
8. Mobile Visits View (field agent app)
9. Sale/Closure Form (deal closing workflow)

**Intelligence & Analytics (3):**
10. Customer 360 History (complete interaction timeline)
11. Command Center Dashboard (real-time analytics)
12. Sales Empowerment Panel (AI-powered assistance)

### Expected Impact
- **30-40% improvement** in telecaller efficiency
- **15-20% increase** in conversion rates
- **50% reduction** in manual data entry time
- **100% visibility** into sales team performance
- **Complete field operations** digitization
- **Automated follow-up** reducing lead leakage by 60%

### Investment & Timeline
- **Development Cost:** ₹28-35 lakhs (one-time)
- **Timeline:** 12-14 weeks to production
- **Expected ROI:** 3-4 months payback period
- **Infrastructure Cost:** ₹85-95k/month

---

## 🎯 Current State Analysis

### Existing Technology Stack

#### Known Infrastructure:
- **Backend Framework:** PHP Laravel (legacy CRM/databases)
- **Databases:** Multiple MySQL databases (fragmented)
- **Data State:** Disorganized across different systems
- **Team Size:** 30 telecallers + managers + field agents
- **Current Process:** Manual dialing, disconnected workflows
- **POC Built:** Basic dashboard (40% of requirements)

#### Pain Points by Stakeholder:

**Telecallers:**
- ❌ Manual dialing wastes 30-40% of productive time
- ❌ No access to complete lead history during calls
- ❌ No real-time guidance on objection handling
- ❌ Manual data entry after each call
- ❌ Difficulty finding information mid-call
- ❌ Can't see customer's previous interactions
- ❌ No access to knowledge base during calls

**Sales Managers:**
- ❌ No real-time visibility into team performance
- ❌ Cannot monitor call quality without manual review
- ❌ Difficult to identify coaching opportunities
- ❌ Reports are delayed and incomplete
- ❌ Cannot track campaign effectiveness
- ❌ No funnel visualization
- ❌ No agent leaderboard

**Field Agents:**
- ❌ No mobile app for visit management
- ❌ Manual visit scheduling via calls/SMS
- ❌ No geolocation tracking
- ❌ Paper-based closure forms
- ❌ Delayed commission processing

**Leadership:**
- ❌ Data locked in multiple systems
- ❌ No single source of truth for metrics
- ❌ Difficult to scale operations
- ❌ High cost per acquisition
- ❌ Limited insights into what works
- ❌ No campaign automation

---

## 🗺️ Complete Feature Map (12 Requirements)

### Feature Matrix

| # | Feature | User | Status | Effort | Priority | Phase |
|---|---------|------|--------|--------|----------|-------|
| 1 | Lead Ingestion Manager | Admin | 🔄 Partial | 1 week | Medium | Foundation |
| 2 | Lead Distribution Engine | Admin | 🔄 Partial | 2 weeks | Medium | Foundation |
| 3 | Smart Queue | Telecaller | 🔄 Partial | 1 week | High | Foundation |
| 4 | Active Call HUD | Telecaller | ❌ Missing | 3 weeks | CRITICAL | PBX Integration |
| 5 | Call Disposition | Telecaller | 🔄 Partial | 1 week | High | Foundation |
| 6 | Campaign Automation | Admin | ❌ Missing | 4 weeks | CRITICAL | Advanced Features |
| 7 | Visit Scheduler | Telecaller | ❌ Missing | 3 weeks | Medium | Advanced Features |
| 8 | Mobile Visits View | Field Agent | ❌ Missing | 3 weeks | Medium | Advanced Features |
| 9 | Sale/Closure Form | Field Agent | ❌ Missing | 2 weeks | Medium | Advanced Features |
| 10 | Customer 360 | Telecaller | ❌ Missing | 4 weeks | High | AI Features |
| 11 | Command Center | Manager | ❌ Missing | 3 weeks | CRITICAL | Dashboards |
| 12 | Empowerment Panel | Telecaller | ❌ Missing | 3 weeks | High | AI Features |

**Total Development:** 30 developer-weeks = 12-14 calendar weeks with 2-3 developers

---

## 🏗️ Solution Architecture Overview

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                     ANKR TeleHub Platform                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Telecaller  │  │   Manager    │  │  Admin/CTO   │  Mobile  │
│  │  Dashboard   │  │   Command    │  │   Analytics  │  (Field) │
│  │              │  │   Center     │  │   Dashboard  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
├─────────┴─────────────────┴──────────────────┴──────────────────┤
│                    API Gateway Layer                             │
│              (REST + GraphQL + WebSocket)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐ ┌─────────────┐ ┌──────────┐ ┌──────────────┐  │
│  │   Call     │ │   AI Call   │ │  Smart   │ │   Campaign   │  │
│  │   Engine   │ │  Assistant  │ │  Queue   │ │   Manager    │  │
│  │  + HUD     │ │  (360 View) │ │  Engine  │ │  (WhatsApp)  │  │
│  └────────────┘ └─────────────┘ └──────────┘ └──────────────┘  │
│                                                                  │
│  ┌────────────┐ ┌─────────────┐ ┌──────────┐ ┌──────────────┐  │
│  │   Voice    │ │  Analytics  │ │  Visit   │ │  Integration │  │
│  │   AI       │ │   Engine    │ │  Manager │ │     Hub      │  │
│  │  (STT/TTS) │ │  (Command)  │ │  (Geo)   │ │  (Laravel)   │  │
│  └────────────┘ └─────────────┘ └──────────┘ └──────────────┘  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                    Data & Storage Layer                          │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │  PostgreSQL      │  │  TimescaleDB     │                     │
│  │  (Primary DB)    │  │  (Time-series)   │                     │
│  │  - telehub.*     │  │  - call_metrics  │                     │
│  └──────────────────┘  └──────────────────┘                     │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │  Redis           │  │  S3/MinIO        │                     │
│  │  (Cache/Queue)   │  │  (Recordings)    │                     │
│  └──────────────────┘  └──────────────────┘                     │
├─────────────────────────────────────────────────────────────────┤
│                    Integration Layer                             │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Laravel  │  │ WhatsApp │  │  Email   │  │  Google  │        │
│  │ CRM API  │  │ Business │  │  SMTP    │  │   Maps   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Exotel  │  │  Twilio  │  │ Assembly │  │   ANKR   │        │
│  │   PBX    │  │  (Backup)│  │    AI    │  │ AI Proxy │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Technical Approaches - Detailed Analysis

### Approach 1: **Laravel Monolith Extension** 🏛️
**Philosophy:** Extend existing Laravel system with new modules

#### Pros:
✅ **Familiar Stack:** Pratham team already knows Laravel
✅ **Direct DB Access:** No need for API integration layer
✅ **Faster Initial Development:** Reuse existing code
✅ **Single Deployment:** Everything in one application
✅ **Lower Learning Curve:** Existing developers can maintain

#### Cons:
❌ **Scalability Limited:** Monolith harder to scale horizontally
❌ **Legacy Constraints:** Tied to old PHP/Laravel version
❌ **Real-time Features:** Laravel not ideal for WebSockets
❌ **AI Integration:** PHP ecosystem weaker for AI/ML
❌ **Performance:** PHP slower for compute-intensive tasks
❌ **Cannot build mobile app easily**

#### Best For:
- Quick MVP (4-6 weeks)
- Budget-constrained projects
- Small team (< 50 users)
- Temporary solution

#### Estimated Timeline: 10-15 weeks

---

### Approach 2: **Microservices Hybrid** 🔗
**Philosophy:** Keep Laravel CRM, add Node.js microservices for new features

#### Architecture:
```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Node.js)                     │
│                   GraphQL + REST + WebSocket                 │
└────────────┬──────────────┬──────────────┬──────────────────┘
             │              │              │
    ┌────────▼─────┐ ┌─────▼──────┐ ┌────▼───────────┐
    │   Laravel    │ │   Call     │ │  AI Assistant  │
    │   CRM API    │ │   Service  │ │    Service     │
    │   (Legacy)   │ │  (Node.js) │ │   (Node.js)    │
    └────────┬─────┘ └─────┬──────┘ └────┬───────────┘
             │              │              │
    ┌────────▼──────────────▼──────────────▼───────────┐
    │      PostgreSQL (Unified Database)               │
    └──────────────────────────────────────────────────┘
```

#### Service Breakdown:

**1. Laravel CRM Service (Legacy)**
- Handles lead management
- User authentication
- Basic CRUD operations
- **Port:** 8000

**2. Call Engine Service (Node.js)**
- PBX integration (Exotel/Twilio)
- Call routing and management
- Auto-dialer logic
- Active Call HUD (#4)
- **Port:** 3001

**3. AI Assistant Service (Node.js)**
- Real-time transcription
- Sentiment analysis
- Customer 360 (#10)
- Empowerment Panel (#12)
- **Port:** 3002

**4. Campaign Service (Node.js)**
- WhatsApp automation (#6)
- Email campaigns (#6)
- Template management
- Drip sequences
- **Port:** 3003

**5. Visit Manager Service (Node.js)**
- Visit scheduling (#7)
- Geolocation tracking (#8)
- Center assignment
- **Port:** 3004

**6. Analytics Service (Node.js)**
- Command Center (#11)
- Real-time metrics
- Report generation
- **Port:** 3005

#### Pros:
✅ **Best of Both Worlds:** Keep Laravel CRM, add modern services
✅ **Scalable:** Each service scales independently
✅ **Technology Freedom:** Use best tool for each job
✅ **Real-time Capable:** Node.js excels at WebSockets
✅ **Gradual Migration:** Migrate features piece by piece
✅ **Team Flexibility:** PHP devs on CRM, Node devs on new features

#### Cons:
⚠️ **Operational Complexity:** Multiple services to deploy
⚠️ **DevOps Overhead:** Need Docker, orchestration
⚠️ **Network Latency:** Service-to-service calls
⚠️ **Data Consistency:** Distributed transactions harder

#### Best For:
- Medium-large teams (50-200 users)
- Organizations planning to scale
- Long-term modernization strategy

#### Estimated Timeline: 15-21 weeks

---

### Approach 3: **Modern Full-Stack (React + Node.js)** 🚀
**Philosophy:** Build new platform, sync data from Laravel via APIs

#### Technology Stack:

**Frontend:**
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **State Management:** Zustand + TanStack Query
- **UI Components:** Radix UI + Tailwind CSS
- **Real-time:** Socket.io-client
- **Charts:** Recharts / D3.js
- **Mobile:** React Native (for #8)

**Backend:**
- **Framework:** NestJS or Fastify
- **Language:** TypeScript
- **API:** GraphQL (Apollo) + REST
- **Real-time:** Socket.io
- **ORM:** Prisma or TypeORM
- **Job Queue:** BullMQ (Redis-based)

**Infrastructure:**
- **Database:** PostgreSQL 16 + TimescaleDB
- **Cache:** Redis 7
- **Storage:** MinIO (S3-compatible)
- **Search:** Elasticsearch (optional)

**AI/ML:**
- **Voice:** AssemblyAI or Deepgram
- **LLM:** ANKR AI Proxy (Claude/GPT)
- **Embeddings:** Jina (free, 88% MTEB)
- **Queue:** Separate AI processing queue

#### Data Sync Strategy:

**Option A: Real-time CDC (Change Data Capture)**
```
Laravel MySQL → Debezium → Kafka → TeleHub PostgreSQL
```

**Option B: Scheduled ETL (Recommended)**
```
Cron Job (every 5 min) → Laravel API → Transform → PostgreSQL
```

#### Pros:
✅ **Modern Stack:** Best developer experience
✅ **Performance:** Node.js + TypeScript fast and efficient
✅ **Type Safety:** End-to-end TypeScript
✅ **Scalability:** Designed for scale from day 1
✅ **Real-time Native:** WebSockets built-in
✅ **AI-Friendly:** Easy integration with Python/ML services
✅ **Future-Proof:** Modern architecture, easy to maintain
✅ **Mobile Ready:** React Native for field agents

#### Cons:
❌ **Greenfield Build:** Everything built from scratch
❌ **Data Migration:** Complex initial data sync
❌ **Two Systems:** Maintain Laravel + new platform during transition
❌ **Learning Curve:** Team needs to learn new stack
❌ **Higher Initial Cost:** More development time

#### Best For:
- Long-term investment (3-5 years)
- Organizations planning significant growth
- When existing Laravel system is too outdated

#### Estimated Timeline: 21-29 weeks (5-7 months)

---

### Approach 4: **ANKR Platform Integration** 🎯 (RECOMMENDED)
**Philosophy:** Leverage existing ANKR infrastructure and add TeleHub as a module

#### Architecture:
```
┌─────────────────────────────────────────────────────────────┐
│              ANKR Ecosystem (Existing)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  ANKR LMS    │  │  ANKR Viewer │  │  Command     │      │
│  │  (Port 5173) │  │  (Port 3199) │  │  Center      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         NEW: ANKR TeleHub Module                     │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐      │   │
│  │  │ Telecaller │ │  Manager   │ │  Mobile    │      │   │
│  │  │ Dashboard  │ │  Command   │ │  Field App │      │   │
│  │  │            │ │  Center    │ │            │      │   │
│  │  │  #3,#4,#5  │ │   #11      │ │  #8, #9    │      │   │
│  │  │ #10, #12   │ │            │ │            │      │   │
│  │  └────────────┘ └────────────┘ └────────────┘      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Shared ANKR Services (Reuse!)                │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐      │   │
│  │  │ AI Proxy   │ │    EON     │ │  PageIndex │      │   │
│  │  │(Port 4444) │ │(Port 4005) │ │  Search    │      │   │
│  │  │  (#12)     │ │  (#10)     │ │  (#12)     │      │   │
│  │  └────────────┘ └────────────┘ └────────────┘      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │    PostgreSQL (ankr_eon + telehub schema)            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ Sync Layer
                             │
┌────────────────────────────▼────────────────────────────────┐
│           Pratham Laravel CRM (Legacy)                       │
│           MySQL Database (Read-only access)                  │
└─────────────────────────────────────────────────────────────┘
```

#### Integration Points:

**1. Reuse ANKR AI Proxy (Port 4444)**
- Powers #10 (Customer 360 insights)
- Powers #12 (Empowerment Panel)
- Already configured with Claude, GPT, Gemini
- Cost-optimized routing
- Built-in caching
- **Benefit:** No new AI infrastructure needed

**2. Leverage EON Memory (Port 4005)**
- Store call transcripts (#4, #10)
- Customer interaction history (#10)
- Vector search for similar calls
- Historical pattern analysis
- **Benefit:** AI learns from past calls

**3. Use Existing PageIndex**
- Index knowledge base, scripts, FAQs (#12)
- Instant search during calls
- **Benefit:** Telecallers find answers in <1 second

**4. ANKR Viewer for Reports**
- Reuse reporting infrastructure (#11)
- Beautiful dashboards already built
- Export capabilities
- **Benefit:** Unified analytics across all ANKR products

**5. Shared Authentication**
- Single sign-on across ANKR products
- Role-based access control
- **Benefit:** One login for all systems

#### Database Schema Design:

```sql
-- New schema in existing ankr_eon database
CREATE SCHEMA telehub;

-- #1: Lead Ingestion Manager
CREATE TABLE telehub.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255), -- Laravel CRM ID
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  status VARCHAR(50), -- fresh, callback, retry, hot, warm, cold
  lead_score INTEGER,
  source VARCHAR(100), -- landing_page, csv, manual, api
  language VARCHAR(20), -- hindi, english, tamil
  pincode VARCHAR(10), -- for #7 (visit scheduling)
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_from VARCHAR(100)
);

-- #2: Lead Distribution Engine
CREATE TABLE telehub.distribution_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  priority INTEGER DEFAULT 0,
  assignment_type VARCHAR(50), -- round_robin, random, source_based, language_based
  conditions JSONB, -- { "source": "landing_page", "language": "hindi" }
  target_agent_group VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- #4: Active Call HUD
CREATE TABLE telehub.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES telehub.leads(id),
  telecaller_id UUID REFERENCES public.users(id),
  direction VARCHAR(20), -- 'inbound', 'outbound'
  status VARCHAR(50), -- 'ringing', 'in_progress', 'completed', 'missed'
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  recording_url TEXT,
  transcript_id UUID, -- Reference to EON memory
  exotel_sid VARCHAR(255), -- Exotel call SID
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- #5: Call Disposition
CREATE TABLE telehub.call_dispositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES telehub.calls(id),
  disposition_code VARCHAR(100), -- connected_interested, connected_not_interested,
                                  -- callback, wrong_number, busy, no_answer,
                                  -- out_of_service, dnd, language_barrier, escalate
  sub_disposition VARCHAR(100),
  notes TEXT,
  callback_scheduled_at TIMESTAMPTZ,
  next_action VARCHAR(100), -- schedule_visit, send_email, add_to_campaign
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- #4: Call Analytics
CREATE TABLE telehub.call_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES telehub.calls(id),
  sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
  talk_ratio DECIMAL(3,2), -- telecaller talk time / total
  keywords JSONB,
  objections JSONB,
  ai_suggestions JSONB,
  quality_score INTEGER, -- 1-10
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- #6: Campaign Automation
CREATE TABLE telehub.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50), -- email, whatsapp, mixed
  target_segment JSONB,
  script_template TEXT,
  active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE telehub.campaign_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES telehub.campaigns(id),
  sequence_order INTEGER,
  trigger_delay_hours INTEGER, -- T+0, T+24, T+48, etc.
  channel VARCHAR(50), -- email, whatsapp
  template_id UUID,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE telehub.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  channel VARCHAR(50), -- email, whatsapp
  subject VARCHAR(255), -- for email
  body TEXT,
  media_url TEXT, -- for WhatsApp images/videos
  variables JSONB, -- {{ first_name }}, {{ center_name }}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- #7: Visit Scheduler
CREATE TABLE telehub.centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  pincode VARCHAR(10),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE telehub.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES telehub.leads(id),
  center_id UUID REFERENCES telehub.centers(id),
  field_agent_id UUID REFERENCES public.users(id),
  scheduled_at TIMESTAMPTZ,
  status VARCHAR(50), -- scheduled, in_progress, completed, cancelled
  check_in_at TIMESTAMPTZ,
  check_in_latitude DECIMAL(10,8),
  check_in_longitude DECIMAL(11,8),
  notes TEXT,
  photos JSONB, -- array of S3 URLs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- #9: Sale/Closure Form
CREATE TABLE telehub.closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES telehub.visits(id),
  lead_id UUID REFERENCES telehub.leads(id),
  product VARCHAR(255),
  price DECIMAL(10,2),
  discount DECIMAL(10,2),
  final_amount DECIMAL(10,2),
  proof_url TEXT, -- signature/document
  invoice_generated BOOLEAN DEFAULT false,
  welcome_email_sent BOOLEAN DEFAULT false,
  payment_status VARCHAR(50), -- pending, partial, full
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- #11: Command Center Performance
CREATE TABLE telehub.telecaller_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telecaller_id UUID REFERENCES public.users(id),
  date DATE NOT NULL,
  calls_made INTEGER DEFAULT 0,
  calls_connected INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  avg_call_duration INTEGER,
  avg_sentiment DECIMAL(3,2),
  revenue_generated DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(telecaller_id, date)
);

-- #10: Customer 360 History
CREATE TABLE telehub.interaction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES telehub.leads(id),
  interaction_type VARCHAR(50), -- call, email, whatsapp, visit, note
  interaction_id UUID, -- references calls, emails, visits
  summary TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email tracking for #10
CREATE TABLE telehub.email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES telehub.leads(id),
  campaign_id UUID REFERENCES telehub.campaigns(id),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  tracking_pixel_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_leads_status ON telehub.leads(status);
CREATE INDEX idx_leads_telecaller ON telehub.leads(assigned_to);
CREATE INDEX idx_calls_telecaller_date ON telehub.calls(telecaller_id, started_at);
CREATE INDEX idx_visits_field_agent_date ON telehub.visits(field_agent_id, scheduled_at);
```

#### Mapping 12 Requirements to Architecture:

| Requirement | Schema Tables | Services | External APIs |
|-------------|---------------|----------|---------------|
| #1: Lead Ingestion | leads, distribution_rules | ETL Service | Laravel API |
| #2: Distribution Engine | distribution_rules, leads | Queue Service | - |
| #3: Smart Queue | leads, calls, dispositions | Backend API | - |
| #4: Active Call HUD | calls, call_analytics | Call Engine | Exotel/Twilio |
| #5: Dispositions | call_dispositions | Backend API | - |
| #6: Campaign Automation | campaigns, sequences, templates | Campaign Service | WhatsApp, SMTP |
| #7: Visit Scheduler | visits, centers | Visit Service | Google Maps |
| #8: Mobile Visits | visits | Mobile API | Geolocation |
| #9: Sale/Closure | closures | Backend API | Invoice API |
| #10: Customer 360 | interaction_history, email_tracking | AI Service | EON Memory |
| #11: Command Center | telecaller_performance, all tables | Analytics Service | - |
| #12: Empowerment Panel | - | AI Service | AI Proxy, PageIndex |

#### File Structure:
```
ankr-labs-nx/
├── packages/
│   └── ankr-telehub/              # NEW PACKAGE
│       ├── src/
│       │   ├── server/
│       │   │   ├── index.ts
│       │   │   ├── call-engine.ts          (#4)
│       │   │   ├── ai-assistant.ts         (#10, #12)
│       │   │   ├── campaign-manager.ts     (#6)
│       │   │   ├── visit-scheduler.ts      (#7)
│       │   │   ├── queue-engine.ts         (#3)
│       │   │   ├── distribution-engine.ts  (#2)
│       │   │   └── laravel-sync.ts         (#1)
│       │   ├── client/
│       │   │   ├── telecaller/
│       │   │   │   ├── SmartQueue.tsx      (#3)
│       │   │   │   ├── ActiveCallHUD.tsx   (#4)
│       │   │   │   ├── Disposition.tsx     (#5)
│       │   │   │   ├── Customer360.tsx     (#10)
│       │   │   │   └── EmpowermentPanel.tsx (#12)
│       │   │   ├── manager/
│       │   │   │   └── CommandCenter.tsx   (#11)
│       │   │   ├── admin/
│       │   │   │   ├── LeadIngestion.tsx   (#1)
│       │   │   │   ├── DistributionRules.tsx (#2)
│       │   │   │   ├── CampaignBuilder.tsx (#6)
│       │   │   │   └── VisitScheduler.tsx  (#7)
│       │   │   └── mobile/
│       │   │       ├── VisitsList.tsx      (#8)
│       │   │       └── ClosureForm.tsx     (#9)
│       │   └── shared/
│       │       ├── types.ts
│       │       └── schemas.ts
│       └── package.json
│
├── apps/
│   ├── telehub-backend/           # NEW APP
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   └── config/
│   │   └── package.json
│   │
│   ├── telehub-frontend/          # NEW WEB APP
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   └── pages/
│   │   └── package.json
│   │
│   └── telehub-mobile/            # NEW MOBILE APP (#8, #9)
│       ├── src/
│       │   ├── App.tsx
│       │   └── screens/
│       └── package.json
```

#### Pros:
✅ **Leverage Existing Investment:** Reuse AI Proxy, EON, PageIndex
✅ **Faster Development:** 40% of features already exist
✅ **Cost Effective:** Share infrastructure costs (₹15k/month savings)
✅ **Unified Platform:** One ecosystem for Pratham
✅ **Proven Stack:** Already battle-tested in production
✅ **AI Capabilities:** Best-in-class AI already integrated
✅ **Easier Maintenance:** One codebase, one team
✅ **Meets All 12 Requirements:** Complete coverage

#### Cons:
⚠️ **ANKR Dependency:** Tied to ANKR ecosystem
⚠️ **Code Coupling:** TeleHub coupled with ANKR platform
⚠️ **Monorepo Complexity:** Nx workspace learning curve

#### Best For:
- **Pratham as ANKR customer** (strategic partnership)
- Organizations wanting proven, production-ready platform
- Teams that value speed to market
- Projects needing advanced AI features

#### Estimated Timeline:
- **Phase 1 (Foundation - #1, #2, #3, #5):** 4-5 weeks
- **Phase 2 (PBX Integration - #4):** 2-3 weeks
- **Phase 3 (Advanced Features - #6, #7, #9):** 4-5 weeks
- **Phase 4 (AI Features - #10, #12):** 3-4 weeks
- **Phase 5 (Dashboards & Mobile - #8, #11):** 3-4 weeks
- **Phase 6 (Testing & Launch):** 2-3 weeks
- **Total:** 18-24 weeks (4.5-6 months)

### **Primary Recommendation: Approach 4 (ANKR Platform Integration)**

**Rationale:**
1. **Complete Feature Coverage:** Meets all 12 requirements
2. **Speed to Market:** Fastest path to production (18-24 weeks)
3. **Cost Effective:** Optimized for maximum ROI
4. **Proven Technology:** Leverage battle-tested ANKR infrastructure
5. **AI Superiority:** Industry-leading AI features already built (#10, #12)
6. **Strategic Alignment:** Positions Pratham as ANKR flagship customer

### **Alternative: Approach 3 (Modern Full-Stack)**

**When to Choose This:**
- Pratham wants full ownership and independence
- Long-term plan to deprecate Laravel entirely
- Have DevOps capability for managing infrastructure
- Budget allows for higher initial investment

---

## 💰 Cost Analysis & Budget Breakdown

### Development Costs (Approach 4 - ANKR Platform)

| Phase | Features | Hours | Rate (₹/hr) | Total (₹) |
|-------|----------|-------|-------------|-----------|
| **Phase 1: Foundation** | | | | |
| #1: Lead Ingestion | 40 | 2,500 | 1,00,000 |
| #2: Distribution Engine | 80 | 2,500 | 2,00,000 |
| #3: Smart Queue Upgrade | 40 | 2,500 | 1,00,000 |
| #5: Disposition Upgrade | 40 | 2,500 | 1,00,000 |
| **Phase 2: PBX Integration** | | | | |
| #4: Active Call HUD | 120 | 2,500 | 3,00,000 |
| **Phase 3: Advanced Features** | | | | |
| #6: Campaign Automation | 160 | 2,500 | 4,00,000 |
| #7: Visit Scheduler | 120 | 2,500 | 3,00,000 |
| #9: Sale/Closure Form | 80 | 2,500 | 2,00,000 |
| **Phase 4: AI Features** | | | | |
| #10: Customer 360 | 120 | 3,000 | 3,60,000 |
| #12: Empowerment Panel | 100 | 3,000 | 3,00,000 |
| **Phase 5: Dashboards & Mobile** | | | | |
| #8: Mobile Visits View | 120 | 2,500 | 3,00,000 |
| #11: Command Center | 120 | 2,500 | 3,00,000 |
| **Cross-Functional** | | | | |
| Backend API Development | 200 | 2,500 | 5,00,000 |
| Database Design & Migration | 60 | 2,500 | 1,50,000 |
| Integration (Laravel sync) | 80 | 2,500 | 2,00,000 |
| Testing & QA | 120 | 2,000 | 2,40,000 |
| DevOps & Deployment | 60 | 2,500 | 1,50,000 |
| Project Management | 140 | 2,000 | 2,80,000 |
| Documentation & Training | 60 | 2,000 | 1,20,000 |
| **Subtotal** | **1,860 hrs** | | **₹46,50,000** |
| ANKR Platform Discount (40%) | | | **-₹18,60,000** |
| **Net Development Cost** | | | **₹27,90,000** |
| Contingency (10%) | | | ₹2,79,000 |
| **Total Development** | | | **₹30,69,000** |

**ANKR Platform Discount Rationale:**
- Reuse AI Proxy infrastructure (saves ₹4L)
- Reuse EON Memory (saves ₹3L)
- Reuse PageIndex (saves ₹2L)
- Reuse authentication (saves ₹1.5L)
- Shared DevOps (saves ₹3L)
- Shared monitoring (saves ₹1L)
- Faster development = less hours (saves ₹4.5L)

---

### Infrastructure Costs (Monthly)

| Service | Cost/Month (₹) | Notes |
|---------|----------------|-------|
| **Hosting & Compute** | | |
| AWS EC2 (t3.medium × 2) | 8,000 | Backend services |
| AWS RDS PostgreSQL (db.t3.medium) | 6,000 | Database |
| Redis Cache (ElastiCache) | 3,000 | Session + Queue |
| **Voice & Communication** | | |
| Exotel Voice API | 36,000* | 30 users × 80 calls/day × 5 min × ₹0.30/min |
| WhatsApp Business API | 2,000 | Template messages |
| Email Service (SendGrid) | 1,000 | Transactional emails |
| SMS (backup/notifications) | 1,000 | OTP + alerts |
| **AI & ML** | | |
| Speech-to-Text (AssemblyAI) | 5,000 | Real-time transcription |
| ANKR AI Proxy Usage | 3,000 | LLM API calls |
| **Storage & CDN** | | |
| S3 Storage (call recordings) | 2,000 | ~500 GB/month |
| CloudFront CDN | 1,000 | Static assets |
| **Monitoring & Tools** | | |
| Monitoring (Datadog Lite) | 2,000 | APM + Logs |
| Error Tracking (Sentry) | 500 | Error monitoring |
| Uptime Monitoring | 500 | Status checks |
| **Maps & Location** | | |
| Google Maps API | 2,000 | Visit scheduling (#7, #8) |
| **Backup & Security** | | |
| Automated Backups | 1,000 | Daily snapshots |
| SSL Certificates | 500 | Let's Encrypt + wildcards |
| **Total Infrastructure/Month** | **₹74,500** | |
| **Total Infrastructure/Year** | **₹8,94,000** | |

*Voice costs breakdown:
- 30 telecallers
- 80 calls per day per telecaller = 2,400 calls/day
- Average 5 minutes per call
- 2,400 × 5 = 12,000 minutes/day
- 12,000 × 30 days = 3,60,000 minutes/month
- 3,60,000 × ₹0.30 = ₹1,08,000/month (if all via Exotel)
- Estimated 30% use mobile calling (not via Exotel) = ₹36,000/month

---

### Additional Costs (One-time & Annual)

| Item | Cost (₹) | Frequency |
|------|----------|-----------|
| **One-time Setup** | | |
| Exotel Account Setup | 5,000 | One-time |
| WhatsApp Business Verification | 2,000 | One-time |
| Domain & Email Setup | 1,000 | One-time |
| SSL Certificates (Year 1) | 0 | Free (Let's Encrypt) |
| **Annual** | | |
| Domain Renewal | 1,000 | Annual |
| Support & Maintenance (AMC) | 3,00,000 | Annual (10% of dev cost) |
| Training Refreshers | 50,000 | Annual |

---

### Year 1 Total Cost Summary

| Item | Cost (₹) |
|------|----------|
| **One-time Costs** | |
| Development | 30,69,000 |
| Setup (Exotel, WhatsApp, etc.) | 8,000 |
| **Recurring Costs (Year 1)** | |
| Infrastructure (12 months × ₹74,500) | 8,94,000 |
| Support & Maintenance | 3,00,000 |
| Training | 50,000 |
| **Year 1 Total** | **₹43,21,000** |

---

### Cost Optimization Opportunities

#### Option 1: Self-host Components
- [ ] Self-host Whisper (STT): Save ₹5,000/month = ₹60,000/year
- [ ] Self-host MinIO (S3): Save ₹2,000/month = ₹24,000/year
- [ ] Self-host Redis: Save ₹3,000/month = ₹36,000/year
- **Total Savings:** ₹1,20,000/year

#### Option 2: Negotiate Volume Pricing
- [ ] Twilio/Exotel volume discount (₹0.25/min): Save ₹6,000/month = ₹72,000/year
- [ ] WhatsApp BSP discount: Save ₹500/month = ₹6,000/year
- **Total Savings:** ₹78,000/year

#### Option 3: ANKR Shared Infrastructure
- [ ] Use ANKR's existing servers: Save ₹10,000/month = ₹1,20,000/year
- [ ] Shared monitoring: Save ₹2,000/month = ₹24,000/year
- [ ] Shared Redis: Save ₹3,000/month = ₹36,000/year
- **Total Savings:** ₹1,80,000/year

**Maximum Potential Savings:** ₹3,78,000/year

**Optimized Year 1 Cost:** ₹39-41 lakhs (instead of ₹43 lakhs)

---

### ROI Calculation

#### Current State (Manual Process)
- 30 telecallers × ₹25,000/month = ₹7,50,000/month
- Avg 60 calls/day/telecaller × 30 = 1,800 calls/day
- Conversion rate: 8%
- 1,800 × 0.08 = 144 conversions/month
- Avg deal value: ₹10,000
- Monthly revenue: ₹14,40,000
- Cost per acquisition (CPA): ₹7,50,000 / 144 = ₹5,208

#### With TeleHub (After 3 months)
- Same 30 telecallers
- 30% efficiency gain = 80 calls/day/telecaller × 30 = 2,400 calls/day
- 15% conversion improvement = 9.2% conversion rate
- 2,400 × 0.092 = 221 conversions/month
- Avg deal value: ₹10,000 (same)
- Monthly revenue: ₹22,10,000
- CPA: ₹7,50,000 / 221 = ₹3,394

#### Impact
- **Additional conversions:** 221 - 144 = 77 per month
- **Additional revenue:** ₹7,70,000 per month
- **Annual additional revenue:** ₹92,40,000
- **Year 1 cost:** ₹43,21,000
- **Net benefit Year 1:** ₹92,40,000 - ₹43,21,000 = ₹49,19,000
- **Payback period:** 5.6 months

---

## 📊 Feature Deep-Dive: 12 Requirements

### PHASE 1 - Core Features

#### #1: Lead Ingestion Manager (Admin)
**User:** Admin
**Status:** 🔄 Partial (needs upgrade)

**What Exists:**
- CSV upload ✓
- Manual entry ✓

**What's Missing:**
- Landing page API integration
- Source mapping configuration UI
- Real-time API status monitoring
- Duplicate detection
- Data validation rules
- Bulk edit capabilities

**Technical Implementation:**
```typescript
// packages/ankr-telehub/src/server/lead-ingestion.ts
class LeadIngestionService {
  async importFromCSV(file: File): Promise<ImportResult> {
    // Parse CSV
    // Validate data
    // Detect duplicates
    // Transform to schema
    // Bulk insert to telehub.leads
  }

  async syncFromLandingPage(): Promise<void> {
    // Poll landing page API
    // Map fields
    // Upsert leads
  }

  async syncFromLaravelCRM(): Promise<void> {
    // Fetch from Laravel API
    // Transform data
    // Upsert with conflict resolution
  }
}
```

**UI Components:**
- File upload dropzone
- Source configuration panel
- Field mapping interface
- Import history table
- Error logs viewer

**Effort:** 1 week
**Dependencies:** Laravel API documentation

---

#### #2: Lead Distribution Engine (Admin)
**User:** Admin
**Status:** 🔄 Partial (needs rules engine)

**What Exists:**
- Basic random assignment ✓

**What's Missing:**
- Round-robin algorithm
- Source-based routing (landing page → Agent A)
- Language-based routing (Hindi → Agent B)
- Agent group selection
- Priority rules
- Auto-assign toggle
- Load balancing

**Technical Implementation:**
```typescript
// packages/ankr-telehub/src/server/distribution-engine.ts
class DistributionEngine {
  async distributeLead(lead: Lead): Promise<User> {
    // Fetch active distribution rules (priority order)
    const rules = await this.getActiveRules();

    for (const rule of rules) {
      if (this.matchesConditions(lead, rule.conditions)) {
        return this.assignByStrategy(lead, rule);
      }
    }

    // Default: round-robin
    return this.roundRobinAssign(lead);
  }

  private assignByStrategy(lead: Lead, rule: Rule): User {
    switch (rule.assignment_type) {
      case 'round_robin':
        return this.roundRobinAssign(lead, rule.target_agent_group);
      case 'source_based':
        return this.sourceBasedAssign(lead);
      case 'language_based':
        return this.languageBasedAssign(lead);
      default:
        return this.randomAssign(lead);
    }
  }
}
```

**UI Components:**
- Rules builder interface
- Drag-and-drop priority ordering
- Condition editor (IF source = X THEN assign to Y)
- Agent group management
- Distribution analytics dashboard

**Effort:** 2 weeks
**Dependencies:** None

---

#### #3: Smart Queue (Telecaller)
**User:** Telecaller
**Status:** 🔄 Partial (needs categorization)

**What Exists:**
- Assigned leads list ✓
- Basic sorting ✓
- Click-to-call button ✓

**What's Missing:**
- Fresh/Callback/Retry categorization
- Hot/Warm/Cold priority tags
- Advanced filters (source, date, score)
- Call history inline display
- Lead age indicators
- Last contact timestamp
- Search functionality

**Technical Implementation:**
```typescript
// packages/ankr-telehub/src/client/telecaller/SmartQueue.tsx
function SmartQueue() {
  const { data: leads } = useQuery({
    queryKey: ['smart-queue'],
    queryFn: () => api.getMyLeads({
      filters: {
        categories: ['fresh', 'callback', 'retry'],
        priorities: ['hot', 'warm', 'cold'],
        sources: selectedSources,
        dateRange: selectedDateRange
      },
      sort: 'priority_desc,lead_age_asc'
    })
  });

  return (
    <div className="smart-queue">
      <QueueFilters />
      <QueueStats />
      <LeadsList leads={leads} />
    </div>
  );
}
```

**UI Components:**
- Category tabs (Fresh, Callback, Retry)
- Priority badges (🔥 Hot, 🌡️ Warm, ❄️ Cold)
- Filter sidebar
- Lead card with inline analytics
- Quick actions menu

**Effort:** 1 week
**Dependencies:** Call history data

---

#### #4: Active Call HUD (Telecaller) 🔥 CRITICAL
**User:** Telecaller
**Status:** ❌ Does Not Exist

**Required Features:**
- Exotel/Twilio integration
- WebSocket screen pop on call connect
- Customer demographics display
- Lead source context
- Script/talking points box
- Call controls (mute, hold, transfer, hangup)
- Real-time call timer
- Recording indicator
- AI suggestions panel (live)

**Technical Implementation:**
```typescript
// packages/ankr-telehub/src/server/call-engine.ts
import Exotel from 'exotel';

class CallEngine {
  private exotel: Exotel;

  async makeCall(telecallerId: string, leadId: string): Promise<Call> {
    const lead = await this.getLeadWithHistory(leadId);
    const telecaller = await this.getUser(telecallerId);

    // Initiate call via Exotel
    const exotelCall = await this.exotel.makeCall({
      from: telecaller.exotel_number,
      to: lead.phone,
      callerId: process.env.EXOTEL_CALLER_ID
    });

    // Create call record
    const call = await prisma.calls.create({
      data: {
        lead_id: leadId,
        telecaller_id: telecallerId,
        exotel_sid: exotelCall.sid,
        status: 'ringing',
        started_at: new Date()
      }
    });

    // Emit WebSocket event (screen pop)
    this.wsServer.to(telecallerId).emit('call:started', {
      callId: call.id,
      lead: lead,
      script: await this.getScriptForLead(lead)
    });

    return call;
  }

  async handleExotelWebhook(event: ExotelEvent): Promise<void> {
    // Process call events: answered, ended, recording ready
    const call = await prisma.calls.findFirst({
      where: { exotel_sid: event.CallSid }
    });

    if (event.Status === 'completed') {
      await prisma.calls.update({
        where: { id: call.id },
        data: {
          status: 'completed',
          ended_at: new Date(),
          duration_seconds: event.Duration,
          recording_url: event.RecordingUrl
        }
      });

      // Trigger AI analysis
      await this.queueAIAnalysis(call.id);
    }

    // Emit real-time update
    this.wsServer.to(call.telecaller_id).emit('call:updated', call);
  }
}
```

**UI Components:**
```typescript
// packages/ankr-telehub/src/client/telecaller/ActiveCallHUD.tsx
function ActiveCallHUD({ call }: { call: Call }) {
  const { lead, script, callAnalytics } = useCallContext(call.id);

  return (
    <div className="call-hud fixed inset-0 bg-black/90 z-50">
      <div className="grid grid-cols-3 gap-4 p-6">
        {/* Left: Customer Info */}
        <div className="col-span-1 bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold">{lead.name}</h2>
          <p className="text-gray-400">{lead.phone}</p>
          <div className="mt-4">
            <Badge>Source: {lead.source}</Badge>
            <Badge>Score: {lead.lead_score}/100</Badge>
          </div>
          <div className="mt-6">
            <h3>Previous Interactions</h3>
            <Timeline interactions={lead.interactions} />
          </div>
        </div>

        {/* Center: Script & AI */}
        <div className="col-span-1 bg-gray-800 rounded-lg p-6">
          <Tabs>
            <TabList>
              <Tab>Script</Tab>
              <Tab>AI Suggestions</Tab>
              <Tab>Objections</Tab>
            </TabList>
            <TabPanel>
              <ScriptView script={script} />
            </TabPanel>
            <TabPanel>
              <AISuggestions callId={call.id} realtime />
            </TabPanel>
            <TabPanel>
              <ObjectionHandlers />
            </TabPanel>
          </Tabs>
        </div>

        {/* Right: Call Controls */}
        <div className="col-span-1 bg-gray-800 rounded-lg p-6">
          <CallTimer startedAt={call.started_at} />
          <CallControls callId={call.id} />
          <SentimentMeter sentiment={callAnalytics?.sentiment_score} />
        </div>
      </div>
    </div>
  );
}
```

**Effort:** 3 weeks
**Dependencies:**
- Exotel account setup (1 week lead time)
- Virtual number provisioning
- Webhook endpoint configuration

---

#### #5: Call Disposition (Telecaller)
**User:** Telecaller
**Status:** 🔄 Partial (needs comprehensive codes)

**What Exists:**
- Basic disposition dropdown ✓
- Notes field ✓

**What's Missing:**
- Comprehensive disposition taxonomy:
  - **Connected:** Interested, Not Interested, Callback, Wrong Number, Language Barrier
  - **Not Connected:** Busy, No Answer, Out of Service, Switched Off
  - **Special:** DND, Escalate to Manager, Technical Issue
- Sub-dispositions (Not Interested → Too Expensive, Already Has Solution, etc.)
- Auto-reschedule for "Callback"
- Next action triggers (Send Email, Add to Campaign, Schedule Visit)
- Mandatory field validation
- Keyboard shortcuts (Ctrl+1 for Interested, etc.)

**Technical Implementation:**
```typescript
// packages/ankr-telehub/src/server/disposition.ts
const DISPOSITION_CODES = {
  CONNECTED_INTERESTED: { code: 'CI', next_action: 'schedule_visit', resched_hours: null },
  CONNECTED_NOT_INTERESTED: { code: 'CNI', next_action: 'add_to_nurture', resched_hours: 2160 }, // 90 days
  CONNECTED_CALLBACK: { code: 'CB', next_action: 'reschedule', resched_hours: 24 },
  CONNECTED_WRONG_NUMBER: { code: 'WN', next_action: 'mark_invalid', resched_hours: null },
  NOT_CONNECTED_BUSY: { code: 'NB', next_action: 'retry', resched_hours: 2 },
  NOT_CONNECTED_NO_ANSWER: { code: 'NA', next_action: 'retry', resched_hours: 4 },
  NOT_CONNECTED_OUT_OF_SERVICE: { code: 'OOS', next_action: 'mark_invalid', resched_hours: null },
  SPECIAL_DND: { code: 'DND', next_action: 'mark_dnd', resched_hours: null },
  SPECIAL_ESCALATE: { code: 'ESC', next_action: 'assign_to_manager', resched_hours: null }
};

class DispositionService {
  async saveDisposition(callId: string, data: DispositionInput): Promise<void> {
    const disposition = DISPOSITION_CODES[data.code];

    // Save disposition
    await prisma.call_dispositions.create({
      data: {
        call_id: callId,
        disposition_code: data.code,
        sub_disposition: data.sub_disposition,
        notes: data.notes,
        callback_scheduled_at: disposition.resched_hours
          ? addHours(new Date(), disposition.resched_hours)
          : null,
        next_action: disposition.next_action
      }
    });

    // Update lead status
    await this.updateLeadStatus(callId, data.code);

    // Trigger next action
    await this.triggerNextAction(callId, disposition.next_action);
  }

  private async triggerNextAction(callId: string, action: string): Promise<void> {
    switch (action) {
      case 'schedule_visit':
        await this.openVisitScheduler(callId);
        break;
      case 'add_to_nurture':
        await this.addToNurtureCampaign(callId);
        break;
      case 'reschedule':
        await this.rescheduleCallback(callId);
        break;
      // ...
    }
  }
}
```

**UI Components:**
- Quick disposition buttons (large, colorful)
- Sub-disposition dropdown (conditional)
- Auto-schedule calendar popup
- Notes textarea with voice input
- Next action confirmation dialog

**Effort:** 1 week
**Dependencies:** None

---

### PHASE 2 - Automation & Logistics

#### #6: Campaign Automation Builder (Admin) 🔥 CRITICAL
**User:** Admin/Marketing
**Status:** ❌ Does Not Exist

**Required Features:**
- Visual drip sequence builder
- WhatsApp Business API integration
- SMTP provider integration (SendGrid/AWS SES)
- Template editor (text + rich media)
- Trigger conditions (T+0, T+24hrs, T+48hrs, T+7days)
- Personalization variables ({{first_name}}, {{center_name}})
- A/B testing capability
- Campaign analytics dashboard
- Pause/Resume controls
- Segment targeting

**Technical Implementation:**
```typescript
// packages/ankr-telehub/src/server/campaign-manager.ts
import WhatsAppAPI from 'whatsapp-business-api';
import SendGrid from '@sendgrid/mail';

class CampaignManager {
  async createCampaign(data: CampaignInput): Promise<Campaign> {
    // Create campaign
    const campaign = await prisma.campaigns.create({ data });

    // Create sequences
    for (const seq of data.sequences) {
      await prisma.campaign_sequences.create({
        data: {
          campaign_id: campaign.id,
          sequence_order: seq.order,
          trigger_delay_hours: seq.delay,
          channel: seq.channel,
          template_id: seq.template_id
        }
      });
    }

    return campaign;
  }

  async executeCampaignSequence(campaignId: string): Promise<void> {
    const campaign = await this.getCampaignWithSequences(campaignId);
    const leads = await this.getTargetLeads(campaign.target_segment);

    for (const lead of leads) {
      for (const sequence of campaign.sequences) {
        await this.scheduleMessage(lead, sequence);
      }
    }
  }

  private async scheduleMessage(lead: Lead, sequence: Sequence): Promise<void> {
    const sendAt = addHours(new Date(), sequence.trigger_delay_hours);

    await this.queue.add('send-campaign-message', {
      leadId: lead.id,
      sequenceId: sequence.id,
      channel: sequence.channel
    }, {
      delay: differenceInMilliseconds(sendAt, new Date())
    });
  }

  async sendWhatsApp(lead: Lead, template: Template): Promise<void> {
    const message = this.personalizeTemplate(template.body, lead);

    await this.whatsappApi.sendTemplateMessage({
      to: lead.phone,
      template: template.name,
      components: [
        { type: 'body', parameters: [{ type: 'text', text: message }] }
      ]
    });

    // Track sent
    await this.trackCampaignActivity(lead.id, 'whatsapp_sent');
  }

  async sendEmail(lead: Lead, template: Template): Promise<void> {
    const html = this.personalizeTemplate(template.body, lead);

    await SendGrid.send({
      to: lead.email,
      from: process.env.FROM_EMAIL,
      subject: this.personalizeTemplate(template.subject, lead),
      html: html,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true, substitutionTag: '%open_tracking%' }
      }
    });

    // Track sent
    await this.trackCampaignActivity(lead.id, 'email_sent');
  }

  private personalizeTemplate(template: string, lead: Lead): string {
    return template
      .replace(/\{\{first_name\}\}/g, lead.name.split(' ')[0])
      .replace(/\{\{phone\}\}/g, lead.phone)
      .replace(/\{\{center_name\}\}/g, lead.assigned_center?.name || 'Pratham Center');
  }
}
```

**UI Components:**
```typescript
// Visual sequence builder
function CampaignBuilder() {
  const [sequences, setSequences] = useState<Sequence[]>([]);

  return (
    <div className="campaign-builder">
      <Timeline>
        <TimelineItem delay={0}>
          <h3>T+0: Immediate Welcome</h3>
          <TemplateSelector channel="whatsapp" />
        </TimelineItem>

        <TimelineItem delay={24}>
          <h3>T+24hrs: Follow-up Email</h3>
          <TemplateSelector channel="email" />
        </TimelineItem>

        <TimelineItem delay={72}>
          <h3>T+3 days: Reminder WhatsApp</h3>
          <TemplateSelector channel="whatsapp" />
        </TimelineItem>
      </Timeline>

      <Button onClick={addSequence}>+ Add Step</Button>
    </div>
  );
}
```

**Effort:** 4 weeks
**Dependencies:**
- WhatsApp Business API account (2-3 weeks approval)
- SendGrid/AWS SES account
- Template approval process (WhatsApp)

---

#### #7: Visit Scheduler (Telecaller/Admin)
**User:** Telecaller
**Status:** ❌ Does Not Exist

**Required Features:**
- Center assignment logic (by pincode)
- Available centers list (with capacity)
- Calendar view (day/week/month)
- Time slot booking
- Map view with center locations
- Pincode-based center finder
- Available field agents list
- Conflict detection
- SMS/Email confirmation to customer
- Visit reminders (T-24hrs, T-2hrs)

**Technical Implementation:**
```typescript
// packages/ankr-telehub/src/server/visit-scheduler.ts
class VisitScheduler {
  async findNearestCenter(pincode: string): Promise<Center[]> {
    // Get lat/long from pincode
    const location = await this.geocodePincode(pincode);

    // Find centers within 50km radius
    const centers = await prisma.$queryRaw`
      SELECT *,
        (6371 * acos(cos(radians(${location.lat}))
        * cos(radians(latitude))
        * cos(radians(longitude) - radians(${location.lng}))
        + sin(radians(${location.lat}))
        * sin(radians(latitude)))) AS distance
      FROM telehub.centers
      WHERE active = true
      HAVING distance < 50
      ORDER BY distance ASC
      LIMIT 5
    `;

    return centers;
  }

  async getAvailableSlots(centerId: string, date: Date): Promise<TimeSlot[]> {
    const fieldAgents = await this.getAvailableAgents(centerId, date);
    const existingVisits = await this.getScheduledVisits(centerId, date);

    const slots: TimeSlot[] = [];
    const workingHours = [9, 10, 11, 12, 14, 15, 16, 17]; // 9am-6pm (skip 1pm lunch)

    for (const hour of workingHours) {
      const slotTime = setHours(date, hour);
      const bookedAgents = existingVisits.filter(v =>
        isSameHour(v.scheduled_at, slotTime)
      ).length;

      if (bookedAgents < fieldAgents.length) {
        slots.push({
          time: slotTime,
          available: true,
          agents_available: fieldAgents.length - bookedAgents
        });
      }
    }

    return slots;
  }

  async scheduleVisit(data: VisitInput): Promise<Visit> {
    // Assign field agent (round-robin)
    const agent = await this.assignFieldAgent(data.center_id, data.scheduled_at);

    const visit = await prisma.visits.create({
      data: {
        lead_id: data.lead_id,
        center_id: data.center_id,
        field_agent_id: agent.id,
        scheduled_at: data.scheduled_at,
        status: 'scheduled'
      }
    });

    // Send confirmation SMS/Email
    await this.sendVisitConfirmation(visit);

    // Schedule reminders
    await this.scheduleReminders(visit);

    return visit;
  }

  private async sendVisitConfirmation(visit: Visit): Promise<void> {
    const lead = await prisma.leads.findUnique({ where: { id: visit.lead_id } });
    const center = await prisma.centers.findUnique({ where: { id: visit.center_id } });

    // SMS
    await this.smsService.send({
      to: lead.phone,
      message: `Your visit to ${center.name} is confirmed for ${format(visit.scheduled_at, 'dd MMM yyyy, h:mm a')}. Address: ${center.address}`
    });

    // Email (if available)
    if (lead.email) {
      await this.emailService.send({
        to: lead.email,
        subject: 'Visit Confirmation - Pratham Education',
        template: 'visit-confirmation',
        data: { lead, center, visit }
      });
    }
  }
}
```

**UI Components:**
```typescript
function VisitScheduler({ leadId }: { leadId: string }) {
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: nearestCenters } = useQuery(['centers', lead.pincode], () =>
    api.findNearestCenters(lead.pincode)
  );

  const { data: availableSlots } = useQuery(
    ['slots', selectedCenter?.id, selectedDate],
    () => api.getAvailableSlots(selectedCenter.id, selectedDate),
    { enabled: !!selectedCenter }
  );

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h3>Nearest Centers</h3>
        <CenterList centers={nearestCenters} onSelect={setSelectedCenter} />
        <MapView centers={nearestCenters} />
      </div>

      <div>
        <Calendar
          value={selectedDate}
          onChange={setSelectedDate}
          minDate={new Date()}
        />

        <h3>Available Slots</h3>
        <SlotGrid slots={availableSlots} onSelect={handleSchedule} />
      </div>
    </div>
  );
}
```

**Effort:** 3 weeks
**Dependencies:**
- Google Maps API key
- Center data (addresses, lat/long)

---

#### #8: Mobile Visits View (Field Agent)
**User:** Field Agent
**Status:** ❌ Does Not Exist

**Required Features:**
- Mobile-responsive UI (PWA or React Native)
- Daily agenda list
- Visit details (customer info, address, notes)
- Navigate button (Google Maps integration)
- Geolocation check-in (verify on-site)
- Visit notes capture
- Photo upload capability
- Offline mode support
- Push notifications

**Technical Implementation:**
```typescript
// apps/telehub-mobile/src/screens/VisitsList.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db'; // IndexedDB for offline

function VisitsList() {
  const visits = useLiveQuery(() =>
    db.visits
      .where('field_agent_id').equals(currentUser.id)
      .and(v => isSameDay(v.scheduled_at, new Date()))
      .toArray()
  );

  return (
    <div className="visits-list">
      <h1>Today's Visits ({visits?.length})</h1>

      {visits?.map(visit => (
        <VisitCard key={visit.id} visit={visit} />
      ))}
    </div>
  );
}

function VisitCard({ visit }: { visit: Visit }) {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);

  const handleCheckIn = async () => {
    const pos = await getCurrentPosition();
    setLocation(pos);

    // Verify within 100m of center
    const distance = getDistance(
      pos.coords.latitude,
      pos.coords.longitude,
      visit.center.latitude,
      visit.center.longitude
    );

    if (distance > 100) {
      alert('You are not at the visit location!');
      return;
    }

    // Check in
    await api.checkIn(visit.id, {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      timestamp: new Date()
    });
  };

  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${visit.center.latitude},${visit.center.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <Card>
      <h3>{visit.lead.name}</h3>
      <p>{visit.lead.phone}</p>
      <p>{format(visit.scheduled_at, 'h:mm a')}</p>

      <Badge>{visit.status}</Badge>

      <div className="actions">
        <Button onClick={handleNavigate}>
          Navigate
        </Button>
        <Button onClick={handleCheckIn}>
          Check In
        </Button>
      </div>
    </Card>
  );
}
```

**Effort:** 3 weeks
**Dependencies:**
- Mobile app deployment (App Store/Play Store)
- Push notification service (FCM)
- Geolocation permissions

---

#### #9: Sale/Closure Form (Field Agent)
**User:** Field Agent
**Status:** ❌ Does Not Exist

**Required Features:**
- Lead status update to "Closed-Won"
- Product selection dropdown
- Pricing & discount fields
- Final amount calculation
- Upload proof (signature/photo of form)
- Invoice generation trigger
- Welcome email automation
- Payment collection tracking (Cash/Online/Pending)
- Commission calculation

**Technical Implementation:**
```typescript
// apps/telehub-mobile/src/screens/ClosureForm.tsx
function ClosureForm({ visitId }: { visitId: string }) {
  const [formData, setFormData] = useState<ClosureInput>({
    product: '',
    price: 0,
    discount: 0,
    payment_status: 'pending'
  });

  const handleSubmit = async () => {
    const finalAmount = formData.price - formData.discount;

    // Upload proof document
    const proofUrl = await uploadProof(formData.proofFile);

    // Create closure
    const closure = await api.createClosure({
      visit_id: visitId,
      lead_id: visit.lead_id,
      product: formData.product,
      price: formData.price,
      discount: formData.discount,
      final_amount: finalAmount,
      proof_url: proofUrl,
      payment_status: formData.payment_status
    });

    // Update lead status
    await api.updateLeadStatus(visit.lead_id, 'closed_won');

    // Trigger automation
    await api.triggerClosureAutomation(closure.id);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Select
        label="Product"
        options={PRODUCTS}
        value={formData.product}
        onChange={v => setFormData({ ...formData, product: v })}
      />

      <Input
        label="Price (₹)"
        type="number"
        value={formData.price}
        onChange={v => setFormData({ ...formData, price: v })}
      />

      <Input
        label="Discount (₹)"
        type="number"
        value={formData.discount}
        onChange={v => setFormData({ ...formData, discount: v })}
      />

      <div className="final-amount">
        <h3>Final Amount: ₹{formData.price - formData.discount}</h3>
      </div>

      <FileUpload
        label="Upload Proof (Signature/Form)"
        accept="image/*,application/pdf"
        onChange={file => setFormData({ ...formData, proofFile: file })}
      />

      <Select
        label="Payment Status"
        options={['pending', 'partial', 'full']}
        value={formData.payment_status}
        onChange={v => setFormData({ ...formData, payment_status: v })}
      />

      <Button type="submit">Complete Sale</Button>
    </Form>
  );
}

// Backend automation trigger
class ClosureAutomation {
  async handleNewClosure(closureId: string): Promise<void> {
    const closure = await prisma.closures.findUnique({
      where: { id: closureId },
      include: { lead: true, visit: true }
    });

    // Generate invoice
    const invoiceUrl = await this.generateInvoice(closure);
    await prisma.closures.update({
      where: { id: closureId },
      data: { invoice_generated: true, invoice_url: invoiceUrl }
    });

    // Send welcome email
    await this.emailService.send({
      to: closure.lead.email,
      subject: 'Welcome to Pratham Family!',
      template: 'welcome-closure',
      attachments: [{ filename: 'invoice.pdf', path: invoiceUrl }]
    });

    // Calculate commission
    await this.calculateCommission(closure);
  }

  private async generateInvoice(closure: Closure): Promise<string> {
    // Use ankr-publish for PDF generation!
    const pdf = await ankrPublish.generatePDF({
      template: 'pratham-invoice',
      data: closure
    });

    const url = await this.uploadToS3(pdf, `invoices/${closure.id}.pdf`);
    return url;
  }
}
```

**Effort:** 2 weeks
**Dependencies:**
- ankr-publish integration
- Invoice template design

---

### PHASE 3 - Intelligence & Analytics

#### #10: Customer 360 History (Telecaller) 🔥 HIGH VALUE
**User:** Telecaller
**Status:** ❌ Does Not Exist

**Required Features:**
- Timeline view of all interactions
- Email open/click tracking
- Website visit tracking (if applicable)
- Previous call recordings playback
- WhatsApp message history
- Visit history
- Notes & comments
- Objection handling cheat-sheet
- Similar customer suggestions
- AI-generated summary

**Technical Implementation:**
```typescript
// packages/ankr-telehub/src/server/customer-360.ts
class Customer360Service {
  async getFullHistory(leadId: string): Promise<CustomerHistory> {
    const lead = await prisma.leads.findUnique({
      where: { id: leadId },
      include: {
        calls: { include: { disposition: true, analytics: true } },
        visits: { include: { center: true, field_agent: true } },
        interactions: true,
        email_tracking: true
      }
    });

    // Fetch from EON Memory
    const conversationHistory = await this.eonService.getMemory(leadId);

    // Fetch WhatsApp history
    const whatsappHistory = await this.getWhatsAppHistory(lead.phone);

    // Combine into timeline
    const timeline = this.buildTimeline({
      calls: lead.calls,
      visits: lead.visits,
      emails: lead.email_tracking,
      whatsapp: whatsappHistory,
      notes: lead.interactions
    });

    // AI-generated summary
    const summary = await this.generateAISummary(timeline);

    return {
      lead,
      timeline,
      summary,
      insights: await this.generateInsights(leadId)
    };
  }

  private async generateAISummary(timeline: Interaction[]): Promise<string> {
    const prompt = `
      Given this customer interaction history, provide a 3-sentence summary:
      ${JSON.stringify(timeline)}
    `;

    const response = await ankrAIProxy.chat({
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content;
  }

  private async generateInsights(leadId: string): Promise<Insight[]> {
    // Use EON to find similar customers
    const similarCustomers = await this.eonService.findSimilar(leadId, { limit: 5 });

    // Objection patterns
    const objections = await this.analyzeObjections(leadId);

    // Best time to call
    const bestTimeToCall = await this.predictBestTime(leadId);

    return [
      { type: 'similar_customers', data: similarCustomers },
      { type: 'common_objections', data: objections },
      { type: 'best_time', data: bestTimeToCall }
    ];
  }
}
```

**UI Components:**
```typescript
function Customer360({ leadId }: { leadId: string }) {
  const { data: history } = useQuery(['customer-360', leadId], () =>
    api.getFullHistory(leadId)
  );

  return (
    <div className="customer-360 grid grid-cols-3 gap-6">
      {/* Left: Timeline */}
      <div className="col-span-2">
        <h2>Interaction Timeline</h2>
        <Timeline>
          {history?.timeline.map(interaction => (
            <TimelineItem key={interaction.id} interaction={interaction}>
              {interaction.type === 'call' && (
                <CallPlayback url={interaction.recording_url} />
              )}
              {interaction.type === 'email' && (
                <EmailPreview email={interaction} />
              )}
              {interaction.type === 'visit' && (
                <VisitDetails visit={interaction} />
              )}
            </TimelineItem>
          ))}
        </Timeline>
      </div>

      {/* Right: Insights */}
      <div className="col-span-1">
        <Card>
          <h3>AI Summary</h3>
          <p>{history?.summary}</p>
        </Card>

        <Card>
          <h3>Similar Customers</h3>
          <SimilarCustomersList customers={history?.insights.similar_customers} />
        </Card>

        <Card>
          <h3>Common Objections</h3>
          <ObjectionsList objections={history?.insights.common_objections} />
        </Card>
      </div>
    </div>
  );
}
```

**Effort:** 4 weeks
**Dependencies:**
- EON Memory integration
- Email tracking SDK (SendGrid webhooks)
- WhatsApp Business API webhooks

---

#### #11: Command Center Dashboard (Manager) 🔥 CRITICAL
**User:** Manager/Admin
**Status:** ❌ Does Not Exist

**Required Features:**
- Live call counter (active calls right now)
- Agent leaderboard (real-time ranking)
- Funnel visualization (Leads → Calls → Visits → Sales)
- Call duration metrics (avg, min, max)
- Conversion rates by agent/campaign/source
- Campaign performance analytics
- Agent activity timeline
- Real-time alerts (long call, negative sentiment, etc.)
- Export to Excel/PDF

**Technical Implementation:**
```typescript
// packages/ankr-telehub/src/server/command-center.ts
class CommandCenterService {
  async getLiveMetrics(): Promise<LiveMetrics> {
    // Active calls right now
    const activeCalls = await prisma.calls.count({
      where: { status: 'in_progress' }
    });

    // Today's stats
    const today = startOfDay(new Date());
    const todayStats = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total_calls,
        AVG(duration_seconds) as avg_duration,
        SUM(CASE WHEN dispositions.disposition_code LIKE 'CONNECTED_INTERESTED%' THEN 1 ELSE 0 END) as conversions
      FROM telehub.calls
      LEFT JOIN telehub.call_dispositions dispositions ON dispositions.call_id = calls.id
      WHERE calls.started_at >= ${today}
    `;

    // Leaderboard
    const leaderboard = await this.getLeaderboard('today');

    // Funnel
    const funnel = await this.getFunnelData('today');

    return {
      activeCalls,
      todayStats,
      leaderboard,
      funnel
    };
  }

  async getLeaderboard(period: 'today' | 'week' | 'month'): Promise<LeaderboardEntry[]> {
    const startDate = this.getStartDate(period);

    const leaderboard = await prisma.$queryRaw`
      SELECT
        users.id,
        users.name,
        COUNT(calls.id) as calls_made,
        AVG(analytics.sentiment_score) as avg_sentiment,
        SUM(CASE WHEN dispositions.disposition_code = 'CONNECTED_INTERESTED' THEN 1 ELSE 0 END) as conversions,
        SUM(closures.final_amount) as revenue
      FROM public.users
      LEFT JOIN telehub.calls ON calls.telecaller_id = users.id AND calls.started_at >= ${startDate}
      LEFT JOIN telehub.call_analytics analytics ON analytics.call_id = calls.id
      LEFT JOIN telehub.call_dispositions dispositions ON dispositions.call_id = calls.id
      LEFT JOIN telehub.visits ON visits.lead_id = calls.lead_id
      LEFT JOIN telehub.closures ON closures.visit_id = visits.id
      WHERE users.role = 'telecaller'
      GROUP BY users.id
      ORDER BY conversions DESC, calls_made DESC
      LIMIT 10
    `;

    return leaderboard;
  }

  async getFunnelData(period: string): Promise<FunnelData> {
    const startDate = this.getStartDate(period);

    const leads = await prisma.leads.count({ where: { created_at: { gte: startDate } } });
    const calls = await prisma.calls.count({ where: { started_at: { gte: startDate } } });
    const visits = await prisma.visits.count({ where: { scheduled_at: { gte: startDate } } });
    const sales = await prisma.closures.count({ where: { created_at: { gte: startDate } } });

    return {
      leads,
      calls,
      visits,
      sales,
      conversionRates: {
        leadsToCall: (calls / leads) * 100,
        callsToVisit: (visits / calls) * 100,
        visitsToSale: (sales / visits) * 100,
        leadsToSale: (sales / leads) * 100
      }
    };
  }
}
```

**UI Components:**
```typescript
function CommandCenter() {
  const { data: metrics } = useQuery(['live-metrics'], () =>
    api.getLiveMetrics(),
    { refetchInterval: 5000 } // Update every 5 seconds
  );

  return (
    <div className="command-center p-8">
      {/* Top KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <KPICard
          title="Active Calls"
          value={metrics?.activeCalls}
          icon={<Phone />}
          color="green"
          pulse
        />
        <KPICard
          title="Calls Today"
          value={metrics?.todayStats.total_calls}
          icon={<PhoneCall />}
        />
        <KPICard
          title="Avg Duration"
          value={formatDuration(metrics?.todayStats.avg_duration)}
          icon={<Clock />}
        />
        <KPICard
          title="Conversions"
          value={metrics?.todayStats.conversions}
          icon={<CheckCircle />}
          color="blue"
        />
      </div>

      {/* Funnel */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <Card>
          <h3>Conversion Funnel</h3>
          <FunnelChart data={metrics?.funnel} />
        </Card>

        <Card>
          <h3>Leaderboard</h3>
          <Leaderboard data={metrics?.leaderboard} />
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-8">
        <Card>
          <h3>Calls by Hour</h3>
          <LineChart data={metrics?.callsByHour} />
        </Card>

        <Card>
          <h3>Campaign Performance</h3>
          <BarChart data={metrics?.campaignStats} />
        </Card>
      </div>
    </div>
  );
}
```

**Effort:** 3 weeks
**Dependencies:**
- Real-time WebSocket setup
- ankr-viewer integration (for charts)

---

#### #12: Sales Empowerment Panel (Telecaller) 🔥 HIGH VALUE
**User:** Telecaller
**Status:** ❌ Does Not Exist

**Required Features:**
- Deep insights side panel (during call)
- Previous interaction timeline (mini version of #10)
- Audio playback of past calls
- Website click history (if tracked)
- FAQ/Script search (PageIndex integration)
- Objection library with suggested responses
- Product knowledge base
- Competitive intelligence
- AI-powered next best action

**Technical Implementation:**
```typescript
// packages/ankr-telehub/src/server/empowerment-panel.ts
class EmpowermentPanelService {
  async getContextualHelp(callId: string, query: string): Promise<ContextualHelp> {
    const call = await prisma.calls.findUnique({
      where: { id: callId },
      include: { lead: true, analytics: true }
    });

    // Search knowledge base (PageIndex)
    const kbResults = await pageIndex.search(query, {
      filters: { category: 'sales-scripts' }
    });

    // Search objection handlers
    const objections = await this.searchObjections(query);

    // AI-powered suggestion
    const aiSuggestion = await this.getAISuggestion(call, query);

    return {
      knowledgeBase: kbResults,
      objections,
      aiSuggestion,
      nextBestAction: await this.predictNextAction(call)
    };
  }

  private async getAISuggestion(call: Call, query: string): Promise<string> {
    const context = {
      lead: call.lead,
      callHistory: await this.getCallHistory(call.lead_id),
      currentSentiment: call.analytics?.sentiment_score,
      query: query
    };

    const prompt = `
      You are a sales coach helping a telecaller at Pratham Education Foundation.

      Context:
      - Customer: ${context.lead.name}
      - Current sentiment: ${context.currentSentiment}
      - Query: ${query}

      Provide a concise, actionable suggestion (2-3 sentences).
    `;

    const response = await ankrAIProxy.chat({
      messages: [
        { role: 'system', content: 'You are a helpful sales coach.' },
        { role: 'user', content: prompt }
      ]
    });

    return response.content;
  }

  async searchObjections(query: string): Promise<Objection[]> {
    const objections = await prisma.objection_library.findMany({
      where: {
        OR: [
          { objection_text: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5
    });

    return objections;
  }
}
```

**UI Components:**
```typescript
function EmpowermentPanel({ callId }: { callId: string }) {
  const [query, setQuery] = useState('');
  const { data: help } = useQuery(['contextual-help', callId, query], () =>
    api.getContextualHelp(callId, query),
    { enabled: query.length > 2 }
  );

  return (
    <div className="empowerment-panel fixed right-0 top-0 h-full w-96 bg-gray-900 p-6 overflow-y-auto">
      <h2>Sales Assistant</h2>

      {/* Quick Search */}
      <Input
        placeholder="Ask anything..."
        value={query}
        onChange={setQuery}
        icon={<Search />}
      />

      {/* AI Suggestion */}
      {help?.aiSuggestion && (
        <Card className="bg-blue-900 mb-4">
          <h3>AI Suggestion</h3>
          <p>{help.aiSuggestion}</p>
        </Card>
      )}

      {/* Knowledge Base Results */}
      {help?.knowledgeBase.length > 0 && (
        <Accordion title="Scripts & FAQs">
          {help.knowledgeBase.map(item => (
            <KBItem key={item.id} item={item} />
          ))}
        </Accordion>
      )}

      {/* Objection Handlers */}
      {help?.objections.length > 0 && (
        <Accordion title="Objection Handlers" defaultOpen>
          {help.objections.map(obj => (
            <ObjectionCard key={obj.id} objection={obj} />
          ))}
        </Accordion>
      )}

      {/* Next Best Action */}
      <Card>
        <h3>Next Best Action</h3>
        <p>{help?.nextBestAction}</p>
      </Card>

      {/* Quick Links */}
      <div className="mt-6">
        <h3>Quick Access</h3>
        <Button onClick={() => setQuery('pricing')}>Pricing</Button>
        <Button onClick={() => setQuery('too expensive')}>Handle "Too Expensive"</Button>
        <Button onClick={() => setQuery('competition')}>Competitor Comparison</Button>
      </div>
    </div>
  );
}
```

**Effort:** 3 weeks
**Dependencies:**
- PageIndex integration
- Objection library content creation
- ANKR AI Proxy

---

## 📈 Success Metrics & KPIs

### Technical Metrics
- [ ] **Uptime:** 99.9% SLA
- [ ] **API Response Time:** < 200ms (p95)
- [ ] **Page Load Time:** < 2 seconds
- [ ] **Call Connection Time:** < 5 seconds
- [ ] **AI Response Time:** < 3 seconds
- [ ] **Concurrent Users:** 30+ supported
- [ ] **Concurrent Calls:** 20+ supported
- [ ] **Mobile App Performance:** < 3s first load

### Business Metrics (Target vs Actual)

**Month 1 (Baseline):**
- [ ] Track current metrics:
  - Calls per day per telecaller: ~60
  - Conversion rate: ~8%
  - Average call duration: ~6 mins
  - Manual data entry time: ~20 mins/day
  - Manager visibility: Delayed reports only

**Month 2-3 (Early Impact):**
- [ ] **Efficiency:** 20-30% improvement (60 → 80 calls/day)
- [ ] **Conversion Rate:** 10-15% increase (8% → 9.2%)
- [ ] **Data Entry Time:** 40% reduction (20 → 12 mins/day)
- [ ] **Manager Visibility:** 100% real-time
- [ ] **Field Visit Completion:** 85%+
- [ ] **Campaign Engagement:** 40% open rate (email), 60% (WhatsApp)

**Month 4-6 (Full Impact):**
- [ ] **Efficiency:** 30-40% improvement (60 → 85 calls/day)
- [ ] **Conversion Rate:** 15-20% increase (8% → 9.6%)
- [ ] **Data Entry Time:** 50% reduction (20 → 10 mins/day)
- [ ] **Telecaller Satisfaction:** 80%+
- [ ] **Manager Satisfaction:** 85%+
- [ ] **ROI Achievement:** Break-even
- [ ] **Lead Response Time:** < 2 hours
- [ ] **Visit Show Rate:** 75%+

### Feature Adoption Metrics
- [ ] **#3 Smart Queue:** 100% daily usage
- [ ] **#4 Call HUD:** 95% of calls use it
- [ ] **#6 Campaigns:** 5+ active campaigns
- [ ] **#10 Customer 360:** 80% of calls check it
- [ ] **#11 Command Center:** Managers check 10+ times/day
- [ ] **#12 Empowerment Panel:** 70% of calls use search
- [ ] **Mobile App (#8):** 90% field agent adoption

---

## 🔐 Security & Compliance

### Data Protection
- ✅ End-to-end encryption for call recordings (AES-256)
- ✅ PCI DSS compliance (if handling payments)
- ✅ GDPR-compliant data retention policies (90 days recordings, 2 years leads)
- ✅ Role-based access control (RBAC) - 5 roles (Admin, Manager, Telecaller, Field Agent, Viewer)
- ✅ Audit logs for all data access (immutable)
- ✅ Data masking (PII hidden except for authorized roles)

### Compliance Requirements (India-specific)
- ✅ **TRAI DND Registry:** Check before every call
- ✅ **Call Recording Consent:** Auto-play disclaimer or opt-in
- ✅ **Data Residency:** India-based servers (AWS Mumbai region)
- ✅ **Right to Deletion:** GDPR Article 17 compliance
- ✅ **DPDP Act 2023:** India's new data protection law compliance

### Security Measures
- ✅ OAuth 2.0 authentication
- ✅ JWT token-based authorization (15 min expiry, refresh tokens)
- ✅ Rate limiting (100 req/min per user, 1000 req/min per IP)
- ✅ DDoS protection (Cloudflare)
- ✅ Regular security audits (quarterly)
- ✅ Penetration testing before launch
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS protection (Content Security Policy)
- ✅ HTTPS everywhere (TLS 1.3)

---

## 🎓 Training & Change Management

### Telecaller Training (2 days)
**Day 1: Platform Basics**
- How to log in and navigate (#1, #2, #3)
- Understanding the Smart Queue (#3)
- Making calls using Call HUD (#4)
- Disposition codes (#5)
- Using AI assistant (#12)

**Day 2: Advanced Features**
- Customer 360 view (#10)
- Campaign management (#6)
- Visit scheduling (#7)
- Performance tracking
- Best practices

### Manager Training (1 day)
- Command center overview (#11)
- Real-time monitoring
- Analytics and reporting
- Coaching using AI insights
- Creating and managing campaigns (#6)
- Configuring distribution rules (#2)

### Field Agent Training (Half day)
- Mobile app navigation (#8)
- Daily agenda and routing
- Check-in procedures (geolocation)
- Closure form (#9)
- Photo uploads and visit notes

### Admin Training (Half day)
- Lead ingestion (#1)
- Distribution rules (#2)
- Campaign builder (#6)
- User management
- System configuration

### Ongoing Support
- Dedicated support hotline (10am-6pm IST)
- WhatsApp support channel
- Video tutorial library (12+ videos)
- Monthly feature updates
- Quarterly training refreshers

---

## 🔮 Future Enhancements (Post-Launch)

### Phase 2 Features (6-12 months)
- Voice bot for initial screening
- Predictive dialer (vs progressive)
- Advanced ML lead scoring
- Revenue forecasting
- Multi-language support (Tamil, Telugu, Bengali)
- Chatbot for website leads
- Social media integration (Facebook, Instagram)
- Advanced gamification (badges, rewards)

### Phase 3 Features (12-24 months)
- Video calling capability
- AI voice cloning for personalized messages
- Blockchain-based lead provenance
- Multi-tenant SaaS version (for other NGOs)
- API marketplace for integrations
- Advanced BI with Metabase/Superset

---

## ❓ Risk Assessment & Mitigation

### Technical Risks

**Risk 1: Laravel Integration Complexity**
- **Impact:** High (blocks go-live)
- **Probability:** Medium
- **Mitigation:**
  - [ ] Start with read-only sync
  - [ ] Extensive testing with staging data
  - [ ] Laravel team involvement from Day 1
  - [ ] Fallback: Manual data entry option

**Risk 2: Exotel/PBX Integration Issues**
- **Impact:** High (can't make calls)
- **Probability:** Low
- **Mitigation:**
  - [ ] Setup Twilio as backup provider
  - [ ] Test call quality in different networks
  - [ ] Fallback: Mobile calling with manual logging
  - [ ] SLA with Exotel (99.9% uptime)

**Risk 3: Real-time Performance at Scale**
- **Impact:** High (poor UX)
- **Probability:** Low
- **Mitigation:**
  - [ ] Load testing early (simulate 50 concurrent users)
  - [ ] Auto-scaling configuration (AWS ECS/Lambda)
  - [ ] Redis caching everywhere
  - [ ] CDN for static assets

**Risk 4: AI API Costs Overrun**
- **Impact:** Medium (budget issues)
- **Probability:** Medium
- **Mitigation:**
  - [ ] Aggressive caching of AI responses (Redis)
  - [ ] ANKR AI Proxy cost optimization
  - [ ] Rate limiting per user (10 AI requests/call)
  - [ ] Monitor costs daily via dashboard

**Risk 5: Mobile App Store Approval**
- **Impact:** Medium (delays field ops)
- **Probability:** Medium
- **Mitigation:**
  - [ ] Start with PWA (no approval needed)
  - [ ] Parallel submit to App Store/Play Store
  - [ ] Follow platform guidelines strictly

### Business Risks

**Risk 1: User Adoption Resistance**
- **Impact:** High (failed launch)
- **Probability:** Medium
- **Mitigation:**
  - [ ] Comprehensive training program (2 days)
  - [ ] Gradual rollout (5 → 15 → 30)
  - [ ] Incentivize early adopters (leaderboard prizes)
  - [ ] Collect feedback continuously
  - [ ] Quick wins in first week

**Risk 2: Data Migration Issues**
- **Impact:** High (data loss)
- **Probability:** Low
- **Mitigation:**
  - [ ] Extensive testing in staging
  - [ ] Pilot migration with 100 leads
  - [ ] Rollback plan documented
  - [ ] Data validation at each step
  - [ ] Keep Laravel CRM running in parallel for 1 month

**Risk 3: WhatsApp Business API Rejection**
- **Impact:** Medium (no automation)
- **Probability:** Low
- **Mitigation:**
  - [ ] Start approval process early (2-3 weeks)
  - [ ] Follow WhatsApp guidelines (verified business)
  - [ ] Fallback: Email + SMS campaigns only
  - [ ] Use approved BSP (Business Solution Provider)

---

## 🏁 Conclusion & Recommendations

### Summary
ANKR TeleHub presents a world-class solution for Pratham's telecalling and field operations challenges, offering:
- 📊 **Complete Coverage:** All 12 requirements met
- 🤖 **AI-Powered:** Real-time assistance and analytics (#10, #12)
- 📈 **30-40% Efficiency Gain:** More calls, better conversions
- 💰 **Cost-Effective:** Better ROI than building from scratch
- 📱 **Field Operations:** Complete visit management (#7, #8, #9)
- 🚀 **Automation:** WhatsApp + Email campaigns (#6)

### Primary Recommendation: **ANKR Platform Integration (Approach 4)**

**Why:**
1. **Fastest Time to Market:** 18-24 weeks vs 29+ weeks for greenfield
2. **Lower Cost:** ₹31 lakhs (after ANKR discount) vs ₹46 lakhs (full build)
3. **Proven Technology:** Battle-tested in production
4. **AI Superiority:** Industry-leading features already built
5. **Complete Feature Set:** Meets all 12 requirements
6. **Future-Proof:** Easy to add features later

### Investment Summary
- **Development:** ₹30.69 lakhs (one-time)
- **Infrastructure:** ₹8.94 lakhs/year
- **Support:** ₹3.50 lakhs/year
- **Year 1 Total:** ₹43.21 lakhs
- **Expected ROI:** ₹49 lakhs+ (net benefit)
- **Payback Period:** 5.6 months

### Next Steps

**Week 1-2: Approval & Setup**
1. Stakeholder sign-off on this report
2. Budget approval
3. Team assignment
4. Kickoff meeting

**Week 3-4: Foundation**
1. Set up ANKR monorepo workspace
2. Provision Exotel account
3. WhatsApp Business API application
4. Database schema creation

**Week 5+: Development Sprints**
1. Start Phase 1 (Foundation)
2. Bi-weekly stakeholder demos
3. Continuous feedback loop

---

**Prepared by:** ANKR Labs Engineering Team
**Contact:** [Contact information]
**Document Version:** 2.0 (Unified)
**Last Updated:** February 14, 2026

**Jai Guru Ji** 🙏

---

*End of Unified Project Report*
