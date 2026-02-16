# ANKR TOS - Terminal Operating System
## Project Plan & Vision Document

**Date:** 2026-02-16
**Version:** 1.0
**Status:** Strategic Planning Phase
**Target Market:** Global Port Terminals & Container Yards
**Competition:** Navis N4, Solvo.TOS, Tideworks, Cosmos

---

## 🎯 Executive Summary

**ANKR TOS** (Terminal Operating System) is a comprehensive, AI-powered container terminal management platform designed to compete with industry leaders like Navis N4. Building on the successful EDIBox BAPLIE viewer foundation, ANKR TOS will provide end-to-end terminal operations management including:

- **Container & Vessel Planning**
- **Berth & Yard Management**
- **Gate Operations & Security**
- **Equipment Tracking & Optimization**
- **Billing & Invoicing**
- **Real-time Analytics & AI Optimization**

**Market Opportunity:**
- Global TOS market: **$2.1 billion** (2025)
- CAGR: **8.2%** (2025-2030)
- 500+ major container terminals worldwide
- Navis N4 dominates with 60%+ market share
- **Gap:** Modern, AI-powered, cloud-native alternative

---

## 🏗️ System Architecture

### **Core Modules**

```
ANKR TOS Platform
├── 1. Vessel Planning & Operations (VOP)
│   ├── Vessel Schedule Management
│   ├── Berth Allocation & Optimization
│   ├── Stowage Planning (extending EDIBox)
│   ├── Load/Discharge Sequencing
│   └── Vessel Performance Analytics
│
├── 2. Yard Management System (YMS)
│   ├── Container Location Tracking (real-time)
│   ├── Yard Block Allocation
│   ├── Stack Optimization (AI-powered)
│   ├── Reshuffling Minimization
│   └── Reefer & Hazmat Zone Management
│
├── 3. Gate Operations (GATE)
│   ├── Truck Appointment System
│   ├── OCR & RFID Integration
│   ├── Driver Check-in/out
│   ├── Damage Inspection (AI vision)
│   └── Queue Management & Optimization
│
├── 4. Equipment Management (EQM)
│   ├── RTG/RMQ Crane Control
│   ├── Reach Stacker Tracking
│   ├── Prime Mover Assignment
│   ├── Equipment Maintenance Scheduling
│   └── Utilization Analytics
│
├── 5. Rail Operations (RAIL)
│   ├── Rail Car Tracking
│   ├── Rail Yard Management
│   ├── Intermodal Transfer
│   └── Rail Schedule Coordination
│
├── 6. Billing & Invoicing (BILLING)
│   ├── Tariff Management
│   ├── Automated Billing (storage, handling, services)
│   ├── Invoice Generation
│   ├── Payment Tracking
│   └── Financial Reporting
│
├── 7. EDI & Integration Hub (EDI)
│   ├── BAPLIE (leveraging EDIBox)
│   ├── COPARN, COARRI, CODECO
│   ├── APERAK, IFTDGN
│   ├── Customs Integration (ICEGATE, AMS, ACI)
│   └── Shipping Line Portals
│
├── 8. Analytics & Optimization (AI)
│   ├── Predictive Berth Planning
│   ├── AI Yard Optimization
│   ├── Equipment Dispatch Optimization
│   ├── Dwell Time Reduction
│   └── Performance Dashboards
│
└── 9. Mobile Apps & IoT
    ├── Equipment Operator Apps
    ├── Gate Officer Apps
    ├── Supervisor Dashboards
    ├── IoT Sensor Integration
    └── Real-time Alerts & Notifications
```

---

## 📊 Module Details

### **1. Vessel Planning & Operations (VOP)**

**Purpose:** Manage vessel arrivals, berth allocation, and cargo operations

**Key Features:**
- **Berth Planning:**
  - AI-optimized berth allocation considering vessel size, draft, cargo volume
  - Multi-berth coordination
  - Tide & weather considerations
  - Minimize vessel waiting time

- **Stowage Planning:**
  - Extends EDIBox BAPLIE viewer
  - Load plan generation (auto-planning)
  - Weight distribution & stability calculations
  - Crane split optimization
  - Dangerous goods segregation

