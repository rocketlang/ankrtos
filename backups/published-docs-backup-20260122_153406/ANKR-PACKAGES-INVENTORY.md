# @ankr Packages Inventory

> **Total Packages**: 251
> **Date**: 18 January 2026
> **Registry**: http://localhost:4873 (Verdaccio)

## Package Distribution

| Location | Count |
|----------|-------|
| `/packages` (top-level) | ~170 |
| `/packages/dodd/*` (DODD ERP) | 24 |
| `/packages/ankr-docchain/*` | 5 |
| `/packages/odoo-evolved/*` | 6 |
| `/packages/sunosunao/*` | 3 |
| `/packages/bani/*` | 2 |
| `/libs/*` (domain modules) | 42 |
| **TOTAL** | **251+** |

These packages are the building blocks used by:
- **VibeCoder** - Code generation
- **Tasher** - Autonomous task execution
- **RocketLang** - Natural language to app composition

---

## Package Categories

| Category | Count | Description |
|----------|-------|-------------|
| AI/ML | 18 | LLM routing, embeddings, RAG, memory |
| Auth/Identity | 8 | OAuth, IAM, OTP, government ID |
| Compliance | 12 | GST, ITR, TDS, MCA, compliance tools |
| Banking/Finance | 8 | UPI, BBPS, calculators, accounting |
| CRM | 5 | Leads, contacts, pipeline |
| ERP | 18 | Full ERP suite modules |
| Logistics/TMS | 12 | Fleet, GPS, drivers, ULIP |
| Communication | 5 | WhatsApp, SMS, chat |
| Voice AI | 6 | STT, TTS, voice engine |
| Code Generation | 8 | VibeCoder, scaffolding, templates |
| Agents/Orchestration | 6 | Tasher, swarm, executor |
| RocketLang | 2 | DSL parser & composer |
| Memory/Context | 6 | EON, RAG, context engine |
| Monitoring | 3 | Pulse, alerts, audit |
| Security | 2 | Guardrails, security |
| Document | 5 | DMS, OCR, invoice generator |
| UI/Widgets | 8 | Flow canvas, themes, studio |
| Infrastructure | 8 | Deploy, sandbox, MCP, publish |
| DODD ERP | 3 | Enhanced ERP modules |
| Saathi | 3 | AI assistant modules |
| Government | 4 | Aadhaar, DigiLocker, schemes, ULIP |
| Utilities | 10+ | i18n, states, entity, QR, etc. |

---

## 1. AI/ML Packages (18)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/ai-router` | 2.0.0 | Multi-provider LLM routing with failover |
| `@ankr/ai-sdk` | 1.0.0 | Unified AI SDK |
| `@ankr/ai-plugins` | 1.0.0 | AI plugin system |
| `@ankr/ai-translate` | 1.0.0 | Multi-language translation |
| `@ankr/brain` | 1.0.0 | AI reasoning engine |
| `@ankr/embeddings` | 1.0.0 | Vector embeddings (pgvector) |
| `@ankr/eon` | 3.2.0 | Episodic + Semantic + Procedural memory |
| `@ankr/eon-rag` | 1.0.0 | RAG integration for EON |
| `@ankr/rag` | 1.0.0 | Retrieval-Augmented Generation |
| `@ankr/intelligence` | 1.0.0 | Intelligence layer |
| `@ankr/intelligence-stack` | 1.0.0 | Full AI stack |
| `@ankr/intent` | 1.0.0 | Intent classification |
| `@ankr/learning` | 1.0.0 | Machine learning utilities |
| `@ankr/context-engine` | 1.0.0 | Context management |
| `@ankr/guardrails` | 1.0.0 | AI safety guardrails |
| `@ankr/judge` | 1.0.0 | LLM-as-judge evaluation |
| `@ankr/guru` | 1.0.0 | Knowledge assistant |
| `@ankr/document-ai` | 1.0.0 | Document understanding AI |

---

## 2. Auth/Identity Packages (8)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/oauth` | 2.0.0 | OAuth 2.0 (9 providers: Google, GitHub, etc.) |
| `@ankr/iam` | 1.0.0 | RBAC, permissions, roles |
| `@ankr/auth-gateway` | 1.0.0 | Centralized auth gateway |
| `@ankr/otp-auth` | 1.0.0 | OTP-based authentication |
| `@ankr/user-keys` | 1.0.0 | API key management |
| `@ankr/gov-aadhaar` | 1.1.0 | Aadhaar verification & eKYC |
| `@ankr/gov-digilocker` | 1.0.0 | DigiLocker integration |
| `@ankr/erp-auth` | 1.0.0 | ERP authentication module |

