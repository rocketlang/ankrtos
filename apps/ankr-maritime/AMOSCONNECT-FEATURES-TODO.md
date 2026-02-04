# AmosConnect-Like Features - Phase 2 TODO

**Date**: February 3, 2026
**Status**: Planned for Phase 2
**Priority**: High value-add for vessel operations

---

## 🎯 Overview

AmosConnect-like features to make Mari8X the **complete vessel operations platform** that replaces expensive legacy systems.

**Goal**: Provide all communication and operational tools vessels need, optimized for satellite connections.

---

## 📋 Feature Categories

### 1. **Compressed Communication** (HIGH PRIORITY)

#### Email Compression
- [ ] Implement text compression (gzip/brotli)
- [ ] Image optimization (reduce resolution, compress)
- [ ] PDF compression
- [ ] Attachment size limits with warnings
- [ ] Differential sync (only send changes)

**Target**: 90% reduction in satellite data usage
**Savings**: $500-$2,000 per vessel per month

#### Offline Email Client
- [ ] Compose emails offline
- [ ] Queue messages for sending
- [ ] Auto-send when connection available
- [ ] Smart sync (only essentials)
- [ ] Priority-based delivery (urgent first)

**Tech Stack**:
- Service Workers (PWA)
- IndexedDB for local storage
- Background Sync API

---

### 2. **One-Tap Reporting** (HIGH PRIORITY)

#### Noon Report (Auto-Fill)
- [ ] GPS/AIS position integration
- [ ] Auto-calculate distance from last report
- [ ] Weather API integration (auto-fill conditions)
- [ ] Fuel ROB tracking (auto from last report + consumption)
- [ ] Speed/course from AIS
- [ ] Pre-fill with voyage data

**Time Saved**: 15-17 minutes per report
**Annual Savings**: 73-103 hours/year per vessel

#### Port Arrival/Departure Reports
- [ ] Pre-fill from voyage orders
- [ ] Auto timestamp from GPS
- [ ] Agent details from port database
- [ ] Document checklist auto-populated
- [ ] Photo upload (compressed)

#### Other Reports
- [ ] Bunker Delivery Note (OCR scanning)
- [ ] Cargo Reports
- [ ] Incident Reports (templates)
- [ ] Safety Checklists (digital forms)
- [ ] Environmental Compliance (MARPOL auto-calculations)

**Implementation**:
```typescript
interface AutoFilledReport {
  position: { lat: number; lng: number };  // From GPS
  datetime: Date;                          // Auto
  course: number;                          // From AIS
  speed: number;                           // From AIS
  distance: number;                        // Calculated
  weather: WeatherData;                    // From API
  fuel: FuelStatus;                        // From tracking
}

async function generateNoonReport(vesselId: string): Promise<AutoFilledReport> {
  const position = await getLatestPosition(vesselId);
  const weather = await getWeather(position.lat, position.lng);
  const fuelStatus = await calculateFuelROB(vesselId);
  // ... return pre-filled report
}
```

---

### 3. **Weather Routing** (MEDIUM PRIORITY)

#### Weather Data Integration
- [ ] GRIB file downloads (compressed)
- [ ] Weather forecast overlay on map
- [ ] Wave height predictions
- [ ] Wind speed/direction
- [ ] Tropical cyclone tracking
- [ ] Ice reports (for polar routes)

#### Weather Routing Optimization
- [ ] Avoid storms automatically
- [ ] Suggest course adjustments
- [ ] ETA recalculation based on weather
- [ ] Fuel consumption optimization with weather
- [ ] Integration with fleet collaborative routing

**Data Sources**:
- NOAA GFS (free)
- OpenWeather API
- Windy API
- Custom weather routing algorithms

---

### 4. **Document Management** (MEDIUM PRIORITY)

#### Offline Document Library
- [ ] Sync essential documents offline
- [ ] Voyage orders always available
- [ ] Certificates cached locally
- [ ] Port guides for upcoming ports
- [ ] SMS/ISM manuals offline
- [ ] Search documents offline

#### Document Categories
- [ ] Statutory certificates (auto-expiry alerts)
- [ ] Crew certificates
- [ ] Voyage documents (charter party, B/L, etc.)
- [ ] Port documents
- [ ] Operational manuals
- [ ] Forms and templates