- **Load/Discharge Sequencing:**
  - Optimal container discharge order
  - Load sequence generation
  - Restow planning for next port
  - Minimize vessel delays

- **Vessel Performance:**
  - Berth productivity tracking (moves/hour)
  - Crane performance metrics
  - Turnaround time analysis
  - Benchmark against targets

**Technology Stack:**
- Backend: Fastify + Prisma (PostgreSQL)
- Real-time: Socket.io for live updates
- AI: Optimization algorithms (genetic algorithms, constraint programming)
- Visualization: React Three Fiber (3D vessel/terminal view)

**Database Schema:**
```sql
-- Vessels
CREATE TABLE vessels (
  id UUID PRIMARY KEY,
  imo_number VARCHAR(10) UNIQUE,
  vessel_name VARCHAR(100),
  operator VARCHAR(100),
  length_overall DECIMAL(10,2),
  beam DECIMAL(10,2),
  draft DECIMAL(10,2),
  gross_tonnage INTEGER,
  capacity_teu INTEGER
);

-- Vessel Visits
CREATE TABLE vessel_visits (
  id UUID PRIMARY KEY,
  vessel_id UUID REFERENCES vessels(id),
  voyage_number VARCHAR(20),
  service_code VARCHAR(10),
  estimated_arrival TIMESTAMP,
  actual_arrival TIMESTAMP,
  estimated_departure TIMESTAMP,
  actual_departure TIMESTAMP,
  berth_id UUID REFERENCES berths(id),
  status VARCHAR(20), -- PLANNED, BERTHED, WORKING, DEPARTED
  import_containers INTEGER,
  export_containers INTEGER,
  discharge_teu INTEGER,
  load_teu INTEGER
);

-- Berths
CREATE TABLE berths (
  id UUID PRIMARY KEY,
  berth_code VARCHAR(10) UNIQUE,
  berth_name VARCHAR(50),
  length DECIMAL(10,2),
  max_draft DECIMAL(10,2),
  cranes INTEGER,
  bollards INTEGER,
  lat DECIMAL(10,8),
  lon DECIMAL(11,8)
);

-- Load/Discharge Plans
CREATE TABLE cargo_operations (
  id UUID PRIMARY KEY,
  visit_id UUID REFERENCES vessel_visits(id),
  container_id UUID REFERENCES containers(id),
  operation_type VARCHAR(10), -- LOAD, DISCHARGE, RESTOW
  sequence_number INTEGER,
  bay VARCHAR(3),
  row VARCHAR(3),
  tier VARCHAR(3),
  crane_number INTEGER,
  planned_time TIMESTAMP,
  actual_time TIMESTAMP,
  operator_id UUID REFERENCES users(id)
);
```

---

### **2. Yard Management System (YMS)**

**Purpose:** Track and optimize container storage in the terminal yard

**Key Features:**
- **Real-time Location Tracking:**
  - GPS on equipment (RTGs, reach stackers)
  - Container position updates on every move
  - RFID/OCR validation at gates
  - 3D yard visualization

- **Yard Block Allocation:**
  - Auto-assignment based on:
    - Import/Export/Transhipment
    - Size (20ft/40ft/45ft)
    - Weight class
    - Reefer/Hazmat requirements
    - Planned vessel/truck delivery
  - Dynamic reallocation based on dwell time

- **Stack Optimization:**
  - AI-powered ground slot selection
  - Minimize reshuffles (aim <10%)
  - Block utilization targets (85-90%)
  - Height optimization (maximize slot usage)

- **Reshuffling Minimization:**
  - Predictive restow planning
  - Pre-marshaling for outbound
  - Cluster same-vessel/same-destination containers

- **Reefer & Hazmat Management:**
  - Dedicated reefer zones with power outlets
  - Hazmat segregation per IMDG rules
  - Temperature monitoring & alerts
  - Safety compliance checks

**Technology:**
- Real-time data: Redis + WebSockets
- AI: Reinforcement learning for slot allocation
- Visualization: D3.js heatmaps + 3D yard views
- IoT: Integration with yard sensors & cameras