---

## 3. Compliance Packages (12)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/compliance-core` | 1.0.0 | Core compliance utilities |
| `@ankr/compliance-gst` | 1.1.0 | GST returns (GSTR-1, 3B, 9) |
| `@ankr/compliance-itr` | 1.1.0 | Income Tax returns |
| `@ankr/compliance-tds` | 1.0.0 | TDS management |
| `@ankr/compliance-mca` | 1.0.0 | MCA/ROC filings |
| `@ankr/compliance-bridge` | 1.0.0 | Multi-compliance bridge |
| `@ankr/compliance-calendar` | 1.0.0 | Compliance due dates |
| `@ankr/compliance-tools` | 1.0.0 | Compliance utilities |
| `@ankr/gst-utils` | 1.0.0 | GST validation & calculation |
| `@ankr/hsn-codes` | 1.0.0 | HSN code lookup |
| `@ankr/tds` | 1.0.0 | TDS calculation |
| `@ankr/complymitra` | 1.0.0 | ComplyMitra integration |

---

## 4. Banking/Finance Packages (8)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/banking-upi` | 1.0.0 | UPI payments (collect, pay, QR) |
| `@ankr/banking-bbps` | 1.0.0 | Bharat Bill Payment System |
| `@ankr/banking-accounts` | 1.0.0 | Bank account management |
| `@ankr/banking-calculators` | 1.0.0 | EMI, SIP, loan calculators |
| `@ankr/erp-accounting` | 1.0.0 | Accounting (ledgers, journal) |
| `@ankr/erp-ap` | 1.0.0 | Accounts Payable |
| `@ankr/erp-ar` | 1.0.0 | Accounts Receivable |
| `@ankr/currency` | 1.0.0 | Multi-currency support |
| `@ankr/fiscal-year` | 1.0.0 | Indian fiscal year utilities |

---

## 5. CRM Packages (5)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/crm-core` | 1.0.0 | CRM core (leads, contacts, deals) |
| `@ankr/crm-graphql` | 1.0.0 | CRM GraphQL API |
| `@ankr/crm-prisma` | 1.0.0 | CRM database schema |
| `@ankr/crm-ui` | 1.0.0 | CRM UI components |
| `@ankr/lead-scraper` | 1.0.0 | Lead scraping utilities |

---

## 6. ERP Packages (18)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/erp` | 1.0.0 | Core ERP module |
| `@ankr/erp-accounting` | 1.0.0 | Accounting & ledgers |
| `@ankr/erp-ap` | 1.0.0 | Accounts Payable |
| `@ankr/erp-ar` | 1.0.0 | Accounts Receivable |
| `@ankr/erp-auth` | 1.0.0 | ERP authentication |
| `@ankr/erp-dashboard` | 1.0.0 | ERP dashboards |
| `@ankr/erp-forms` | 1.0.0 | Dynamic forms |
| `@ankr/erp-gst` | 1.0.0 | GST integration |
| `@ankr/erp-inventory` | 1.0.0 | Inventory management |
| `@ankr/erp-prisma` | 1.0.0 | ERP database schema |
| `@ankr/erp-procurement` | 1.0.0 | Purchase orders |
| `@ankr/erp-projects` | 1.0.0 | Project management |
| `@ankr/erp-receiving` | 1.0.0 | Goods receiving |
| `@ankr/erp-reports` | 1.0.0 | Reporting engine |
| `@ankr/erp-sales` | 1.0.0 | Sales orders |
| `@ankr/erp-shipping` | 1.0.0 | Shipping management |
| `@ankr/erp-ui` | 1.0.0 | ERP UI components |
| `@ankr/erp-warehouse` | 1.0.0 | Warehouse management |

---

## 7. Logistics/TMS Packages (12)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/tms` | 1.0.0 | Transport Management System |
| `@ankr/gps-server` | 1.0.0 | GPS tracking server |
| `@ankr/ocean-tracker` | 1.0.0 | Container/vessel tracking |
| `@ankr/fleet-widgets` | 1.0.0 | Fleet UI widgets |
| `@ankr/driver-widgets` | 1.0.0 | Driver app widgets |
| `@ankr/driverland` | 1.0.0 | Driver management |
| `@ankr/nav` | 1.0.0 | Navigation/routing |
| `@ankr/gov-ulip` | 1.0.0 | ULIP (logistics) integration |
| `@ankr/ulip-wizard` | 1.0.0 | ULIP setup wizard |
| `@ankr/sms-gps` | 1.0.0 | SMS-based GPS tracking |
| `@ankr/wowtruck-gps-standalone` | 1.0.0 | WowTruck GPS |
| `@ankr/wowtruck-mobile-app` | 1.0.0 | Driver mobile app |

