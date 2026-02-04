# Vyomo (व्योमो) - Revised Project Roadmap

> **"Momentum in Trade"** - Making F&O Trading Accessible to Every Indian
>
> Last Updated: 19th January 2026 (Phase 3 LMS + Gamification Complete)

---

## Vision

Vyomo aims to democratize options trading by providing **plain-language insights** that anyone can understand - from a first-time investor in Tier-3 India to a seasoned trader. We believe that financial literacy shouldn't require an MBA.

---

## Phase 1: Foundation (Completed)

### Core Infrastructure
- [x] GraphQL API with Fastify + Mercurius
- [x] Option Chain with real-time Greeks calculation
- [x] Black-Scholes pricing engine
- [x] WebSocket support for live updates
- [x] Redis caching layer
- [x] Centralized port configuration (@vyomo/config)

### Analytics Engine
- [x] PCR (Put-Call Ratio) metrics
- [x] Max Pain calculation
- [x] IV Metrics (percentile, rank, term structure)
- [x] GEX (Gamma Exposure) analysis
- [x] Fear & Greed Index
- [x] Market Regime detection
- [x] Smart Money indicators
- [x] Direction prediction model

### AI Insights Layer
- [x] Plain-language market mood explanations
- [x] PCR interpretation for beginners
- [x] Support/Resistance in simple terms
- [x] Stock validation with manipulation detection
- [x] Daily summary (voice-ready)
- [x] Swayam Bot - AI trading assistant

### Multi-Language Support
- [x] 11 Indian languages supported
  - Hindi, Tamil, Telugu, Kannada, Malayalam
  - Marathi, Bengali, Gujarati, Punjabi, Odia, English
- [x] Translation service with AI fallback
- [x] Voice narration support (TTS)
- [x] Bilingual responses in all insights

---

## Phase 2: Proprietary Algorithms (100% Complete) ✅

> **All 15 proprietary algorithms implemented with bilingual support (English + Hindi)**

### Retail Protection Suite ✅
- [x] **Retail Trap Detector** - Identify stop-loss hunting zones
- [x] **Manipulation Pattern Recognition** - Detect pump-and-dump setups
- [x] **Operator Accumulation Tracker** - Spot institutional accumulation

### Smart Money Analysis ✅
- [x] **FII-DII Divergence Score** - Track institutional positioning
- [x] **Smart vs Dumb Money Flow** - First 15 min vs last 30 min analysis
- [x] **Block Deal Tracker** - Large trade detection and interpretation

### Volatility Intelligence ✅
- [x] **Regime Shift Predictor** - Hidden Markov Model for volatility transitions
- [x] **Volatility Compression Alert** - Breakout prediction
- [x] **IV Skew Anomaly Detection** - Unusual put/call IV divergence

### Expiry Day Analytics ✅
- [x] **Gamma Flip Calculator** - Find dealer hedging pivot points (via GEX service)
- [x] **Expiry Pinning Probability** - Max pain gravitational pull
- [x] **Liquidity Void Mapping** - Identify fast-move zones

### Behavioral Analytics ✅
- [x] **Narrative Cycle Tracker** - NLP-based theme lifecycle detection
- [x] **Social Sentiment Contrarian** - Google Trends + social media analysis
- [x] **Retail FOMO Index** - Measure retail excitement levels

---

## Phase 3: User Experience (In Progress) 🚧

> **Notification System completed using @ankr/wire**

### Notifications & Alerts ✅ (Completed)
- [x] **Multi-Channel Notification Service** - Using @ankr/wire v3.0
  - Telegram, WhatsApp, SMS (MSG91), Email, Push notifications
- [x] **Alert Formatters** - Bilingual (English + Hindi) for all signals
  - Price, IV, PCR, GEX, Manipulation, Trap alerts
  - Smart Money, FOMO, Expiry, Regime, Compression alerts
  - Block Deal, Narrative, Sentiment, Daily Summary
- [x] **GraphQL API for Notifications**
  - NotificationSubscription type with channel configs
  - Create/Update/Delete subscription mutations
  - Test notification, channel verification
  - Real-time WebSocket subscription (vyomoNotification)