**Database Schema:**
```sql
-- Yard Blocks
CREATE TABLE yard_blocks (
  id UUID PRIMARY KEY,
  block_code VARCHAR(10) UNIQUE,
  block_type VARCHAR(20), -- IMPORT, EXPORT, EMPTY, REEFER
  capacity_ground INTEGER,
  capacity_stack INTEGER,
  max_tiers INTEGER,
  has_power BOOLEAN, -- For reefers
  lat DECIMAL(10,8),
  lon DECIMAL(11,8)
);

-- Yard Slots
CREATE TABLE yard_slots (
  id UUID PRIMARY KEY,
  block_id UUID REFERENCES yard_blocks(id),
  slot_code VARCHAR(15) UNIQUE, -- e.g., A1-01-02
  row INTEGER,
  bay INTEGER,
  tier INTEGER,
  status VARCHAR(20), -- EMPTY, OCCUPIED, RESERVED, BLOCKED
  container_id UUID REFERENCES containers(id),
  weight_limit INTEGER,
  is_reefer_capable BOOLEAN
);

-- Container Inventory
CREATE TABLE containers (
  id UUID PRIMARY KEY,
  container_number VARCHAR(11) UNIQUE,
  iso_size VARCHAR(4),
  iso_type VARCHAR(4),
  operator VARCHAR(10),
  status VARCHAR(20), -- IMPORT, EXPORT, TRANSHIP, EMPTY
  current_slot_id UUID REFERENCES yard_slots(id),
  arrival_date TIMESTAMP,
  last_free_date TIMESTAMP,
  weight_kg INTEGER,
  is_reefer BOOLEAN,
  temp_setpoint DECIMAL(5,2),
  is_hazmat BOOLEAN,
  imdg_class VARCHAR(10),
  vessel_id UUID REFERENCES vessel_visits(id), -- For import
  truck_booking_id UUID REFERENCES truck_bookings(id) -- For export
);

-- Move History
CREATE TABLE container_moves (
  id UUID PRIMARY KEY,
  container_id UUID REFERENCES containers(id),
  from_slot_id UUID REFERENCES yard_slots(id),
  to_slot_id UUID REFERENCES yard_slots(id),
  move_type VARCHAR(20), -- DISCHARGE, LOAD, RESHUFFLE, GATE_IN, GATE_OUT
  equipment_id UUID REFERENCES equipment(id),
  operator_id UUID REFERENCES users(id),
  move_time TIMESTAMP,
  duration_seconds INTEGER
);
```

---

### **3. Gate Operations (GATE)**

**Purpose:** Manage truck gate-in/gate-out, appointments, and inspections

**Key Features:**
- **Truck Appointment System (TAS):**
  - Online booking portal
  - Time-slot allocation (15-min windows)
  - Queue management
  - SMS/Email notifications

- **OCR & RFID:**
  - Automatic container number recognition
  - License plate OCR
  - RFID tag reading
  - Validation against bookings

- **Driver Check-in/out:**
  - Driver ID verification
  - Document validation (delivery order, VGM)
  - Chassis inspection
  - Seal verification

- **Damage Inspection:**
  - AI-powered damage detection (cameras)
  - Photo documentation
  - EIR (Equipment Interchange Receipt) generation
  - Dispute management

- **Queue Optimization:**
  - Real-time queue monitoring
  - Dynamic lane assignment
  - VIP/express lanes
  - Wait time prediction

**Technology:**
- OCR: Tesseract + Custom ML model
- Damage Detection: YOLOv8 + OpenCV
- Queue Management: Real-time analytics + load balancing
- Mobile: React Native app for drivers

