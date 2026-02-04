# Phase 36: Email Intelligence Engine - MVP Implementation Plan
## Priority 3: AI-Powered Email Classification & Entity Extraction
**Created**: February 2, 2026 11:25 UTC

---

## 🎯 EXECUTIVE SUMMARY

**Market**: Brokers and operators receiving 500-2,000 emails/day
**Pain Point**: Manual email sorting, missing critical cargo enquiries, lost fixtures
**Solution**: AI-powered email classification (13 categories) + entity extraction
**Time to Market**: 4-6 weeks (MVP), 3 months (full)
**Processing**: <2 seconds per email, 95%+ accuracy

**Value Proposition**: Reduce email triage time from 2 hours/day to 15 minutes (87% reduction)

---

## 📋 PROBLEM STATEMENT

### Broker's Daily Email Nightmare

**Volume**: 500-2,000 emails/day
- 200+ cargo enquiries
- 150+ vessel position updates
- 100+ fixture recaps
- 50+ bunker enquiries
- 500+ spam/irrelevant

**Current Process** (Manual):
1. Read subject line (5 seconds)
2. Skim email body (10-30 seconds)
3. Decide category (5 seconds)
4. File to folder or flag for action (5 seconds)
5. **Total**: 25-45 seconds per email = **4-6 hours/day**

**Problems**:
- ❌ Missed cargo enquiries (lost revenue)
- ❌ Delayed responses (poor customer service)
- ❌ Manual data entry from emails
- ❌ No searchable history
- ❌ No automation/workflows

---

## 🚀 SOLUTION OVERVIEW

### Core Features (MVP)

**1. 13-Category Email Classification**
- cargo_enquiry, vessel_position, fixture_recap, laytime_calculation
- bunker_enquiry, port_charges, survey_report, ais_alert
- compliance_notification, market_report, ops_update, general, spam
- ML model: 95%+ accuracy (BERT-based)

**2. Entity Extraction**
- Vessel names → IMO number lookup
- Port names → UNLOCODE matching
- Cargo types → HS code mapping
- Dates → laycan, ETA, delivery
- Rates → freight, hire, demurrage
- 92%+ extraction accuracy

**3. Smart Actions & Workflows**
- Auto-create CargoEnquiry from cargo_enquiry email
- Auto-update VesselPosition from position report
- Auto-file FixtureRecap to deal folder
- Alert on laytime_calculation disputes
- Flag urgent emails (red priority)

**4. Universal Email Connectors**
- Microsoft 365 (Graph API)
- Gmail (Gmail API)
- IMAP/SMTP (generic email servers)
- Auto-sync every 5 minutes
- Support shared mailboxes (chartering@company.com)

---

## 🏗️ TECHNICAL ARCHITECTURE

### Tech Stack

**ML/AI**:
- @ankr/eon for LLM inference
- Hugging Face Transformers (BERT, RoBERTa)
- Named Entity Recognition (spaCy + custom maritime NER)
- Text classification (fine-tuned DistilBERT)

**Backend**:
- Node.js + TypeScript
- BullMQ for job queue
- Redis for caching
- PostgreSQL for storage

**Email Connectors**:
- @microsoft/microsoft-graph-client (Microsoft 365)
- googleapis (Gmail)
- node-imap (IMAP/SMTP)

---

## 🗄️ DATABASE SCHEMA

### Email Tables

```prisma
// Email Message (already exists, enhance)
model EmailMessage {
  id              String   @id @default(cuid())
  organizationId  String

  // Email Headers
  from            String
  to              String[]
  cc              String[]
  subject         String
  receivedAt      DateTime
  messageId       String   @unique  // RFC822 Message-ID

  // Body
  body            String   @db.Text
  bodyHtml        String?  @db.Text
  bodyPlain       String?  @db.Text

  // Classification
  category        String?  // cargo_enquiry, vessel_position, etc.
  categoryConfidence Float? // 0.0-1.0
  isSpam          Boolean  @default(false)
  spamScore       Float?   // 0.0-1.0

  // Priority
  priority        String?  // high, normal, low
  isUrgent        Boolean  @default(false)

  // Status
  status          String   @default("unread")  // unread, read, archived, deleted
  isStarred       Boolean  @default(false)

  // Extracted Entities
  extractedEntities Json?  // { vessels: [...], ports: [...], cargos: [...], dates: [...], rates: [...] }

  // Smart Actions
  autoActions     Json?  // { createdCargoEnquiry: "id", updatedPosition: "id" }

  // Attachments
  hasAttachments  Boolean  @default(false)
  attachmentCount Int      @default(0)
  attachments     EmailAttachment[]

  // Thread
  threadId        String?
  isReply         Boolean  @default(false)
  replyToId       String?

  // Relations
  organization    Organization @relation(fields: [organizationId], references: [id])
  cargoEnquiry    CargoEnquiry?
  vesselPosition  VesselPosition?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([organizationId, category, receivedAt])
  @@index([from, receivedAt])
  @@index([category, isUrgent])
}

// Email Attachments
model EmailAttachment {
  id          String   @id @default(cuid())
  emailId     String

  filename    String
  mimeType    String
  size        Int      // bytes
  content     Bytes?   // Store small attachments inline
  url         String?  // S3/MinIO URL for large files

  email       EmailMessage @relation(fields: [emailId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())

  @@index([emailId])
}

// Email Sync Status
model EmailSyncStatus {
  id              String   @id @default(cuid())
  organizationId  String
  connector       String   // microsoft365, gmail, imap
  email           String   // user@example.com

  lastSyncAt      DateTime?
  lastMessageId   String?
  syncStatus      String   // idle, syncing, error
  errorMessage    String?

  // Stats
  totalEmails     Int      @default(0)
  unreadEmails    Int      @default(0)
  lastError       DateTime?

  organization    Organization @relation(fields: [organizationId], references: [id])

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([organizationId, connector, email])
}
```

