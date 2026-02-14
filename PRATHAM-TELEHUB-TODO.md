# Pratham TeleHub - Implementation TODO

**Last Updated:** February 14, 2026
**Timeline:** 12 weeks (Feb 15 - May 8, 2026)
**Team:** 2 developers
**Launch Target:** May 1, 2026

---

## Progress Summary

- ✅ **Completed:** 15% (Architecture, MSG91 provider)
- 🔄 **In Progress:** 0%
- ⏳ **Pending:** 85%

---

## Phase 1: Foundation (Weeks 1-2)
**Dates:** Feb 15-28, 2026
**Goal:** Multi-provider calling works

### 1.1 Project Setup
- [x] Create package structure at `ankr-labs-nx/packages/ankr-telehub/`
- [x] Initialize package.json with dependencies
- [x] Setup TypeScript configuration
- [ ] Setup ESLint + Prettier
- [ ] Create README.md with setup instructions
- [ ] Setup environment variables template (.env.example)
- [ ] Configure Docker Compose for local dev

### 1.2 Database Setup
- [x] Design Prisma schema (Tenant, Extension, CallQueue, Call, Message, Campaign, IVRFlow, Recording, CallAnalytics)
- [ ] Setup PostgreSQL database
- [ ] Run Prisma migrations
- [ ] Seed database with test data
  - [ ] Create "pratham" tenant
  - [ ] Create sample extensions (101-110)
  - [ ] Create sample call queue
  - [ ] Create sample IVR flow
- [ ] Setup database backups

### 1.3 Provider Implementation
- [x] Create provider abstraction layer (`base.ts`)
- [x] Implement MSG91 provider (makeCall, sendSMS, sendWhatsApp, healthCheck)
- [ ] **Implement Twilio provider**
  - [ ] makeCall()
  - [ ] sendSMS()
  - [ ] sendWhatsApp()
  - [ ] getCallStatus()
  - [ ] hangupCall()
  - [ ] healthCheck()
- [ ] **Implement Plivo provider**
  - [ ] makeCall()
  - [ ] sendSMS()
  - [ ] getCallStatus()
  - [ ] hangupCall()
  - [ ] healthCheck()
- [ ] **Test all providers**
  - [ ] MSG91 test call
  - [ ] Twilio test call
  - [ ] Plivo test call
  - [ ] Compare call quality

### 1.4 Provider Router
- [ ] Create ProviderRouter class
- [ ] Implement weighted routing (MSG91: 80%, Kaleyra: 15%, Twilio: 5%)
- [ ] Implement failover logic
- [ ] Implement health check (every 5 minutes)
- [ ] Add retry logic (max 2 retries per provider, exponential backoff)
- [ ] Track provider metrics (success rate, latency, cost)

### 1.5 API Server Setup
- [ ] Create Fastify server
- [ ] Setup CORS middleware
- [ ] Setup JWT authentication
- [ ] Setup multi-tenant middleware (X-Tenant-ID header)
- [ ] Setup error handling
- [ ] Setup request logging
- [ ] Setup rate limiting
- [ ] Create health check endpoint (`/health`)
- [ ] Create Swagger documentation (`/docs`)

**Deliverable:** Can make calls via MSG91/Twilio/Plivo with automatic failover

---

## Phase 2: Campaign System (Weeks 3-4)
**Dates:** Mar 1-14, 2026
**Goal:** Can schedule bulk campaigns

### 2.1 Campaign API
- [ ] Create campaign routes (POST, GET, PATCH, DELETE)
- [ ] POST `/api/v1/campaigns/:id/start` - Start campaign
- [ ] POST `/api/v1/campaigns/:id/pause` - Pause campaign
- [ ] POST `/api/v1/campaigns/:id/resume` - Resume campaign
- [ ] Implement campaign validation
- [ ] Add campaign permissions (admin/agent/viewer)

### 2.2 Redis Job Queue
- [ ] Setup Redis connection
- [ ] Setup BullMQ
- [ ] Create campaign job processor
- [ ] Create call job processor
- [ ] Create SMS job processor
- [ ] Create WhatsApp job processor
- [ ] Add job retry logic (max 3 retries, dead letter queue)
- [ ] Add job monitoring

### 2.3 Campaign Scheduler
- [ ] Create cron job handler (check every minute)
- [ ] Start campaigns at scheduled time
- [ ] Handle timezone conversions
- [ ] Prevent duplicate starts
- [ ] Send notifications (campaign started/completed/failed)

### 2.4 Bulk Sending
- [ ] Implement batch processing (default batch size: 100)
- [ ] Implement throttling (default: 100 calls/min)
- [ ] Implement progress tracking
- [ ] Handle errors gracefully
- [ ] Retry failed calls