- [x] **Subscription Management**
  - Category-based filtering
  - Priority-based filtering (low, medium, high, critical)
  - Quiet hours support (IST timezone)
  - Weekend enable/disable
  - Language preference with Hindi translation option
- [x] **Wire Event Integration**
  - VyomoTopics for cross-service communication
  - Real-time alert dispatch to matching subscriptions

### Messaging Bots ✅ (Completed)
- [x] **WhatsApp Bot** - Using @whiskeysockets/baileys
  - Commands: NIFTY, BANKNIFTY, PCR, MOOD, TRAP, FOMO, GEX, EXPIRY
  - SUBSCRIBE/UNSUBSCRIBE for alerts
  - LANG HI/EN for bilingual support
  - Auto-broadcasts alerts to subscribers
- [x] **Telegram Bot** - Command-based interface
  - Commands: /nifty, /banknifty, /pcr, /mood, /trap, /fomo, /gex, /expiry
  - /subscribe, /unsubscribe, /status, /lang
  - Webhook mode support
  - Real-time alert broadcasts

### Mobile App (Planned)
- [ ] React Native app for Android/iOS
- [ ] Voice-first interface for Hindi users
- [ ] Offline mode for Tier-2/3 connectivity

### Custom Alert Rules ✅ (Completed)
- [x] **Alert Rules Service** - Full rule engine
  - 17 metrics: PRICE, IV, PCR, OI, GEX, FOMO, FEAR_GREED, etc.
  - 9 operators: GT, LT, CROSSES_ABOVE, CROSSES_BELOW, BETWEEN, etc.
  - AND/OR logic for combining conditions
  - Cooldown & daily trigger limits
  - Active hours scheduling
- [x] **GraphQL API** - Full CRUD + presets
  - Create, update, delete, toggle rules
  - Test rule evaluation (dry run)
  - Rule presets: Breakout, IV Spike, PCR signals, FOMO extreme
- [x] **Multi-channel dispatch**
  - Telegram, WhatsApp, Email, SMS, Push
  - Priority-based delivery

### Voice Alerts ✅ (Completed)
- [x] **Voice Alerts Service** - Regional language support
  - 11 Indian languages (Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Odia, English)
  - Voice templates for all alert categories
  - Phone calls (IVR via MSG91/Exotel)
  - WhatsApp voice messages
  - Telegram voice notes
  - Push notification audio files
- [x] **TTS Integration** - Multiple providers
  - Sarvam AI (primary - Indian languages)
  - Google TTS (fallback)
  - Browser Web Speech API (client-side)
  - Audio caching for performance
- [x] **Voice Subscription Management**
  - Per-user language preference
  - Channel selection (call, WhatsApp voice, Telegram voice, push audio)
  - Quiet hours & market hours scheduling
  - Priority-based filtering
- [x] **GraphQL API**
  - Create/Update/Delete voice subscriptions
  - Send test voice alerts
  - Preview voice audio generation
  - Supported languages query

### LMS - Learning Management System ✅ (Completed)
- [x] **Course Management**
  - Course structure (modules, lessons)
  - Multiple content types (video, text, interactive, quiz)
  - Multi-language support (11 Indian languages)
  - Free & premium courses with pricing
- [x] **Sample Courses**
  - "Options Trading Basics" - Free, beginner-friendly with Hindi examples
  - "Option Greeks Simplified" - Intermediate with real-life analogies
  - "Expiry Day Trading Strategies" - Advanced strategies
- [x] **Learning Paths**
  - "Beginner to Pro" - Structured journey from basics to advanced
  - Prerequisite tracking
  - Outcome-based learning
- [x] **Quizzes & Assessments**
  - Single choice, multiple choice, true/false questions
  - Hindi + English bilingual questions
  - Explanations after submission
  - Passing scores and retry limits
- [x] **Progress Tracking**
  - Lesson completion tracking
  - Quiz scores and attempts
  - Time spent tracking
  - Current lesson resumption