---

## 🤖 EMAIL CLASSIFICATION

### 13 Categories

1. **cargo_enquiry**: "We have 70,000 MT wheat ex USNYC for INMUN, laycan 1-5 March..."
2. **vessel_position**: "MV CAPE GLORY - Position Update - LAT 25.3N LON 68.5E..."
3. **fixture_recap**: "Fixture Confirmation - VCH-2026-001 - CAPE GLORY..."
4. **laytime_calculation**: "Laytime Statement - MV PANAMAX STAR - Loading completed..."
5. **bunker_enquiry**: "Bunker prices SGP 380cst - $450/MT..."
6. **port_charges**: "Proforma DA - CAPE GLORY - Port of Mumbai..."
7. **survey_report**: "Draft Survey Report - MV HANDYMAX PRIDE..."
8. **ais_alert**: "AIS Alert - CAPE GLORY entered Singapore port limits..."
9. **compliance_notification**: "SIRE Inspection scheduled - MV VLCC TITAN..."
10. **market_report**: "Baltic Dry Index - Capesize rates up 3%..."
11. **ops_update**: "Sailing update - PANAMAX STAR ETD 0600 hrs..."
12. **general**: General business correspondence
13. **spam**: Unsolicited marketing, phishing

### Classification Model

**Training Data**: 10,000+ labeled maritime emails
**Model**: DistilBERT (distilbert-base-uncased)
**Fine-tuning**: 5 epochs, learning rate 2e-5
**Accuracy**: 95%+ on test set

```typescript
import { pipeline } from '@huggingface/transformers';

class EmailClassifier {
  private classifier: any;

  async initialize() {
    this.classifier = await pipeline(
      'text-classification',
      'ankr/maritime-email-classifier'  // Custom fine-tuned model
    );
  }

  async classify(email: { subject: string; body: string }): Promise<Classification> {
    const text = `${email.subject}\n\n${email.body}`;
    const result = await this.classifier(text);

    return {
      category: result[0].label,
      confidence: result[0].score,
    };
  }
}
```

---

## 🔍 ENTITY EXTRACTION

### Extracted Entities

**1. Vessels**:
- Pattern: /M[TV]\s+([A-Z\s]+)/g
- Example: "MV CAPE GLORY" → Look up IMO 9876543
- Confidence: 0.95 if found in database

**2. Ports**:
- Pattern: /\b(SGSIN|INMUN|USNYC|[A-Z]{5})\b/g
- Example: "ex USNYC for INMUN" → USNYC (New York), INMUN (Nhava Sheva)
- UNLOCODE validation
- Confidence: 0.98 if valid UNLOCODE

**3. Cargo Types**:
- Pattern: /(\d+,?\d*)\s*(MT|TONS|CBM|TEU)\s+(\w+)/g
- Example: "70,000 MT wheat" → { quantity: 70000, unit: 'MT', cargo: 'wheat' }
- HS code mapping (wheat → HS 1001)

**4. Dates**:
- Pattern: /laycan\s+(\d{1,2})-(\d{1,2})\s+(\w+)/gi
- Example: "laycan 1-5 March" → { laycanStart: '2026-03-01', laycanEnd: '2026-03-05' }
- Relative dates: "next week", "Monday"

**5. Rates**:
- Pattern: /\$?([\d,]+\.?\d*)\s*(USD|EUR|INR)?\s*per\s*(MT|day|ton)/gi
- Example: "$12.50 per MT" → { amount: 12.50, currency: 'USD', unit: 'per_mt' }

### NER Model