**Database Schema:**
```sql
-- Truck Appointments
CREATE TABLE truck_bookings (
  id UUID PRIMARY KEY,
  booking_number VARCHAR(20) UNIQUE,
  booking_type VARCHAR(10), -- IMPORT_PICKUP, EXPORT_DROPOFF
  container_number VARCHAR(11),
  truck_license VARCHAR(20),
  driver_name VARCHAR(100),
  driver_phone VARCHAR(15),
  appointment_time TIMESTAMP,
  gate_lane_assigned VARCHAR(5),
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  status VARCHAR(20) -- BOOKED, CHECKED_IN, PROCESSED, NO_SHOW
);

-- Gate Transactions
CREATE TABLE gate_transactions (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES truck_bookings(id),
  container_id UUID REFERENCES containers(id),
  transaction_type VARCHAR(10), -- GATE_IN, GATE_OUT
  gate_lane VARCHAR(5),
  gate_officer_id UUID REFERENCES users(id),
  transaction_time TIMESTAMP,
  seal_number VARCHAR(20),
  chassis_number VARCHAR(20),
  gross_weight INTEGER,
  vgm_verified BOOLEAN
);

-- Damage Records
CREATE TABLE damage_inspections (
  id UUID PRIMARY KEY,
  container_id UUID REFERENCES containers(id),
  gate_transaction_id UUID REFERENCES gate_transactions(id),
  damage_type VARCHAR(50), -- DENT, HOLE, RUST, etc.
  severity VARCHAR(10), -- MINOR, MAJOR, CRITICAL
  location VARCHAR(50), -- DOOR, ROOF, SIDE, etc.
  photo_url TEXT,
  reported_by UUID REFERENCES users(id),
  created_at TIMESTAMP
);
```

---

### **4. Equipment Management (EQM)**

**Purpose:** Track and optimize terminal equipment (cranes, RTGs, trucks)

**Key Features:**
- **Equipment Tracking:**
  - Real-time GPS location
  - Utilization tracking (idle vs. working)
  - Operator assignment
  - Fuel consumption monitoring

- **Dispatch Optimization:**
  - Auto-assignment of jobs to nearest equipment
  - Load balancing across equipment
  - Priority job handling
  - AI-powered route optimization

- **Maintenance Scheduling:**
  - Predictive maintenance (based on hours/cycles)
  - Scheduled maintenance calendar
  - Breakdown tracking
  - Spare parts inventory

- **Performance Analytics:**
  - Moves per hour (productivity)
  - Downtime analysis
  - Utilization rates
  - Benchmark vs. targets

**Technology:**
- IoT: GPS trackers, CAN bus integration
- Dispatch: AI routing algorithms (A*, Dijkstra)
- Predictive Maintenance: ML anomaly detection
- Mobile: Operator apps for job assignment

**Database Schema:**
```sql
-- Equipment Registry
CREATE TABLE equipment (
  id UUID PRIMARY KEY,
  equipment_code VARCHAR(20) UNIQUE,
  equipment_type VARCHAR(20), -- RTG, RMQ, REACHSTACKER, TRUCK
  manufacturer VARCHAR(50),
  model VARCHAR(50),
  year INTEGER,
  serial_number VARCHAR(50),
  capacity_tons INTEGER,
  status VARCHAR(20), -- ACTIVE, MAINTENANCE, BREAKDOWN, RETIRED
  current_lat DECIMAL(10,8),
  current_lon DECIMAL(11,8),
  assigned_operator_id UUID REFERENCES users(id)
);

-- Work Orders
CREATE TABLE equipment_jobs (
  id UUID PRIMARY KEY,
  job_type VARCHAR(20), -- DISCHARGE, LOAD, RESHUFFLE, GATE_MOVE
  container_id UUID REFERENCES containers(id),
  from_location VARCHAR(50),
  to_location VARCHAR(50),
  assigned_equipment_id UUID REFERENCES equipment(id),
  assigned_operator_id UUID REFERENCES users(id),
  priority INTEGER,
  status VARCHAR(20), -- PENDING, IN_PROGRESS, COMPLETED, CANCELLED
  created_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Maintenance Records
CREATE TABLE equipment_maintenance (
  id UUID PRIMARY KEY,
  equipment_id UUID REFERENCES equipment(id),
  maintenance_type VARCHAR(20), -- PREVENTIVE, CORRECTIVE, BREAKDOWN
  description TEXT,
  scheduled_date DATE,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  technician_id UUID REFERENCES users(id),
  parts_used JSONB,
  cost DECIMAL(10,2),
  status VARCHAR(20)
);
```

---

### **5. Billing & Invoicing (BILLING)**

**Purpose:** Automate terminal tariff calculation and invoice generation

**Key Features:**
- **Tariff Management:**
  - Multi-currency support
  - Customer-specific rates
  - Seasonal pricing
  - Volume discounts

