# Pratham TeleHub - Fresh Dashboard TODO
**Sprint-Ready Implementation Checklist**
**Start Date:** February 14, 2026
**Target:** Production-Ready Telecalling Dashboard
**Timeline:** 4-6 weeks

---

## 🎯 Mission: Build Production Telecalling Dashboard

Transform the POC into a **real, working telecalling platform** with:
- Real lead data from CRM
- Live call integration (Exotel/Twilio)
- AI-powered assistance
- Manager command center
- Production-grade infrastructure

---

## 📊 Current State Assessment

### ✅ What We Have (POC)
- [x] Basic React + Node.js stack
- [x] PostgreSQL database schema
- [x] Sample telecaller dashboard
- [x] WebSocket real-time updates
- [x] Mock AI suggestions
- [x] Manager command center (basic)
- [x] Running on localhost:3100/3101

### ❌ What's Missing (Production)
- [ ] Real CRM data integration
- [ ] Live PBX integration (Exotel)
- [ ] Active Call HUD
- [ ] Production AI integration
- [ ] Advanced lead routing
- [ ] Campaign automation
- [ ] Customer 360 view
- [ ] Production deployment

---

## 🏃 SPRINT 1: Foundation (Week 1-2) - IN PROGRESS

### Week 1: Data & Infrastructure

#### Day 1-2: Real Lead Data Integration
- [ ] **Task 1.1:** Get real lead export from Pratham CRM
  - [ ] Contact Pratham IT team for CRM access
  - [ ] Request CSV/API access to lead database
  - [ ] Get sample of 100-200 real leads
  - [ ] Document lead data structure

- [ ] **Task 1.2:** Clean and import real lead data
  - [ ] Create data mapping script (CRM → TeleHub)
  - [ ] Handle data quality issues (duplicates, invalid phones)
  - [ ] Import leads using existing script: `node import-leads.js`
  - [ ] Verify data in database
  - [ ] Test lead display in dashboard

- [ ] **Task 1.3:** Set up production database
  - [ ] Create production schema in `ankr_eon`
  - [ ] Add indexes for performance
  - [ ] Set up automated backups
  - [ ] Configure connection pooling
  - [ ] Add database monitoring

**Deliverable:** Real leads visible in dashboard ✅

---

#### Day 3-4: Enhanced Smart Queue (#3)

**File:** `/root/pratham-telehub-poc/frontend/src/pages/TelecallerDashboard.jsx`

- [ ] **Task 2.1:** Add priority categorization
  ```javascript
  // Group leads by priority
  - HOT: Score 80+, Last contact < 7 days
  - WARM: Score 60-79, Last contact < 30 days
  - COLD: Score < 60 or Last contact > 30 days
  ```

- [ ] **Task 2.2:** Add filters and sorting
  - [ ] Filter by: Status, Score, Source, Date
  - [ ] Sort by: Priority, Score, Last Contact
  - [ ] Search by: Name, Phone, Organization
  - [ ] Add "My Leads" vs "All Leads" toggle

- [ ] **Task 2.3:** Add lead age indicators
  ```javascript
  // Visual indicators
  - 🔥 Fresh (< 24 hours)
  - ⏰ Pending callback (scheduled)
  - 📅 Overdue follow-up (> 3 days)
  - ❄️ Cold (> 30 days)
  ```

- [ ] **Task 2.4:** Inline lead history
  - [ ] Show last 3 calls in lead card
  - [ ] Display last contact date/time
  - [ ] Show previous outcomes
  - [ ] Add quick notes preview

**Deliverable:** Smart Queue with prioritization ✅

---

#### Day 5: Improved Disposition System (#5)

**File:** `/root/pratham-telehub-poc/backend/index.js`