```typescript
import nlp from 'compromise';
import { spacy } from 'spacy-nlp';

class EntityExtractor {
  async extract(text: string): Promise<ExtractedEntities> {
    const vessels = this.extractVessels(text);
    const ports = this.extractPorts(text);
    const cargos = this.extractCargos(text);
    const dates = this.extractDates(text);
    const rates = this.extractRates(text);

    return { vessels, ports, cargos, dates, rates };
  }

  private extractVessels(text: string): Vessel[] {
    const pattern = /M[TV]\s+([A-Z\s]+)/g;
    const matches = text.matchAll(pattern);

    const vessels: Vessel[] = [];
    for (const match of matches) {
      const name = match[1].trim();
      const vessel = await this.lookupVesselByName(name);
      if (vessel) {
        vessels.push({ name, imo: vessel.imo, confidence: 0.95 });
      }
    }

    return vessels;
  }

  private extractPorts(text: string): Port[] {
    const pattern = /\b([A-Z]{5})\b/g;
    const matches = text.matchAll(pattern);

    const ports: Port[] = [];
    for (const match of matches) {
      const code = match[1];
      const port = await this.validateUNLOCODE(code);
      if (port) {
        ports.push({ code, name: port.name, confidence: 0.98 });
      }
    }

    return ports;
  }

  private extractCargos(text: string): Cargo[] {
    const pattern = /(\d+,?\d*)\s*(MT|TONS|CBM|TEU)\s+(\w+)/gi;
    const matches = text.matchAll(pattern);

    const cargos: Cargo[] = [];
    for (const match of matches) {
      const quantity = parseFloat(match[1].replace(',', ''));
      const unit = match[2];
      const type = match[3];

      cargos.push({
        type,
        quantity,
        unit,
        hsCode: await this.mapToHSCode(type),
        confidence: 0.85,
      });
    }

    return cargos;
  }

  private extractDates(text: string): Date[] {
    const doc = nlp(text);
    const dates = doc.dates().json();
    return dates.map(d => ({ date: d.date, context: d.text, confidence: 0.90 }));
  }

  private extractRates(text: string): Rate[] {
    const pattern = /\$?([\d,]+\.?\d*)\s*(USD|EUR|INR)?\s*per\s*(MT|day|ton)/gi;
    const matches = text.matchAll(pattern);

    const rates: Rate[] = [];
    for (const match of matches) {
      rates.push({
        amount: parseFloat(match[1].replace(',', '')),
        currency: match[2] || 'USD',
        unit: match[3],
        confidence: 0.92,
      });
    }

    return rates;
  }
}
```

---

## ⚡ SMART ACTIONS

### Auto-Create Cargo Enquiry

**Trigger**: Email classified as `cargo_enquiry` with confidence >0.9

**Action**:
```typescript
async function autoCreateCargoEnquiry(email: EmailMessage) {
  const entities = email.extractedEntities;

  const enquiry = await prisma.cargoEnquiry.create({
    data: {
      reference: generateReference('CEQ'),
      chartererId: await findChartererId(email.from),
      cargoType: entities.cargos[0]?.type,
      quantity: entities.cargos[0]?.quantity,
      loadPort: entities.ports[0]?.code,
      dischargePort: entities.ports[1]?.code,
      laycanFrom: entities.dates[0]?.date,
      laycanTo: entities.dates[1]?.date,
      rateIndication: entities.rates[0]?.amount,
      status: 'seeking_offers',
      sourceEmail: email.id,
    },
  });

  // Update email with action
  await prisma.emailMessage.update({
    where: { id: email.id },
    data: {
      autoActions: { createdCargoEnquiry: enquiry.id },
    },
  });

  // Notify broker
  await notifyBroker({
    type: 'new_cargo_enquiry',
    enquiryId: enquiry.id,
    emailId: email.id,
  });
}
```

### Auto-Update Vessel Position

**Trigger**: Email classified as `vessel_position`

**Action**:
```typescript
async function autoUpdateVesselPosition(email: EmailMessage) {
  const entities = email.extractedEntities;
  const vessel = entities.vessels[0];

  if (!vessel) return;

  const position = await prisma.vesselPosition.create({
    data: {
      vesselId: vessel.id,
      latitude: entities.coordinates.lat,
      longitude: entities.coordinates.lon,
      speed: entities.speed,
      course: entities.course,
      timestamp: email.receivedAt,
      source: 'EMAIL',
    },
  });

  await prisma.emailMessage.update({
    where: { id: email.id },
    data: {
      autoActions: { updatedPosition: position.id },
    },
  });
}
```

---

## 📧 UNIVERSAL EMAIL CONNECTORS

### Microsoft 365 Connector

