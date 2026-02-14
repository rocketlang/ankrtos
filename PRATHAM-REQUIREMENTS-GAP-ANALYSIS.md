# Pratham TeleHub - Requirements Gap Analysis
**Date:** February 14, 2026
**Based on:** Pratham CRM Requirements Spreadsheet

---

## 📊 Executive Summary

**Total Requirements:** 12 functional screens/features
**Current Status:**
- ✅ **Fully Complete:** 2 (17%)
- 🔄 **Partially Complete:** 3 (25%)
- ❌ **Not Started:** 7 (58%)

**Estimated Development:** 8-12 weeks for remaining features

---

## 🎯 Detailed Gap Analysis

### **PHASE 1 - Core Features (5 Requirements)**

#### ✅ #1: Lead Ingestion Manager (Admin)
**Status:** EXISTS ✅
**Current Implementation:**
- CSV upload capability ✓
- Manual entry support ✓
- Basic data normalization ✓

**What's Missing:**
- Landing page API integration
- Source mapping table UI
- Real-time API status indicators

**Effort:** 1 week to add missing features

---

#### ✅ #2: Lead Distribution Engine (Admin)
**Status:** EXISTS ✅
**Current Implementation:**
- Basic assignment logic ✓
- Random assignment ✓

**What's Missing:**
- Round-robin algorithm
- Source-based routing
- Language-based routing
- Agent group selection UI
- Assignment rules configuration
- Auto-assign toggle

**Effort:** 2 weeks for complete rules engine

---

#### 🔄 #3: The Smart Queue (Telecaller)
**Status:** PARTIAL - Needs Modification ⚠️
**Current Implementation:**
- Assigned leads list ✓
- Basic priority sorting ✓
- Click-to-call button ✓

**What's Missing:**
- Fresh/Callback/Retry categorization
- Hot/Warm/Cold priority tags
- Advanced filtering (by source, date, score)
- Analytics integration (call history inline)
- Lead age indicators
- Last contact timestamp

**Effort:** 1 week

---

#### ❌ #4: Active Call HUD (Heads Up Display)
**Status:** DOES NOT EXIST ❌
**Required Features:**
- Exotel/Twilio bridge integration
- WebSocket screen pop on call connect
- Customer demographics display
- Lead source context
- Script/talking points box
- Call controls (mute, hold, transfer, hangup)
- Real-time call timer
- Recording indicator

**Effort:** 3 weeks
**Dependencies:** Exotel/Twilio account setup

---

#### 🔄 #5: Active Call Disposition
**Status:** PARTIAL - Needs Upgrade ⚠️
**Current Implementation:**
- Basic disposition codes ✓
- Call notes field ✓

**What's Missing:**
- Comprehensive disposition codes:
  - Connected (Interested, Not Interested, Callback, Wrong Number)
  - Not Connected (Busy, No Answer, Out of Service)
  - Special (DND, Language Barrier, Escalate)
- Auto-reschedule logic for "Callback"
- Next action buttons (Schedule Visit, Send Email, Add to Campaign)
- Mandatory field validation
- Quick disposition shortcuts (keyboard shortcuts)

**Effort:** 1 week

---

### **PHASE 2 - Automation & Logistics (4 Requirements)**

#### ❌ #6: Campaign Automation Builder (Admin)
**Status:** DOES NOT EXIST ❌
**Required Features:**
- Drip sequence builder (visual timeline)
- WhatsApp Business API integration
- SMTP provider integration
- Template editor (text + media)
- Trigger conditions (T+0, T+24hrs, etc.)
- A/B testing capability
- Campaign analytics dashboard

**Effort:** 4 weeks
**Dependencies:** WhatsApp Business API account, SMTP service

---

#### ❌ #7: Visit Scheduler (Telecaller)
**Status:** DOES NOT EXIST ❌
**Required Features:**
- Center assignment logic (by pincode/location)
- Calendar slot booking
- Map view with center locations
- Pincode-based center finder
- Available field agents list
- Appointment calendar (day/week/month views)
- Conflict detection
- SMS/Email confirmation

**Effort:** 3 weeks

---