- **Automated Billing:**
  - Storage charges (per diem after free time)
  - Handling charges (lift-on/lift-off)
  - Reefer power charges
  - Special services (VGM, lashing, etc.)

- **Invoice Generation:**
  - PDF invoices with itemized charges
  - Email delivery
  - Payment tracking
  - Credit note management

- **Financial Reporting:**
  - Revenue dashboards
  - Aging reports
  - Customer statements
  - Tax reporting (GST, VAT)

**Technology:**
- Billing Engine: PostgreSQL stored procedures
- PDF: jsPDF or PDFKit
- Integrations: Accounting software (Tally, QuickBooks)
- Reporting: Power BI / Tableau

**Database Schema:**
```sql
-- Tariff Matrix
CREATE TABLE tariffs (
  id UUID PRIMARY KEY,
  tariff_code VARCHAR(20) UNIQUE,
  description TEXT,
  unit_type VARCHAR(20), -- PER_TEU, PER_TON, PER_MOVE, PER_DAY
  base_rate DECIMAL(10,2),
  currency VARCHAR(3),
  effective_from DATE,
  effective_to DATE
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  invoice_number VARCHAR(20) UNIQUE,
  customer_id UUID REFERENCES customers(id),
  vessel_visit_id UUID REFERENCES vessel_visits(id),
  invoice_date DATE,
  due_date DATE,
  subtotal DECIMAL(10,2),
  tax_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  status VARCHAR(20), -- DRAFT, SENT, PAID, OVERDUE
  payment_date DATE
);

-- Invoice Line Items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  tariff_id UUID REFERENCES tariffs(id),
  container_id UUID REFERENCES containers(id),
  description TEXT,
  quantity DECIMAL(10,2),
  unit_rate DECIMAL(10,2),
  amount DECIMAL(10,2)
);
```

---

### **6. EDI & Integration Hub (EDI)**

**Purpose:** Seamless data exchange with shipping lines, customs, and stakeholders

**Key Features:**
- **BAPLIE Integration:**
  - Leverage existing EDIBox parser
  - Auto-import vessel stowage plans
  - Validate against terminal capacity

- **COPARN (Container Pre-Announcement):**
  - Pre-advice of import containers
  - Export booking confirmations
  - Automation of gate appointments

- **COARRI (Container Arrival):**
  - Vessel arrival notifications
  - Container manifest import
  - Customs declaration integration

- **CODECO (Container Discharge/Gate-in/Gate-out):**
  - Real-time event notifications
  - Status updates to shipping lines
  - Billing triggers

- **Customs Integration:**
  - India: ICEGATE (customs clearance)
  - USA: AMS (Automated Manifest System)
  - Canada: ACI (Advance Commercial Information)
  - EU: ICS2 (Import Control System)

**Technology:**
- EDI Parser: Extend EDIBox engine
- Message Queue: RabbitMQ for reliable delivery
- API Gateway: For REST/GraphQL integrations
- Monitoring: Track message success/failure rates

---

### **7. Analytics & AI Optimization**

**Purpose:** Data-driven insights and predictive optimization

**Key Features:**
- **Berth Planning AI:**
  - Predict vessel arrival delays (weather, port congestion)
  - Optimize berth allocation (minimize waiting time + maximize utilization)
  - Crane assignment optimization

- **Yard Optimization:**
  - ML-based slot allocation (minimize reshuffles)
  - Predictive dwell time analysis
  - Auto-marshaling for outbound containers

- **Equipment Dispatch:**
  - Real-time routing optimization
  - Load balancing across equipment fleet
  - Reduce idle time & fuel consumption

- **Dwell Time Reduction:**
  - Identify long-dwelling containers
  - Auto-alerts to customers
  - Storage charge triggers

- **Performance Dashboards:**
  - KPIs: Berth productivity, yard utilization, gate throughput
  - Real-time metrics
  - Historical trends & benchmarking

**Technology:**
- AI/ML: TensorFlow, PyTorch for predictive models
- Optimization: OR-Tools (Google), Gurobi (commercial)
- Dashboards: React + D3.js + Recharts
- Data Warehouse: PostgreSQL + TimescaleDB

---