```typescript
import { Client } from '@microsoft/microsoft-graph-client';

class Microsoft365Connector {
  private client: Client;

  async connect(accessToken: string) {
    this.client = Client.init({
      authProvider: (done) => done(null, accessToken),
    });
  }

  async syncEmails(mailbox: string, since?: Date) {
    const messages = await this.client
      .api(`/users/${mailbox}/messages`)
      .filter(since ? `receivedDateTime ge ${since.toISOString()}` : '')
      .select('id,subject,from,toRecipients,receivedDateTime,body')
      .top(100)
      .get();

    for (const msg of messages.value) {
      await this.processEmail(msg);
    }
  }

  private async processEmail(msg: any) {
    const email = await prisma.emailMessage.create({
      data: {
        from: msg.from.emailAddress.address,
        to: msg.toRecipients.map(r => r.emailAddress.address),
        subject: msg.subject,
        bodyHtml: msg.body.content,
        bodyPlain: this.stripHtml(msg.body.content),
        receivedAt: new Date(msg.receivedDateTime),
        messageId: msg.id,
        organizationId: this.organizationId,
      },
    });

    // Queue for classification
    await this.queueClassification(email.id);
  }
}
```

### Gmail Connector

```typescript
import { google } from 'googleapis';

class GmailConnector {
  private gmail: any;

  async connect(oauth2Client: any) {
    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  async syncEmails(since?: Date) {
    const response = await this.gmail.users.messages.list({
      userId: 'me',
      q: since ? `after:${Math.floor(since.getTime() / 1000)}` : '',
      maxResults: 100,
    });

    for (const message of response.data.messages || []) {
      const full = await this.gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full',
      });

      await this.processEmail(full.data);
    }
  }

  private async processEmail(msg: any) {
    const headers = msg.payload.headers;
    const from = headers.find(h => h.name === 'From')?.value;
    const to = headers.find(h => h.name === 'To')?.value;
    const subject = headers.find(h => h.name === 'Subject')?.value;

    const body = this.extractBody(msg.payload);

    const email = await prisma.emailMessage.create({
      data: {
        from,
        to: [to],
        subject,
        bodyPlain: body,
        receivedAt: new Date(parseInt(msg.internalDate)),
        messageId: msg.id,
        organizationId: this.organizationId,
      },
    });

    await this.queueClassification(email.id);
  }
}
```

---

## 📅 IMPLEMENTATION TIMELINE

### Week 1-2: Email Classification
- [ ] Collect and label 10,000 maritime emails
- [ ] Fine-tune DistilBERT model
- [ ] Test classification accuracy (target: 95%+)
- [ ] Deploy model to @ankr/eon

### Week 3-4: Entity Extraction
- [ ] Build NER patterns (vessels, ports, cargos, dates, rates)
- [ ] Train custom spaCy model
- [ ] Test extraction accuracy (target: 92%+)
- [ ] Integrate with classification pipeline

### Week 5-6: Email Connectors
- [ ] Build Microsoft 365 connector
- [ ] Build Gmail connector
- [ ] Build IMAP connector
- [ ] Test sync with 1000+ emails

### Week 7-8: Smart Actions
- [ ] Auto-create cargo enquiry
- [ ] Auto-update vessel position
- [ ] Auto-file fixture recap
- [ ] Alert on urgent emails

### Weeks 9-12: Frontend & Testing
- [ ] Email inbox UI (React)
- [ ] Email detail view with extracted entities
- [ ] Settings (connect email accounts)
- [ ] Analytics dashboard (email stats)
- [ ] E2E testing

---

## 📊 SUCCESS METRICS

### Technical
- Classification accuracy: 95%+
- Entity extraction accuracy: 92%+
- Processing speed: <2 seconds per email
- False positive rate: <3%

### Business
- Time saved: 2 hours/day → 15 minutes (87%)
- Email response time: 24 hours → 2 hours (92%)
- Missed enquiries: 10% → 0%
- Revenue impact: +15% (faster response = more fixtures)

### Adoption
- Active users: 100+ brokers in 3 months
- Emails processed: 10,000+ per month per company
- NPS: >60

---

## 🎯 NEXT ACTIONS

**Immediate**:
1. [ ] Approve implementation plan
2. [ ] Collect 10,000 labeled emails
3. [ ] Start model training (Week 1-2)

**Short-term**:
1. [ ] Build entity extraction (Week 3-4)
2. [ ] Build email connectors (Week 5-6)
3. [ ] Build smart actions (Week 7-8)

**Long-term**:
1. [ ] Complete MVP (12 weeks)
2. [ ] Beta testing (50 users)
3. [ ] Production launch

---

**Created By**: Claude Sonnet 4.5 <noreply@anthropic.com>
**Date**: February 2, 2026
**Purpose**: MVP implementation plan for Email Intelligence Engine (Priority 3)
**Target**: Production-ready in 3 months, 95%+ accuracy, 87% time savings