#### ❌ #8: My Visits - Mobile View (Field Agent)
**Status:** DOES NOT EXIST ❌
**Required Features:**
- Mobile-responsive UI (PWA)
- Daily agenda list
- Geolocation check-in
- Navigate button (Google Maps integration)
- Customer address & phone
- Visit notes capture
- Photo upload capability
- Offline mode support

**Effort:** 3 weeks
**Tech Stack:** React Native or PWA

---

#### ❌ #9: Sale/Closure Form (Field Agent)
**Status:** DOES NOT EXIST ❌
**Required Features:**
- Lead status update to "Closed-Won"
- Product selection dropdown
- Pricing & discount fields
- Upload proof (image/signature)
- Invoice generation trigger
- Welcome email automation
- Payment collection tracking

**Effort:** 2 weeks

---

### **PHASE 3 - Intelligence & Analytics (3 Requirements)**

#### ❌ #10: Customer 360 History (Telecaller)
**Status:** DOES NOT EXIST ❌
**Required Features:**
- Timeline view of all interactions
- Email open tracking
- Website visit tracking
- Previous call recordings playback
- WhatsApp message history
- Lead activity feed
- Objection handling cheat-sheet
- Similar customer suggestions

**Effort:** 4 weeks
**Dependencies:** Email tracking, web analytics integration

---

#### ❌ #11: Command Center Dashboard (Admin)
**Status:** DOES NOT EXIST ❌
**Required Features:**
- Live call counter
- Agent leaderboard (real-time)
- Funnel visualization (Leads → Calls → Visits → Sales)
- Call duration metrics
- Conversion rates by agent/campaign/source
- Campaign performance analytics
- Agent activity timeline
- Real-time alerts
- Export to Excel/PDF

**Effort:** 3 weeks

---

#### ❌ #12: Sales Empowerment Panel (Telecaller)
**Status:** DOES NOT EXIST ❌
**Required Features:**
- Deep insights panel (side drawer)
- Previous interaction timeline
- Audio playback of past calls
- Website click history
- FAQ/Script search
- Objection library
- Product knowledge base
- Competitive intelligence

**Effort:** 3 weeks
**Dependencies:** EON/PageIndex integration

---

## 📅 Recommended Implementation Roadmap

### **Sprint 1-2 (Weeks 1-4): Complete Phase 1 Core**

**Priority: HIGH** - Foundation for all operations

- [ ] Week 1: Upgrade #3 (Smart Queue analytics)
- [ ] Week 1: Enhance #5 (Disposition codes)
- [ ] Week 2: Complete #1 (Lead Ingestion)
- [ ] Weeks 2-3: Build #4 (Active Call HUD) 🔥 **CRITICAL**
- [ ] Week 4: Enhance #2 (Distribution Engine)

**Deliverable:** Telecallers can make calls with full HUD

---

### **Sprint 3-4 (Weeks 5-8): Phase 2 Logistics**

**Priority: MEDIUM** - Field operations

- [ ] Weeks 5-6: Build #7 (Visit Scheduler)
- [ ] Week 7: Build #9 (Sale/Closure Form)
- [ ] Week 8: Build #8 (Mobile Visits App)

**Deliverable:** End-to-end field visit workflow

---

### **Sprint 5-6 (Weeks 9-12): Phase 3 Intelligence**

**Priority: HIGH** - Competitive advantage

- [ ] Weeks 9-10: Build #6 (Campaign Automation) 🔥 **HIGH ROI**
- [ ] Week 11: Build #10 (Customer 360)
- [ ] Week 11: Build #11 (Command Center)
- [ ] Week 12: Build #12 (Empowerment Panel)

**Deliverable:** Full AI-powered intelligence platform

---

## 💰 Development Effort Summary

| Phase | Features | Weeks | Developer-Weeks |
|-------|----------|-------|-----------------|
| Phase 1 - Core | 5 | 4 weeks | 6 dev-weeks |
| Phase 2 - Logistics | 4 | 4 weeks | 8 dev-weeks |
| Phase 3 - Intelligence | 3 | 4 weeks | 10 dev-weeks |
| **Total** | **12** | **12 weeks** | **24 dev-weeks** |

