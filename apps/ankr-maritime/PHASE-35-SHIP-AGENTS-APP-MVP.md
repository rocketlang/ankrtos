# Phase 35: Ship Agents App - MVP Implementation Plan
## Priority 2: Mobile-First Port Agent Solution
**Created**: February 2, 2026 11:15 UTC

---

## 🎯 EXECUTIVE SUMMARY

**Market**: 10,000+ field agents at ports globally
**Pain Point**: Paper-based PDA/FDA, manual invoice entry, no offline capability
**Solution**: Offline-first mobile app with voice input + photo OCR
**Time to Market**: 4-5 months
**Platform**: iOS + Android (React Native + Expo)

**Value Proposition**: Field agents can create PDAs, capture invoices, and manage port calls entirely offline, syncing when back online.

---

## 📋 PROBLEM STATEMENT

### Current Agent Workflow (Manual)

**Morning (7:00 AM - Port Visit)**:
1. Agent drives to port (no internet on ship)
2. Meets with ship captain, collects requirements
3. Writes notes on paper notepad
4. Takes photos of vessel documents with phone camera
5. Cannot access PDA template or tariff database

**Back at Office (5:00 PM)**:
1. Enters handwritten notes into desktop system
2. Manually types invoice details from photos
3. Creates PDA in Excel (2-4 hours)
4. Emails PDA to ship owner

**Problems**:
- ❌ No offline capability
- ❌ Double data entry (paper → system)
- ❌ Slow invoice processing
- ❌ No voice input
- ❌ Lost time traveling to/from office

---

## 🚀 SOLUTION OVERVIEW

### Core Features (MVP)

**1. Offline-First Architecture**
- IndexedDB for local storage (100MB+ capacity)
- Delta sync when back online
- Conflict resolution (last-write-wins or manual merge)
- Background sync queue with retry logic

**2. Voice Input for PDA Entries**
- Web Speech API integration
- Maritime domain vocabulary
- Voice commands: "Add pilotage, $2,500, USD"
- Auto-categorization of charges

**3. Photo OCR for Invoices**
- Tesseract.js for text extraction
- Detect: vendor, amount, currency, date, invoice number
- 85%+ accuracy with manual review for low confidence
- Batch upload (5-10 invoices at once)

**4. GPS Geolocation Features**
- Auto-detect current port (within 5km radius)
- Geofence alerts (vessel arrival/departure)
- Distance to vessel calculator
- Port navigation (map to berth)

**5. Offline PDA Generation**
- Pre-cached port tariffs for 100 major ports
- Template-based PDA creation
- Submit when back online

---

## 🏗️ TECHNICAL ARCHITECTURE

### Tech Stack

**Frontend**:
- React Native 0.73+
- Expo SDK 50+
- TypeScript
- TailwindCSS (NativeWind)

**State Management**:
- Zustand (lightweight)
- React Query (server state)
- IndexedDB (offline storage)

**Offline Sync**:
- Apollo Client (GraphQL with offline mutations)
- Background sync API
- Conflict resolution middleware

**Voice**:
- react-native-voice
- Web Speech API polyfill
- Custom maritime vocabulary

**OCR**:
- Tesseract.js
- react-native-vision-camera
- Image preprocessing (contrast, rotate, crop)

**Maps**:
- MapLibre GL Native
- react-native-maps
- Geofencing API

---

## 📱 APP SCREENS

### 1. Dashboard (Home)
- Today's appointments (offline-cached)
- Pending tasks (PDA to generate, FDA to submit)
- Quick actions: New PDA, Scan Invoice, Voice Input
- Sync status indicator

### 2. Appointments List
- Upcoming appointments (7 days)
- In-progress (at berth)
- Completed (past 30 days)
- Filter by port, vessel, status

### 3. Appointment Detail
- Vessel info, ETA/ETB/ETD
- Service requests
- PDA/FDA status
- Documents attached
- Voice notes

### 4. PDA Creation (Voice)
- Voice recording UI
- Real-time transcription
- Line item list (swipe to edit/delete)
- Total calculator
- Preview & submit

### 5. Invoice Scanner
- Camera view with guides
- Batch capture (5-10 photos)
- OCR processing with progress bar
- Review extracted data
- Assign to PDA line item

### 6. FDA Creation
- Import PDA line items
- Attach invoices (photos)
- Variance analysis (auto-calculated)
- Submit for approval