- [x] **Certificates**
  - Auto-generated on course completion
  - Verification codes
  - Downloadable certificates
- [x] **GraphQL API**
  - courses, course, courseBySlug, searchCourses
  - learningPaths, learningPath, learningPathBySlug
  - enrollInCourse, completeLesson, submitQuiz
  - myEnrolledCourses, myCourseProgress, myCertificates

### Gamification ✅ (Completed)
- [x] **@ankr/gamification Integration**
  - Points, badges, streaks, tiers, challenges
  - In-memory storage (production: PostgreSQL via Prisma)
- [x] **20+ Vyomo-Specific Badges**
  - Learning: First Step, Course Graduate, Quiz Master, Knowledge Seeker, Scholar, Professor
  - Trading: Greeks Guru, Expiry Expert, PCR Pro, GEX Genius
  - Engagement: Daily Learner, Dedicated Student, Learning Legend, Early Bird, Night Owl
  - Social: Knowledge Sharer, Referral Starter, Community Builder
  - Special: Hindi Learner, Multilingual Trader, Certified Trader, Beta Tester
- [x] **5-Tier System with Hindi Names**
  - Bronze/शुरुआती, Silver/सीखने वाला, Gold/ट्रेडर, Platinum/विशेषज्ञ, Diamond/मास्टर
- [x] **4 Active Challenges**
  - Weekly Learner (5 lessons/week)
  - Quiz Champion (3 quizzes with 80%+)
  - Greeks Mastery (complete Greeks course)
  - 7-Day Streak Challenge
- [x] **Points Configuration**
  - Lesson complete: 20 points
  - Quiz pass: 30 points, Perfect: 50 points
  - Course complete: 200 points
  - Certificate: 300 points
  - Daily login: 5 points
- [x] **GraphQL API**
  - myGamificationProfile, leaderboard, availableBadges
  - activeChallenges, tierInfo
  - joinChallenge, claimDailyBonus, recordShare, recordReferral
- [x] **LMS Integration**
  - Auto-award points on lesson completion
  - Auto-award points on quiz pass
  - Auto-award badges on course completion
  - Auto-award certificate badges

### Personalization (Planned)
- [ ] Risk profile assessment
- [ ] Personalized insights based on portfolio
- [ ] Trade journal with AI analysis

---

## Phase 4: Advanced Features (Future)

### Paper Trading
- [ ] Virtual portfolio for practice
- [ ] Strategy backtesting
- [ ] P&L simulation

### Broker Integration
- [ ] Zerodha Kite Connect
- [ ] Angel One SmartAPI
- [ ] Groww, Upstox integration
- [ ] One-click order placement

### Community Features
- [ ] Anonymized trade sharing
- [ ] Strategy marketplace
- [ ] Expert webinars in Hindi

---

## Technical Debt & Improvements

### Performance
- [ ] Redis cluster for high availability
- [ ] GraphQL query optimization
- [ ] Response caching strategy

### Data Quality
- [ ] Real NSE/BSE data integration
- [ ] Historical data backfill
- [ ] Tick-by-tick data storage

### Testing
- [ ] Unit tests for all resolvers
- [ ] Integration tests for analytics
- [ ] E2E tests for critical flows

---

## Success Metrics

| Metric | Target |
|--------|--------|
| API Response Time | < 100ms |
| Languages Supported | 11 |
| Insight Accuracy | > 70% |
| User Understanding Score | > 80% |
| False Manipulation Alerts | < 5% |

---

## Team & Contributors

- **Lead Developer**: Bharat Anil
- **AI/ML**: Claude Opus 4.5
- **Design**: [TBD]

---

## References

- [Vyomo Proprietary Algorithms](./Vyomo_Proprietary.md)
- [Traditional Pattern Trading Guide](./Vyomo_Project_Traditional.md)
- [API Documentation](./api-docs.md)

---

*श्री गणेशाय नमः | जय गुरुजी*

*© 2026 ANKR Labs - Powerp Box IT Solutions Pvt Ltd*
