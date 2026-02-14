# TeleHub: PBX vs Simple Campaign System

**Date:** February 14, 2026
**Question:** Do we need full PBX or something simpler?

---

## 🤔 What You Actually Need (Pratham Use Case)

### Your Core Requirements:
1. ✅ **Outbound calls** - Call 1000s of students daily
2. ✅ **IVR menus** - "Press 1 for Math, 2 for English"
3. ✅ **SMS reminders** - "Your lesson starts at 9 AM"
4. ✅ **WhatsApp notifications** - Course updates
5. ✅ **Campaign scheduling** - Automate daily calls
6. ✅ **Multi-provider** - Failover if one fails
7. ✅ **White-label** - Rebrand for different schools

### What You DON'T Need:
- ❌ Extensions (101, 102, etc.) - Not a call center
- ❌ Call queues - No inbound support calls
- ❌ Agent routing - No human agents
- ❌ Call transfer - All automated
- ❌ Voicemail - One-way communication

---

## 📊 Comparison

| Feature | Full PBX | Simple Campaign System | You Need? |
|---------|----------|------------------------|-----------|
| **Outbound Calls** | ✅ Yes | ✅ Yes | ✅ **YES** |
| **IVR (Menu System)** | ✅ Yes | ✅ Yes | ✅ **YES** |
| **SMS Sending** | ✅ Yes | ✅ Yes | ✅ **YES** |
| **WhatsApp** | ✅ Yes | ✅ Yes | ✅ **YES** |
| **Campaign Scheduling** | ✅ Yes | ✅ Yes | ✅ **YES** |
| **Multi-Provider** | ✅ Yes | ✅ Yes | ✅ **YES** |
| **White-Label** | ✅ Yes | ✅ Yes | ✅ **YES** |
| **Extensions (101, 102)** | ✅ Yes | ❌ No | ❌ **NO** |
| **Call Queues** | ✅ Yes | ❌ No | ❌ **NO** |
| **Agent Routing** | ✅ Yes | ❌ No | ❌ **NO** |
| **Inbound Handling** | ✅ Yes | ⚠️ Basic | ⚠️ **MAYBE** |
| **Call Transfer** | ✅ Yes | ❌ No | ❌ **NO** |
| **Voicemail** | ✅ Yes | ❌ No | ❌ **NO** |

---

## 🎯 Recommendation: **Hybrid Approach**

Build a **Campaign-First System** with **Optional PBX Features**:

```
┌─────────────────────────────────────────────┐
│   ANKR TeleHub Core (Campaign System)      │
│   - Outbound calls                          │
│   - IVR flows                               │
│   - SMS/WhatsApp                            │
│   - Multi-provider                          │
│   - White-label                             │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼──────────┐
│  PBX Module    │    │  Simple Mode      │
│  (Optional)    │    │  (Default)        │
│                │    │                   │
│  - Extensions  │    │  - Just campaigns │
│  - Queues      │    │  - Just IVR       │
│  - Agents      │    │  - Just SMS       │
└────────────────┘    └───────────────────┘
```

---

## 💡 Alternative: Use Existing PBX Services

Instead of building PBX from scratch, integrate with existing services:

### Option 1: **Exotel** (India's Best PBX)
**What:** Cloud PBX service for India
**Pricing:** ₹0.50/min for calls, ₹0.20/SMS
**Features:**
- ✅ Extensions, queues, routing (built-in)
- ✅ API for automation
- ✅ India numbers
- ✅ Dashboard included

**Verdict:** More expensive than MSG91, but PBX features ready

### Option 2: **Knowlarity** (Another India PBX)
**What:** Cloud contact center
**Pricing:** ₹0.60/min
**Features:**
- ✅ Full PBX
- ✅ Call tracking
- ✅ Analytics

**Verdict:** Good, but expensive

### Option 3: **MSG91 + Custom Routing** (Cheapest)
**What:** Use MSG91 for calls/SMS + build simple routing
**Pricing:** ₹0.30/min, ₹0.15/SMS
**Features:**
- ✅ Cheapest
- ✅ Good quality
- ❌ No built-in PBX
- ✅ We build what we need

**Verdict:** Best for Pratham (education use case)

---

## 🏗️ Recommended Architecture