### 7. Settings
- Offline data: Pre-cache ports, tariffs
- Sync preferences: WiFi-only, Auto-sync
- Voice language: English, Hindi, Chinese
- OCR language: English, Chinese, Spanish

---

## 🗄️ OFFLINE DATA STRATEGY

### IndexedDB Schema

```typescript
// Stores
const stores = {
  appointments: 'id, portCode, eta, vesselId, status, syncStatus',
  pdas: 'id, appointmentId, reference, status, syncStatus, lastModified',
  fdas: 'id, appointmentId, reference, status, syncStatus, lastModified',
  lineItems: 'id, pdaId, fdaId, category, amount, syncStatus',
  invoices: 'id, appointmentId, photo, ocrData, syncStatus',
  portTariffs: 'portCode, chargeType, amount, cachedAt',
  vessels: 'id, imo, name, type, cachedAt',
  syncQueue: 'id, operation, entity, entityId, payload, retries, createdAt',
};

// Sync Status
enum SyncStatus {
  SYNCED = 'synced',           // Exists on server
  PENDING = 'pending',         // Created offline, not yet sent
  CONFLICT = 'conflict',       // Modified both offline and online
  ERROR = 'error',             // Sync failed, needs retry
}
```

### Pre-caching Strategy

**On Initial Install**:
- Download 100 major ports (10MB)
- Download port tariffs for frequent ports (5MB)
- Download vessel list (owned fleet) (2MB)

**Weekly Sync**:
- Update port tariffs (changes only)
- Update vessel list (changes only)
- Clean up old data (>90 days)

**Total Storage**: ~20-30MB (manageable)

---

## 🎤 VOICE INPUT IMPLEMENTATION

### Voice Commands

**Add Charge**:
- "Add pilotage two thousand five hundred dollars" → { category: 'pilotage', amount: 2500, currency: 'USD' }
- "Add towage inbound one thousand euros" → { category: 'towage', amount: 1000, currency: 'EUR', description: 'inbound' }

**Edit Charge**:
- "Change pilotage to three thousand" → Updates pilotage line item amount

**Delete Charge**:
- "Remove agency fee" → Deletes agency_fee line item

**Maritime Vocabulary**:
```typescript
const maritimeTerms = {
  charges: ['pilotage', 'towage', 'mooring', 'port dues', 'agency fee', 'garbage', 'freshwater'],
  units: ['dollars', 'euros', 'rupees', 'yuan', 'pounds'],
  directions: ['inbound', 'outbound', 'shifting'],
};
```

### Implementation

```typescript
import Voice from '@react-native-voice/voice';

const VoiceInputComponent = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startListening = async () => {
    try {
      await Voice.start('en-US');
      setIsListening(true);
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e) {
      console.error(e);
    }
  };

  Voice.onSpeechResults = (e) => {
    const text = e.value[0];
    setTranscript(text);
    parseVoiceCommand(text);
  };

  const parseVoiceCommand = (text: string) => {
    // Parse "Add pilotage $2500 USD"
    const addPattern = /add\s+(\w+)\s+([\d,]+)\s+(\w+)/i;
    const match = text.match(addPattern);
    if (match) {
      const [, category, amount, currency] = match;
      addLineItem({
        category,
        amount: parseFloat(amount.replace(',', '')),
        currency: currency.toUpperCase(),
      });
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={isListening ? stopListening : startListening}>
        <Icon name={isListening ? 'mic' : 'mic-off'} />
      </TouchableOpacity>
      <Text>{transcript}</Text>
    </View>
  );
};
```

---

## 📷 INVOICE OCR IMPLEMENTATION

### Image Preprocessing