---

## 8. Communication Packages (5)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/messaging` | 1.0.0 | Multi-channel messaging |
| `@ankr/messaging-free` | 1.0.0 | Free messaging tier |
| `@ankr/chat-widget` | 1.0.0 | Embeddable chat widget |
| `@ankr/wa-scraper` | 1.0.0 | WhatsApp utilities |
| `@ankr/inbox` | 1.0.0 | Unified inbox |

---

## 9. Voice AI Packages (6)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/voice` | 1.0.0 | Voice processing core |
| `@ankr/voice-ai` | 1.0.0 | Voice AI integration |
| `@ankr/voice-engine` | 1.0.0 | Voice engine |
| `@ankr/bani` | 1.0.0 | BANI voice server |
| `@ankr/bani-app` | 1.0.0 | BANI application |
| `@ankr/sunosunao` | 1.0.0 | Hindi voice AI |

---

## 10. Code Generation Packages (8)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/vibecoding-tools` | 2.0.2 | 41 code generation tools |
| `@ankr/vibecoder` | 1.0.0 | VibeCoder core |
| `@ankr/codegen` | 1.0.0 | Code generation utilities |
| `@ankr/backend-generator` | 1.0.0 | Backend scaffolding |
| `@ankr/frontend-generator` | 1.0.0 | Frontend scaffolding |
| `@ankr/templates` | 1.0.0 | Project templates |
| `@ankr/create-ankr` | 1.0.0 | `npm create ankr` CLI |
| `@ankr/omega-coder` | 1.0.0 | Omega AI coder |

---

## 11. Agents/Orchestration Packages (6)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/tasher` | 1.0.0 | Manus-style autonomous executor |
| `@ankr/vibetasher` | 1.0.0 | VibeTasher variant |
| `@ankr/agents` | 1.0.0 | Agent framework |
| `@ankr/orchestrator` | 1.0.0 | Multi-agent orchestration |
| `@ankr/executor` | 1.0.0 | Task execution engine |
| `@ankr/swarm` | 1.0.0 | Agent swarm coordination |

---

## 12. RocketLang Packages (2)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/rocketlang` | 1.0.0 | Indic DSL parser & normalizer |
| `@ankr/rocketlang-composer` | 1.0.0 | Natural language to app composer |

---

## 13. Memory/Context Packages (6)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/eon` | 3.2.0 | 3-layer memory system |
| `@ankr/eon-rag` | 1.0.0 | EON RAG integration |
| `@ankr/rag` | 1.0.0 | Retrieval-Augmented Generation |
| `@ankr/context-engine` | 1.0.0 | Context management |
| `@ankr/package-memory` | 1.0.0 | Package usage memory |
| `@ankr/universal-memory` | 1.0.0 | Universal memory layer |
| `@ankr/postmemory` | 1.0.0 | Post-conversation memory |

---

## 14. Monitoring/Observability Packages (3)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/pulse` | 1.0.0 | Service monitoring & health |
| `@ankr/alerts` | 1.0.0 | Alert management |
| `@ankr/audit-trail` | 1.0.0 | Audit logging |

---

## 15. Security Packages (2)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/security` | 1.0.0 | WAF, encryption, rate limiting |
| `@ankr/guardrails` | 1.0.0 | AI safety guardrails |

---

## 16. Document Packages (5)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/dms` | 1.0.0 | Document Management System |
| `@ankr/docchain` | 1.0.0 | Document blockchain |
| `@ankr/document-ai` | 1.0.0 | Document AI (extraction, classification) |
| `@ankr/ocr` | 1.0.0 | OCR processing |
| `@ankr/invoice-generator` | 1.0.0 | Invoice PDF generation |

---

## 17. UI/Widget Packages (8)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/widgets` | 1.0.0 | Reusable UI widgets |
| `@ankr/flow-canvas` | 1.0.0 | Visual flow builder |
| `@ankr/omega-themes` | 1.0.0 | Theme system |
| `@ankr/studio` | 1.0.0 | Visual editor |
| `@ankr/omega-shell` | 1.0.0 | Shell UI |
| `@ankr/wowtruck-theme` | 1.0.0 | WowTruck theme |
| `@ankr/saathi-ui` | 1.0.0 | Saathi UI components |
| `@ankr/erp-ui` | 1.0.0 | ERP UI components |