## 🛠️ Technology Stack

### **Backend**
- **Framework:** Fastify (Node.js) - High performance
- **Database:** PostgreSQL 16 + TimescaleDB (for time-series)
- **ORM:** Prisma 5.22
- **Real-time:** Socket.io / WebSockets
- **Message Queue:** RabbitMQ (EDI, async tasks)
- **Cache:** Redis (real-time data, sessions)
- **Search:** Elasticsearch (container/vessel search)

### **Frontend**
- **Framework:** React 19 + TypeScript
- **Build:** Vite 5.0
- **UI Library:** Tailwind CSS + Shadcn/ui
- **3D Visualization:** React Three Fiber (berth/yard views)
- **2D Visualization:** D3.js (charts, heatmaps)
- **State Management:** Zustand / TanStack Query
- **Forms:** React Hook Form + Zod validation

### **Mobile**
- **Framework:** React Native / Expo
- **Platforms:** iOS, Android
- **Offline:** SQLite + sync on reconnect

### **AI/ML**
- **Python Backend:** FastAPI (for ML models)
- **Models:** TensorFlow / PyTorch
- **Optimization:** Google OR-Tools
- **Deployment:** Docker + Kubernetes

### **DevOps**
- **Containers:** Docker
- **Orchestration:** Kubernetes (K8s)
- **CI/CD:** GitHub Actions
- **Monitoring:** Grafana + Prometheus
- **Logging:** ELK Stack (Elasticsearch, Logstash, Kibana)

### **Infrastructure**
- **Cloud:** AWS / Azure / On-premise
- **CDN:** Cloudflare
- **Backup:** Automated daily backups (PostgreSQL)
- **HA:** Multi-region deployment

---

## 📅 Implementation Roadmap

### **Phase 1: Foundation (Months 1-3)**
**Goal:** Core TOS infrastructure + Vessel Planning

**Deliverables:**
- ✅ Database schema design (all modules)
- ✅ Authentication & RBAC (role-based access)
- ✅ Vessel Planning module (VOP)
  - Berth planning UI
  - Vessel schedule management
  - Basic load/discharge tracking
- ✅ EDI Integration (BAPLIE from EDIBox)
- ✅ Admin dashboard (React)

**Team:** 3-4 developers, 1 DBA, 1 DevOps

**Estimated Cost:** $120,000 - $150,000

---

### **Phase 2: Yard & Gate Operations (Months 4-6)**
**Goal:** Yard Management + Gate Automation

**Deliverables:**
- ✅ Yard Management System (YMS)
  - Real-time container tracking
  - Yard block visualization (3D)
  - Stack optimization AI
- ✅ Gate Operations (GATE)
  - Truck appointment system
  - OCR integration
  - Damage inspection (AI vision)
- ✅ Mobile app for gate officers
- ✅ Integration with yard sensors/IoT

**Team:** 5-6 developers, 1 ML engineer, 1 IoT specialist

**Estimated Cost:** $180,000 - $220,000

---

### **Phase 3: Equipment & Billing (Months 7-9)**
**Goal:** Equipment tracking + Financial modules

**Deliverables:**
- ✅ Equipment Management (EQM)
  - GPS tracking
  - Dispatch optimization
  - Maintenance scheduling
- ✅ Billing & Invoicing (BILLING)
  - Tariff engine
  - Automated invoice generation
  - Payment tracking
- ✅ Mobile app for equipment operators
- ✅ Financial reporting dashboards

**Team:** 4-5 developers, 1 accountant (consultant)

**Estimated Cost:** $150,000 - $180,000

---

### **Phase 4: Analytics & AI (Months 10-12)**
**Goal:** Advanced AI optimization + Analytics

**Deliverables:**
- ✅ AI Optimization Engines
  - Berth planning AI
  - Yard slot allocation ML
  - Equipment dispatch routing
- ✅ Predictive Analytics
  - Vessel delay prediction
  - Dwell time forecasting
  - Demand forecasting
- ✅ Executive Dashboards
  - KPI tracking
  - Real-time metrics
  - Performance benchmarking
- ✅ Mobile apps (iOS + Android)

**Team:** 3-4 developers, 2 ML engineers, 1 data scientist

