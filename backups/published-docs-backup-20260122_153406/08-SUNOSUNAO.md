# SunoSunao - Digital Will & Voice Legacy Platform

> **Preserve Your Voice for Future Generations**

**Platform:** SunoSunao (सुनो-सुनाओ = "Listen & Tell")
**Category:** Digital Estate Planning / Voice Legacy
**Status:** Production Path Ready (55% Complete)
**Estimated Value:** $3-5M

---

## Executive Summary

SunoSunao is a multilingual **voice legacy platform** that enables users to record voice messages for future delivery - creating digital time capsules of memories, birthday wishes, life advice, and final words that can be automatically delivered on specific dates, birthdays, ages, or after the creator passes away.

---

## Platform Metrics

| Metric | Value |
|--------|-------|
| **Languages Supported** | 103 (21 Indian + 82 International) |
| **Database Models** | 13 Prisma tables |
| **Trigger Types** | 4 (Date, Birthday, Age, Death) |
| **Voice Providers** | 6 (Sarvam, VibeVoice, IndicF5, XTTS, Whisper, MMS) |
| **Subscription Tiers** | 4 (Free, Family, Legacy, Forever) |
| **Architecture Completion** | 95% |
| **Overall Completion** | 55% |

---

## Technology Stack

### Backend
- **Framework:** Fastify 5.2.1
- **GraphQL:** Mercurius 16.0.1 + Pothos 4.3.0
- **ORM:** Prisma 6.2.1
- **Database:** PostgreSQL 16-alpine
- **Cache:** Redis 7-alpine
- **Validation:** Zod
- **Auth:** JWT (jsonwebtoken 9.0.2)
- **OTP:** Twilio/MSG91
- **Storage:** Cloudflare R2

### Frontend
- **Framework:** React 19.2.0 + Vite 7.2.4
- **GraphQL:** Apollo Client 4.0.10
- **Styling:** Tailwind CSS 4.1.18
- **i18n:** i18next 25.7.3
- **Routing:** React Router 7.10.1

---

## Core Features

### 1. Voice Message Recording
- Browser-based MediaRecorder API
- Unlimited length recordings
- Multi-chapter voice stories (Story + StoryChapter models)
- Transcription and translation

### 2. Family Groups & Beneficiaries
- Hierarchical family management
- Relationship tracking (parent, child, grandparent, etc.)
- Generation level tracking for family tree
- Contact import (bulk)
- Multiple recipients per message

### 3. Delivery Trigger System
Four distinct trigger mechanisms:

| Trigger | Description |
|---------|-------------|
| **Date-based** | Deliver on specific scheduled date |
| **Birthday-triggered** | Deliver on recipient's birthday |
| **Age-triggered** | Deliver when recipient reaches specific age |
| **Death-triggered** | Deliver immediately after user death verification |

### 4. Voice Cloning
- Coqui XTTS integration
- Ethical consent-first model
- Quality scoring (0-100)
- Sample processing pipeline

---

## Death Trigger System

### Death Verification Flow
```typescript
async function initiateDeathVerification(userId, reportedBy)
async function triggerDeathDelivery(userId)
```

### Process
1. Family member reports death
2. Trusted contacts notified for verification
3. Grace period implemented (prevents false positives)
4. Upon confirmation:
   - User marked as `isDeceased: true`
   - `dateOfDeath` timestamp recorded
   - All death-triggered messages immediately delivered

---

## Age Trigger System

### Age Calculation Logic
```typescript
checkAgeTrigger(recipients, targetAge) {
  for each recipient:
    age = today.diff(dateOfBirth, 'year')
    if age === targetAge:
      birthdayThisYear = dateOfBirth.year(today.year())
      daysSinceBirthday = today.diff(birthdayThisYear, 'day')
      if daysSinceBirthday >= 0 && < 1:
        return true
}
```

### Examples
- Grandparent records: "Listen when you turn 18"
- Parent records: "Your college fund access at 21"
- Terminal patient: "Life advice at 30"

---

## Database Schema (13 Models)

### Core Models
```prisma
User {
  id, phone, name, email, dateOfBirth
  primaryLanguage, avatarUrl
  isDeceased, dateOfDeath
  subscriptionTier
}

VoiceMessage {
  id, creatorId, title, description
  audioUrl, transcript, language, duration
  status: draft|scheduled|delivered
  deliveryTrigger: date|birthday|age|death
  cloneId
}

MessageRecipient {
  id, messageId, recipientId
  status: pending|delivered|read
  deliveredAt, viewedAt, viewCount
}

DeliverySchedule {
  id, messageId, triggerType
  deliverOn, triggerAge
  status: active|delivered|cancelled
}

Family {
  id, name, description, adminUserId
}

FamilyMember {
  id, familyId, userId
  relationship, nickname, role, generation
}

Story {
  id, creatorId, title, category, isPublic
}

StoryChapter {
  id, storyId, messageId, chapterNumber, title
}

VoiceClone {
  id, ownerId, name, modelPath
  status, qualityScore, consentAudio
}

VoiceSample {
  id, cloneId, audioUrl, duration
}
```