### 2.5 SMS & WhatsApp Integration
- [ ] Implement SMS sending (single + bulk)
- [ ] Implement WhatsApp sending (templates, parameters, media)
- [ ] Handle delivery reports (webhooks)
- [ ] Add unsubscribe handling (opt-out list)

**Deliverable:** Can send to 10,000 recipients via voice/SMS/WhatsApp

---

## Phase 3: IVR Builder (Weeks 5-6)
**Dates:** Mar 15-28, 2026
**Goal:** Visual IVR flow designer works

### 3.1 IVR Flow Engine
- [ ] Create IVR flow interpreter
- [ ] Implement node types (Play, Gather, Record, Dial, Forward, Queue, Hangup, Condition)
- [ ] Add TTS support (Google TTS API, Amazon Polly backup)
- [ ] Add audio recording (upload to S3)
- [ ] Add DTMF handling (single/multi-digit, timeout, invalid input)

### 3.2 Visual Flow Designer (React)
- [ ] Create React Flow canvas
- [ ] Create node palette (drag-and-drop)
- [ ] Implement node types UI
- [ ] Implement edge connections
- [ ] Add validation (entry node, orphaned nodes, infinite loops)
- [ ] Add flow testing (simulate + real call)
- [ ] Save/load flows to database
- [ ] Export/import as JSON

### 3.3 IVR Templates
- [ ] Create common templates (greeting, survey, appointment reminder, payment reminder, lead capture)
- [ ] Add template marketplace
- [ ] Add multi-language support (Hindi, Tamil, Bengali)

**Deliverable:** Can create and test IVR flows with 5+ nodes

---

## Phase 4: PBX Features (Weeks 7-8)
**Dates:** Mar 29 - Apr 11, 2026
**Goal:** Full PBX functionality for 30-person team

### 4.1 Extension Management
- [ ] Create extension routes (POST, GET, PATCH, DELETE)
- [ ] Implement extension types (user, queue, ivr, voicemail)
- [ ] Add extension features (forward, voicemail, call recording, DND)
- [ ] Add extension status (active, busy, offline, DND)

### 4.2 Call Queue Implementation
- [ ] Create call queue routes
- [ ] Implement queue strategies (round-robin, random, longest-idle, skills-based)
- [ ] Add queue features (max wait time, max queue size, overflow, priority)
- [ ] Add wait experience (hold music, position announcements, callback)
- [ ] Track queue metrics (avg wait time, abandon rate, service level)

### 4.3 Agent Routing
- [ ] Implement agent availability tracking
- [ ] Implement routing logic
- [ ] Add agent features (accept/reject calls, set status, view stats)
- [ ] Add supervisor features (monitor, whisper, barge)

### 4.4 Call Transfer
- [ ] Implement blind transfer
- [ ] Implement attended transfer
- [ ] Add transfer validation
- [ ] Track transfer metrics

### 4.5 Voicemail System
- [ ] Implement voicemail recording
- [ ] Add voicemail inbox
- [ ] Add voicemail transcription (Google Speech-to-Text)
- [ ] Add custom greetings

### 4.6 Call Recording
- [ ] Implement call recording (all calls / on-demand)
- [ ] Add recording management
- [ ] Add recording retention (auto-delete after 90 days)
- [ ] Add recording transcription

**Deliverable:** 30-person team can use extensions, queues, and voicemail

---

## Phase 5: WhatsApp & Rich Media (Week 9)
**Dates:** Apr 12-18, 2026
**Goal:** Rich WhatsApp messaging

### 5.1 WhatsApp Business API
- [ ] Setup WhatsApp Business Account
- [ ] Verify business
- [ ] Create WhatsApp API credentials
- [ ] Integrate with MSG91/Twilio WhatsApp API
- [ ] Handle incoming messages (webhooks)

### 5.2 Template Management
- [ ] Create template UI (list, create, edit, delete, submit for approval)
- [ ] Implement template types (text, buttons, media, location)
- [ ] Add template parameters
- [ ] Track template usage

### 5.3 Media Upload
- [ ] Implement image upload (< 5MB)
- [ ] Implement document upload (PDF, DOCX, XLSX, < 100MB)
- [ ] Implement video upload (< 16MB)
- [ ] Add media library

### 5.4 Interactive Messages
- [ ] Implement button messages (quick reply, call-to-action, up to 3 buttons)
- [ ] Implement list messages (section headers, up to 10 items)
- [ ] Handle button/list responses