**Storage Strategy**:
- Critical docs: Always cached (certificates, voyage orders)
- Frequently accessed: Smart caching
- Archive: On-demand download

---

### 5. **Crew Welfare Features** (MEDIUM PRIORITY)

#### Personal Communication
- [ ] Crew email (compressed)
- [ ] Messaging with family
- [ ] News feeds (compressed)
- [ ] Sports scores
- [ ] Currency exchange rates
- [ ] Home country news

#### Entertainment & Training
- [ ] Online courses (cached offline)
- [ ] Safety drills tracking
- [ ] Certificate renewal reminders
- [ ] Exercise videos
- [ ] Mental health resources

#### Financial
- [ ] Salary statements
- [ ] Allotment status
- [ ] Tax documents
- [ ] Banking information

**Crew Portal** (`/crew-portal`):
```typescript
interface CrewPortal {
  email: CompressedEmail;
  news: NewsFeeds;
  training: OnlineCourses;
  financial: SalaryInfo;
  wellbeing: WellnessResources;
}
```

---

### 6. **Voice Input** (LOW PRIORITY - Future)

#### Voice-to-Text Reports
- [ ] Voice dictation for reports
- [ ] Hands-free operation (useful on bridge)
- [ ] Multi-language support
- [ ] Automatic transcription
- [ ] Voice commands ("Create noon report")

**Tech**: Web Speech API, cloud speech-to-text

---

### 7. **Offline-First Architecture** (HIGH PRIORITY)

#### PWA Implementation
- [ ] Service Worker for offline caching
- [ ] Background sync for reports
- [ ] IndexedDB for local data
- [ ] Smart sync strategy
- [ ] Offline indicators

#### Data Sync Strategy
```typescript
interface SyncStrategy {
  priority: 'high' | 'medium' | 'low';
  frequency: number; // seconds
  maxRetries: number;
  compressionLevel: number; // 0-9
}

const syncPriorities = {
  emergencyAlerts: { priority: 'high', frequency: 0, maxRetries: Infinity },
  noonReports: { priority: 'high', frequency: 60, maxRetries: 10 },
  emails: { priority: 'medium', frequency: 300, maxRetries: 5 },
  documents: { priority: 'low', frequency: 3600, maxRetries: 3 },
};
```

---

### 8. **Mobile Apps** (MEDIUM PRIORITY)

#### Native Mobile Apps
- [ ] iOS app (App Store)
- [ ] Android app (Play Store)
- [ ] Offline-first architecture
- [ ] Push notifications
- [ ] Camera integration (for reports)
- [ ] GPS integration
- [ ] Background sync

**Why Native**:
- Better offline support
- Push notifications
- Hardware access (GPS, camera)
- App store distribution

**Alternative**: Continue with PWA (faster, cross-platform)

---

## 🚀 Implementation Roadmap

### Phase 2.1: Communication Essentials (Month 1)
**Priority**: Enable basic vessel communication
- [ ] Compressed email system
- [ ] Offline email client
- [ ] Queue and sync mechanism
- [ ] Priority-based delivery

**Success Metrics**:
- 90% reduction in satellite data
- Email send/receive working offline
- <30 second sync time when connected

---

### Phase 2.2: Smart Reporting (Month 2)
**Priority**: Reduce master workload
- [ ] Auto-filled noon reports
- [ ] Port arrival/departure reports
- [ ] Weather API integration
- [ ] Fuel tracking integration
- [ ] Photo upload (compressed)

**Success Metrics**:
- Noon report time: <3 minutes (from 15-20 min)
- 90%+ pre-fill accuracy
- User satisfaction: 9/10

---

### Phase 2.3: Weather & Documents (Month 3)
**Priority**: Operational intelligence
- [ ] GRIB file downloads
- [ ] Weather routing overlay
- [ ] Storm avoidance suggestions
- [ ] Offline document library
- [ ] Certificate expiry alerts

**Success Metrics**:
- Weather data updated 4x daily
- All critical docs cached offline
- Zero missed certificate expiries

---

### Phase 2.4: Crew Features (Month 4)
**Priority**: Vessel satisfaction & retention
- [ ] Crew personal email
- [ ] News feeds
- [ ] Training modules
- [ ] Financial info portal
- [ ] Well-being resources