---

## Delivery Scheduler Service

### Cron Jobs
- **Hourly:** `0 * * * *` - Check for due deliveries
- **Midnight:** `0 0 * * *` - Birthday checks

### Delivery Flow
1. Status update: `pending` → `delivered`
2. Message status updated
3. Schedule updated with `deliveredAt`
4. Notification sent (SMS/WhatsApp)

---

## Document Vault (Cloudflare R2)

### Storage Categories
```typescript
type FileCategory = 'messages' | 'clones' | 'samples' | 'avatars'
```

### Features
- Base64 & Buffer upload support
- Automatic key generation
- Signed URLs for secure download (7-day expiry)
- User audit trail

---

## Security Features

### Authentication
- OTP-Based Phone Authentication
- Primary: MSG91 (approved in India)
- Fallback: Twilio Verify
- JWT tokens (7-day expiry)

### Guardrails & Content Safety
**Voice Clone Abuse Prevention:**
- Block celebrity voice cloning (Modi, Shah, SRK, etc.)
- Rate limiting: Max 3 clones per user

**Synthesis Content Filtering:**
- Block financial fraud attempts (OTP, bank, PIN)
- Block threats (bomb, kill, attack)

### Audit Trail
- All cloning, synthesis, delivery logged
- Watermarked with cloneId, userId, timestamp

---

## Subscription Tiers

| Tier | Price | Features | Storage |
|------|-------|----------|---------|
| **Free** | ₹0 | 5 messages/month, 2 min each | 1 year |
| **Family** | ₹99/month | Unlimited messages, 5 family members | 5 years |
| **Legacy** | ₹999/year | Voice cloning, priority delivery | 50 years |
| **Forever** | ₹9,999 one-time | Lifetime storage, unlimited cloning | Lifetime |

---

## Voice Engine (6 Providers)

| Provider | Languages | Model | Use Case | Cost |
|----------|-----------|-------|----------|------|
| **Sarvam AI** | 11 Indian | Bulbul:v2 | Primary Indian TTS | $0.0018/char |
| **VibeVoice** | English | Low-latency | English premium | Free |
| **IndicF5** | 21 Indian | Open-source | Regional fallback | Free |
| **Coqui XTTS** | 16 | Voice cloning | Clone synthesis | Free |
| **Whisper** | 100+ | OpenAI | Speech-to-text | Free |
| **Meta MMS** | 1100+ | Universal | Ultimate fallback | Free |

---

## API Endpoints

### Authentication
```
POST /auth/otp/send           - Send OTP
POST /auth/otp/verify         - Verify OTP, get JWT
GET  /auth/me                 - Get profile
```

### Family Management
```
POST /family                  - Create family
GET  /family/tree             - Get family tree
POST /family/:id/member       - Add member
POST /contacts/import         - Bulk import
```

### Voice Messages
```
POST /messages                - Create message
GET  /messages                - List messages
POST /upload/audio            - Upload audio
POST /messages/:id/deliver    - Manual delivery
```

### Voice Cloning
```
POST /voice-clones            - Create clone
POST /voice-clones/:id/samples - Upload sample
POST /voice-clones/:id/synthesize - Synthesize
```

### Stories
```
POST /stories                 - Create story
POST /stories/:id/chapters    - Add chapter
POST /stories/:id/publish     - Publish story
```

---

## Use Cases

1. **Grandparents:** Leave voice messages for grandchildren's milestones
2. **Terminal Patients:** Be present for children's future events
3. **Emigrants:** Preserve family voices across geography
4. **Young Parents:** Record memories while children grow
5. **Communities:** Preserve oral histories, traditions

---

## Competitive Advantages

| Feature | SunoSunao | Competitors |
|---------|-----------|------------|
| Indian Languages | 21 native | 2-3 basic |
| Voice Cloning | Yes (XTTS) | Limited |
| Death Triggers | Yes (multi-step) | No |
| Age Triggers | Yes (smart calc) | No |
| TTS Providers | 6+ | 1-2 |
| Storage Duration | 50-lifetime years | 5-10 years |
| Trigger Types | 4 | 1-2 |

---

## Market Opportunity

- **India:** 400M elderly with family overseas
- **Global:** 1.5B people wanting to preserve legacy
- **Death Industry:** 10M deaths/year in India × ₹5000+ per customer

---

## Investment Highlights

1. **Unique Product:** Voice legacy with death/age triggers
2. **103 Languages:** Global reach with Indian native support
3. **Ethical Voice Cloning:** Consent-first architecture
4. **Multiple Revenue Streams:** Subscription + one-time + B2B
5. **Network Effects:** Family invites drive viral growth

---

*Document Classification: Investor Confidential*
*Last Updated: 19 Jan 2026*
*Source: /root/ankr-labs-nx/packages/sunosunao/*