- [ ] **Task 3.1:** Expand disposition codes
  ```javascript
  // Connected outcomes
  - INTERESTED: Lead showed interest
  - NOT_INTERESTED: Declined
  - CALLBACK_REQUESTED: Asked to call back
  - WRONG_NUMBER: Invalid contact
  - LANGUAGE_BARRIER: Communication issue
  - ALREADY_CUSTOMER: Existing client

  // Not connected
  - NO_ANSWER: Rang but no pickup
  - BUSY: Line busy
  - SWITCHED_OFF: Phone off
  - OUT_OF_SERVICE: Number invalid
  - DND: Do Not Disturb

  // Special
  - ESCALATE_TO_MANAGER: Needs manager
  - SCHEDULE_VISIT: Book field visit
  - SEND_INFO: Email materials
  ```

- [ ] **Task 3.2:** Auto-reschedule logic
  - [ ] CALLBACK_REQUESTED → Schedule for specific time
  - [ ] NO_ANSWER → Retry in 2 hours
  - [ ] BUSY → Retry in 30 minutes
  - [ ] Add to retry queue automatically

- [ ] **Task 3.3:** Mandatory field validation
  - [ ] Require disposition before ending call
  - [ ] Require notes for certain dispositions
  - [ ] Add next action assignment
  - [ ] Prevent duplicate calls too soon

**Deliverable:** Professional disposition system ✅

---

### Week 2: PBX Integration Setup

#### Day 1-2: Exotel Account Setup

- [ ] **Task 4.1:** Create Exotel account
  - [ ] Sign up: https://exotel.com
  - [ ] Choose plan (recommended: ClickToCall)
  - [ ] Get API credentials (SID, Token)
  - [ ] Purchase virtual number
  - [ ] Set up webhook URLs

- [ ] **Task 4.2:** Test Exotel API
  - [ ] Test click-to-call API
  - [ ] Test call status webhooks
  - [ ] Test recording download
  - [ ] Verify call quality
  - [ ] Check pricing/billing

- [ ] **Task 4.3:** Configure environment
  ```bash
  # Add to .env
  EXOTEL_SID=your_sid
  EXOTEL_TOKEN=your_token
  EXOTEL_CALLER_ID=your_number
  EXOTEL_WEBHOOK_URL=https://your-domain.com/api/webhooks/exotel
  ```

**Deliverable:** Exotel API working ✅

---

#### Day 3-5: Active Call HUD (#4) - CRITICAL

**New File:** `/root/pratham-telehub-poc/frontend/src/components/ActiveCallHUD.jsx`

- [ ] **Task 5.1:** Build Call HUD UI
  ```javascript
  // Components
  - Call timer (live)
  - Customer info panel (name, org, previous calls)
  - Script/talking points box
  - AI suggestions panel (real-time)
  - Call controls (mute, hold, transfer, hangup)
  - Notes/disposition area
  - Recording indicator
  ```

- [ ] **Task 5.2:** Exotel integration (Backend)
  **File:** `/root/pratham-telehub-poc/backend/services/CallEngine.js`
  ```javascript
  class CallEngine {
    async initiateCall(leadId, telecallerId) {
      // 1. Fetch lead and telecaller phone
      // 2. Call Exotel API
      // 3. Create call record
      // 4. Emit WebSocket event
      // 5. Return call ID
    }

    async handleCallEvent(webhook) {
      // Process Exotel webhooks
      // Update call status
      // Emit real-time updates
    }
  }
  ```

- [ ] **Task 5.3:** WebSocket real-time updates
  - [ ] Emit `call:started` event
  - [ ] Emit `call:answered` event
  - [ ] Emit `call:ended` event
  - [ ] Stream call duration
  - [ ] Update UI in real-time

- [ ] **Task 5.4:** Call recording
  - [ ] Store recording URL from Exotel
  - [ ] Add playback in call history
  - [ ] Set up S3/MinIO for storage
  - [ ] Add recording download API

**Deliverable:** Working click-to-call with HUD ✅

---

## 🚀 SPRINT 2: AI & Intelligence (Week 3-4)

### Week 3: Real AI Integration

#### Day 1-2: ANKR AI Proxy Integration