---

## 18. Infrastructure Packages (8)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/deploy` | 1.0.0 | Deployment utilities |
| `@ankr/sandbox2` | 1.0.0 | Docker sandbox environment |
| `@ankr/sandbox` | 1.0.0 | Sandbox (legacy) |
| `@ankr/sandbox-tester` | 1.0.0 | Sandbox testing |
| `@ankr/mcp-tools` | 1.0.0 | MCP tool server |
| `@ankr/publish` | 1.1.0 | Document publishing |
| `@ankr/wire` | 1.0.0 | Service wiring |
| `@ankr/forge` | 1.0.0 | Build toolchain |

---

## 19. Government Integration Packages (4)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/gov-aadhaar` | 1.1.0 | Aadhaar verification & eKYC |
| `@ankr/gov-digilocker` | 1.0.0 | DigiLocker document fetch |
| `@ankr/gov-schemes` | 1.0.0 | Government scheme eligibility |
| `@ankr/gov-ulip` | 1.0.0 | Unified Logistics Interface |

---

## 20. DODD ERP Suite (3)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/dodd` | 1.0.0 | DODD ERP core |
| `@ankr/dodd-core` | 1.0.0 | DODD core utilities |
| `@ankr/dodd-account` | 1.0.0 | DODD accounting |

---

## 21. Saathi Assistant (3)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/saathi-core` | 1.0.0 | Saathi AI assistant core |
| `@ankr/saathi-modules` | 1.0.0 | Saathi modules |
| `@ankr/saathi-ui` | 1.0.0 | Saathi UI components |

---

## 22. Utility Packages (10+)

| Package | Version | Purpose |
|---------|---------|---------|
| `@ankr/core` | 1.0.0 | Core utilities |
| `@ankr/entity` | 1.0.0 | Base entity pattern |
| `@ankr/i18n` | 1.0.0 | Internationalization |
| `@ankr/indian-states` | 1.0.0 | Indian states/districts |
| `@ankr/qr` | 1.0.0 | QR code generation |
| `@ankr/sdk` | 1.0.0 | ANKR SDK |
| `@ankr/domain` | 1.0.0 | Domain utilities |
| `@ankr/test` | 1.0.0 | Testing utilities |
| `@ankr/one` | 1.0.0 | Unified entry point |
| `@ankr/xchg` | 1.0.0 | Data exchange |

---

## Package Usage by System

### VibeCoder Uses

```typescript
// Code generation
import { generateComponent } from '@ankr/vibecoding-tools';
import { templates } from '@ankr/templates';
import { validate } from '@ankr/security';

// Domain-specific
import { generateGSTForm } from '@ankr/compliance-gst';
import { generateShipmentUI } from '@ankr/tms';
import { generateLeadForm } from '@ankr/crm-core';
```

### Tasher Uses

```typescript
// Orchestration
import { TaskDecomposer } from '@ankr/tasher';
import { runInSandbox } from '@ankr/sandbox2';
import { remember, recall } from '@ankr/eon';

// Agents
import { BrowserAgent } from '@ankr/tasher';
import { executeTool } from '@ankr/vibecoding-tools';
import { deploy } from '@ankr/deploy';
```

### RocketLang Uses

```typescript
// Composition
import { compose } from '@ankr/rocketlang-composer';
import { classifyIntent } from '@ankr/intent';
import { findPackages } from '@ankr/package-memory';

// All @ankr packages for wiring
import * as gst from '@ankr/compliance-gst';
import * as upi from '@ankr/banking-upi';
import * as crm from '@ankr/crm-core';
import * as tms from '@ankr/tms';
```

---

## Installation

```bash
# From local Verdaccio
npm install @ankr/package-name --registry http://localhost:4873

# Or add to .npmrc
echo "@ankr:registry=http://localhost:4873" >> .npmrc
npm install @ankr/package-name
```

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Packages** | 189 |
| **AI/ML Packages** | 18 |
| **Compliance Packages** | 12 |
| **ERP Packages** | 18 |
| **Logistics Packages** | 12 |
| **Government Packages** | 4 |
| **Banking Packages** | 8 |
| **CRM Packages** | 5 |
| **Voice AI Packages** | 6 |
| **Code Gen Packages** | 8 |
| **Agent Packages** | 6 |

---

*This inventory enables VibeCoder, Tasher, and RocketLang to compose full-stack Indian business applications from natural language.*

*Last Updated: 18 January 2026*