```typescript
import Tesseract from 'tesseract.js';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const preprocessImage = async (uri: string) => {
  // 1. Resize to max 2000px width (reduce processing time)
  // 2. Increase contrast (improve OCR accuracy)
  // 3. Convert to grayscale
  const processed = await manipulateAsync(
    uri,
    [
      { resize: { width: 2000 } },
      { contrast: 0.3 },
    ],
    { compress: 0.8, format: SaveFormat.JPEG }
  );
  return processed.uri;
};

const extractInvoiceData = async (imageUri: string) => {
  const processedUri = await preprocessImage(imageUri);

  const { data: { text, confidence } } = await Tesseract.recognize(
    processedUri,
    'eng',
    {
      logger: (m) => console.log(m),
    }
  );

  // Parse extracted text
  const invoice = parseInvoiceText(text);
  invoice.confidence = confidence;

  return invoice;
};

const parseInvoiceText = (text: string) => {
  // Extract invoice number: "Invoice #12345" or "INV-12345"
  const invoicePattern = /(?:Invoice|INV)[:\s#-]*(\w+)/i;
  const invoiceMatch = text.match(invoicePattern);

  // Extract amount: "$2,500.00" or "USD 2500"
  const amountPattern = /(?:USD|EUR|INR|SGD)?\s*([\d,]+\.?\d*)/;
  const amountMatch = text.match(amountPattern);

  // Extract date: "2026-02-01" or "01 Feb 2026"
  const datePattern = /(\d{4}-\d{2}-\d{2})|(\d{2}\s+\w+\s+\d{4})/;
  const dateMatch = text.match(datePattern);

  return {
    invoiceNumber: invoiceMatch ? invoiceMatch[1] : null,
    amount: amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : null,
    date: dateMatch ? dateMatch[0] : null,
    vendor: extractVendor(text),
    currency: extractCurrency(text),
    confidence: 0.85,  // Overall confidence
  };
};
```

---

## 🔄 OFFLINE SYNC IMPLEMENTATION

### Sync Queue

```typescript
interface SyncQueueItem {
  id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'PDA' | 'FDA' | 'LineItem' | 'Invoice';
  entityId: string;
  payload: any;
  retries: number;
  createdAt: Date;
}

class SyncService {
  private queue: SyncQueueItem[] = [];

  async enqueue(item: Omit<SyncQueueItem, 'id' | 'retries' | 'createdAt'>) {
    const queueItem: SyncQueueItem = {
      ...item,
      id: generateId(),
      retries: 0,
      createdAt: new Date(),
    };

    this.queue.push(queueItem);
    await this.saveQueueToIndexedDB();
  }

  async processQueue() {
    if (!navigator.onLine) {
      console.log('Offline - skipping sync');
      return;
    }

    for (const item of this.queue) {
      try {
        await this.syncItem(item);
        this.queue = this.queue.filter(q => q.id !== item.id);
      } catch (error) {
        item.retries += 1;
        if (item.retries >= 3) {
          console.error('Max retries reached:', item);
          // Move to error state or alert user
        }
      }
    }

    await this.saveQueueToIndexedDB();
  }

  private async syncItem(item: SyncQueueItem) {
    switch (item.operation) {
      case 'CREATE':
        return await this.createOnServer(item.entity, item.payload);
      case 'UPDATE':
        return await this.updateOnServer(item.entity, item.entityId, item.payload);
      case 'DELETE':
        return await this.deleteOnServer(item.entity, item.entityId);
    }
  }

  private async createOnServer(entity: string, payload: any) {
    const mutation = gql`
      mutation Create${entity}($input: ${entity}Input!) {
        create${entity}(input: $input) {
          id
        }
      }
    `;

    const { data } = await apolloClient.mutate({
      mutation,
      variables: { input: payload },
    });

    return data;
  }
}
```

### Conflict Resolution

```typescript
enum ConflictStrategy {
  LAST_WRITE_WINS = 'last_write_wins',
  MANUAL_MERGE = 'manual_merge',
  KEEP_LOCAL = 'keep_local',
  KEEP_SERVER = 'keep_server',
}

class ConflictResolver {
  async resolve(local: any, server: any, strategy: ConflictStrategy) {
    switch (strategy) {
      case ConflictStrategy.LAST_WRITE_WINS:
        return local.updatedAt > server.updatedAt ? local : server;

      case ConflictStrategy.MANUAL_MERGE:
        // Show UI for user to choose
        return await this.showConflictUI(local, server);

      case ConflictStrategy.KEEP_LOCAL:
        return local;

      case ConflictStrategy.KEEP_SERVER:
        return server;
    }
  }

  private async showConflictUI(local: any, server: any) {
    // Show modal with side-by-side comparison
    // User selects which version to keep
  }
}
```

---

## 📅 IMPLEMENTATION TIMELINE (4-5 Months)

### Month 1: Foundation
**Week 1-2**: Project Setup
- [ ] Initialize Expo project
- [ ] Configure React Native Navigation
- [ ] Set up Zustand state management
- [ ] Configure Apollo Client with offline mutations
- [ ] Design UI mockups (Figma)

**Week 3-4**: Offline Core
- [ ] Implement IndexedDB wrapper
- [ ] Build sync queue system
- [ ] Implement delta sync logic
- [ ] Test offline CRUD operations

