# Kinara - Technical TODO

> Master task list for building the Kinara platform

---

## Phase 1: Foundation (Weeks 1-4)

### 1.1 Project Setup
- [ ] Initialize monorepo with pnpm workspaces
- [ ] Setup TypeScript configuration
- [ ] Configure ESLint + Prettier
- [ ] Setup Git hooks (husky + lint-staged)
- [ ] Create CI/CD pipeline (GitHub Actions)
- [ ] Setup development environment (Docker Compose)

### 1.2 Database Design
- [ ] Design PostgreSQL schema for users, devices, tenants
- [ ] Setup TimescaleDB for time-series data
- [ ] Create migration system (Prisma or Drizzle)
- [ ] Design data retention policies
- [ ] Implement multi-tenant isolation

### 1.3 Core API Server
- [ ] Setup Fastify server with TypeScript
- [ ] Implement authentication (JWT + API keys)
- [ ] Create tenant management endpoints
- [ ] Build device registration flow
- [ ] Setup request validation (Zod)
- [ ] Implement rate limiting
- [ ] Add request logging and tracing

### 1.4 Data Ingestion Pipeline
- [ ] Design reading ingestion endpoint
- [ ] Implement batch ingestion (1000+ readings)
- [ ] Add data validation and quality scoring
- [ ] Setup async processing queue (BullMQ)
- [ ] Create data normalization layer

---

## Phase 2: Sensor SDK (Weeks 5-8)

### 2.1 SDK Architecture
- [ ] Design plugin-based sensor architecture
- [ ] Define sensor interface/contract
- [ ] Create sensor registry system
- [ ] Implement hot-swap capability

### 2.2 BLE Sensor Support
- [ ] Create BLE abstraction layer
- [ ] Implement MAX30205 temperature sensor driver
- [ ] Implement MAX30102 PPG sensor driver
- [ ] Add generic BLE characteristic reader
- [ ] Build connection management (reconnect, timeout)

### 2.3 Third-Party Integrations
- [ ] Apple HealthKit connector
- [ ] Google Health Connect connector
- [ ] Oura Ring API integration
- [ ] Fitbit API integration
- [ ] Generic webhook receiver

### 2.4 Mobile SDK (React Native)
- [ ] Create @kinara/react-native-sdk package
- [ ] Implement BLE scanning and pairing
- [ ] Build sensor data streaming
- [ ] Add offline data buffering
- [ ] Create sync manager

### 2.5 Embedded SDK (C/Zephyr)
- [ ] Create kinara-embedded-sdk
- [ ] Implement sensor drivers
- [ ] Build BLE GATT services
- [ ] Add edge processing hooks
- [ ] Optimize for power consumption

---

## Phase 3: ML Models (Weeks 9-12)

### 3.1 Data Pipeline
- [ ] Create training data schema
- [ ] Build synthetic data generator
- [ ] Implement data labeling tools
- [ ] Setup feature engineering pipeline

### 3.2 Hot Flash Prediction Model
- [ ] Research existing literature/models
- [ ] Design model architecture (LSTM or 1D-CNN)
- [ ] Create training pipeline
- [ ] Train initial model on synthetic data
- [ ] Implement model evaluation metrics
- [ ] Export to ONNX format

### 3.3 Sleep Quality Model
- [ ] Design sleep stage classifier
- [ ] Create training dataset
- [ ] Train and validate model
- [ ] Export to ONNX

### 3.4 Pattern Detection
- [ ] Implement trigger correlation algorithm
- [ ] Build anomaly detection
- [ ] Create personalization layer

### 3.5 Edge ML
- [ ] Convert models to TensorFlow Lite
- [ ] Optimize for nRF52840 (if applicable)
- [ ] Benchmark inference latency
- [ ] Implement on-device prediction

### 3.6 ML Serving
- [ ] Setup ONNX Runtime server
- [ ] Create prediction API endpoints
- [ ] Implement model versioning
- [ ] Add A/B testing capability

---

## Phase 4: Analytics & Insights (Weeks 13-16)

### 4.1 Aggregation Engine
- [ ] Build time-series aggregations
- [ ] Implement rolling statistics
- [ ] Create comparison (week-over-week, etc.)

### 4.2 Insights API
- [ ] Design insights data model
- [ ] Implement pattern insights endpoint
- [ ] Build trigger analysis
- [ ] Create sleep correlation insights
- [ ] Add recommendation engine

### 4.3 Reports
- [ ] Design report templates
- [ ] Implement PDF generation
- [ ] Create doctor-shareable format
- [ ] Build export functionality