- [ ] **Task 6.1:** Connect to AI Proxy
  **File:** `/root/pratham-telehub-poc/backend/services/AIAssistant.js`
  ```javascript
  // Use existing ANKR AI Proxy on port 4444
  const AI_PROXY_URL = 'http://localhost:4444';

  async getSuggestions(callContext) {
    const response = await fetch(`${AI_PROXY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: PRATHAM_TELECALLER_PROMPT
          },
          {
            role: 'user',
            content: buildContextPrompt(callContext)
          }
        ]
      })
    });
  }
  ```

- [ ] **Task 6.2:** Build AI prompts library
  - [ ] Create telecaller system prompt
  - [ ] Add objection handling prompt
  - [ ] Build script suggestion prompt
  - [ ] Add sentiment analysis prompt
  - [ ] Test different scenarios

- [ ] **Task 6.3:** Real-time AI streaming
  - [ ] Stream AI responses via WebSocket
  - [ ] Show typing indicator in HUD
  - [ ] Display suggestions in real-time
  - [ ] Add suggestion feedback (helpful/not)

**Deliverable:** Live AI assistance during calls ✅

---

#### Day 3-4: Speech-to-Text (Optional Phase 1)

- [ ] **Task 7.1:** Choose STT provider
  - [ ] Option A: AssemblyAI (best for Indian English)
  - [ ] Option B: Deepgram (faster, cheaper)
  - [ ] Option C: Whisper (self-hosted, free)
  - [ ] Test accuracy with sample calls
  - [ ] Compare pricing

- [ ] **Task 7.2:** Integrate STT
  - [ ] Set up API credentials
  - [ ] Build transcription service
  - [ ] Stream transcription to UI
  - [ ] Store in database
  - [ ] Add to call history

- [ ] **Task 7.3:** Sentiment analysis
  - [ ] Use AI to analyze transcription
  - [ ] Track sentiment over time
  - [ ] Alert on negative sentiment
  - [ ] Show in manager dashboard

**Deliverable:** (Optional) Live transcription ✅

---

#### Day 5: Customer Context Panel

- [ ] **Task 8.1:** Build interaction timeline
  - [ ] Fetch all previous calls
  - [ ] Show email history (if available)
  - [ ] Display notes from past interactions
  - [ ] Add lead activity log

- [ ] **Task 8.2:** Quick facts panel
  - [ ] Organization/school details
  - [ ] Decision maker info
  - [ ] Budget/pricing info
  - [ ] Previous objections
  - [ ] Competitor mentions

**Deliverable:** 360° lead context ✅

---

### Week 4: Manager Features

#### Day 1-3: Command Center Dashboard (#11)

**File:** `/root/pratham-telehub-poc/frontend/src/pages/ManagerDashboard.jsx`

- [ ] **Task 9.1:** Real-time team status
  - [ ] Live call counter (who's on call now)
  - [ ] Agent availability status
  - [ ] Queue depth per agent
  - [ ] Average wait time

- [ ] **Task 9.2:** Performance metrics
  - [ ] Calls per hour (per agent)
  - [ ] Conversion rates (today/week/month)
  - [ ] Average call duration
  - [ ] First call resolution rate
  - [ ] Callback completion rate

- [ ] **Task 9.3:** Leaderboard
  - [ ] Top performers (by conversions)
  - [ ] Most calls made
  - [ ] Best average call time
  - [ ] Highest customer satisfaction
  - [ ] Add gamification badges

- [ ] **Task 9.4:** Alerts system
  - [ ] Agent idle too long (> 10 min)
  - [ ] Negative sentiment detected
  - [ ] VIP lead not contacted
  - [ ] SLA breach warning
  - [ ] Technical issues (call failures)

**Deliverable:** Full command center ✅

---

#### Day 4-5: Analytics & Reporting

- [ ] **Task 10.1:** Funnel visualization
  ```
  Leads Assigned
    ↓ 80% Attempted
  Calls Made
    ↓ 60% Connected
  Conversations
    ↓ 30% Interested
  Follow-ups Scheduled
    ↓ 15% Converted
  Sales
  ```

- [ ] **Task 10.2:** Campaign performance
  - [ ] Leads by source (website, referral, etc.)
  - [ ] Conversion by source
  - [ ] ROI per campaign
  - [ ] Best performing time slots

- [ ] **Task 10.3:** Export reports
  - [ ] Daily activity report (CSV)
  - [ ] Weekly performance report (Excel)
  - [ ] Monthly analytics (PDF)
  - [ ] Custom date range export

**Deliverable:** Complete analytics ✅

---

## 🎨 SPRINT 3: Polish & Production (Week 5-6)

### Week 5: UI/UX Polish

#### Day 1-2: Design Improvements

- [ ] **Task 11.1:** Consistent design system
  - [ ] Migrate to Tailwind CSS (from vanilla CSS)
  - [ ] Add Shadcn/ui components
  - [ ] Implement dark mode
  - [ ] Responsive mobile layout
  - [ ] Accessibility (WCAG 2.1)

- [ ] **Task 11.2:** Loading states & animations
  - [ ] Skeleton loaders
  - [ ] Smooth transitions
  - [ ] Progress indicators
  - [ ] Success/error toasts
  - [ ] Optimistic updates

- [ ] **Task 11.3:** Error handling
  - [ ] Graceful error messages
  - [ ] Retry mechanisms
  - [ ] Offline mode handling
  - [ ] Network error recovery

**Deliverable:** Professional UI/UX ✅

---

#### Day 3-4: Performance Optimization

- [ ] **Task 12.1:** Frontend optimization
  - [ ] Code splitting (React.lazy)
  - [ ] Image optimization
  - [ ] Bundle size reduction
  - [ ] Memoization (React.memo)
  - [ ] Virtual scrolling (long lists)

- [ ] **Task 12.2:** Backend optimization
  - [ ] Database query optimization
  - [ ] Add database indexes
  - [ ] Redis caching layer
  - [ ] API response compression
  - [ ] Connection pooling

- [ ] **Task 12.3:** Real-time optimization
  - [ ] WebSocket message batching
  - [ ] Reduce emit frequency
  - [ ] Optimize payload size
  - [ ] Client-side caching

**Deliverable:** Fast, smooth performance ✅

---

#### Day 5: Security Hardening

- [ ] **Task 13.1:** Authentication
  - [ ] JWT token implementation
  - [ ] Refresh token mechanism
  - [ ] Password hashing (bcrypt)
  - [ ] Session management
  - [ ] Login rate limiting

- [ ] **Task 13.2:** Authorization
  - [ ] Role-based access control
  - [ ] Agent can only see own leads
  - [ ] Manager can see team data
  - [ ] Admin has full access
  - [ ] API endpoint protection

- [ ] **Task 13.3:** Data security
  - [ ] SQL injection prevention
  - [ ] XSS protection
  - [ ] CSRF tokens
  - [ ] Input validation (all endpoints)
  - [ ] Secure headers

**Deliverable:** Production-grade security ✅

---

### Week 6: Testing & Deployment

#### Day 1-2: Testing

- [ ] **Task 14.1:** Unit tests
  - [ ] Backend API tests (Jest)
  - [ ] Frontend component tests (React Testing Library)
  - [ ] Service layer tests
  - [ ] 70%+ code coverage

- [ ] **Task 14.2:** Integration tests
  - [ ] End-to-end call flow
  - [ ] Lead assignment flow
  - [ ] Disposition workflow
  - [ ] Manager dashboard updates

- [ ] **Task 14.3:** Load testing
  - [ ] 30 concurrent users
  - [ ] 20 simultaneous calls
  - [ ] 1000 leads in database
  - [ ] WebSocket stability
  - [ ] Database performance

**Deliverable:** Tested, stable system ✅

---

#### Day 3-4: Production Deployment

- [ ] **Task 15.1:** Infrastructure setup
  - [ ] Set up production server
  - [ ] Configure PM2 for process management
  - [ ] Set up Nginx reverse proxy
  - [ ] Configure SSL/HTTPS
  - [ ] Set up monitoring (Datadog/New Relic)

- [ ] **Task 15.2:** Database migration
  - [ ] Backup existing data
  - [ ] Run production migrations
  - [ ] Verify data integrity
  - [ ] Set up automated backups

- [ ] **Task 15.3:** Environment configuration
  ```bash
  # Production .env
  NODE_ENV=production
  PORT=4055
  DB_HOST=localhost
  DB_NAME=ankr_eon
  EXOTEL_SID=xxx
  EXOTEL_TOKEN=xxx
  AI_PROXY_URL=http://localhost:4444
  REDIS_URL=redis://localhost:6379
  ```

**Deliverable:** Live on production server ✅

---

#### Day 5: Training & Handoff

- [ ] **Task 16.1:** User documentation
  - [ ] Telecaller quick start guide
  - [ ] Manager dashboard guide
  - [ ] Admin configuration guide
  - [ ] FAQ document
  - [ ] Video tutorials (5-10 min each)

- [ ] **Task 16.2:** Team training
  - [ ] Telecaller training session (2 hours)
  - [ ] Manager training session (1 hour)
  - [ ] Admin training session (1 hour)
  - [ ] Q&A session
  - [ ] Feedback collection

- [ ] **Task 16.3:** Support setup
  - [ ] Create support email/Slack channel
  - [ ] Document common issues
  - [ ] Set up monitoring alerts
  - [ ] Create runbook for issues

**Deliverable:** Team trained, system live ✅

---

## 🎯 Success Metrics

### Week 2 Milestone
- [ ] 100+ real leads in system
- [ ] Click-to-call working
- [ ] Basic AI suggestions live

### Week 4 Milestone
- [ ] 5 telecallers actively using system
- [ ] 50+ calls made through platform
- [ ] Manager can view real-time metrics
- [ ] Zero critical bugs

### Week 6 Milestone (Production Launch)
- [ ] 30 telecallers onboarded
- [ ] 200+ calls per day
- [ ] 99% uptime
- [ ] Positive feedback from team

---

## 🔥 Critical Blockers & Dependencies

### Must Have Before Week 1:
- [ ] Real lead data from Pratham CRM
- [ ] Exotel account approved
- [ ] Production server access
- [ ] Pratham team contact assigned

### Must Have Before Week 3:
- [ ] Exotel API working
- [ ] 5 pilot telecallers identified
- [ ] ANKR AI Proxy accessible

### Must Have Before Week 6:
- [ ] Production domain/SSL
- [ ] Full team list for training
- [ ] Sign-off from Pratham management

---

## 📋 Daily Standup Checklist

**Every Morning:**
- [ ] What did I complete yesterday?
- [ ] What will I work on today?
- [ ] Any blockers?
- [ ] Update task status in this doc

**Every Evening:**
- [ ] Mark completed tasks with ✅
- [ ] Document any issues
- [ ] Plan tomorrow's tasks
- [ ] Commit code changes

---

## 🚨 Issue Tracker

### Current Issues:
_None yet - add as you encounter them_

### Resolved Issues:
_Track resolved issues here_

---

## 📞 Quick Reference

### Important Links:
- **POC Demo:** http://localhost:3101
- **Backend API:** http://localhost:3100
- **AI Proxy:** http://localhost:4444
- **Database:** ankr_eon (PostgreSQL)

### Important Commands:
```bash
# Start development
cd /root/pratham-telehub-poc
./start.sh

# Stop services
./stop.sh

# Import leads
node import-leads.js

# Check logs
tail -f backend.log
tail -f frontend.log

# Database access
PGPASSWORD="indrA@0612" psql -U ankr -d ankr_eon
```

### Team Contacts:
- **ANKR Lead:** Capt. Anil Sharma
- **Pratham Contact:** [TBD]
- **Exotel Support:** support@exotel.com

---

## 🎉 Celebration Points

**Week 1 Complete:**
🎊 First real leads imported!

**Week 2 Complete:**
🎊 First successful call through Exotel!

**Week 4 Complete:**
🎊 Pilot team using the system!

**Week 6 Complete:**
🎊 PRODUCTION LAUNCH! 🚀

---

**Document Version:** 1.0
**Last Updated:** February 14, 2026
**Status:** Active Sprint
**Next Review:** End of Week 1

🙏 **Jai Guru Ji** | Let's build something amazing! 💪