**Success Metrics**:
- 80%+ crew portal adoption
- Improved crew satisfaction scores
- Reduced crew turnover

---

## 💰 Business Case

### Cost Savings for Vessel Owners

**Satellite Communication Costs**:
- Current: $5-$15 per MB
- Average vessel usage: 500-1,000 MB/month
- Current cost: $2,500-$15,000/month

**With Mari8X Compression**:
- 90% reduction in data usage
- New usage: 50-100 MB/month
- New cost: $250-$1,500/month
- **Savings: $2,250-$13,500/month per vessel**

**Time Savings**:
- Reporting time saved: 3-4 hours/day
- Master time value: $100-$150/hour
- Daily savings: $300-$600
- **Annual savings: $109,000-$219,000 per vessel**

**Total Annual Savings per Vessel**: $136,000-$381,000

---

### Competitive Advantage

**Replace Legacy Systems**:
- AmosConnect: $500-$1,000/month/vessel
- Traditional weather routing: $300-$500/month
- Document management: $200-$300/month
- Total replaced: $1,000-$1,800/month

**Mari8X Pricing** (can be lower because of scale):
- Basic: Free (with vessel data sharing)
- Premium: $500/month (all AmosConnect features + more)
- ROI: 10-20x for vessel owners

---

## 🔧 Technical Architecture

### Communication Layer
```
Vessel (Satellite) ←→ Compression Proxy ←→ Mari8X Backend

Compression Techniques:
├─ Gzip/Brotli for text (90% reduction)
├─ Image optimization (resize, compress)
├─ PDF compression
├─ Delta sync (only changes)
└─ Batch transfers (reduce connection overhead)
```

### Offline-First Stack
```
Frontend (PWA)
├─ Service Worker (caching, offline)
├─ IndexedDB (local data storage)
├─ Background Sync API (queue uploads)
└─ Push API (notifications)

Backend
├─ Compression middleware
├─ Sync queue manager
├─ Priority scheduler
└─ Retry logic with exponential backoff
```

---

## 📊 Success Metrics

### For Vessels
- **Satellite cost reduction**: Target 70-90%
- **Reporting time reduction**: Target 70-80%
- **Crew satisfaction**: Target 8/10+
- **Daily active usage**: Target 100%

### For Mari8X
- **Vessel adoption**: Target 90%+ of fleet owners' vessels
- **Feature usage**: Target 10+ features/day per vessel
- **Retention**: Target 98%+
- **NPS**: Target 80+

---

## 🎯 Priority Order

### Must Have (Phase 2.1-2.2)
1. **Compressed email** - Core communication need
2. **Auto-filled reports** - Biggest time saver
3. **Offline-first architecture** - Essential for satellite
4. **Document management** - Always needed

### Should Have (Phase 2.3)
5. **Weather routing** - Safety and efficiency
6. **Smart alerts** - Proactive help
7. **Performance analytics** - Data-driven decisions

### Nice to Have (Phase 2.4+)
8. **Crew welfare features** - Retention bonus
9. **Voice input** - Convenience feature
10. **Native mobile apps** - Better UX

---

## 💡 Key Insights

**Your Original Request**:
> "Maybe add Amos features later"

**Why Later is Smart**:
- ✅ Build portals first (proven value)
- ✅ Get user feedback on priorities
- ✅ Understand actual usage patterns
- ✅ Phase 2 adds communication layer
- ✅ Becomes complete replacement for AmosConnect

**The Vision**:
```
Phase 1: Portals (NOW)
├─ Vessel Portal ✅
├─ Fleet Portal ✅
└─ DA Desk integration ✅

Phase 2: AmosConnect Features (NEXT)
├─ Compressed communication
├─ Smart reporting
├─ Weather routing
└─ Offline-first

Result: Complete vessel operations platform!
```

---

## 📝 Next Steps

1. **Complete Phase 1** (Portals) ✅
2. **User Testing** (Get feedback from masters)
3. **Prioritize Phase 2** (Based on feedback)
4. **Build Communication Layer** (Compression proxy)
5. **Launch AmosConnect Features** (Month by month)

---

**Status**: Ready for Phase 2 planning!
**Timeline**: 4-6 months for full AmosConnect feature parity
**Investment**: High value-add, replaces expensive legacy systems

This will make Mari8X the **only platform vessels need** for all operations! 🚢✨