### 4.4 Dashboards
- [ ] Create tenant admin dashboard
- [ ] Build analytics visualization
- [ ] Implement real-time monitoring
- [ ] Add alerting configuration

---

## Phase 5: Hardware Reference (Weeks 13-20, Parallel)

### 5.1 Basic Temperature Band
- [ ] Finalize component selection
- [ ] Create schematic (KiCad)
- [ ] Design PCB layout
- [ ] Order prototype PCBs
- [ ] Assemble prototypes (5 units)
- [ ] Write firmware
- [ ] Test and iterate

### 5.2 Multi-Sensor Wearable
- [ ] Design schematic with PPG + temp + IMU
- [ ] PCB design
- [ ] Prototype assembly
- [ ] Firmware development
- [ ] Sensor fusion algorithm

### 5.3 Enclosure Design
- [ ] 3D model wristband enclosure
- [ ] Print prototypes
- [ ] Test comfort and fit
- [ ] Iterate design

---

## Phase 6: White-Label Components (Weeks 17-20)

### 6.1 UI Component Library
- [ ] Create @kinara/ui package
- [ ] Build symptom tracker component
- [ ] Create temperature chart
- [ ] Design insight cards
- [ ] Build device pairing flow

### 6.2 Sample Application
- [ ] Create reference React Native app
- [ ] Implement full user flow
- [ ] Add theming/customization
- [ ] Document customization options

### 6.3 Content Module
- [ ] Structure content database
- [ ] Create initial article set (20)
- [ ] Build content API
- [ ] Implement search

---

## Phase 7: Testing & Documentation (Ongoing)

### 7.1 Testing
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests for APIs
- [ ] End-to-end tests
- [ ] Load testing (1000+ concurrent users)
- [ ] Security audit

### 7.2 Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] SDK documentation
- [ ] Integration guides
- [ ] Deployment documentation
- [ ] Video tutorials

---

## Phase 8: Launch Prep (Weeks 21-24)

### 8.1 Infrastructure
- [ ] Setup production environment
- [ ] Configure monitoring (Prometheus/Grafana)
- [ ] Setup alerting
- [ ] Implement backup strategy
- [ ] Security hardening

### 8.2 Compliance
- [ ] Data privacy policy
- [ ] DPDP Act compliance checklist
- [ ] Terms of service
- [ ] API usage agreement

### 8.3 Pilot Program
- [ ] Identify 3-5 pilot customers
- [ ] Onboarding documentation
- [ ] Support process
- [ ] Feedback collection system

---

## Backlog (Post-MVP)

### Future Sensors
- [ ] GSR/EDA sensor support
- [ ] Thermal camera integration (FLIR Lepton)
- [ ] Continuous glucose monitor integration
- [ ] Blood pressure monitor integration
- [ ] Smart scale integration

### Future Features
- [ ] Ayurveda Prakriti assessment
- [ ] Nutrition recommendations
- [ ] Meal planning module
- [ ] Guided meditation/yoga content
- [ ] Community/peer support
- [ ] Telemedicine integration
- [ ] Pharmacy/supplement marketplace

### Future Integrations
- [ ] EMR/EHR integration (FHIR)
- [ ] Insurance claim integration
- [ ] Smart home (AC/fan control)
- [ ] WhatsApp bot
- [ ] Voice assistant (Alexa/Google)

---

## Sprint Planning Template

### Sprint [N]: [Start Date] - [End Date]

**Goal:** [One-line sprint goal]

**Tasks:**
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

**Deliverables:**
- Deliverable 1
- Deliverable 2

**Blockers:**
- None

---

## Done ✅

*Move completed items here with date*

- [x] Project inception and planning (Jan 2025)

---

## Notes

### Key Decisions
1. **Database**: TimescaleDB over InfluxDB - better SQL compatibility
2. **ML Runtime**: ONNX over TFLite for server - better Python integration
3. **Mobile SDK**: React Native over Flutter - larger talent pool
4. **Monorepo**: pnpm workspaces - simpler than Nx/Turborepo for our scale

### Technical Debt Register
| Item | Impact | Priority | Notes |
|------|--------|----------|-------|
| - | - | - | - |

### Learning Resources
- [TimescaleDB Tutorials](https://docs.timescale.com/tutorials/)
- [BLE with React Native](https://github.com/dotintent/react-native-ble-plx)
- [ONNX Runtime](https://onnxruntime.ai/docs/)
- [Zephyr RTOS](https://docs.zephyrproject.org/)