**Team Size:** 2-3 developers
**Timeline:** 10-12 weeks (parallel development)

---

## 🔥 Critical Path Features

These features are **blockers** for going live:

1. **#4: Active Call HUD** - Can't make effective calls without this
2. **#6: Campaign Automation** - High ROI, essential for scale
3. **#11: Command Center** - Managers need visibility

**Recommendation:** Build these 3 first (7 weeks total)

---

## 🎯 Quick Wins (Low Effort, High Impact)

1. **#3: Smart Queue Enhancement** (1 week) - Immediate productivity boost
2. **#5: Disposition Upgrade** (1 week) - Better data capture
3. **#1: Lead Ingestion** (1 week) - More lead sources

**Total:** 3 weeks for 40% improvement in current system

---

## 🛠️ Technical Dependencies

### External Services Needed:

1. **Exotel/Twilio Account**
   - For: #4 (Call HUD)
   - Cost: ₹30-40k/month
   - Setup: 1 week

2. **WhatsApp Business API**
   - For: #6 (Campaign Automation)
   - Cost: ₹2-5k/month
   - Setup: 2-3 weeks (approval process)

3. **Email Service (SendGrid/AWS SES)**
   - For: #6 (Campaign Automation), #10 (Tracking)
   - Cost: ₹1-2k/month
   - Setup: 1 day

4. **Google Maps API**
   - For: #7 (Visit Scheduler), #8 (Field Agent)
   - Cost: ₹2-3k/month
   - Setup: 1 day

5. **Web Analytics (Mixpanel/Amplitude)**
   - For: #10 (Customer 360)
   - Cost: Free tier available
   - Setup: 1 week integration

---

## 📊 Current vs Required State

### What We Have (POC):
```
✅ Basic lead list
✅ Simple telecaller dashboard
✅ Manager metrics view
✅ WebSocket real-time updates
✅ PostgreSQL database
✅ Sample data
```

### What We Need (Production):
```
❌ Full Call HUD with PBX integration
❌ Campaign automation
❌ Field visit management
❌ Customer 360 view
❌ Command center analytics
❌ Mobile app for field agents
❌ Advanced lead routing
❌ Sales empowerment AI
```

**Gap:** ~60% of required functionality missing

---

## 🚀 Recommended Next Steps

### Option 1: MVP Launch (6 weeks)
**Build Critical Path Only:**
- Active Call HUD (#4) - 3 weeks
- Smart Queue + Disposition (#3, #5) - 1 week
- Command Center (#11) - 2 weeks

**Outcome:** Basic but functional telecalling system

---

### Option 2: Full Platform (12 weeks)
**Build Everything:**
- All 12 features
- Complete automation
- Field agent support
- Full analytics

**Outcome:** World-class sales automation platform

---

### Option 3: Phased Rollout (Recommended)
**Phase 1:** MVP Launch (6 weeks)
**Phase 2:** Add automation + field ops (4 weeks)
**Phase 3:** Add intelligence layer (4 weeks)

**Outcome:** Fast time-to-value, iterative feedback

---

## 📋 Immediate Action Items

### This Week:
1. [ ] Import real lead data from spreadsheet
2. [ ] Set up Exotel/Twilio account
3. [ ] Finalize requirements with Pratham team
4. [ ] Choose implementation approach (MVP vs Full)

### Next Week:
1. [ ] Start #4 (Call HUD) development
2. [ ] Enhance #3 (Smart Queue)
3. [ ] Upgrade #5 (Disposition)

---

## 💡 Key Insights

1. **Current POC covers only 40% of requirements**
2. **Call HUD is the most critical missing piece**
3. **Campaign automation has highest ROI**
4. **Field operations are completely new scope**
5. **Intelligence features need external integrations**

---

**Next Step:** Should we start with:
- 🏃 **Quick Win:** Import your leads and enhance Smart Queue (1 week)?
- 🚀 **Critical Path:** Build Call HUD with Exotel integration (3 weeks)?
- 📋 **Full Plan:** Detailed sprint planning for all 12 features?

---

**Prepared by:** ANKR Labs
**Document:** Requirements Gap Analysis v1.0
**Date:** February 14, 2026