**Estimated Cost:** $180,000 - $220,000

---

### **Phase 5: Integration & Deployment (Months 13-15)**
**Goal:** Customer integrations + Pilot deployment

**Deliverables:**
- ✅ Full EDI suite (COPARN, COARRI, CODECO, IFTDGN)
- ✅ Customs integrations (ICEGATE, AMS, ACI)
- ✅ Shipping line portal integrations
- ✅ Pilot deployment at 1-2 terminals
- ✅ Training & documentation
- ✅ Performance tuning & optimization

**Team:** 6-8 developers, 1 DevOps, 2 trainers, 1 PM

**Estimated Cost:** $200,000 - $250,000

---

## 💰 Total Project Cost Estimate

| Phase | Duration | Team Size | Cost Range |
|-------|----------|-----------|------------|
| Phase 1 | 3 months | 5 people | $120k - $150k |
| Phase 2 | 3 months | 7 people | $180k - $220k |
| Phase 3 | 3 months | 6 people | $150k - $180k |
| Phase 4 | 3 months | 6 people | $180k - $220k |
| Phase 5 | 3 months | 10 people | $200k - $250k |
| **TOTAL** | **15 months** | **Avg 7 people** | **$830k - $1.02M** |

**Note:** Costs include salaries, infrastructure, licenses, and contingency (15%)

---

## 🎯 Competitive Advantages

### **vs. Navis N4**

| Feature | Navis N4 | ANKR TOS |
|---------|----------|----------|
| **Architecture** | Legacy (Java monolith) | Modern microservices |
| **AI Optimization** | Basic rules | Advanced ML/AI |
| **Cloud-native** | ❌ On-premise only | ✅ Cloud + On-premise |
| **Mobile Apps** | Limited | Full-featured iOS/Android |
| **3D Visualization** | Basic | Advanced (Three.js) |
| **Pricing** | $500k+ per terminal | $100k - $300k |
| **Customization** | Difficult | Easy (open architecture) |
| **Training Time** | 3-6 months | 1-2 months |
| **API-first** | ❌ | ✅ GraphQL + REST |
| **Real-time Updates** | Slow | WebSocket real-time |

---

## 📈 Market Strategy

### **Target Customers (Phase 1-2)**
1. **Tier 2 & 3 Ports** (200k - 500k TEU/year)
   - Lower budget ($100k-$300k)
   - Faster decision-making
   - Examples: Mundra, Kattupalli, Hazira (India)

2. **Private Container Terminals**
   - Owned by shipping lines or logistics companies
   - More tech-savvy
   - Examples: APM Terminals, DP World

3. **Inland Container Depots (ICDs)**
   - Growing market in developing countries
   - Need cost-effective solutions
   - Examples: Tughlakabad, Dadri (India)

### **Pricing Models**

**Option 1: License + Maintenance**
- One-time license: $100,000 - $300,000 (based on terminal size)
- Annual maintenance: 15-20% of license fee
- Professional services: $150/hour

**Option 2: SaaS (Cloud)**
- Monthly subscription: $5,000 - $15,000 (based on TEU handled)
- No upfront cost
- Includes hosting, updates, support

**Option 3: Revenue Share**
- No upfront cost
- 2-5% of terminal operating revenue
- Incentive-aligned with customer success

---

## 🚀 Go-to-Market Plan

### **Phase 1: Pilot (Months 1-6)**
- Partner with 1-2 friendly terminals
- Deploy pilot version
- Gather feedback & iterate
- Build case studies

### **Phase 2: Early Adopters (Months 7-12)**
- Target 5-10 terminals in India
- Leverage pilot success stories
- Build integration partnerships (shipping lines, customs)

### **Phase 3: Expansion (Year 2)**
- Expand to Southeast Asia (Singapore, Malaysia, Vietnam)
- Middle East (Dubai, Jebel Ali)
- Africa (Durban, Lagos)

### **Phase 4: Global (Year 3-5)**
- Enter European & American markets
- Build global partner network
- Compete head-to-head with Navis

---

## 🎓 Success Metrics

