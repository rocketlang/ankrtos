# PRATHAM TELEHUB - Unified Production Roadmap & TODO
## Complete Task List for All 12 Requirements

**Project:** AI-Powered Telecalling & Sales Management Platform for Pratham Education Foundation
**Status:** Requirements Finalized → Ready for Execution
**Timeline:** 18-24 weeks to production (4.5-6 months)
**Budget:** ₹30.69 lakhs development + ₹8.94 lakhs/year infrastructure
**Expected ROI:** 5.6 months payback period
**Version:** 2.0 (Unified)

---

## 📊 Project Overview

### What We Built (POC - Complete ✅)
- ✅ Basic telecaller dashboard
- ✅ Manager command center (basic)
- ✅ WebSocket live updates
- ✅ PostgreSQL database with sample data
- ✅ Professional showcase (HTML + PDF)
- ✅ Demo running on localhost

### Coverage of 12 Requirements
- ✅ **Fully Complete:** #1 (partial), #2 (partial), #3 (partial), #5 (partial)
- ❌ **Need to Build:** #4, #6, #7, #8, #9, #10, #11, #12
- **Overall Completion:** 40% → Target: 100%

### What We Need to Build (Production)
**Foundation & Core (Phase 1):**
- 🎯 #1: Complete Lead Ingestion Manager (CSV + API + Laravel sync)
- 🎯 #2: Complete Distribution Engine (rules + routing)
- 🎯 #3: Upgrade Smart Queue (categorization + filters)
- 🎯 #5: Upgrade Disposition System (comprehensive codes)

**PBX Integration (Phase 2):**
- 🎯 #4: Build Active Call HUD (Exotel/Twilio integration) - CRITICAL

**Advanced Features (Phase 3):**
- 🎯 #6: Campaign Automation Builder (WhatsApp + Email) - HIGH ROI
- 🎯 #7: Visit Scheduler (geolocation + centers)
- 🎯 #9: Sale/Closure Form (mobile-ready)

**AI Features (Phase 4):**
- 🎯 #10: Customer 360 History (EON integration)
- 🎯 #12: Sales Empowerment Panel (AI-powered)

**Dashboards & Mobile (Phase 5):**
- 🎯 #8: Mobile Visits View (React Native/PWA)
- 🎯 #11: Command Center Dashboard (real-time analytics)

---

## 🗓️ PHASE 1: Foundation & Core Features (Weeks 1-5)

**Goal:** Complete all partial features + integrate with Laravel
**Deliverable:** Telecallers can manage leads and make basic calls

---

### Week 1-2: Project Setup & Architecture