### 5.5 WhatsApp Chatbot
- [ ] Create chatbot builder (visual flow designer)
- [ ] Implement chatbot nodes
- [ ] Add AI integration (optional: OpenAI GPT-4)
- [ ] Track chatbot metrics

**Deliverable:** WhatsApp templates, media, and chatbots work

---

## Phase 6: White-Label & Multi-Tenant (Week 10)
**Dates:** Apr 19-25, 2026
**Goal:** Fully white-labeled for resale

### 6.1 Tenant Isolation
- [ ] Implement tenant context middleware
- [ ] Add tenant filtering (automatically filter queries by tenantId)
- [ ] Add tenant creation (admin can create tenant)
- [ ] Add tenant settings (timezone, currency, default provider, feature flags)

### 6.2 Custom Branding
- [ ] Create branding settings UI (upload logo, set colors, set font)
- [ ] Implement branding API
- [ ] Apply branding to dashboard
- [ ] Apply branding to emails
- [ ] Apply branding to SMS/WhatsApp (where allowed)

### 6.3 Custom Domain
- [ ] Add custom domain setup (CNAME record, verification)
- [ ] Setup SSL certificates (Let's Encrypt, auto-renew)
- [ ] Route by domain
- [ ] Handle fallback (subdomain if domain not found)

### 6.4 Provider Credential Management
- [ ] Create provider settings UI
- [ ] Implement credential encryption (AWS KMS)
- [ ] Add credential validation
- [ ] Allow provider selection

### 6.5 Per-Tenant Analytics
- [ ] Create tenant analytics dashboard
- [ ] Add date range filter
- [ ] Add export (CSV, PDF, email)
- [ ] Add scheduled reports (daily, weekly, monthly)

**Deliverable:** Can create new tenants with custom branding and domains

---

## Phase 7: Analytics & Dashboard (Weeks 11-12)
**Dates:** Apr 26 - May 8, 2026
**Goal:** Production-ready platform

### 7.1 Admin Dashboard (React)
- [ ] Create dashboard layout (sidebar, header, main content, responsive)
- [ ] Create dashboard pages (overview, campaigns, calls, messages, IVR flows, extensions, call queues, analytics, settings)
- [ ] Add authentication (login, JWT tokens, refresh tokens, logout)
- [ ] Add role-based access (admin, agent, viewer)

### 7.2 Real-Time Analytics
- [ ] Implement WebSocket connection
- [ ] Stream real-time events (call started/answered/ended, message sent/delivered, campaign progress)
- [ ] Update UI in real-time
- [ ] Add notifications (toast, browser, sound)

### 7.3 Cost Tracking
- [ ] Track costs per call/message
- [ ] Create cost dashboard (total cost by day/week/month, by provider, by campaign, by extension)
- [ ] Add budget alerts (50%, 80%, 100%)
- [ ] Generate invoices (monthly, PDF, email)

### 7.4 Campaign Reports
- [ ] Create campaign report (delivery rate, answer rate, avg duration, cost per recipient)
- [ ] Add charts (delivery over time, status breakdown, cost breakdown, hourly distribution)
- [ ] Add filters (by campaign, date range, provider, status)
- [ ] Add comparison (compare campaigns, time periods)

### 7.5 Export & Sharing
- [ ] Implement CSV export (calls, messages, campaigns, analytics)
- [ ] Implement PDF export (campaign report, analytics report, invoice)
- [ ] Add email sharing
- [ ] Add API export

**Deliverable:** Full-featured dashboard with real-time analytics

---

## Testing & Quality Assurance

### Unit Tests (Target: 80% coverage)
- [ ] Provider tests (MSG91, Twilio, Plivo, router)
- [ ] IVR engine tests (node execution, flow validation, DTMF)
- [ ] Campaign tests (creation, job processing, throttling)
- [ ] API tests (all endpoints, auth, multi-tenant filtering)

### Integration Tests
- [ ] End-to-end call flow
- [ ] End-to-end SMS flow
- [ ] End-to-end WhatsApp flow
- [ ] Multi-tenant isolation
- [ ] Provider failover

### Load Tests
- [ ] Campaign load test (10,000 recipients, 100 calls/min)
- [ ] API load test (1,000 req/sec)
- [ ] Database load test (1M+ calls)

### Security Tests
- [ ] Authentication bypass attempts
- [ ] SQL injection attempts
- [ ] Cross-tenant access attempts
- [ ] API rate limit tests
- [ ] Credential encryption verification

---

## Deployment & DevOps

### Infrastructure Setup
- [ ] Setup production database (PostgreSQL with backups, replication, connection pooling)
- [ ] Setup Redis (persistence, max memory)
- [ ] Setup S3/R2 bucket (CORS, lifecycle rules)
- [ ] Setup domain & SSL

### CI/CD Pipeline
- [ ] Setup GitHub Actions (run tests on PR, linter, build Docker image)
- [ ] Setup staging environment (auto-deploy on merge to `develop`)
- [ ] Setup production deployment (manual approval, zero-downtime, automatic rollback)

### Monitoring & Alerts
- [ ] Setup application monitoring (Sentry, New Relic/DataDog, UptimeRobot)
- [ ] Setup infrastructure monitoring (server metrics, database metrics, Redis metrics)
- [ ] Setup alerts (error rate > 5%, response time > 1s, database connections > 80%, disk usage > 80%, uptime < 99.5%)

### Documentation
- [ ] API documentation (Swagger)
- [ ] User guide (getting started, campaign creation, IVR builder, WhatsApp templates)
- [ ] Admin guide (tenant setup, provider configuration, troubleshooting)
- [ ] Developer guide (local setup, architecture overview, contributing)

---

## Launch Checklist

### Pre-Launch (Week 12, Day 1-3)
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Performance acceptable (< 200ms API)
- [ ] Security audit complete
- [ ] Documentation complete
- [ ] Monitoring setup
- [ ] Backup/restore tested
- [ ] Rollback plan ready

### Launch Day (Week 12, Day 4)
- [ ] Deploy to production
- [ ] Verify all services running
- [ ] Create Pratham tenant
- [ ] Configure Pratham providers
- [ ] Import Pratham students
- [ ] Create test campaign
- [ ] Send test calls/SMS
- [ ] Monitor for errors
- [ ] Notify team of launch

### Post-Launch (Week 12, Day 5-7)
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] Monitor costs
- [ ] Collect user feedback
- [ ] Fix critical bugs
- [ ] Optimize slow queries
- [ ] Update documentation

