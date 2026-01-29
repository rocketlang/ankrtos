---
title: "ankrICD - ICD & CFS Management System"
description: "World-class Inland Container Depot and Container Freight Station management platform with 15 domain engines, 3D Digital Twin, and AI-powered operations"
category: "Product Documentation"
tags: ["icd", "cfs", "container", "yard", "rail", "customs", "billing", "logistics", "digital-twin", "3d", "hotspot", "erp", "crm", "bonded-warehouse"]
date: "2026-01-29"
author: "ANKR Engineering"
featured: true
---

# ankrICD - ICD & CFS Management System

> World-class Inland Container Depot and Container Freight Station management with Rail, Road, Waterfront, Yard, Equipment, Billing, Customs, Analytics, IoT, and AI.

## Quick Stats

| Metric | Value |
|--------|-------|
| Package | `@ankr/dodd-icd` |
| LOC | 27,000+ |
| Domain Engines | 15 |
| Event Types | 170+ |
| Prisma Models | 55+ |
| GraphQL Operations | 188 (97Q + 80M + 11S) |
| Unit Tests | 194 |
| Dashboard Pages | 6 (Next.js 15) |
| Mobile Modules | 3 (Expo SDK 52) |
| Completed Phases | 10 of 23 |
| Total Tasks | 467 |

---

## Documentation

| Document | Description |
|----------|-------------|
| [Project Report](./ANKR-ICD-PROJECT-REPORT.md) | Complete architecture, tech stack, engines, API, dashboard, mobile |
| [Master TODO](./ANKR-ICD-TODO.md) | 467 tasks across 23 phases with gap analysis vs ankrWMS |

---

## 15 Domain Engines

1. **Facility Manager** — ICD/CFS config, zones, blocks, multi-tenant
2. **Container Engine** — Full lifecycle, ISO 6346, holds, movement history
3. **Yard Engine** — Block-bay-row-tier placement, utilization, reefer plugs
4. **Gate Engine** — Gate-in/out workflow, weighment, document verification
5. **Rail Terminal Engine** — Rake/wagon management, CONCOR reporting
6. **Road Transport Engine** — Trip management, GPS, freight calculation
7. **Waterfront Engine** — Vessel/voyage, berth allocation, discharge/load plans
8. **Equipment Engine** — Fleet (RTG, reach stacker, forklift), maintenance
9. **Billing Engine** — Tariff master, invoices, payments, revenue analytics
10. **Customs Engine** — BOE, shipping bills, examination, ICEGATE
11. **Analytics Engine** — Terminal KPIs, performance scorecard, trends
12. **Operations Engine** — Stuffing, destuffing, LCL/FCL, cross-dock
13. **Documentation Engine** — B/L, D/O, EDI, cargo manifests
14. **Hardware Manager** — RFID, OCR, weighbridge, CCTV, barriers
15. **IoT Manager** — Reefer monitoring, GPS, sensors, real-time feeds

---

## Roadmap (Phases 7–23)

### HIGH Priority
- **Phase 7** — 3D Visualization & Digital Twin (Three.js, heat maps, capacity simulation)
- **Phase 8** — Hotspot & Congestion Management (real-time detection, traffic control)
- **Phase 9** — Advanced Yard Management (dock scheduling, stacking optimization)
- **Phase 12** — Custom Bond & Bonded Warehouse (ICEGATE, bond register)
- **Phase 17** — E-Way Bill, E-Invoice & GST (NIC API, GSTR returns)

### MEDIUM Priority
- **Phase 10** — ERP Integration (Tally, SAP, ANKR ERP)
- **Phase 11** — CRM Integration (customer portal, SLA, 3PL billing)
- **Phase 13** — Advanced Inspections & QC (survey, customs exam, SOLAS VGM)
- **Phase 14** — Labor Management & Cost Allocation
- **Phase 15** — Advanced Equipment & MHE (telematics, safety, charging)
- **Phase 16** — Advanced EDI (COPARN, BAPLIE, CODECO, X12, EDIFACT)
- **Phase 18** — AI/ML (yard optimization, demand forecast, anomaly detection)
- **Phase 21–23** — RFID, Cycle Counting, Advanced Reporting

### LOW Priority
- **Phase 19** — Voice-Directed Operations
- **Phase 20** — Drone Operations

---

## Technology Stack

| Layer | Tech |
|-------|------|
| Core Library | TypeScript, tsup (ESM + CJS + DTS) |
| API Server | Fastify 5, Mercurius GraphQL, graphql-ws |
| Database | PostgreSQL, Prisma ORM, pgcrypto, PostGIS |
| Auth | JWT (HMAC-SHA256), RBAC (5 roles) |
| Dashboard | Next.js 15, React 19, Tailwind CSS 4, Apollo Client |
| Mobile | Expo SDK 52, React Native 0.76, Apollo Client |
| Events | ICDEventBus (170+ typed events) |

---

*Part of ANKR Universe — Jai Guruji, Guru Kripa*