#### 1.1 Project Initialization
- [ ] Create project in ANKR monorepo: `apps/pratham-telehub-backend/`
- [ ] Create frontend app: `apps/pratham-telehub-frontend/`
- [ ] Create mobile app stub: `apps/pratham-telehub-mobile/`
- [ ] Create shared package: `packages/ankr-telehub/`
- [ ] Set up Nx workspace configuration
- [ ] Configure TypeScript for all apps
- [ ] Set up ESLint and Prettier
- [ ] Initialize Git Flow (main, develop, feature/*)

#### 1.2 Environment Setup
- [ ] Create `.env.development`, `.env.staging`, `.env.production`
- [ ] Configure ANKR service ports:
  - Backend: 4055
  - Frontend: 3055
  - WebSocket: 4056
- [ ] Add to `ankr-ctl` service management
- [ ] Set up PM2 process configuration
- [ ] Configure logging (Winston + Pino)
- [ ] Set up error tracking (Sentry)

#### 1.3 Database Architecture
- [ ] Create schema in ankr_eon database: `CREATE SCHEMA telehub;`
- [ ] Define core tables (see unified schema in report):
  - [ ] `telehub.leads` (with status, source, language, priority)
  - [ ] `telehub.distribution_rules` (#2)
  - [ ] `telehub.calls` (#4)
  - [ ] `telehub.call_dispositions` (#5)
  - [ ] `telehub.call_analytics` (#4)
  - [ ] `telehub.campaigns` (#6)
  - [ ] `telehub.campaign_sequences` (#6)
  - [ ] `telehub.templates` (#6)
  - [ ] `telehub.centers` (#7)
  - [ ] `telehub.visits` (#7, #8)
  - [ ] `telehub.closures` (#9)
  - [ ] `telehub.telecaller_performance` (#11)
  - [ ] `telehub.interaction_history` (#10)
  - [ ] `telehub.email_tracking` (#10)
- [ ] Set up indexes for performance:
  ```sql
  CREATE INDEX idx_leads_status ON telehub.leads(status);
  CREATE INDEX idx_leads_assigned ON telehub.leads(assigned_to);
  CREATE INDEX idx_calls_telecaller_date ON telehub.calls(telecaller_id, started_at);
  CREATE INDEX idx_visits_agent_date ON telehub.visits(field_agent_id, scheduled_at);
  ```
- [ ] Configure TimescaleDB for time-series data (call_analytics)
- [ ] Create views for common queries:
  ```sql
  CREATE VIEW telehub.daily_performance AS
  SELECT telecaller_id, DATE(started_at) as date, COUNT(*) as calls
  FROM telehub.calls
  GROUP BY telecaller_id, DATE(started_at);
  ```
- [ ] Set up automated backups (daily snapshots)

#### 1.4 Laravel CRM Integration Planning
- [ ] Document Laravel CRM endpoints needed:
  - `GET /api/pratham/leads` - Fetch leads (with filters)
  - `GET /api/pratham/leads/{id}` - Single lead details
  - `POST /api/pratham/calls` - Log call results
  - `PUT /api/pratham/leads/{id}` - Update lead status
  - `GET /api/pratham/users` - Fetch telecallers/agents
  - `POST /api/pratham/visits` - Log visit appointments
  - `POST /api/pratham/closures` - Log sales
- [ ] Define TeleHub API structure:
  - GraphQL schema (queries, mutations, subscriptions)
  - REST endpoints (for webhooks, external integrations)
- [ ] Create API documentation (OpenAPI/Swagger)
- [ ] Set up API versioning strategy (v1, v2)
- [ ] Design sync strategy:
  - Option A: Scheduled sync (every 5 minutes via cron)
  - Option B: Webhook-based real-time sync
  - Option C: Database CDC (Debezium + Kafka)
  - **Decision:** [To be made with Laravel team]

**Deliverables:**
- ✅ Development environment running
- ✅ Database schema deployed and tested
- ✅ API contracts documented and approved
- ✅ Team onboarded and trained

---

### Week 3-5: Core Platform Development

#### 2.1 Backend Development (NestJS/Fastify)
- [ ] Set up NestJS framework:
  ```bash
  cd apps/pratham-telehub-backend
  nest new .
  ```
- [ ] Install dependencies:
  - Prisma ORM
  - GraphQL (Apollo Server)
  - Socket.io (WebSocket)
  - BullMQ (job queue)
  - Winston (logging)
- [ ] Implement Prisma schema (from database design)
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Create GraphQL schema (see report for full schema):
  ```graphql
  type Lead {
    id: ID!
    name: String!
    phone: String!
    status: LeadStatus!
    source: String
    priority: Priority!
    assignedTo: User
    calls: [Call!]!
    visits: [Visit!]!
  }

  type Query {
    leads(filter: LeadFilter): [Lead!]!
    myQueue: [Lead!]! # #3: Smart Queue
    myPerformance(period: DateRange): Performance! # #11
    teamStatus: TeamStatus! # #11
  }

  type Mutation {
    startCall(leadId: ID!): Call! # #4
    endCall(callId: ID!, disposition: DispositionInput!): Call! # #5
    scheduleVisit(input: VisitInput!): Visit! # #7
    createClosure(input: ClosureInput!): Closure! # #9
  }

  type Subscription {
    callStatusChanged: Call! # #4
    teamUpdated: TeamStatus! # #11
  }
  ```
- [ ] Implement REST endpoints for compatibility:
  - `POST /api/v1/calls/webhook` (Exotel)
  - `POST /api/v1/whatsapp/webhook` (WhatsApp)
  - `GET /api/v1/health` (health check)
- [ ] Set up WebSocket server (Socket.io):
  ```typescript
  // packages/ankr-telehub/src/server/websocket.ts
  io.on('connection', (socket) => {
    socket.on('join', (userId) => {
      socket.join(userId);
    });
  });
  ```
- [ ] Add request validation (Zod schemas)
- [ ] Implement error handling middleware
- [ ] Add request logging and tracing

#### 2.2 Authentication & Authorization
- [ ] Implement JWT-based authentication:
  ```typescript
  // packages/ankr-telehub/src/server/auth.ts
  @Post('login')
  async login(@Body() credentials) {
    const user = await this.authService.validateUser(credentials);
    return { access_token: this.generateJWT(user) };
  }
  ```
- [ ] Create login/logout endpoints
- [ ] Add role-based access control (RBAC):
  - **Admin:** Full access (all 12 features)
  - **Manager:** View all, manage team (#11, #2, #6)
  - **Telecaller:** Own data + assigned leads (#3, #4, #5, #7, #10, #12)
  - **Field Agent:** Mobile app only (#8, #9)
  - **Viewer:** Read-only analytics (#11)
- [ ] Implement refresh token mechanism (15 min access, 7 day refresh)
- [ ] Add session management (Redis-based)
- [ ] Set up password reset flow (email-based)
- [ ] Implement MFA (optional for admins - Google Authenticator)

#### 2.3 Laravel CRM Sync Service (#1)
- [ ] Build Laravel API client module:
  ```typescript
  // packages/ankr-telehub/src/server/laravel-sync.ts
  class LaravelSyncService {
    async syncLeads(): Promise<void> {
      const lastSyncTime = await this.getLastSyncTime();
      const leads = await this.laravelApi.getLeads({ updated_since: lastSyncTime });

      for (const laravelLead of leads) {
        await this.upsertLead({
          external_id: laravelLead.id,
          name: laravelLead.name,
          phone: laravelLead.phone,
          email: laravelLead.email,
          status: this.mapStatus(laravelLead.status),
          source: 'laravel_crm',
          synced_from: 'laravel_crm',
          metadata: laravelLead
        });
      }

      await this.updateLastSyncTime(new Date());
    }

    async pushCallResults(call: Call): Promise<void> {
      await this.laravelApi.post('/api/pratham/calls', {
        lead_id: call.lead.external_id,
        duration: call.duration_seconds,
        outcome: call.disposition.disposition_code,
        notes: call.disposition.notes,
        recording_url: call.recording_url
      });
    }
  }
  ```
- [ ] Set up scheduled sync (cron every 5 minutes):
  ```typescript
  @Cron('*/5 * * * *')
  async handleCron() {
    await this.laravelSyncService.syncLeads();
  }
  ```
- [ ] Add conflict resolution strategy:
  - If updated_at (TeleHub) > updated_at (Laravel) → TeleHub wins
  - Else → Laravel wins
- [ ] Implement webhook listeners for real-time updates (optional)
- [ ] Add sync status monitoring (#1 admin UI)
- [ ] Create admin dashboard for sync management

#### 2.4 Requirement #1: Lead Ingestion Manager
**User:** Admin

- [ ] **Backend:**
  - [ ] CSV parser service:
    ```typescript
    async importCSV(file: File): Promise<ImportResult> {
      const data = await parseCSV(file);
      const validated = await this.validateLeads(data);
      const duplicates = await this.detectDuplicates(validated);
      const inserted = await this.bulkInsert(validated);
      return { total: data.length, inserted: inserted.length, duplicates: duplicates.length };
    }
    ```
  - [ ] Landing page API poller (if applicable)
  - [ ] Source mapping configuration
  - [ ] Duplicate detection (by phone number)
  - [ ] Data validation rules (Zod schemas)
  - [ ] Bulk import queue (BullMQ)

- [ ] **Frontend:**
  - [ ] CSV upload dropzone (React Dropzone)
  - [ ] Field mapping interface (drag-and-drop)
  - [ ] Source configuration panel
  - [ ] Import history table
  - [ ] Error logs viewer
  - [ ] Preview before import (show first 10 rows)

- [ ] **Testing:**
  - [ ] Test with sample CSV (100 leads)
  - [ ] Test duplicate detection
  - [ ] Test error handling (invalid phone, missing fields)

**Effort:** 1 week

#### 2.5 Requirement #2: Distribution Engine
**User:** Admin

- [ ] **Backend:**
  - [ ] Rules engine:
    ```typescript
    async distributeLead(lead: Lead): Promise<User> {
      const rules = await this.getActiveRules(); // ordered by priority

      for (const rule of rules) {
        if (this.matchesConditions(lead, rule.conditions)) {
          return await this.assignByStrategy(lead, rule);
        }
      }

      // Fallback: round-robin
      return await this.roundRobinAssign(lead);
    }
    ```
  - [ ] Assignment strategies:
    - [ ] Round-robin (least assigned first)
    - [ ] Source-based (landing page → Agent A)
    - [ ] Language-based (Hindi → Agent B, English → Agent C)
    - [ ] Random
  - [ ] Agent group management
  - [ ] Load balancing (max leads per agent)
  - [ ] Auto-assign toggle (on/off)

- [ ] **Frontend:**
  - [ ] Rules builder UI (drag-and-drop priority)
  - [ ] Condition editor:
    ```
    IF source = "landing_page" AND language = "hindi"
    THEN assign to "Hindi Team" using "round_robin"
    ```
  - [ ] Agent group management
  - [ ] Distribution analytics dashboard (who got how many)

- [ ] **Testing:**
  - [ ] Test each assignment strategy
  - [ ] Test priority ordering
  - [ ] Test load balancing

**Effort:** 2 weeks

#### 2.6 Requirement #3: Smart Queue (Upgrade)
**User:** Telecaller

- [ ] **Backend:**
  - [ ] Categorization logic:
    - **Fresh:** Never called before
    - **Callback:** Explicitly requested callback
    - **Retry:** Called but not connected
  - [ ] Priority tagging:
    - **Hot:** Lead score > 80 OR marked as interested
    - **Warm:** Lead score 50-80 OR called once
    - **Cold:** Lead score < 50 OR called 3+ times
  - [ ] Advanced filters API:
    ```typescript
    async getSmartQueue(userId: string, filters: QueueFilters) {
      return await prisma.leads.findMany({
        where: {
          assigned_to: userId,
          status: { in: filters.categories }, // ['fresh', 'callback', 'retry']
          priority: { in: filters.priorities }, // ['hot', 'warm', 'cold']
          source: { in: filters.sources },
          created_at: { gte: filters.dateFrom, lte: filters.dateTo }
        },
        orderBy: [
          { priority: 'desc' }, // Hot first
          { created_at: 'asc' } // Oldest first
        ],
        include: {
          calls: { take: 3, orderBy: { started_at: 'desc' } } // Last 3 calls
        }
      });
    }
    ```

- [ ] **Frontend:**
  - [ ] Category tabs (Fresh, Callback, Retry)
  - [ ] Priority badges (🔥 Hot, 🌡️ Warm, ❄️ Cold)
  - [ ] Filter sidebar:
    - Source dropdown
    - Date range picker
    - Search by name/phone
  - [ ] Lead card with inline analytics:
    - Last call date
    - Number of attempts
    - Lead age (days since created)
    - Quick call button
  - [ ] Sort options (Priority, Age, Score)

- [ ] **Testing:**
  - [ ] Test categorization logic
  - [ ] Test priority calculation
  - [ ] Test filters

**Effort:** 1 week

#### 2.7 Requirement #5: Disposition System (Upgrade)
**User:** Telecaller

- [ ] **Backend:**
  - [ ] Comprehensive disposition codes:
    ```typescript
    const DISPOSITION_CODES = {
      // Connected
      CONNECTED_INTERESTED: { auto_action: 'schedule_visit', resched: null },
      CONNECTED_NOT_INTERESTED: { auto_action: 'nurture_campaign', resched: 2160 }, // 90 days
      CONNECTED_CALLBACK: { auto_action: 'reschedule', resched: 24 },
      CONNECTED_WRONG_NUMBER: { auto_action: 'mark_invalid', resched: null },
      CONNECTED_LANGUAGE_BARRIER: { auto_action: 'reassign', resched: null },

      // Not Connected
      NOT_CONNECTED_BUSY: { auto_action: 'retry', resched: 2 },
      NOT_CONNECTED_NO_ANSWER: { auto_action: 'retry', resched: 4 },
      NOT_CONNECTED_OUT_OF_SERVICE: { auto_action: 'mark_invalid', resched: null },
      NOT_CONNECTED_SWITCHED_OFF: { auto_action: 'retry', resched: 6 },

      // Special
      SPECIAL_DND: { auto_action: 'mark_dnd', resched: null },
      SPECIAL_ESCALATE: { auto_action: 'assign_manager', resched: null },
      SPECIAL_TECHNICAL_ISSUE: { auto_action: 'retry', resched: 1 }
    };
    ```
  - [ ] Sub-dispositions (Not Interested → Too Expensive, Already Has Solution, etc.)
  - [ ] Auto-reschedule service
  - [ ] Next action triggers (send email, add to campaign, etc.)
  - [ ] Mandatory field validation

- [ ] **Frontend:**
  - [ ] Large disposition buttons (grid layout)
  - [ ] Sub-disposition dropdown (conditional)
  - [ ] Auto-schedule calendar popup (for callbacks)
  - [ ] Notes textarea with:
    - Voice input (Web Speech API)
    - Auto-save (every 10 seconds)
    - Character limit (500)
  - [ ] Next action confirmation dialog
  - [ ] Keyboard shortcuts:
    - Ctrl+1: Interested
    - Ctrl+2: Not Interested
    - Ctrl+3: Callback
    - Ctrl+4: Wrong Number

- [ ] **Testing:**
  - [ ] Test all disposition codes
  - [ ] Test auto-reschedule logic
  - [ ] Test keyboard shortcuts

**Effort:** 1 week

#### 2.8 Frontend Migration to TypeScript
- [ ] Migrate POC React components to TypeScript:
  - [ ] Dashboard layout
  - [ ] Navigation
  - [ ] Common components (Button, Card, Table)
- [ ] Set up TanStack Query for data fetching:
  ```typescript
  const { data: leads } = useQuery({
    queryKey: ['smart-queue', filters],
    queryFn: () => api.getSmartQueue(filters)
  });
  ```
- [ ] Implement Zustand for state management:
  ```typescript
  const useStore = create((set) => ({
    currentCall: null,
    setCurrentCall: (call) => set({ currentCall: call })
  }));
  ```
- [ ] Add TypeScript types for all API responses
- [ ] Set up Apollo Client for GraphQL:
  ```typescript
  const client = new ApolloClient({
    uri: 'http://localhost:4055/graphql',
    cache: new InMemoryCache()
  });
  ```
- [ ] Migrate to Tailwind CSS + Shadcn/ui:
  - [ ] Install shadcn/ui: `npx shadcn-ui@latest init`
  - [ ] Add components: Button, Card, Table, Dialog, Dropdown
- [ ] Add loading states (Skeleton screens)
- [ ] Add error boundaries
- [ ] Implement optimistic updates (for call start/end)

**Deliverables:**
- ✅ Production backend running (port 4055)
- ✅ Authentication working (JWT)
- ✅ Laravel sync operational (scheduled)
- ✅ TypeScript frontend deployed (port 3055)
- ✅ #1, #2, #3, #5 features complete

---

## 🗓️ PHASE 2: PBX & Calling Integration (Weeks 6-8)

**Goal:** Build #4 Active Call HUD with Exotel integration
**Deliverable:** Telecallers can make calls with full HUD and AI assistance

---

### Week 6-7: Exotel/Twilio Integration

#### 3.1 PBX Provider Setup
- [ ] Choose provider:
  - **Primary:** Exotel (India-focused, ₹0.30/min)
  - **Backup:** Twilio (global, ₹0.35/min)
- [ ] Set up Exotel account:
  - [ ] Sign up at exotel.com
  - [ ] KYC verification (2-3 days)
  - [ ] Purchase virtual numbers (min 2)
  - [ ] Configure SIP trunks
- [ ] Test call quality:
  - [ ] Test on Jio, Airtel, Vodafone networks
  - [ ] Test audio quality (both directions)
  - [ ] Measure latency (< 300ms acceptable)
- [ ] Set up webhook endpoints:
  - `POST /api/v1/calls/webhook` (call events)
  - `POST /api/v1/recordings/webhook` (recording ready)

#### 3.2 Requirement #4: Active Call HUD
**User:** Telecaller
**Priority:** CRITICAL 🔥

- [ ] **Backend:**
  - [ ] Install Exotel SDK:
    ```bash
    npm install exotel
    ```
  - [ ] Call Engine service:
    ```typescript
    class CallEngine {
      async makeCall(telecallerId: string, leadId: string): Promise<Call> {
        const lead = await this.getLeadWithHistory(leadId);
        const telecaller = await this.getUser(telecallerId);

        // Initiate call via Exotel
        const exotelCall = await this.exotel.makeCall({
          from: telecaller.exotel_number || process.env.EXOTEL_DEFAULT_NUMBER,
          to: lead.phone,
          callerId: process.env.EXOTEL_CALLER_ID,
          record: true
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
          lead: await this.enrichLeadData(lead), // Include history
          script: await this.getScriptForLead(lead)
        });

        return call;
      }

      async handleExotelWebhook(event: ExotelEvent): Promise<void> {
        const call = await prisma.calls.findFirst({
          where: { exotel_sid: event.CallSid }
        });

        switch (event.Status) {
          case 'completed':
            await this.handleCallCompleted(call, event);
            break;
          case 'answered':
            await this.handleCallAnswered(call, event);
            break;
          case 'missed':
            await this.handleCallMissed(call, event);
            break;
        }

        // Emit real-time update
        this.wsServer.to(call.telecaller_id).emit('call:updated', call);
      }

      private async handleCallCompleted(call: Call, event: ExotelEvent) {
        await prisma.calls.update({
          where: { id: call.id },
          data: {
            status: 'completed',
            ended_at: new Date(),
            duration_seconds: event.Duration,
            recording_url: event.RecordingUrl
          }
        });

        // Queue AI analysis (transcription + sentiment)
        await this.queue.add('analyze-call', { callId: call.id });

        // Auto-download recording
        await this.downloadRecording(call.id, event.RecordingUrl);
      }
    }
    ```
  - [ ] Click-to-call endpoint: `POST /api/v1/calls/start`
  - [ ] Call controls endpoints:
    - `POST /api/v1/calls/{id}/mute`
    - `POST /api/v1/calls/{id}/hold`
    - `POST /api/v1/calls/{id}/transfer`
    - `POST /api/v1/calls/{id}/hangup`
  - [ ] Real-time call timer (WebSocket)
  - [ ] Recording download service (S3 upload)

- [ ] **Frontend:**
  - [ ] Active Call HUD component:
    ```typescript
    function ActiveCallHUD({ callId }: { callId: string }) {
      const { call, lead, script } = useCallContext(callId);
      const { sentiment, suggestions } = useAIAnalytics(callId);

      return (
        <div className="fixed inset-0 bg-black/90 z-50 p-6">
          <div className="grid grid-cols-3 gap-6 h-full">
            {/* Left: Customer Info */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-3xl font-bold">{lead.name}</h2>
              <p className="text-xl text-gray-400">{lead.phone}</p>

              <div className="mt-4 flex gap-2">
                <Badge variant={lead.priority}>{lead.priority}</Badge>
                <Badge>Source: {lead.source}</Badge>
                <Badge>Score: {lead.lead_score}/100</Badge>
              </div>

              <Separator className="my-4" />

              <h3 className="font-semibold mb-2">Demographics</h3>
              <p>Email: {lead.email}</p>
              <p>Language: {lead.language}</p>
              <p>Location: {lead.pincode}</p>

              <Separator className="my-4" />

              <h3 className="font-semibold mb-2">Previous Interactions</h3>
              <MiniTimeline interactions={lead.recent_interactions} />
            </div>

            {/* Center: Script & AI */}
            <div className="bg-gray-800 rounded-lg p-6 overflow-y-auto">
              <Tabs defaultValue="script">
                <TabsList>
                  <TabsTrigger value="script">Script</TabsTrigger>
                  <TabsTrigger value="ai">AI Suggestions</TabsTrigger>
                  <TabsTrigger value="objections">Objections</TabsTrigger>
                </TabsList>

                <TabsContent value="script">
                  <ScriptView script={script} />
                </TabsContent>

                <TabsContent value="ai">
                  <AISuggestions suggestions={suggestions} realtime />
                </TabsContent>

                <TabsContent value="objections">
                  <ObjectionHandlers />
                </TabsContent>
              </Tabs>
            </div>

            {/* Right: Call Controls */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-center mb-6">
                <CallTimer startedAt={call.started_at} className="text-4xl" />
                <Badge variant={call.status === 'in_progress' ? 'success' : 'default'}>
                  {call.status}
                </Badge>
              </div>

              <CallControls callId={callId} />

              <Separator className="my-6" />

              <h3 className="font-semibold mb-4">Live Sentiment</h3>
              <SentimentMeter sentiment={sentiment} animated />

              <Separator className="my-6" />

              <h3 className="font-semibold mb-4">Recording</h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span>Recording in progress</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    ```
  - [ ] Call controls component:
    ```typescript
    function CallControls({ callId }: { callId: string }) {
      const [isMuted, setIsMuted] = useState(false);
      const [isOnHold, setIsOnHold] = useState(false);

      return (
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant={isMuted ? 'destructive' : 'default'}
            onClick={() => {
              api.toggleMute(callId);
              setIsMuted(!isMuted);
            }}
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </Button>

          <Button
            variant={isOnHold ? 'destructive' : 'default'}
            onClick={() => {
              api.toggleHold(callId);
              setIsOnHold(!isOnHold);
            }}
          >
            {isOnHold ? 'Resume' : 'Hold'}
          </Button>

          <Button variant="outline">Transfer</Button>

          <Button variant="destructive" onClick={() => api.hangup(callId)}>
            End Call
          </Button>
        </div>
      );
    }
    ```
  - [ ] WebSocket screen pop (auto-open HUD when call connects)
  - [ ] Script viewer with highlighting
  - [ ] AI suggestions panel (live updates)
  - [ ] Call timer (MM:SS format)
  - [ ] Recording indicator (red dot)

- [ ] **Testing:**
  - [ ] Test call initiation (Exotel)
  - [ ] Test call controls (mute, hold, transfer)
  - [ ] Test WebSocket screen pop
  - [ ] Test recording download
  - [ ] Load test (10 concurrent calls)

**Effort:** 3 weeks
**Dependencies:**
- Exotel account setup (1 week lead time)
- Virtual number provisioning
- Webhook configuration

---

### Week 8: Call Recording & Auto-dialer

#### 3.3 Call Recording
- [ ] Set up recording storage (S3/MinIO):
  ```typescript
  async downloadRecording(callId: string, recordingUrl: string) {
    const audioBuffer = await fetch(recordingUrl).then(r => r.arrayBuffer());
    const s3Key = `recordings/${callId}.mp3`;

    await s3.upload({
      Bucket: process.env.S3_BUCKET,
      Key: s3Key,
      Body: audioBuffer,
      ContentType: 'audio/mpeg'
    });

    await prisma.calls.update({
      where: { id: callId },
      data: { recording_url: s3Key }
    });
  }
  ```
- [ ] Implement recording download from Exotel
- [ ] Add recording playback in UI (HTML5 audio player)
- [ ] Implement recording transcription (AssemblyAI):
  ```typescript
  async transcribeRecording(callId: string) {
    const call = await prisma.calls.findUnique({ where: { id: callId } });
    const recordingUrl = await this.getSignedUrl(call.recording_url);

    const transcript = await assemblyai.transcribe({
      audio_url: recordingUrl,
      language_code: 'hi', // Hindi + auto-detect
      speaker_labels: true
    });

    await prisma.calls.update({
      where: { id: callId },
      data: { transcript_id: transcript.id }
    });

    // Store in EON Memory for #10
    await eonService.storeMemory({
      id: transcript.id,
      type: 'call_transcript',
      content: transcript.text,
      metadata: { call_id: callId, lead_id: call.lead_id }
    });
  }
  ```
- [ ] Add recording search functionality (by transcript)
- [ ] Set up retention policies (delete after 90 days):
  ```typescript
  @Cron('0 2 * * *') // 2am daily
  async cleanupOldRecordings() {
    const cutoffDate = subDays(new Date(), 90);
    const oldRecordings = await prisma.calls.findMany({
      where: { created_at: { lt: cutoffDate } }
    });

    for (const call of oldRecordings) {
      await s3.deleteObject({ Bucket: process.env.S3_BUCKET, Key: call.recording_url });
      await prisma.calls.update({
        where: { id: call.id },
        data: { recording_url: null }
      });
    }
  }
  ```

#### 3.4 Auto-dialer (Progressive)
- [ ] Build auto-dialer queue:
  ```typescript
  class AutoDialer {
    async startDialing(telecallerId: string) {
      const queue = await this.getMyQueue(telecallerId);

      for (const lead of queue) {
        // Check if telecaller is available
        const isAvailable = await this.checkAvailability(telecallerId);
        if (!isAvailable) break;

        // Make call
        await this.callEngine.makeCall(telecallerId, lead.id);

        // Wait for call to complete before next
        await this.waitForCallEnd();
      }
    }

    private async waitForCallEnd(): Promise<void> {
      return new Promise((resolve) => {
        this.wsServer.once('call:ended', () => resolve());
      });
    }
  }
  ```
- [ ] Campaign-based dialing (#6 integration)
- [ ] Dialer controls (start, pause, stop)
- [ ] Skip lead functionality
- [ ] Dialer statistics (calls/hour, connection rate)

**Deliverables:**
- ✅ Click-to-call working (#4)
- ✅ Call recording functional
- ✅ Active Call HUD complete
- ✅ Auto-dialer operational

---

## 🗓️ PHASE 3: Advanced Features (Weeks 9-13)

**Goal:** Build automation & field operations (#6, #7, #9)
**Deliverable:** Complete campaign automation + visit management

---

### Week 9-11: Campaign Automation (#6)

#### 5.1 Requirement #6: Campaign Automation Builder
**User:** Admin/Marketing
**Priority:** CRITICAL (High ROI) 🔥

- [ ] **External Setup:**
  - [ ] Set up WhatsApp Business API:
    - [ ] Apply at facebook.com/business/whatsapp
    - [ ] Choose BSP (Business Solution Provider) - e.g., Gupshup, Twilio
    - [ ] Business verification (2-3 weeks)
    - [ ] Create message templates
    - [ ] Get templates approved by WhatsApp
  - [ ] Set up SMTP service:
    - [ ] Sign up for SendGrid or AWS SES
    - [ ] Verify domain (SPF, DKIM, DMARC records)
    - [ ] Configure sender authentication
    - [ ] Test email delivery

- [ ] **Backend:**
  - [ ] Install dependencies:
    ```bash
    npm install @sendgrid/mail whatsapp-business-api
    ```
  - [ ] Campaign Manager service:
    ```typescript
    class CampaignManager {
      async createCampaign(data: CampaignInput): Promise<Campaign> {
        // Create campaign
        const campaign = await prisma.campaigns.create({
          data: {
            name: data.name,
            description: data.description,
            type: data.type, // email, whatsapp, mixed
            target_segment: data.target_segment, // JSON filter
            active: true,
            start_date: data.start_date
          }
        });

        // Create sequences
        for (const seq of data.sequences) {
          await prisma.campaign_sequences.create({
            data: {
              campaign_id: campaign.id,
              sequence_order: seq.order,
              trigger_delay_hours: seq.delay, // T+0, T+24, T+48
              channel: seq.channel,
              template_id: seq.template_id
            }
          });
        }

        return campaign;
      }

      async executeCampaign(campaignId: string): Promise<void> {
        const campaign = await this.getCampaignWithSequences(campaignId);
        const leads = await this.getTargetLeads(campaign.target_segment);

        for (const lead of leads) {
          for (const sequence of campaign.sequences) {
            const sendAt = addHours(new Date(), sequence.trigger_delay_hours);

            await this.queue.add('send-campaign-message', {
              leadId: lead.id,
              sequenceId: sequence.id
            }, {
              delay: differenceInMilliseconds(sendAt, new Date())
            });
          }
        }
      }

      async sendWhatsApp(lead: Lead, template: Template): Promise<void> {
        const message = this.personalizeTemplate(template.body, lead);

        await this.whatsappApi.sendTemplateMessage({
          to: lead.phone,
          template: template.whatsapp_template_name,
          components: [
            { type: 'body', parameters: [{ type: 'text', text: message }] }
          ]
        });

        await this.trackActivity(lead.id, 'whatsapp_sent', template.id);
      }

      async sendEmail(lead: Lead, template: Template): Promise<void> {
        await sendgrid.send({
          to: lead.email,
          from: process.env.FROM_EMAIL,
          subject: this.personalizeTemplate(template.subject, lead),
          html: this.personalizeTemplate(template.body, lead),
          trackingSettings: {
            clickTracking: { enable: true },
            openTracking: { enable: true }
          }
        });

        await this.trackActivity(lead.id, 'email_sent', template.id);
      }

      private personalizeTemplate(text: string, lead: Lead): string {
        return text
          .replace(/\{\{first_name\}\}/g, lead.name.split(' ')[0])
          .replace(/\{\{full_name\}\}/g, lead.name)
          .replace(/\{\{phone\}\}/g, lead.phone)
          .replace(/\{\{center_name\}\}/g, lead.assigned_center?.name || 'Pratham Center');
      }
    }
    ```
  - [ ] Template management CRUD
  - [ ] Email tracking webhooks (SendGrid)
  - [ ] WhatsApp delivery status webhooks
  - [ ] Campaign analytics aggregation
  - [ ] A/B testing logic (send variant A to 50%, variant B to 50%)

- [ ] **Frontend:**
  - [ ] Campaign builder UI:
    ```typescript
    function CampaignBuilder() {
      const [sequences, setSequences] = useState<Sequence[]>([
        { order: 1, delay: 0, channel: 'whatsapp', template_id: null }
      ]);

      const addSequence = () => {
        setSequences([
          ...sequences,
          { order: sequences.length + 1, delay: 24, channel: 'email', template_id: null }
        ]);
      };

      return (
        <div className="campaign-builder">
          <Input label="Campaign Name" />
          <Textarea label="Description" />

          <h3>Target Audience</h3>
          <SegmentBuilder />

          <h3>Message Sequence</h3>
          <Timeline>
            {sequences.map((seq, i) => (
              <TimelineItem key={i} delay={seq.delay}>
                <Select
                  label="Channel"
                  options={['whatsapp', 'email']}
                  value={seq.channel}
                  onChange={(v) => updateSequence(i, 'channel', v)}
                />

                <TemplateSelector
                  channel={seq.channel}
                  value={seq.template_id}
                  onChange={(v) => updateSequence(i, 'template_id', v)}
                />

                {i > 0 && (
                  <Input
                    label="Send after (hours)"
                    type="number"
                    value={seq.delay}
                    onChange={(v) => updateSequence(i, 'delay', v)}
                  />
                )}
              </TimelineItem>
            ))}
          </Timeline>

          <Button onClick={addSequence}>+ Add Step</Button>
        </div>
      );
    }
    ```
  - [ ] Template editor (WYSIWYG for email, text for WhatsApp)
  - [ ] Personalization variable picker ({{first_name}}, {{phone}}, etc.)
  - [ ] Campaign analytics dashboard:
    - Messages sent
    - Open rate (email)
    - Click rate (email)
    - Read rate (WhatsApp)
    - Conversion rate
  - [ ] Campaign pause/resume controls

- [ ] **Testing:**
  - [ ] Test email sending (Gmail, Outlook, Yahoo)
  - [ ] Test WhatsApp sending (approved templates only)
  - [ ] Test personalization
  - [ ] Test scheduling (T+24, T+48)
  - [ ] Test A/B variants

**Effort:** 4 weeks
**Dependencies:**
- WhatsApp Business API approval (2-3 weeks)
- Template approval (3-5 days per template)

---

### Week 12-13: Visit Management (#7, #9)

#### 5.2 Requirement #7: Visit Scheduler
**User:** Telecaller

- [ ] **Backend:**
  - [ ] Centers management CRUD
  - [ ] Visit scheduler service:
    ```typescript
    class VisitScheduler {
      async findNearestCenters(pincode: string): Promise<Center[]> {
        const location = await this.geocodePincode(pincode);

        return await prisma.$queryRaw`
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
      }

      async getAvailableSlots(centerId: string, date: Date): Promise<TimeSlot[]> {
        const fieldAgents = await this.getAvailableAgents(centerId, date);
        const existingVisits = await this.getScheduledVisits(centerId, date);

        const slots: TimeSlot[] = [];
        const workingHours = [9, 10, 11, 12, 14, 15, 16, 17]; // 9am-6pm

        for (const hour of workingHours) {
          const slotTime = setHours(date, hour);
          const booked = existingVisits.filter(v => isSameHour(v.scheduled_at, slotTime)).length;

          if (booked < fieldAgents.length) {
            slots.push({
              time: slotTime,
              available: true,
              agents_available: fieldAgents.length - booked
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

        // Send confirmation
        await this.sendVisitConfirmation(visit);

        // Schedule reminders (T-24hrs, T-2hrs)
        await this.scheduleReminders(visit);

        return visit;
      }

      private async sendVisitConfirmation(visit: Visit) {
        const lead = await prisma.leads.findUnique({ where: { id: visit.lead_id } });
        const center = await prisma.centers.findUnique({ where: { id: visit.center_id } });

        // SMS
        await sms.send({
          to: lead.phone,
          message: `Your visit to ${center.name} is confirmed for ${format(visit.scheduled_at, 'dd MMM, h:mm a')}. Address: ${center.address}`
        });

        // Email
        if (lead.email) {
          await email.send({
            to: lead.email,
            subject: 'Visit Confirmation',
            template: 'visit-confirmation',
            data: { lead, center, visit }
          });
        }
      }
    }
    ```
  - [ ] Geocoding service (Google Maps API)
  - [ ] Calendar slot management
  - [ ] Conflict detection
  - [ ] Visit reminders (SMS + Email)

- [ ] **Frontend:**
  - [ ] Visit scheduler UI:
    ```typescript
    function VisitScheduler({ leadId }: { leadId: string }) {
      const lead = useLead(leadId);
      const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
      const [selectedDate, setSelectedDate] = useState<Date>(new Date());

      const { data: centers } = useQuery(['centers', lead.pincode], () =>
        api.findNearestCenters(lead.pincode)
      );

      const { data: slots } = useQuery(
        ['slots', selectedCenter?.id, selectedDate],
        () => api.getAvailableSlots(selectedCenter.id, selectedDate),
        { enabled: !!selectedCenter }
      );

      return (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3>Nearest Centers ({lead.pincode})</h3>
            <CenterList
              centers={centers}
              onSelect={setSelectedCenter}
              selected={selectedCenter}
            />

            <MapView
              centers={centers}
              selected={selectedCenter}
              customerLocation={lead.location}
            />
          </div>

          <div>
            <Calendar
              value={selectedDate}
              onChange={setSelectedDate}
              minDate={new Date()}
              maxDate={addDays(new Date(), 30)}
            />

            <h3>Available Slots</h3>
            <SlotGrid
              slots={slots}
              onSelect={(slot) => handleSchedule(selectedCenter, slot)}
            />
          </div>
        </div>
      );
    }
    ```
  - [ ] Center list with distance
  - [ ] Google Maps integration (map view)
  - [ ] Calendar picker (react-day-picker)
  - [ ] Slot grid (hourly slots)
  - [ ] Confirmation modal

- [ ] **Testing:**
  - [ ] Test geocoding (pincode → lat/long)
  - [ ] Test distance calculation
  - [ ] Test slot availability
  - [ ] Test SMS/Email confirmation

**Effort:** 3 weeks
**Dependencies:**
- Google Maps API key
- Center data (addresses, coordinates)

---

#### 5.3 Requirement #9: Sale/Closure Form
**User:** Field Agent (via mobile app #8)

- [ ] **Backend:**
  - [ ] Closure creation API:
    ```typescript
    async createClosure(data: ClosureInput): Promise<Closure> {
      const visit = await prisma.visits.findUnique({
        where: { id: data.visit_id },
        include: { lead: true }
      });

      // Upload proof
      const proofUrl = await this.uploadProof(data.proofFile);

      // Create closure
      const closure = await prisma.closures.create({
        data: {
          visit_id: data.visit_id,
          lead_id: visit.lead_id,
          product: data.product,
          price: data.price,
          discount: data.discount,
          final_amount: data.price - data.discount,
          proof_url: proofUrl,
          payment_status: data.payment_status
        }
      });

      // Update lead status
      await prisma.leads.update({
        where: { id: visit.lead_id },
        data: { status: 'closed_won' }
      });

      // Trigger automation
      await this.triggerClosureAutomation(closure.id);

      return closure;
    }

    private async triggerClosureAutomation(closureId: string) {
      const closure = await this.getClosureWithDetails(closureId);

      // Generate invoice (use ankr-publish!)
      const invoiceUrl = await this.generateInvoice(closure);
      await prisma.closures.update({
        where: { id: closureId },
        data: { invoice_generated: true, invoice_url: invoiceUrl }
      });

      // Send welcome email with invoice
      await email.send({
        to: closure.lead.email,
        subject: 'Welcome to Pratham Family!',
        template: 'welcome-closure',
        attachments: [{ filename: 'invoice.pdf', path: invoiceUrl }]
      });

      // Calculate commission
      await this.calculateCommission(closure);

      // Add to customer success campaign
      await campaignManager.addToCampaign(closure.lead_id, 'customer-success');
    }
    ```
  - [ ] Invoice generation (ankr-publish integration)
  - [ ] Commission calculation
  - [ ] Welcome email automation

- [ ] **Frontend (Mobile):**
  - [ ] Closure form component (see mobile app section in Phase 5)

**Effort:** 2 weeks (backend only, UI in Phase 5)
**Dependencies:**
- ankr-publish service
- Invoice template design

---

**Deliverables:**
- ✅ Campaign automation live (#6)
- ✅ Visit scheduler operational (#7)
- ✅ Sale/closure backend ready (#9)

---

## 🗓️ PHASE 4: AI Features (Weeks 14-17)

**Goal:** Build Customer 360 (#10) and Empowerment Panel (#12)
**Deliverable:** AI-powered intelligence for telecallers

---

### Week 14-16: Customer 360 & AI Integration

#### 4.1 Requirement #10: Customer 360 History
**User:** Telecaller
**Priority:** High 🔥

- [ ] **Backend:**
  - [ ] Integrate with EON Memory:
    ```typescript
    class Customer360Service {
      async getFullHistory(leadId: string): Promise<CustomerHistory> {
        const lead = await prisma.leads.findUnique({
          where: { id: leadId },
          include: {
            calls: {
              include: { disposition: true, analytics: true },
              orderBy: { started_at: 'desc' }
            },
            visits: {
              include: { center: true, field_agent: true, closure: true },
              orderBy: { scheduled_at: 'desc' }
            },
            interactions: { orderBy: { created_at: 'desc' } }
          }
        });

        // Fetch from EON Memory (call transcripts, insights)
        const eonMemory = await eonService.getMemory({
          filters: { metadata: { lead_id: leadId } }
        });

        // Fetch WhatsApp history
        const whatsappHistory = await this.getWhatsAppHistory(lead.phone);

        // Fetch email tracking
        const emailTracking = await prisma.email_tracking.findMany({
          where: { lead_id: leadId },
          orderBy: { sent_at: 'desc' }
        });

        // Build unified timeline
        const timeline = this.buildTimeline({
          calls: lead.calls,
          visits: lead.visits,
          whatsapp: whatsappHistory,
          emails: emailTracking,
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

      private buildTimeline(data: any): Interaction[] {
        const timeline: Interaction[] = [];

        // Add calls
        for (const call of data.calls) {
          timeline.push({
            type: 'call',
            timestamp: call.started_at,
            summary: `${call.duration_seconds}s call - ${call.disposition?.disposition_code}`,
            data: call
          });
        }

        // Add visits
        for (const visit of data.visits) {
          timeline.push({
            type: 'visit',
            timestamp: visit.scheduled_at,
            summary: `Visit to ${visit.center.name} - ${visit.status}`,
            data: visit
          });
        }

        // Add emails
        for (const email of data.emails) {
          timeline.push({
            type: 'email',
            timestamp: email.sent_at,
            summary: `Email ${email.opened_at ? 'opened' : 'sent'}`,
            data: email
          });
        }

        // Sort by timestamp (newest first)
        return timeline.sort((a, b) => b.timestamp - a.timestamp);
      }

      private async generateAISummary(timeline: Interaction[]): Promise<string> {
        const prompt = `
          Given this customer interaction history, provide a concise 3-sentence summary
          highlighting the customer's journey, interests, and current status:

          ${JSON.stringify(timeline.slice(0, 10))} // Last 10 interactions
        `;

        const response = await ankrAIProxy.chat({
          messages: [{ role: 'user', content: prompt }],
          model: 'claude-3-haiku' // Fast + cheap
        });

        return response.content;
      }

      private async generateInsights(leadId: string): Promise<Insight[]> {
        // Find similar customers (EON vector search)
        const similarCustomers = await eonService.findSimilar(leadId, { limit: 5 });

        // Analyze common objections
        const objections = await this.analyzeObjections(leadId);

        // Predict best time to call (ML model)
        const bestTime = await this.predictBestTime(leadId);

        return [
          { type: 'similar_customers', data: similarCustomers },
          { type: 'common_objections', data: objections },
          { type: 'best_time_to_call', data: bestTime }
        ];
      }
    }
    ```
  - [ ] Email tracking webhook handler (SendGrid):
    ```typescript
    @Post('/webhooks/sendgrid')
    async handleSendGridWebhook(@Body() events: SendGridEvent[]) {
      for (const event of events) {
        if (event.event === 'open') {
          await prisma.email_tracking.update({
            where: { tracking_id: event.sg_message_id },
            data: { opened_at: new Date(event.timestamp * 1000) }
          });
        } else if (event.event === 'click') {
          await prisma.email_tracking.update({
            where: { tracking_id: event.sg_message_id },
            data: { clicked_at: new Date(event.timestamp * 1000) }
          });
        }
      }
    }
    ```
  - [ ] WhatsApp history fetcher
  - [ ] Website visit tracking (optional - Mixpanel/Amplitude)

- [ ] **Frontend:**
  - [ ] Customer 360 view:
    ```typescript
    function Customer360({ leadId }: { leadId: string }) {
      const { data: history, isLoading } = useQuery(
        ['customer-360', leadId],
        () => api.getFullHistory(leadId)
      );

      if (isLoading) return <Skeleton />;

      return (
        <div className="customer-360 grid grid-cols-3 gap-6 p-6">
          {/* Left: Timeline (2 cols) */}
          <div className="col-span-2">
            <h2 className="text-2xl font-bold mb-4">Interaction Timeline</h2>

            <Timeline>
              {history.timeline.map((interaction, i) => (
                <TimelineItem key={i} timestamp={interaction.timestamp}>
                  <TimelineIcon type={interaction.type} />

                  <div className="ml-4">
                    <h4 className="font-semibold">{interaction.summary}</h4>

                    {interaction.type === 'call' && (
                      <CallDetails call={interaction.data}>
                        <AudioPlayer url={interaction.data.recording_url} />
                        <TranscriptView callId={interaction.data.id} />
                      </CallDetails>
                    )}

                    {interaction.type === 'email' && (
                      <EmailDetails email={interaction.data}>
                        <Badge>{interaction.data.opened_at ? 'Opened' : 'Sent'}</Badge>
                        {interaction.data.clicked_at && <Badge>Clicked</Badge>}
                      </EmailDetails>
                    )}

                    {interaction.type === 'visit' && (
                      <VisitDetails visit={interaction.data}>
                        <MapPreview location={interaction.data.center} />
                        {interaction.data.closure && <ClosureInfo closure={interaction.data.closure} />}
                      </VisitDetails>
                    )}
                  </div>
                </TimelineItem>
              ))}
            </Timeline>
          </div>

          {/* Right: Insights (1 col) */}
          <div className="col-span-1">
            <Card className="mb-4">
              <h3 className="font-semibold mb-2">AI Summary</h3>
              <p className="text-sm text-gray-600">{history.summary}</p>
            </Card>

            <Card className="mb-4">
              <h3 className="font-semibold mb-2">Similar Customers</h3>
              <SimilarCustomersList customers={history.insights.similar_customers} />
            </Card>

            <Card className="mb-4">
              <h3 className="font-semibold mb-2">Common Objections</h3>
              <ObjectionsList objections={history.insights.common_objections} />
            </Card>

            <Card>
              <h3 className="font-semibold mb-2">Best Time to Call</h3>
              <p>{history.insights.best_time_to_call}</p>
            </Card>
          </div>
        </div>
      );
    }
    ```
  - [ ] Timeline component with filters
  - [ ] Audio playback (HTML5 audio)
  - [ ] Transcript viewer
  - [ ] Email preview
  - [ ] Visit details with map

- [ ] **Testing:**
  - [ ] Test timeline building
  - [ ] Test AI summary generation
  - [ ] Test email tracking (open/click)
  - [ ] Test audio playback

**Effort:** 4 weeks
**Dependencies:**
- EON Memory integration
- Email tracking SDK (SendGrid webhooks)
- WhatsApp Business API webhooks

---

### Week 17: Empowerment Panel (#12)

#### 4.2 Requirement #12: Sales Empowerment Panel
**User:** Telecaller
**Priority:** High 🔥

- [ ] **Backend:**
  - [ ] Contextual help service:
    ```typescript
    class EmpowermentPanelService {
      async getContextualHelp(callId: string, query: string): Promise<ContextualHelp> {
        const call = await this.getCallWithContext(callId);

        // Search knowledge base (PageIndex)
        const kbResults = await pageIndex.search(query, {
          filters: { category: 'sales-scripts' },
          limit: 5
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
          query
        };

        const prompt = `
          You are a sales coach for Pratham Education Foundation.

          Context:
          - Customer: ${context.lead.name}
          - Current sentiment: ${context.currentSentiment}
          - Telecaller asked: "${query}"

          Provide a concise, actionable suggestion (2-3 sentences).
        `;

        const response = await ankrAIProxy.chat({
          messages: [
            { role: 'system', content: 'You are a helpful sales coach.' },
            { role: 'user', content: prompt }
          ],
          model: 'claude-3-sonnet'
        });

        return response.content;
      }

      async searchObjections(query: string): Promise<Objection[]> {
        return await prisma.objection_library.findMany({
          where: {
            OR: [
              { objection_text: { contains: query, mode: 'insensitive' } },
              { category: { contains: query, mode: 'insensitive' } }
            ]
          },
          take: 5
        });
      }
    }
    ```
  - [ ] Integrate with PageIndex (knowledge base search)
  - [ ] Objection library CRUD
  - [ ] Real-time AI suggestions (WebSocket)

- [ ] **Frontend:**
  - [ ] Empowerment panel component:
    ```typescript
    function EmpowermentPanel({ callId }: { callId: string }) {
      const [query, setQuery] = useState('');
      const [debouncedQuery] = useDebounce(query, 300);

      const { data: help } = useQuery(
        ['contextual-help', callId, debouncedQuery],
        () => api.getContextualHelp(callId, debouncedQuery),
        { enabled: debouncedQuery.length > 2 }
      );

      return (
        <div className="empowerment-panel fixed right-0 top-0 h-full w-96 bg-gray-900 text-white p-6 overflow-y-auto shadow-2xl z-40">
          <h2 className="text-xl font-bold mb-4">Sales Assistant</h2>

          {/* Quick Search */}
          <Input
            placeholder="Ask anything... (e.g., pricing, objections)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={<Search />}
            className="mb-4"
          />

          {/* AI Suggestion */}
          {help?.aiSuggestion && (
            <Card className="bg-blue-900 mb-4 p-4">
              <div className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-blue-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">AI Suggestion</h3>
                  <p className="text-sm">{help.aiSuggestion}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Knowledge Base Results */}
          {help?.knowledgeBase && help.knowledgeBase.length > 0 && (
            <Accordion type="single" collapsible defaultValue="kb">
              <AccordionItem value="kb">
                <AccordionTrigger>Scripts & FAQs ({help.knowledgeBase.length})</AccordionTrigger>
                <AccordionContent>
                  {help.knowledgeBase.map((item) => (
                    <KBItem key={item.id} item={item} />
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Objection Handlers */}
          {help?.objections && help.objections.length > 0 && (
            <Accordion type="single" collapsible defaultValue="objections">
              <AccordionItem value="objections">
                <AccordionTrigger>Objection Handlers ({help.objections.length})</AccordionTrigger>
                <AccordionContent>
                  {help.objections.map((obj) => (
                    <ObjectionCard key={obj.id} objection={obj} />
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Next Best Action */}
          {help?.nextBestAction && (
            <Card className="bg-green-900 p-4 mt-4">
              <h3 className="font-semibold mb-1">Next Best Action</h3>
              <p className="text-sm">{help.nextBestAction}</p>
            </Card>
          )}

          {/* Quick Links */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Quick Access</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" onClick={() => setQuery('pricing')}>Pricing</Button>
              <Button size="sm" onClick={() => setQuery('too expensive')}>Handle "Too Expensive"</Button>
              <Button size="sm" onClick={() => setQuery('competition')}>Competitors</Button>
              <Button size="sm" onClick={() => setQuery('benefits')}>Benefits</Button>
            </div>
          </div>
        </div>
      );
    }
    ```
  - [ ] Search input with autocomplete
  - [ ] AI suggestion card (with animation)
  - [ ] Knowledge base items (expandable)
  - [ ] Objection handlers (copy-to-clipboard)
  - [ ] Quick access buttons

- [ ] **Testing:**
  - [ ] Test PageIndex search
  - [ ] Test AI suggestions
  - [ ] Test real-time updates
  - [ ] Test keyboard shortcuts

**Effort:** 3 weeks
**Dependencies:**
- PageIndex integration
- Objection library content (create 20+ objections)
- ANKR AI Proxy

---

**Deliverables:**
- ✅ Customer 360 complete (#10)
- ✅ Empowerment Panel live (#12)
- ✅ AI-powered assistance operational

---

## 🗓️ PHASE 5: Dashboards & Mobile (Weeks 18-21)

**Goal:** Build Command Center (#11) and Mobile App (#8)
**Deliverable:** Manager analytics + field agent mobile app

---

### Week 18-19: Command Center (#11)

#### 6.1 Requirement #11: Command Center Dashboard
**User:** Manager/Admin
**Priority:** CRITICAL 🔥

- [ ] **Backend:**
  - [ ] Live metrics aggregation:
    ```typescript
    class CommandCenterService {
      async getLiveMetrics(): Promise<LiveMetrics> {
        // Active calls RIGHT NOW
        const activeCalls = await prisma.calls.count({
          where: { status: 'in_progress' }
        });

        // Today's stats
        const today = startOfDay(new Date());
        const todayStats = await prisma.$queryRaw`
          SELECT
            COUNT(*) as total_calls,
            AVG(duration_seconds) as avg_duration,
            SUM(CASE WHEN d.disposition_code = 'CONNECTED_INTERESTED' THEN 1 ELSE 0 END) as conversions
          FROM telehub.calls c
          LEFT JOIN telehub.call_dispositions d ON d.call_id = c.id
          WHERE c.started_at >= ${today}
        `;

        // Leaderboard
        const leaderboard = await this.getLeaderboard('today');

        // Funnel
        const funnel = await this.getFunnelData('today');

        // Calls by hour (for chart)
        const callsByHour = await this.getCallsByHour('today');

        return {
          activeCalls,
          todayStats,
          leaderboard,
          funnel,
          callsByHour
        };
      }

      async getLeaderboard(period: 'today' | 'week' | 'month'): Promise<LeaderboardEntry[]> {
        const startDate = this.getStartDate(period);

        return await prisma.$queryRaw`
          SELECT
            u.id,
            u.name,
            u.avatar_url,
            COUNT(c.id) as calls_made,
            AVG(ca.sentiment_score) as avg_sentiment,
            SUM(CASE WHEN d.disposition_code = 'CONNECTED_INTERESTED' THEN 1 ELSE 0 END) as conversions,
            SUM(cl.final_amount) as revenue
          FROM public.users u
          LEFT JOIN telehub.calls c ON c.telecaller_id = u.id AND c.started_at >= ${startDate}
          LEFT JOIN telehub.call_analytics ca ON ca.call_id = c.id
          LEFT JOIN telehub.call_dispositions d ON d.call_id = c.id
          LEFT JOIN telehub.visits v ON v.lead_id = c.lead_id
          LEFT JOIN telehub.closures cl ON cl.visit_id = v.id
          WHERE u.role = 'telecaller'
          GROUP BY u.id
          ORDER BY conversions DESC, calls_made DESC
          LIMIT 10
        `;
      }

      async getFunnelData(period: string): Promise<FunnelData> {
        const startDate = this.getStartDate(period);

        const leads = await prisma.leads.count({
          where: { created_at: { gte: startDate } }
        });

        const calls = await prisma.calls.count({
          where: { started_at: { gte: startDate } }
        });

        const visits = await prisma.visits.count({
          where: { scheduled_at: { gte: startDate } }
        });

        const sales = await prisma.closures.count({
          where: { created_at: { gte: startDate } }
        });

        return {
          leads,
          calls,
          visits,
          sales,
          conversionRates: {
            leadsToCall: (calls / leads) * 100,
            callsToVisit: (visits / calls) * 100,
            visitsToSale: (sales / visits) * 100,
            overall: (sales / leads) * 100
          }
        };
      }
    }
    ```
  - [ ] Real-time WebSocket updates (every 5 seconds)
  - [ ] Campaign performance analytics
  - [ ] Agent activity timeline
  - [ ] Real-time alerts:
    - Long call (> 15 minutes)
    - Negative sentiment detected
    - High-value lead called
    - Conversion happened

- [ ] **Frontend:**
  - [ ] Command center dashboard:
    ```typescript
    function CommandCenter() {
      const { data: metrics } = useQuery(
        ['live-metrics'],
        () => api.getLiveMetrics(),
        { refetchInterval: 5000 } // Update every 5 seconds
      );

      return (
        <div className="command-center p-8 bg-gray-50 min-h-screen">
          <h1 className="text-3xl font-bold mb-8">Command Center</h1>

          {/* Top KPIs */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <KPICard
              title="Active Calls"
              value={metrics?.activeCalls}
              icon={<Phone className="w-8 h-8" />}
              color="green"
              pulse // Animated pulse effect
            />
            <KPICard
              title="Calls Today"
              value={metrics?.todayStats.total_calls}
              icon={<PhoneCall />}
              trend={{ value: 12, direction: 'up' }}
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
              trend={{ value: 8, direction: 'up' }}
            />
          </div>

          {/* Funnel + Leaderboard */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <Card>
              <h3 className="text-xl font-semibold mb-4">Conversion Funnel</h3>
              <FunnelChart data={metrics?.funnel} />
            </Card>

            <Card>
              <h3 className="text-xl font-semibold mb-4">Leaderboard</h3>
              <Leaderboard data={metrics?.leaderboard} />
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-8">
            <Card>
              <h3 className="text-xl font-semibold mb-4">Calls by Hour</h3>
              <LineChart
                data={metrics?.callsByHour}
                xKey="hour"
                yKey="calls"
                color="#3b82f6"
              />
            </Card>

            <Card>
              <h3 className="text-xl font-semibold mb-4">Campaign Performance</h3>
              <BarChart
                data={metrics?.campaignStats}
                xKey="campaign"
                yKey="conversions"
                color="#10b981"
              />
            </Card>
          </div>
        </div>
      );
    }
    ```
  - [ ] KPI cards with animations
  - [ ] Funnel visualization (Recharts)
  - [ ] Leaderboard with avatars
  - [ ] Line chart (calls by hour)
  - [ ] Bar chart (campaigns)
  - [ ] Real-time alerts (toast notifications)
  - [ ] Export to Excel/PDF button

- [ ] **Testing:**
  - [ ] Test real-time updates (WebSocket)
  - [ ] Test leaderboard calculation
  - [ ] Test funnel calculation
  - [ ] Load test (50+ concurrent viewers)

**Effort:** 3 weeks
**Dependencies:**
- ankr-viewer integration (for charts)

---

### Week 20-21: Mobile App (#8)

#### 6.2 Requirement #8: Mobile Visits View
**User:** Field Agent
**Priority:** Medium

- [ ] **Decision: PWA vs React Native**
  - [ ] Evaluate:
    - **PWA:** Faster to build, no app store approval, works offline
    - **React Native:** Better UX, native features (camera, geolocation), app store presence
  - [ ] **Recommendation:** Start with PWA, migrate to React Native later
  - [ ] If PWA chosen:
    - [ ] Add service worker for offline support
    - [ ] Add web app manifest
    - [ ] Add install prompt
  - [ ] If React Native chosen:
    - [ ] Set up React Native project: `npx react-native init TelehubMobile`
    - [ ] Set up navigation (React Navigation)
    - [ ] Set up state management (Zustand)

- [ ] **Backend:**
  - [ ] Mobile API endpoints:
    - `GET /api/v1/mobile/visits/today` - Today's visits
    - `POST /api/v1/mobile/visits/{id}/checkin` - Check in
    - `POST /api/v1/mobile/visits/{id}/notes` - Add notes
    - `POST /api/v1/mobile/visits/{id}/photos` - Upload photos
  - [ ] Geolocation verification:
    ```typescript
    async checkIn(visitId: string, location: Location): Promise<CheckInResult> {
      const visit = await prisma.visits.findUnique({
        where: { id: visitId },
        include: { center: true }
      });

      // Calculate distance from center
      const distance = getDistance(
        location.latitude,
        location.longitude,
        visit.center.latitude,
        visit.center.longitude
      );

      if (distance > 100) { // 100 meters tolerance
        return { success: false, error: 'Not at visit location', distance };
      }

      // Check in
      await prisma.visits.update({
        where: { id: visitId },
        data: {
          status: 'in_progress',
          check_in_at: new Date(),
          check_in_latitude: location.latitude,
          check_in_longitude: location.longitude
        }
      });

      return { success: true };
    }
    ```
  - [ ] Photo upload to S3

- [ ] **Mobile Frontend:**
  - [ ] Visits list screen:
    ```typescript
    // apps/telehub-mobile/src/screens/VisitsList.tsx
    import { useLiveQuery } from 'dexie-react-hooks';
    import { db } from '../db'; // IndexedDB for offline

    function VisitsList() {
      const user = useAuth();
      const [refreshing, setRefreshing] = useState(false);

      const visits = useLiveQuery(() =>
        db.visits
          .where('field_agent_id').equals(user.id)
          .and(v => isSameDay(v.scheduled_at, new Date()))
          .toArray()
      );

      const onRefresh = async () => {
        setRefreshing(true);
        await syncVisits(); // Fetch from server
        setRefreshing(false);
      };

      return (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View className="p-4">
            <Text className="text-2xl font-bold mb-4">
              Today's Visits ({visits?.length || 0})
            </Text>

            {visits?.map(visit => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
          </View>
        </ScrollView>
      );
    }

    function VisitCard({ visit }: { visit: Visit }) {
      const navigation = useNavigation();

      const handleNavigate = () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${visit.center.latitude},${visit.center.longitude}`;
        Linking.openURL(url);
      };

      const handleCheckIn = async () => {
        const location = await getCurrentPosition();

        const result = await api.checkIn(visit.id, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });

        if (!result.success) {
          Alert.alert('Check-in Failed', result.error);
        }
      };

      return (
        <Card className="mb-4">
          <View className="flex-row justify-between items-start mb-2">
            <View>
              <Text className="text-lg font-bold">{visit.lead.name}</Text>
              <Text className="text-gray-600">{visit.lead.phone}</Text>
            </View>
            <Badge status={visit.status} />
          </View>

          <Text className="text-sm mb-2">
            {format(visit.scheduled_at, 'h:mm a')} • {visit.center.name}
          </Text>

          <View className="flex-row gap-2">
            <Button onPress={handleNavigate} variant="outline">
              Navigate
            </Button>

            {visit.status === 'scheduled' && (
              <Button onPress={handleCheckIn}>
                Check In
              </Button>
            )}

            {visit.status === 'in_progress' && (
              <Button onPress={() => navigation.navigate('ClosureForm', { visitId: visit.id })}>
                Complete
              </Button>
            )}
          </View>
        </Card>
      );
    }
    ```
  - [ ] Visit details screen
  - [ ] Check-in flow (geolocation permission)
  - [ ] Notes capture screen
  - [ ] Photo upload screen (camera + gallery)
  - [ ] Closure form screen (see #9)
  - [ ] Offline mode (IndexedDB/Dexie)
  - [ ] Push notifications (FCM)

- [ ] **Closure Form (Mobile):**
  - [ ] See requirement #9 implementation (Week 12-13 backend)
  - [ ] Mobile UI for closure form
  - [ ] Signature capture (react-native-signature-canvas)
  - [ ] Photo capture (react-native-camera)

- [ ] **Testing:**
  - [ ] Test on iOS (iPhone SE, iPhone 14)
  - [ ] Test on Android (Samsung, Pixel)
  - [ ] Test offline mode
  - [ ] Test geolocation accuracy
  - [ ] Test photo upload

**Effort:** 3 weeks
**Dependencies:**
- App Store / Play Store accounts (if React Native)
- Push notification service (FCM)

---

**Deliverables:**
- ✅ Command Center complete (#11)
- ✅ Mobile app ready (#8)
- ✅ Closure form in mobile (#9)

---

## 🗓️ PHASE 6: Production Readiness (Weeks 22-24)

**Goal:** Testing, security, training, deployment
**Deliverable:** Production-ready platform with trained users

---

### Week 22: Testing & QA

#### 7.1 Testing Strategy
- [ ] **Unit Tests (80%+ coverage):**
  - [ ] Backend services (Jest)
  - [ ] API endpoints (Supertest)
  - [ ] Frontend components (Vitest + React Testing Library)
  - [ ] Run: `npm run test:coverage`

- [ ] **Integration Tests:**
  - [ ] Laravel sync flow (end-to-end)
  - [ ] Exotel call flow (mocked)
  - [ ] Campaign automation flow
  - [ ] Visit scheduling flow
  - [ ] Run: `npm run test:integration`

- [ ] **E2E Tests (Critical paths):**
  - [ ] User login → Smart Queue → Make Call → Disposition
  - [ ] Admin → Create Campaign → Execute → Track
  - [ ] Telecaller → Schedule Visit → Field Agent Check-in → Closure
  - [ ] Use: Playwright or Cypress
  - [ ] Run: `npm run test:e2e`

- [ ] **Load Testing:**
  - [ ] Simulate 30 concurrent users (K6 or Artillery)
  - [ ] Simulate 20 concurrent calls
  - [ ] Test WebSocket scalability
  - [ ] Target: < 200ms API response time (p95)

- [ ] **Stress Testing:**
  - [ ] Push to 50 concurrent users
  - [ ] Simulate 100 calls/minute
  - [ ] Test auto-scaling

- [ ] **Security Testing:**
  - [ ] OWASP Top 10 scan (OWASP ZAP)
  - [ ] SQL injection tests
  - [ ] XSS tests
  - [ ] CSRF tests
  - [ ] Authentication bypass tests

- [ ] **Accessibility Testing:**
  - [ ] WCAG 2.1 Level AA compliance
  - [ ] Screen reader compatibility
  - [ ] Keyboard navigation
  - [ ] Use: axe DevTools

#### 7.2 Performance Optimization
- [ ] Database query optimization:
  - [ ] Add missing indexes
  - [ ] Optimize slow queries (< 100ms)
  - [ ] Use EXPLAIN ANALYZE
- [ ] API response time optimization:
  - [ ] Add Redis caching for frequently accessed data
  - [ ] Implement query result caching (5 min TTL)
  - [ ] Target: < 200ms p95 response time
- [ ] Frontend bundle optimization:
  - [ ] Code splitting by route
  - [ ] Lazy load components
  - [ ] Tree-shake unused code
  - [ ] Target: < 200KB initial bundle
- [ ] Image optimization:
  - [ ] Compress images (WebP format)
  - [ ] Lazy load images
  - [ ] Use Next.js Image or similar
- [ ] CDN setup:
  - [ ] CloudFront for static assets
  - [ ] Edge caching
- [ ] Redis caching:
  - [ ] Cache GraphQL queries (5 min TTL)
  - [ ] Cache user sessions
  - [ ] Cache leaderboard (1 min TTL)
- [ ] Database connection pooling:
  - [ ] Prisma connection pool (10-20 connections)

#### 7.3 Bug Fixes & Polish
- [ ] Fix all critical bugs (severity: high)
- [ ] Fix high-priority bugs (P1)
- [ ] UI/UX polish:
  - [ ] Consistent spacing (Tailwind)
  - [ ] Smooth animations (Framer Motion)
  - [ ] Responsive design (mobile, tablet, desktop)
- [ ] Error message improvements (user-friendly)
- [ ] Loading state improvements (skeleton screens)
- [ ] Empty states (no data illustrations)

**Deliverables:**
- ✅ All tests passing (unit, integration, E2E)
- ✅ Performance targets met (< 200ms p95, < 2s page load)
- ✅ Zero critical bugs
- ✅ Load testing report (30+ users, 20+ calls)

---

### Week 23: Security & Compliance

#### 7.4 Security Hardening
- [ ] Implement rate limiting:
  ```typescript
  @UseGuards(ThrottlerGuard)
  @Throttle(100, 60) // 100 requests per minute
  ```
- [ ] Add CSRF protection (csurf middleware)
- [ ] Set up WAF (Web Application Firewall):
  - [ ] AWS WAF or Cloudflare WAF
  - [ ] Block common attack patterns
- [ ] Enable HTTPS/SSL everywhere:
  - [ ] Let's Encrypt SSL certificates
  - [ ] Force HTTPS redirect
  - [ ] HSTS header
- [ ] SQL injection prevention:
  - [ ] Use Prisma ORM (parameterized queries)
  - [ ] Never use raw SQL with user input
- [ ] XSS protection:
  - [ ] Content Security Policy (CSP) header
  - [ ] Sanitize user input (DOMPurify)
- [ ] Set up security headers:
  ```typescript
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }));
  ```
- [ ] API key rotation:
  - [ ] Rotate API keys quarterly
  - [ ] Use AWS Secrets Manager
- [ ] Audit logging:
  ```typescript
  async logAudit(action: string, userId: string, metadata: any) {
    await prisma.audit_logs.create({
      data: { action, user_id: userId, metadata, timestamp: new Date() }
    });
  }
  ```

#### 7.5 Data Privacy & Compliance
- [ ] **GDPR Compliance:**
  - [ ] Right to access (data export API)
  - [ ] Right to deletion (delete user data endpoint)
  - [ ] Data portability (JSON export)
  - [ ] Consent management (call recording consent)
- [ ] **Data Retention Policy:**
  - [ ] Call recordings: 90 days
  - [ ] Leads: 2 years (inactive)
  - [ ] Audit logs: 5 years
  - [ ] Implement auto-cleanup jobs
- [ ] **Right to Deletion:**
  ```typescript
  async deleteUserData(userId: string) {
    await prisma.$transaction([
      prisma.calls.deleteMany({ where: { telecaller_id: userId } }),
      prisma.visits.deleteMany({ where: { field_agent_id: userId } }),
      prisma.users.delete({ where: { id: userId } })
    ]);
  }
  ```
- [ ] **Call Recording Consent:**
  - [ ] Auto-play disclaimer at call start
  - [ ] "This call is being recorded for quality purposes"
  - [ ] Opt-out option
- [ ] **TRAI DND Registry:**
  ```typescript
  async checkDND(phone: string): Promise<boolean> {
    const isDND = await traiDNDApi.check(phone);
    if (isDND) {
      throw new Error('Number is on DND registry');
    }
  }
  ```
- [ ] **DPDP Act 2023 (India):**
  - [ ] Data localization (India servers)
  - [ ] Consent management
  - [ ] Data breach notification (72 hours)

#### 7.6 Backup & Recovery
- [ ] Set up automated database backups:
  ```bash
  # Daily backup at 2am
  0 2 * * * pg_dump ankr_eon > /backups/ankr_eon_$(date +\%Y\%m\%d).sql
  ```
- [ ] Implement point-in-time recovery (AWS RDS)
- [ ] Test backup restoration:
  - [ ] Restore to staging environment
  - [ ] Verify data integrity
- [ ] Set up disaster recovery plan:
  - [ ] Multi-region backup (AWS S3 cross-region replication)
  - [ ] RPO (Recovery Point Objective): 24 hours
  - [ ] RTO (Recovery Time Objective): 4 hours
- [ ] Document recovery procedures (runbook)
- [ ] Set up monitoring and alerts:
  - [ ] Datadog or New Relic
  - [ ] Alert on high error rate
  - [ ] Alert on high latency
  - [ ] Alert on database connection failures

**Deliverables:**
- ✅ Security audit passed (OWASP)
- ✅ Compliance verified (GDPR, TRAI, DPDP)
- ✅ Backup/recovery tested

---

### Week 24: Training & Documentation

#### 7.7 Documentation
- [ ] **User Manuals:**
  - [ ] Telecaller manual (PDF + online)
  - [ ] Manager manual
  - [ ] Field agent manual
  - [ ] Admin manual
- [ ] **API Documentation:**
  - [ ] OpenAPI/Swagger docs
  - [ ] GraphQL playground
  - [ ] Webhook documentation
- [ ] **Deployment Guide:**
  - [ ] Infrastructure setup
  - [ ] Environment variables
  - [ ] Database migrations
  - [ ] PM2 process management
- [ ] **Troubleshooting Guide:**
  - [ ] Common errors and solutions
  - [ ] FAQ
  - [ ] Support contact info
- [ ] **Video Tutorials (12+ videos):**
  - [ ] How to use Smart Queue (#3)
  - [ ] How to make calls with HUD (#4)
  - [ ] How to use AI Assistant (#12)
  - [ ] How to schedule visits (#7)
  - [ ] How to create campaigns (#6)
  - [ ] How to view Customer 360 (#10)
  - [ ] How to use mobile app (#8)
  - [ ] How to complete closures (#9)
  - [ ] How to use Command Center (#11)
  - [ ] How to configure distribution rules (#2)
  - [ ] How to import leads (#1)
  - [ ] How to read analytics

#### 7.8 Training Program
- [ ] **Telecaller Training (2 days):**
  - **Day 1: Platform Basics**
    - [ ] Login and navigation
    - [ ] Understanding the Smart Queue (#3)
    - [ ] Making calls with HUD (#4)
    - [ ] Using AI assistant (#12)
    - [ ] Disposition codes (#5)
  - **Day 2: Advanced Features**
    - [ ] Customer 360 view (#10)
    - [ ] Scheduling visits (#7)
    - [ ] Performance tracking
    - [ ] Best practices
    - [ ] Q&A

- [ ] **Manager Training (1 day):**
  - [ ] Command Center overview (#11)
  - [ ] Real-time monitoring
  - [ ] Analytics and reporting
  - [ ] Coaching using AI insights (#10, #12)
  - [ ] Creating campaigns (#6)
  - [ ] Configuring distribution rules (#2)

- [ ] **Field Agent Training (Half day):**
  - [ ] Mobile app installation (#8)
  - [ ] Daily agenda and navigation
  - [ ] Check-in procedures
  - [ ] Closure form (#9)
  - [ ] Photo uploads

- [ ] **Admin Training (Half day):**
  - [ ] Lead ingestion (#1)
  - [ ] User management
  - [ ] System configuration
  - [ ] Troubleshooting

#### 7.9 Support System Setup
- [ ] Set up helpdesk system:
  - [ ] Freshdesk or Zendesk
  - [ ] Support ticket workflow
  - [ ] Priority levels (P1, P2, P3)
- [ ] Create support ticket workflow:
  - [ ] Auto-assign to team member
  - [ ] SLA: P1 = 4 hours, P2 = 24 hours, P3 = 72 hours
- [ ] Build internal knowledge base (Notion or Confluence)
- [ ] Set up on-call rotation (PagerDuty)
- [ ] Create escalation procedures:
  - [ ] L1 Support → L2 Support → Engineering

**Deliverables:**
- ✅ All documentation complete (4 manuals + API docs)
- ✅ Training sessions conducted (60+ people)
- ✅ Support system operational (helpdesk + on-call)

---

## 🗓️ PHASE 7: Deployment & Launch (Weeks 25-27)

**Goal:** Deploy to production and gradual rollout
**Deliverable:** Full platform live with 30 users

---

### Week 25: Production Deployment

#### 8.1 Production Infrastructure Setup
- [ ] **AWS Setup:**
  - [ ] Create production VPC
  - [ ] Set up security groups
  - [ ] Configure load balancer (ALB)
  - [ ] Set up auto-scaling (min: 2, max: 5 instances)
- [ ] **Database:**
  - [ ] Provision RDS PostgreSQL (db.t3.medium)
  - [ ] Enable automated backups (7-day retention)
  - [ ] Enable Multi-AZ for high availability
- [ ] **Redis:**
  - [ ] Provision ElastiCache (cache.t3.micro)
  - [ ] Configure as session store + cache
- [ ] **S3 Buckets:**
  - [ ] Create bucket for call recordings
  - [ ] Create bucket for photos/documents
  - [ ] Enable lifecycle policies (delete after 90 days)
- [ ] **CloudFront CDN:**
  - [ ] Set up for static assets
  - [ ] Configure edge caching

#### 8.2 Deployment Process
- [ ] **Build & Deploy Backend:**
  ```bash
  cd apps/pratham-telehub-backend
  npm run build
  pm2 start ecosystem.config.js --env production
  ```
- [ ] **Deploy Frontend:**
  ```bash
  cd apps/pratham-telehub-frontend
  npm run build
  # Deploy to S3 + CloudFront OR Vercel
  ```
- [ ] **Database Migrations:**
  ```bash
  npx prisma migrate deploy
  npx prisma db seed # Initial data (centers, templates, etc.)
  ```
- [ ] **Configure Monitoring:**
  - [ ] Datadog APM
  - [ ] Datadog Logs
  - [ ] Datadog RUM (frontend)
  - [ ] Error tracking (Sentry)
- [ ] **Configure Uptime Monitoring:**
  - [ ] UptimeRobot or Pingdom
  - [ ] Monitor: /health endpoint
  - [ ] Alert on downtime (SMS + Email)

#### 8.3 Smoke Tests (Production)
- [ ] Test user login
- [ ] Test API health endpoints
- [ ] Test database connectivity
- [ ] Test Exotel integration (make test call)
- [ ] Test WhatsApp sending (test message)
- [ ] Test email sending (test email)
- [ ] Test file upload (S3)
- [ ] Test WebSocket connection
- [ ] Test mobile app connection

**Deliverables:**
- ✅ Production environment running
- ✅ All services healthy
- ✅ Monitoring active
- ✅ Smoke tests passed

---

### Week 26-27: Gradual Rollout

#### 8.4 Pilot Launch (Week 1 - 5 Users)
- [ ] **Select Pilot Users:**
  - [ ] 3 telecallers (varied experience levels)
  - [ ] 1 manager
  - [ ] 1 field agent
- [ ] **Onboarding:**
  - [ ] Individual training sessions (1 hour each)
  - [ ] Walk through all 12 features
  - [ ] Answer questions
- [ ] **Daily Check-ins:**
  - [ ] Morning: Plan for the day
  - [ ] Evening: Feedback session
  - [ ] Collect issues and suggestions
- [ ] **Monitor Metrics:**
  - [ ] Calls made per day
  - [ ] Feature usage (which features are used most)
  - [ ] Errors encountered
  - [ ] User satisfaction (survey)
- [ ] **Fix Urgent Issues:**
  - [ ] Deploy hotfixes daily
  - [ ] Prioritize blocking issues

#### 8.5 Expanded Rollout (Week 2 - 15 Users)
- [ ] **Select Additional Users:**
  - [ ] 10 more telecallers
  - [ ] 2 more managers
  - [ ] 3 field agents
- [ ] **Group Training:**
  - [ ] 2-day training program (as designed)
  - [ ] Hands-on sessions
- [ ] **Monitor System Stability:**
  - [ ] CPU usage
  - [ ] Memory usage
  - [ ] Database connections
  - [ ] API response time
  - [ ] Error rate
- [ ] **Adjust Resources:**
  - [ ] Scale up if needed (more EC2 instances)
  - [ ] Optimize slow queries
- [ ] **Collect Feedback:**
  - [ ] Weekly survey
  - [ ] Feature requests
  - [ ] Bug reports

#### 8.6 Full Rollout (Week 3 - 30 Users)
- [ ] **Rollout to All Users:**
  - [ ] 30 telecallers
  - [ ] 5 managers
  - [ ] 10 field agents
  - [ ] 2 admins
- [ ] **Final Training:**
  - [ ] Batch training sessions
  - [ ] Q&A sessions
  - [ ] Video tutorials available
- [ ] **Monitor Performance:**
  - [ ] Track all KPIs (see success metrics)
  - [ ] Daily reports to leadership
- [ ] **Support:**
  - [ ] Dedicated support team (2 people)
  - [ ] WhatsApp support channel
  - [ ] Helpdesk ticketing
- [ ] **Continuous Improvement:**
  - [ ] Bi-weekly feedback sessions
  - [ ] Monthly feature updates
  - [ ] Quarterly roadmap reviews

**Deliverables:**
- ✅ 5-user pilot successful
- ✅ 15-user rollout stable
- ✅ Full rollout (30+ users) operational
- ✅ Support system handling < 5 tickets/day

---

## 📊 Success Metrics & KPIs (Tracking)

### Technical Metrics (Track Weekly)
- [ ] **Uptime:** 99.9% SLA (target)
- [ ] **API Response Time:** < 200ms (p95) (target)
- [ ] **Page Load Time:** < 2 seconds (target)
- [ ] **Call Connection Time:** < 5 seconds (target)
- [ ] **AI Response Time:** < 3 seconds (target)
- [ ] **Concurrent Users:** 30+ supported (target)
- [ ] **Concurrent Calls:** 20+ supported (target)
- [ ] **Error Rate:** < 0.1% (target)
- [ ] **Mobile App Crash Rate:** < 0.5% (target)

### Business Metrics (Track Daily)

**Baseline (Month 1):**
- [ ] Calls per day per telecaller: [Measure]
- [ ] Conversion rate: [Measure]
- [ ] Average call duration: [Measure]
- [ ] Manual data entry time: [Measure]
- [ ] Lead response time: [Measure]

**Targets (Month 3):**
- [ ] **Efficiency:** 30% improvement (60 → 80 calls/day)
- [ ] **Conversion Rate:** 15% increase (8% → 9.2%)
- [ ] **Data Entry Time:** 50% reduction (20 → 10 mins/day)
- [ ] **Lead Response Time:** < 2 hours
- [ ] **Visit Show Rate:** 75%+
- [ ] **Campaign Engagement:** 40% email open, 60% WhatsApp read

### Feature Adoption (Track Daily)
- [ ] **#1 Lead Ingestion:** Leads imported per day
- [ ] **#2 Distribution:** Auto-assignment enabled (yes/no)
- [ ] **#3 Smart Queue:** % of telecallers using daily (target: 100%)
- [ ] **#4 Call HUD:** % of calls using HUD (target: 95%)
- [ ] **#5 Disposition:** % of calls with disposition (target: 100%)
- [ ] **#6 Campaigns:** Active campaigns count (target: 5+)
- [ ] **#7 Visit Scheduler:** Visits scheduled per day
- [ ] **#8 Mobile App:** % field agents using daily (target: 90%)
- [ ] **#9 Closures:** Closures logged per week
- [ ] **#10 Customer 360:** % of calls checking history (target: 80%)
- [ ] **#11 Command Center:** Manager logins per day (target: 10+)
- [ ] **#12 Empowerment:** Searches per call (target: 2+)

---

## 💰 Budget Tracking

### Development Costs (Track Actual vs Estimated)
| Phase | Estimated (₹) | Actual (₹) | Status |
|-------|---------------|------------|--------|
| Phase 1: Foundation | 5,00,000 | [TBD] | ⏳ |
| Phase 2: PBX Integration | 3,00,000 | [TBD] | ⏳ |
| Phase 3: Advanced Features | 9,00,000 | [TBD] | ⏳ |
| Phase 4: AI Features | 6,60,000 | [TBD] | ⏳ |
| Phase 5: Dashboards & Mobile | 6,00,000 | [TBD] | ⏳ |
| Phase 6: Testing & Training | 3,30,000 | [TBD] | ⏳ |
| **Total** | **₹30,69,000** | **[TBD]** | ⏳ |

### Infrastructure Costs (Track Monthly)
| Month | Estimated (₹) | Actual (₹) | Notes |
|-------|---------------|------------|-------|
| Month 1 | 74,500 | [TBD] | Pilot (5 users) |
| Month 2 | 74,500 | [TBD] | Expanded (15 users) |
| Month 3 | 74,500 | [TBD] | Full (30 users) |

---

## 🎯 Risk Management (Review Weekly)

### Technical Risks
- [ ] **Laravel Integration Issues:** [Status: ☐ Resolved ☐ In Progress ☐ Blocked]
- [ ] **Exotel Call Quality:** [Status: ☐ Good ☐ Issues ☐ Blocked]
- [ ] **Real-time Performance:** [Status: ☐ Good ☐ Optimizing ☐ Issues]
- [ ] **AI API Costs:** [Current: ₹___/month] [Budget: ₹3,000/month]

### Business Risks
- [ ] **User Adoption:** [Adoption rate: ___%] [Target: 90%+]
- [ ] **Data Migration:** [Status: ☐ Complete ☐ In Progress ☐ Issues]
- [ ] **WhatsApp API Approval:** [Status: ☐ Approved ☐ Pending ☐ Rejected]

---

## 📋 Pre-Launch Checklist

### Technical Checklist
- [ ] All 12 features complete and tested
- [ ] All tests passing (unit, integration, E2E)
- [ ] Performance targets met (< 200ms API, < 2s page load)
- [ ] Security audit completed and passed
- [ ] Load testing successful (30+ users, 20+ calls)
- [ ] Disaster recovery tested
- [ ] Monitoring and alerts configured
- [ ] Documentation complete (4 manuals + API docs)
- [ ] Backups automated and tested

### Business Checklist
- [ ] Stakeholder sign-off received
- [ ] Training completed (100% of users)
- [ ] Support system operational (helpdesk + on-call)
- [ ] SLA agreements signed (Exotel, WhatsApp, etc.)
- [ ] Data privacy compliance verified (GDPR, TRAI, DPDP)
- [ ] Budget approved and allocated
- [ ] Launch communication prepared (internal announcement)
- [ ] Success metrics baseline captured

### Legal & Compliance
- [ ] Privacy policy approved and published
- [ ] Terms of service approved and published
- [ ] Call recording consent mechanism verified
- [ ] TRAI DND compliance checked
- [ ] Data retention policy documented and implemented
- [ ] Vendor contracts signed (Exotel, SendGrid, WhatsApp BSP)

---

## 🎉 Success Criteria

### POC Success (✅ ACHIEVED)
- ✅ Working telecaller dashboard
- ✅ AI assistant with suggestions
- ✅ Manager command center
- ✅ Real-time WebSocket updates
- ✅ Professional showcase delivered

### MVP Success (Target: Week 14)
- [ ] 15 telecallers actively using system
- [ ] 50+ calls per day through platform
- [ ] Laravel CRM sync operational
- [ ] #1, #2, #3, #4, #5 features live
- [ ] Zero critical bugs in production

### Full Launch Success (Target: Week 27)
- [ ] 30+ telecallers using all features
- [ ] All 12 requirements complete
- [ ] 99.9% uptime achieved
- [ ] 30-40% efficiency improvement measured
- [ ] 15-20% conversion rate increase
- [ ] 90%+ user satisfaction
- [ ] ROI positive (break-even at 5.6 months)

---

## 📈 Roadmap Beyond Launch (Post-Week 27)

### Month 2-6: Enhancements
- [ ] Voice bot for initial screening
- [ ] Predictive dialer (vs progressive)
- [ ] Advanced ML lead scoring
- [ ] Revenue forecasting
- [ ] Multi-language support (Tamil, Telugu, Bengali)
- [ ] Chatbot for website leads

### Month 7-12: Scale-Up
- [ ] Support for 100+ telecallers
- [ ] Multi-tenant architecture
- [ ] White-label version for other NGOs
- [ ] API marketplace for integrations
- [ ] Advanced analytics and BI (Metabase)
- [ ] Blockchain-based lead provenance

---

## 🚀 Quick Start Commands

### Development
```bash
# Start all services
cd /root/ankr-labs-nx
nx serve pratham-telehub-backend  # Port 4055
nx serve pratham-telehub-frontend # Port 3055

# Run tests
nx test pratham-telehub-backend
nx test pratham-telehub-frontend

# Build for production
nx build pratham-telehub-backend --prod
nx build pratham-telehub-frontend --prod
```

### Deployment
```bash
# Deploy to staging
./scripts/deploy-staging.sh

# Deploy to production
./scripts/deploy-production.sh

# Rollback deployment
./scripts/rollback.sh
```

### Database
```bash
# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Backup database
./scripts/backup-db.sh
```

### Monitoring
```bash
# View logs
ankr-ctl logs pratham-telehub-backend

# Check service status
ankr-ctl status pratham-telehub-backend

# Restart service
ankr-ctl restart pratham-telehub-backend
```

---

## 📞 Stakeholders & Contacts

### Pratham Team
- **Project Sponsor:** [Name, Title, Email, Phone]
- **Product Owner:** [Name, Title, Email, Phone]
- **Technical Lead (Laravel):** [Name, Email, Phone]
- **Training Coordinator:** [Name, Email, Phone]

### ANKR Team
- **Project Manager:** Capt. Anil Sharma
- **Tech Lead:** [Assigned Developer]
- **AI/ML Lead:** [Assigned Developer]
- **Mobile Developer:** [Assigned Developer]
- **DevOps Lead:** [Assigned Developer]

### External Vendors
- **Exotel:** Account Manager [Name, Contact]
- **WhatsApp BSP:** [Provider Name, Contact]
- **SendGrid:** Support [Email]
- **AWS:** Account Manager [Name]

---

## 📚 Documentation Links

- **Project Report:** `/root/PRATHAM-TELEHUB-UNIFIED-PROJECT-REPORT.md`
- **POC Showcase:** `/root/pratham-telehub-showcase.pdf`
- **POC Code:** `/root/pratham-telehub-poc/`
- **ANKR Platform Docs:** `/root/ankr-labs-nx/docs/`
- **API Documentation:** [URL when deployed]
- **Training Videos:** [YouTube/Vimeo playlist when ready]

---

**Document Version:** 2.0 (Unified)
**Last Updated:** February 14, 2026
**Status:** Ready for Execution

**Jai Guru Ji** 🙏 | © 2026 ANKR Labs

---

**Next Step:** Schedule kickoff meeting with Pratham stakeholders to review this roadmap and get approval to proceed! 🚀