### Month 2: Voice & OCR
**Week 5-6**: Voice Input
- [ ] Integrate react-native-voice
- [ ] Build voice command parser
- [ ] Maritime vocabulary training
- [ ] Test voice accuracy (target: 90%+)

**Week 7-8**: Invoice OCR
- [ ] Integrate Tesseract.js
- [ ] Build image preprocessing pipeline
- [ ] Invoice data extraction logic
- [ ] Test OCR accuracy (target: 85%+)

### Month 3: Core Features
**Week 9-10**: PDA/FDA Creation
- [ ] PDA creation flow (offline)
- [ ] Voice input for line items
- [ ] FDA creation with invoice attachment
- [ ] Variance analysis

**Week 11-12**: Sync & Conflict Resolution
- [ ] Background sync service
- [ ] Conflict resolution UI
- [ ] Error handling & retry logic
- [ ] Sync status indicators

### Month 4: GPS & Navigation
**Week 13-14**: Geolocation
- [ ] GPS auto-port detection
- [ ] Geofencing alerts
- [ ] Map view with berth navigation
- [ ] Distance calculator

**Week 15-16**: Polish & Testing
- [ ] UI/UX refinement
- [ ] Performance optimization
- [ ] Battery usage optimization
- [ ] E2E testing

### Month 5: Beta & Launch
**Week 17-18**: Beta Testing
- [ ] TestFlight (iOS) / Play Store beta (Android)
- [ ] Onboard 50 beta testers
- [ ] Gather feedback
- [ ] Bug fixes

**Week 19-20**: Launch
- [ ] App Store submission
- [ ] Marketing materials
- [ ] User documentation
- [ ] Launch campaign

---

## 🧪 TESTING STRATEGY

### Offline Testing
- Airplane mode testing (full offline functionality)
- Network interruption (mid-sync failures)
- Large data sync (1000+ line items)

### Voice Testing
- Different accents (Indian, British, American, Chinese)
- Background noise (port environment)
- Maritime vocabulary accuracy
- Command recognition rate

### OCR Testing
- Various invoice formats (PDF, photo, scanned)
- Different languages (English, Chinese, Hindi)
- Low-light photos
- Batch processing (10 invoices)

### GPS Testing
- Port auto-detection accuracy (5km radius)
- Geofence trigger reliability
- Battery usage monitoring

---

## 📊 SUCCESS METRICS

### Technical
- Offline capability: 7+ days without internet
- Voice recognition accuracy: 90%+
- OCR accuracy: 85%+
- Sync success rate: 98%+
- App size: <50MB
- Cold start time: <3 seconds

### Business
- Agent adoption: 500+ agents in 6 months
- Daily active users: 60%+
- Retention (30-day): 70%+
- App store rating: 4.5+ stars
- Support tickets: <2% of users

### User Satisfaction
- NPS: >50
- Time saved: 2 hours/day → 30 min (75% reduction)
- PDA creation time: 2-4 hours → 15 minutes (90% reduction)

---

## 💰 REVENUE MODEL

**Freemium**:
- Free: 5 PDAs/month
- Pro: $29/month (unlimited PDAs, voice, OCR)
- Enterprise: $99/month (multi-user, white-label, API)

**Target**: 500 agents x $29/month = $14.5K MRR by month 6

---

## 🚀 GO-TO-MARKET

### Beta Phase
- Onboard 50 beta testers (agents from Phase 34)
- Gather feedback and testimonials
- Refine based on usage

### Launch Phase
- App Store / Play Store launch
- Content marketing (demo videos)
- Agent training webinars

### Growth Phase
- Referral program (20% discount)
- Enterprise sales (large agencies)
- Integration with Phase 34 Portal

---

## 🎯 NEXT ACTIONS

**Immediate**:
1. [ ] Approve this implementation plan
2. [ ] Initialize Expo project
3. [ ] Design UI mockups (Figma)

**Short-term**:
1. [ ] Build offline sync core (Month 1)
2. [ ] Integrate voice & OCR (Month 2)
3. [ ] Build PDA/FDA flows (Month 3)

**Long-term**:
1. [ ] Complete MVP (Month 1-4)
2. [ ] Beta testing (Month 5)
3. [ ] App Store launch

---

**Created By**: Claude Sonnet 4.5 <noreply@anthropic.com>
**Date**: February 2, 2026
**Purpose**: MVP implementation plan for Ship Agents App (Priority 2)
**Target**: Production-ready in 4-5 months, 500+ agents, 4.5+ stars