### Phase 1: MVP (Education Focus)
```
ANKR TeleHub - Simple Campaign System
├── Multi-Provider (MSG91, Twilio, Plivo)
├── Outbound Campaigns
│   ├── Voice calls with IVR
│   ├── SMS messaging
│   └── WhatsApp notifications
├── IVR Builder
│   ├── Visual flow designer
│   ├── DTMF input
│   └── TTS/recordings
├── Campaign Scheduler
│   ├── Daily/weekly schedules
│   ├── Bulk sending
│   └── Progress tracking
└── White-Label
    ├── Custom branding
    ├── Multi-tenant
    └── Custom domains
```

**Database Tables:**
- ✅ Tenant (white-label)
- ✅ Campaign
- ✅ Call
- ✅ Message
- ✅ IVRFlow
- ❌ ~~Extension~~ (skip for now)
- ❌ ~~CallQueue~~ (skip for now)
- ❌ ~~Agent~~ (skip for now)

**Benefits:**
- 🚀 Faster to build (2 weeks vs 2 months)
- 💰 Cheaper (no complex routing)
- 🎯 Focused on actual needs
- 📈 Can add PBX later if needed

---

## 🎬 What to Build

### Core Features (Must Have):
1. **Multi-Provider Abstraction**
   - MSG91 (primary - cheapest)
   - Twilio (fallback - reliable)
   - Plivo (fallback - quality)

2. **Campaign Manager**
   - Schedule voice/SMS/WhatsApp campaigns
   - Bulk sending with throttling
   - Status tracking

3. **IVR Flow Builder**
   - Visual designer
   - DTMF handling
   - TTS/recording playback

4. **White-Label Multi-Tenant**
   - Custom branding per tenant
   - Isolated data
   - Custom domain support

5. **Analytics Dashboard**
   - Call/SMS delivery rates
   - Costs per campaign
   - User engagement metrics

### PBX Features (If Needed Later):
1. **Extensions** - If you need internal numbers
2. **Call Queues** - If you add customer support
3. **Agent Management** - If you hire support team

---

## 💰 Cost Comparison (10,000 students/day)

### Scenario: Call 10,000 students, 2 min avg, daily

| Provider | Per-Min Cost | Daily Cost | Monthly Cost |
|----------|-------------|------------|--------------|
| **MSG91** | ₹0.30 | ₹6,000 | ₹1,80,000 |
| **Exotel** | ₹0.50 | ₹10,000 | ₹3,00,000 |
| **Knowlarity** | ₹0.60 | ₹12,000 | ₹3,60,000 |
| **Twilio** | ₹1.20 | ₹24,000 | ₹7,20,000 |

**Recommendation:** Use MSG91 as primary, Twilio as failover

**Savings:** ₹1.2L/month vs Exotel, ₹5.4L/month vs Twilio!

---

## 🎯 Decision Time

### Questions to Answer:

1. **Do you need inbound call handling?**
   - No → Simple campaign system ✅
   - Yes → Need PBX features

2. **Do you need human agents?**
   - No → No queue/routing needed ✅
   - Yes → Need PBX features

3. **Do you need call transfer?**
   - No → Simple is fine ✅
   - Yes → Need PBX

4. **Do you need internal extensions?**
   - No → Skip extensions ✅
   - Yes → Need PBX

### My Recommendation:

**Start with Simple Campaign System** because:
- ✅ Faster to build (2 weeks)
- ✅ Cheaper to operate
- ✅ Covers 90% of your needs
- ✅ Can add PBX later if needed

**Core Stack:**
```
ANKR TeleHub Lite
├── MSG91 (primary provider - ₹0.30/min)
├── Campaign System
├── IVR Builder
├── SMS/WhatsApp
└── White-Label Multi-Tenant
```

---

## 🚀 Next Steps

**Option A: Simple Campaign System** (Recommended)
- Skip PBX complexity
- Focus on campaigns + IVR
- Use MSG91 for cost savings
- Build time: ~2 weeks

**Option B: Full PBX System**
- Include extensions, queues
- More complex architecture
- Higher cost
- Build time: ~2 months

**Option C: Hybrid**
- Start simple
- Add PBX module later
- Progressive enhancement

---

**Which approach do you prefer?**

1. **Simple & Fast** - Campaign system only
2. **Full PBX** - Complete call center
3. **Hybrid** - Start simple, add PBX later
4. **Use Exotel** - Pay for ready PBX