---

## Success Metrics

### Week 4 (After Phase 2)
- [ ] Campaign system works
- [ ] Can send to 1,000 recipients
- [ ] SMS/WhatsApp delivery > 95%

### Week 6 (After Phase 3)
- [ ] IVR builder works
- [ ] Can create flow with 5+ nodes
- [ ] Test calls work correctly

### Week 8 (After Phase 4)
- [ ] PBX features work
- [ ] Extensions route correctly
- [ ] Call queue distributes evenly

### Week 12 (Launch)
- [ ] All features complete
- [ ] Can handle 10,000 students/day
- [ ] Cost < ₹3L/month
- [ ] Uptime > 99%
- [ ] Pratham using daily

---

## Future Roadmap (Post-Launch)

### Month 3-6 (Jun-Aug 2026)
- [ ] AI agent integration (TTS for AI teachers, STT for student responses, NLP)
- [ ] Mobile app (agent softphone, teacher dashboard, push notifications)
- [ ] Advanced analytics (student engagement scoring, predictive dropout detection, A/B testing)

### Month 6-12 (Sep 2026 - Jan 2027)
- [ ] Multi-language support (Hindi, Tamil, Telugu, Bengali IVR flows and templates)
- [ ] Integrations (LMS: Moodle/Canvas, CRM: Salesforce/Zoho, payment gateway)
- [ ] White-label marketplace (self-service tenant creation, template marketplace, plugin system)

---

## Resource Allocation

| Resource | Allocation |
|----------|------------|
| Backend Developer | 1 full-time (12 weeks) |
| Full-Stack Developer | 1 full-time (12 weeks) |
| DevOps Support | 1 part-time (2 weeks total) |
| QA Testing | 1 part-time (4 weeks total) |

---

## Budget Breakdown

| Item | Cost |
|------|------|
| Development (2 devs × 12 weeks × ₹50k/week) | ₹12,00,000 |
| Infrastructure (3 months AWS/DigitalOcean) | ₹45,000 |
| Provider testing credits (MSG91, Twilio, Plivo) | ₹25,000 |
| Contingency (10%) | ₹1,30,000 |
| **Total** | **₹14,00,000** |

---

## Next Actions (This Week)

1. ✅ Approve architecture and TODO
2. ⏳ Allocate 2 developers starting Feb 15
3. ⏳ Setup infrastructure accounts (AWS, DigitalOcean, Redis Cloud)
4. ⏳ Create project in GitHub
5. ⏳ Setup project management (Linear/Jira)
6. ⏳ Kick-off meeting with team

---

**Last Updated:** February 14, 2026
**Next Review:** February 21, 2026
**Owner:** ANKR Labs
**PM:** [To be assigned]
**Team:** [To be assigned]
**Stakeholders:** Pratham Education Foundation