### **Product KPIs**
- **Berth Productivity:** >30 moves/hour (industry avg: 25)
- **Yard Utilization:** >85% (vs. 70-75% typical)
- **Reshuffle Rate:** <10% (vs. 15-20% typical)
- **Gate Throughput:** <15 min avg turnaround (vs. 30 min)
- **System Uptime:** 99.9%

### **Business KPIs**
- **Customer Acquisition:** 10 terminals in Year 1
- **Revenue:** $1M ARR by end of Year 1
- **Customer Retention:** >90%
- **NPS Score:** >50

---

## 🔐 Risk Mitigation

### **Technical Risks**
- **Integration Complexity:** Mitigate with modular API-first design
- **Scalability:** Cloud-native architecture, load testing
- **Data Security:** ISO 27001 compliance, encryption, penetration testing

### **Business Risks**
- **Navis Lock-in:** Offer migration tools + incentives
- **Sales Cycle:** Partner with consultants, offer pilot programs
- **Customization Demands:** Balance with product roadmap, charge for custom work

### **Operational Risks**
- **24/7 Support:** Build global support team, tiered SLAs
- **Terminal Downtime:** Multi-region deployment, offline mode
- **Training:** Comprehensive docs, video tutorials, onsite training

---

## 👥 Team Requirements

### **Development Team**
- **Backend:** 3-4 developers (Node.js, PostgreSQL, Prisma)
- **Frontend:** 3-4 developers (React, TypeScript, Three.js)
- **Mobile:** 2 developers (React Native)
- **ML/AI:** 2 engineers (TensorFlow, optimization algorithms)
- **DevOps:** 1-2 engineers (K8s, AWS, CI/CD)
- **QA:** 2 testers (automated + manual)

### **Business/Support**
- **Product Manager:** 1 (maritime domain expert)
- **Sales:** 2-3 (enterprise sales, maritime industry)
- **Support:** 3-5 (24/7 coverage, tiered)
- **Trainers:** 2 (onsite + online training)

**Total Team Size:** 20-25 people (full-time + contractors)

---

## 📚 Appendix

### **Related Documents**
- EDIBox Project Report: `/root/EDIBOX-PDF-EXPORT-COMPLETE.md`
- EDIBox Implementation Plan: `/root/.claude/plans/edibox-implementation-plan.md`
- ANKR Port Configuration: `/root/.ankr/config/ports.json`

### **Industry Standards**
- **SMDG:** Shipping Message Development Group (EDI standards)
- **ISO 668:** Container dimensions
- **ISO 6346:** Container identification
- **IMO:** International Maritime Organization (safety regulations)
- **IMDG Code:** Dangerous goods classification

### **Competitor Analysis**
- **Navis N4:** Market leader, legacy tech, expensive
- **Solvo.TOS:** Modern, cloud-based, growing
- **Tideworks:** Strong in North America
- **Cosmos:** Popular in Asia

---

## ✅ Next Steps (Immediate)

1. **Validate Market Demand**
   - Interview 10-15 terminal operators
   - Understand pain points with existing TOS
   - Validate pricing assumptions

2. **Build Proof of Concept**
   - Extend EDIBox with basic vessel planning
   - Demo berth allocation + yard visualization
   - Prepare pitch deck

3. **Secure Funding**
   - Seed round: $500k - $1M
   - Pilot partnerships: $100k - $200k (subsidized deployment)

4. **Hire Core Team**
   - Product Manager (maritime expert)
   - Lead Backend Engineer
   - Lead Frontend Engineer
   - ML Engineer

5. **Set Up Infrastructure**
   - AWS account + K8s cluster
   - Development environments
   - CI/CD pipelines

---

## 🎉 Vision

**ANKR TOS** will be the **world's most intelligent, user-friendly, and cost-effective Terminal Operating System**, empowering ports worldwide to operate at peak efficiency with AI-driven optimization.

**Target:** Become the **#2 TOS provider globally** by 2030, handling **50+ million TEU annually** across **100+ terminals worldwide**.

---

**Document Version:** 1.0
**Last Updated:** 2026-02-16
**Next Review:** 2026-03-16

**Prepared by:** ANKR Labs
**Contact:** ankr-tos@ankrlabs.com

---

*"From BAPLIE Viewer to Global TOS Leader - The ANKR Journey"*
