# Vyomo Anomaly Detection & AI Agent System - Implementation TODO

**Date:** 2026-02-13
**Project:** Vyomo Trading Platform Enhancement
**Status:** 🚀 Ready to Start
**Timeline:** 5 weeks (35 days) + 4 weeks rollout
**Priority:** HIGH

---

## 📋 Quick Summary

**Total Tasks:** 85
**Completed:** 2 ✅
**In Progress:** 1 🔄
**Pending:** 82 ⏳

**Estimated Effort:** ~240 developer hours
**Team Size:** 2-3 developers
**Target Completion:** Week of March 20, 2026

---

## ✅ Pre-Implementation (COMPLETED)

### Planning & Design
- [x] **PLAN-001** - Research article on anomaly detection with AI agents
- [x] **PLAN-002** - Create comprehensive implementation plan
- [x] **PLAN-003** - Design system architecture (4 components)
- [x] **PLAN-004** - Define database schema (Prisma models)
- [x] **PLAN-005** - Create project report and publish
- [x] **PLAN-006** - Identify integration points with existing systems
- [x] **PLAN-007** - Define performance targets and success metrics
- [x] **PLAN-008** - Cost-benefit analysis approval

---

## 🔄 Week 0: Project Setup (Days 0-2)

### Environment Setup
- [ ] **SETUP-001** - Create project directory structure
  - `/root/ankr-labs-nx/packages/vyomo-anomaly-agent/`
  - `src/detectors/`, `src/agent/`, `src/integration/`, `src/actions/`
  - **Owner:** DevOps
  - **Priority:** P0
  - **Estimate:** 1 hour

- [ ] **SETUP-002** - Initialize TypeScript configuration
  - Copy from existing packages
  - Configure paths for @vyomo/core integration
  - **Owner:** Backend Dev
  - **Priority:** P0
  - **Estimate:** 30 min

- [ ] **SETUP-003** - Set up database schema files
  - Create `prisma/migrations/` folder
  - Add Prisma schema additions to `/root/ankr-bfc/prisma/schema.prisma`
  - **Owner:** Backend Dev
  - **Priority:** P0
  - **Estimate:** 1 hour

- [ ] **SETUP-004** - Configure development environment
  - Update `.env` with AI_PROXY_URL (localhost:4444)
  - Add test data seeds
  - **Owner:** DevOps
  - **Priority:** P1
  - **Estimate:** 30 min

- [ ] **SETUP-005** - Set up testing framework
  - Install Jest, testing-library
  - Configure test DB (vyomo_test)
  - **Owner:** QA
  - **Priority:** P1
  - **Estimate:** 2 hours

---

## 📅 Week 1: Core Detection (Days 1-5)

### Day 1-2: Market Data Anomaly Detector

- [ ] **DETECT-001** - Create MarketAnomalyDetectionService class
  - File: `market-anomaly-detection.service.ts`
  - Singleton pattern with getInstance()
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 3 hours

- [ ] **DETECT-002** - Implement Z-score detection method
  - Rolling window calculation (20, 50, 200 periods)
  - Price and volume anomalies
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 4 hours

- [ ] **DETECT-003** - Implement IQR (Interquartile Range) method
  - Outlier detection with 1.5 × IQR threshold
  - **Owner:** Backend Dev 1
  - **Priority:** P1
  - **Estimate:** 2 hours

- [ ] **DETECT-004** - Implement percentile ranking method
  - IV Rank calculation
  - Historical percentile tracking
  - **Owner:** Backend Dev 1
  - **Priority:** P1
  - **Estimate:** 3 hours

- [ ] **DETECT-005** - Add growth rate detection
  - Period-over-period % change
  - >50% threshold for anomaly
  - **Owner:** Backend Dev 1
  - **Priority:** P1
  - **Estimate:** 2 hours

- [ ] **DETECT-006** - Create SQL migration for market_anomalies table
  - Columns: id, type, severity, detectedAt, underlying, value, baseline, zScore
  - Indexes on [type], [severity], [detectedAt], [underlying]
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 1 hour

- [ ] **DETECT-007** - Write unit tests for detection methods
  - Test cases: normal data, 2σ, 3σ, 4σ anomalies
  - Edge cases: missing data, single data point
  - **Owner:** QA
  - **Priority:** P1
  - **Estimate:** 4 hours

- [ ] **DETECT-008** - Test with historical Nifty data
  - Load 6 months of historical data
  - Validate detection accuracy
  - Tune thresholds based on false positives
  - **Owner:** Backend Dev 1 + QA
  - **Priority:** P1
  - **Estimate:** 3 hours

### Day 3-4: Algorithm Conflict Detector

- [ ] **CONFLICT-001** - Create AlgorithmConflictEngine class
  - File: `AlgorithmConflictEngine.ts`
  - Singleton pattern
  - Signal history Map (userId:symbol → signals)
  - **Owner:** Backend Dev 2
  - **Priority:** P0
  - **Estimate:** 3 hours

- [ ] **CONFLICT-002** - Implement disagreement score calculation
  - Variance of signals (BUY=+1, SELL=-1, NEUTRAL=0)
  - Normalize to 0-100 scale
  - **Owner:** Backend Dev 2
  - **Priority:** P0
  - **Estimate:** 2 hours

- [ ] **CONFLICT-003** - Implement confidence spread metric
  - max(confidence) - min(confidence)
  - **Owner:** Backend Dev 2
  - **Priority:** P0
  - **Estimate:** 1 hour

- [ ] **CONFLICT-004** - Implement category alignment calculation
  - % agreement within each of 4 categories
  - VOLATILITY, GREEKS, MARKET_STRUCTURE, SENTIMENT
  - **Owner:** Backend Dev 2
  - **Priority:** P1
  - **Estimate:** 3 hours

- [ ] **CONFLICT-005** - Implement temporal stability metric
  - Track signal history over 5-minute window
  - Calculate flip rate
  - **Owner:** Backend Dev 2
  - **Priority:** P1
  - **Estimate:** 3 hours

- [ ] **CONFLICT-006** - Implement consensus strength calculation
  - Weighted scoring: Σ(signal × confidence) / Σ(confidence)
  - **Owner:** Backend Dev 2
  - **Priority:** P0
  - **Estimate:** 2 hours

- [ ] **CONFLICT-007** - Add severity classification logic
  - CRITICAL: disagreementScore >70 & evenly split
  - WARNING: low temporal stability <50
  - MINOR: moderate disagreement 30-50
  - **Owner:** Backend Dev 2
  - **Priority:** P0
  - **Estimate:** 2 hours

- [ ] **CONFLICT-008** - Add action determination logic
  - CRITICAL → PAUSE_AUTO_TRADING
  - WARNING → REDUCE_POSITION_SIZE_50
  - MINOR → PROCEED_WITH_CAUTION
  - **Owner:** Backend Dev 2
  - **Priority:** P0
  - **Estimate:** 1 hour

- [ ] **CONFLICT-009** - Create Prisma migration for conflict tables
  - AlgorithmConflict model
  - ConflictSeverity, ConflictAction enums
  - **Owner:** Backend Dev 2
  - **Priority:** P0
  - **Estimate:** 1 hour

- [ ] **CONFLICT-010** - Write unit tests
  - Mock 13 algorithm signals
  - Test edge cases (all agree, all disagree, category conflicts)
  - **Owner:** QA
  - **Priority:** P1
  - **Estimate:** 4 hours

- [ ] **CONFLICT-011** - Integration test with mock algorithm outputs
  - Simulate real trading scenarios
  - Verify actions triggered correctly
  - **Owner:** Backend Dev 2 + QA
  - **Priority:** P1
  - **Estimate:** 3 hours

### Day 5: Event Bridge

- [ ] **EVENT-001** - Create EventBridge class
  - File: `EventBridge.ts`
  - Extend EventEmitter
  - Pattern-based event routing
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 2 hours

- [ ] **EVENT-002** - Define event patterns
  - `anomaly.market.detected`
  - `anomaly.algorithm.conflict`
  - `anomaly.behavior.detected`
  - `algorithm.signal.generated`
  - `trade.executed`
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 1 hour

- [ ] **EVENT-003** - Wire detectors to emit events
  - MarketAnomalyDetectionService → EventBridge
  - AlgorithmConflictEngine → EventBridge
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 2 hours

- [ ] **EVENT-004** - Add event logging
  - Log all events to console (development)
  - Structured JSON format
  - **Owner:** Backend Dev 1
  - **Priority:** P1
  - **Estimate:** 1 hour

- [ ] **EVENT-005** - Write end-to-end event flow test
  - Trigger market anomaly → verify event emitted
  - Verify event payload structure
  - **Owner:** QA
  - **Priority:** P1
  - **Estimate:** 3 hours

---

## 📅 Week 2: Behavioral Detection + AI Agent (Days 6-10)

### Day 6-7: Trading Behavior Anomaly Detector

- [ ] **BEHAVIOR-001** - Create TradingBehaviorAnomalyEngine class
  - File: `TradingBehaviorAnomalyEngine.ts`
  - Singleton pattern
  - Baseline cache Map (userId → UserBaseline)
  - **Owner:** Backend Dev 2
  - **Priority:** P0
  - **Estimate:** 3 hours

- [ ] **BEHAVIOR-002** - Implement baseline calculation
  - 30-day rolling window
  - Metrics: avgDailyTrades, avgPositionSize, typicalHours, winRate
  - **Owner:** Backend Dev 2
  - **Priority:** P0
  - **Estimate:** 4 hours

- [ ] **BEHAVIOR-003** - Implement revenge trading detection
  - Rapid re-entry after loss (<5 min)
  - Position size increase check
  - **Owner:** Backend Dev 2
  - **Priority:** P1
  - **Estimate:** 2 hours

- [ ] **BEHAVIOR-004** - Implement overtrading detection
  - Z-score on daily trade count
  - >2σ threshold
  - **Owner:** Backend Dev 2
  - **Priority:** P1
  - **Estimate:** 2 hours

- [ ] **BEHAVIOR-005** - Implement position size anomaly detection
  - >2x normal position size
  - **Owner:** Backend Dev 2
  - **Priority:** P1
  - **Estimate:** 1 hour

- [ ] **BEHAVIOR-006** - Implement unusual timing detection
  - Trading outside typical hours
  - Market hours check (9:15-15:30 IST)
  - **Owner:** Backend Dev 2
  - **Priority:** P2
  - **Estimate:** 2 hours

- [ ] **BEHAVIOR-007** - Implement risk limit breach detection
  - Current daily loss vs maxDailyLoss
  - ≥80% threshold for WARNING
  - **Owner:** Backend Dev 2
  - **Priority:** P1
  - **Estimate:** 2 hours

- [ ] **BEHAVIOR-008** - Implement win/loss streak detection
  - Win streak aggression (increasing size after wins)
  - Loss streak desperation (martingale behavior)
  - **Owner:** Backend Dev 2
  - **Priority:** P1
  - **Estimate:** 3 hours

- [ ] **BEHAVIOR-009** - Implement rapid fire trading detection
  - Multiple trades within 1 minute
  - **Owner:** Backend Dev 2
  - **Priority:** P2
  - **Estimate:** 1 hour

- [ ] **BEHAVIOR-010** - Create Prisma migrations
  - TradingBehaviorAnomaly model
  - UserTradingBaseline model
  - AnomalyType, AnomalySeverity, AnomalyAction enums
  - **Owner:** Backend Dev 2
  - **Priority:** P0
  - **Estimate:** 2 hours

- [ ] **BEHAVIOR-011** - Write unit tests
  - Test each detection algorithm independently
  - Mock user trade data
  - **Owner:** QA
  - **Priority:** P1
  - **Estimate:** 5 hours

- [ ] **BEHAVIOR-012** - Test with historical user data
  - Load real user trade patterns (anonymized)
  - Validate detection accuracy
  - **Owner:** Backend Dev 2 + QA
  - **Priority:** P1
  - **Estimate:** 3 hours

### Day 8-9: AI Decision Agent Core

- [ ] **AI-001** - Create AnomalyDecisionAgent class
  - File: `AnomalyDecisionAgent.ts`
  - Integration with AI Proxy (localhost:4444)
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 3 hours

- [ ] **AI-002** - Implement ContextBuilder
  - Assemble: anomaly details, market context, algorithm consensus, user impact
  - Market phase detection (pre-open/open/closed)
  - VIX level check
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 4 hours

- [ ] **AI-003** - Add news event integration (optional)
  - Fetch recent news for underlying
  - Circuit breaker detection
  - **Owner:** Backend Dev 1
  - **Priority:** P2
  - **Estimate:** 3 hours

- [ ] **AI-004** - Implement AI Proxy integration
  - HTTP POST to localhost:4444/v1/chat/completions
  - Timeout: 5s
  - Retry logic (3 attempts)
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 2 hours

- [ ] **AI-005** - Add decision caching
  - Cache identical contexts for 5 minutes
  - Redis-based cache (optional)
  - **Owner:** Backend Dev 1
  - **Priority:** P2
  - **Estimate:** 2 hours

- [ ] **AI-006** - Test decision latency
  - Target: <50ms (p95)
  - Load test with 100 concurrent requests
  - **Owner:** QA
  - **Priority:** P1
  - **Estimate:** 3 hours

- [ ] **AI-007** - Write unit tests
  - Mock AI Proxy responses
  - Test context assembly
  - Test response parsing
  - **Owner:** QA
  - **Priority:** P1
  - **Estimate:** 4 hours

### Day 10: Decision Prompts

- [ ] **PROMPT-001** - Design system prompt
  - Define role: "AI monitoring agent for Vyomo trading"
  - Constrain outputs: FIX_ANOMALY | KEEP_ANOMALY | FLAG_FOR_REVIEW
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 2 hours

- [ ] **PROMPT-002** - Create user prompt templates
  - Template per anomaly type
  - Include severity, value, deviation, context
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 2 hours

- [ ] **PROMPT-003** - Implement response parsing
  - Extract decision from AI response
  - Validate decision is one of 3 options
  - Fallback to FLAG_FOR_REVIEW if invalid
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 1 hour

- [ ] **PROMPT-004** - Add reasoning extraction
  - Parse AI's explanation
  - Store in anomaly_decisions.reasoning
  - **Owner:** Backend Dev 1
  - **Priority:** P1
  - **Estimate:** 1 hour

- [ ] **PROMPT-005** - Test prompt variations
  - Test with 10+ different anomaly scenarios
  - Validate decision quality
  - Tune prompt based on results
  - **Owner:** Backend Dev 1 + QA
  - **Priority:** P1
  - **Estimate:** 4 hours

---

## 📅 Week 3: Actions + Integration (Days 11-15)

### Day 11-12: Action Executors

- [ ] **ACTION-001** - Create AutoFixAction executor
  - Rolling mean replacement (20-period)
  - Interpolation for missing strikes
  - Mark data as corrected in DB
  - **Owner:** Backend Dev 2
  - **Priority:** P0
  - **Estimate:** 3 hours

- [ ] **ACTION-002** - Create PreserveAction executor
  - Mark anomaly as validated real event
  - Store original value
  - Create informational notification
  - **Owner:** Backend Dev 2
  - **Priority:** P0
  - **Estimate:** 2 hours

- [ ] **ACTION-003** - Create ReviewAction executor
  - Create high-priority notification
  - Pause affected trading strategies (if CRITICAL)
  - Assign to operations team queue
  - **Owner:** Backend Dev 2
  - **Priority:** P0
  - **Estimate:** 3 hours

- [ ] **ACTION-004** - Add action logging to DB
  - anomaly_actions table
  - Fields: actionType, originalValue, correctedValue, executedAt, success
  - **Owner:** Backend Dev 2
  - **Priority:** P0
  - **Estimate:** 1 hour

- [ ] **ACTION-005** - Implement rollback mechanism
  - Undo auto-fix if manually overridden
  - Restore original value
  - **Owner:** Backend Dev 2
  - **Priority:** P2
  - **Estimate:** 3 hours

- [ ] **ACTION-006** - Write unit tests for actions
  - Test auto-fix with mock data
  - Test preserve action
  - Test review action (notification creation)
  - **Owner:** QA
  - **Priority:** P1
  - **Estimate:** 4 hours

- [ ] **ACTION-007** - Integration test: anomaly → decision → action
  - End-to-end flow
  - Verify DB updates
  - Verify notifications sent
  - **Owner:** QA
  - **Priority:** P1
  - **Estimate:** 3 hours

### Day 13-14: Blockchain Integration

- [ ] **BLOCKCHAIN-001** - Create BlockchainLogger class
  - File: `BlockchainLogger.ts`
  - Docchain pattern implementation
  - **Owner:** Backend Dev 1
  - **Priority:** P1
  - **Estimate:** 3 hours

- [ ] **BLOCKCHAIN-002** - Implement block creation
  - Generate blockHash (SHA-256)
  - Link to previousBlockHash
  - Sign with Ed25519 (crypto.sign)
  - **Owner:** Backend Dev 1
  - **Priority:** P1
  - **Estimate:** 3 hours

- [ ] **BLOCKCHAIN-003** - Implement genesis block initialization
  - Create first block on service start
  - previousBlockHash = "0x0000..."
  - **Owner:** Backend Dev 1
  - **Priority:** P1
  - **Estimate:** 1 hour

- [ ] **BLOCKCHAIN-004** - Add chain verification API
  - Verify all blocks linked correctly
  - Verify all signatures valid
  - Return integrity score
  - **Owner:** Backend Dev 1
  - **Priority:** P1
  - **Estimate:** 3 hours

- [ ] **BLOCKCHAIN-005** - Create Prisma migration for blockchain_blocks
  - Fields: id, previousBlockHash, blockHash, signature, action, timestamp
  - Index on [anomalyId], [action], [timestamp]
  - **Owner:** Backend Dev 1
  - **Priority:** P1
  - **Estimate:** 1 hour

- [ ] **BLOCKCHAIN-006** - Log all anomaly detections to blockchain
  - Hook into event bridge
  - Async logging (non-blocking)
  - **Owner:** Backend Dev 1
  - **Priority:** P1
  - **Estimate:** 2 hours

- [ ] **BLOCKCHAIN-007** - Log all actions to blockchain
  - FIX_ANOMALY, KEEP_ANOMALY, FLAG_FOR_REVIEW
  - Include documentHash of action details
  - **Owner:** Backend Dev 1
  - **Priority:** P1
  - **Estimate:** 2 hours

- [ ] **BLOCKCHAIN-008** - Write unit tests
  - Test block creation and linking
  - Test signature verification
  - Test chain integrity check
  - **Owner:** QA
  - **Priority:** P1
  - **Estimate:** 4 hours

- [ ] **BLOCKCHAIN-009** - Performance test
  - 1000 blocks creation
  - Verify chain performance <200ms
  - **Owner:** QA
  - **Priority:** P2
  - **Estimate:** 2 hours

### Day 15: Notification Manager

- [ ] **NOTIF-001** - Create NotificationManager integration
  - File: `NotificationManager.ts`
  - Connect to BFC smart notification service
  - **Owner:** Backend Dev 2
  - **Priority:** P1
  - **Estimate:** 2 hours

- [ ] **NOTIF-002** - Implement smart grouping
  - 60-second window
  - Group anomalies by type and underlying
  - **Owner:** Backend Dev 2
  - **Priority:** P1
  - **Estimate:** 3 hours

- [ ] **NOTIF-003** - Add priority mapping
  - CRITICAL anomaly → NotificationPriority.URGENT
  - WARNING → HIGH
  - MINOR → NORMAL
  - **Owner:** Backend Dev 2
  - **Priority:** P0
  - **Estimate:** 1 hour

- [ ] **NOTIF-004** - Format notification messages
  - Template per anomaly type
  - Include: symbol, severity, action taken
  - **Owner:** Backend Dev 2
  - **Priority:** P1
  - **Estimate:** 2 hours

- [ ] **NOTIF-005** - Add user preferences integration
  - Respect quiet hours
  - Channel preferences (push/email/SMS)
  - **Owner:** Backend Dev 2
  - **Priority:** P2
  - **Estimate:** 2 hours

- [ ] **NOTIF-006** - Write unit tests
  - Test grouping logic
  - Test priority mapping
  - Mock notification service
  - **Owner:** QA
  - **Priority:** P1
  - **Estimate:** 3 hours

- [ ] **NOTIF-007** - Integration test with BFC notification service
  - Send test notifications
  - Verify delivery
  - **Owner:** Backend Dev 2 + QA
  - **Priority:** P1
  - **Estimate:** 2 hours

---

## 📅 Week 4: API + Database (Days 16-20)

### Day 16-17: GraphQL Schema

- [ ] **GQL-001** - Define GraphQL type definitions
  - File: `anomaly.types.graphql`
  - Types: AnomalyDetection, AnomalyDecision, AnomalyAction
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 2 hours

- [ ] **GQL-002** - Create Query resolvers
  - `anomalies(filters)` - list with pagination
  - `anomaly(id)` - single anomaly
  - `anomalyDashboard` - analytics data
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 4 hours

- [ ] **GQL-003** - Create Mutation resolvers
  - `approveAnomalyFix(id)` - manual approval
  - `markAnomalyAsReal(id)` - override AI
  - `overrideDecision(id, newDecision)` - change decision
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 3 hours

- [ ] **GQL-004** - Create Subscription setup
  - `anomalyDetected` - real-time feed
  - `anomalyDecisionMade` - decision updates
  - `anomalyActionTaken` - action updates
  - **Owner:** Backend Dev 1
  - **Priority:** P1
  - **Estimate:** 4 hours

- [ ] **GQL-005** - Add authentication middleware
  - JWT validation
  - Role-based access (only admins can override)
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 2 hours

- [ ] **GQL-006** - Add rate limiting
  - 100 requests/minute per user
  - **Owner:** Backend Dev 1
  - **Priority:** P2
  - **Estimate:** 1 hour

- [ ] **GQL-007** - Write GraphQL tests
  - Test all queries with GraphQL Playground
  - Test mutations
  - Test subscriptions with WebSocket client
  - **Owner:** QA
  - **Priority:** P1
  - **Estimate:** 5 hours

### Day 18-19: Database Finalization

- [ ] **DB-001** - Run all Prisma migrations
  - Verify all tables created
  - Check indexes
  - **Owner:** DevOps
  - **Priority:** P0
  - **Estimate:** 1 hour

- [ ] **DB-002** - Optimize indexes
  - Analyze query patterns
  - Add composite indexes if needed
  - **Owner:** Backend Dev 2
  - **Priority:** P1
  - **Estimate:** 2 hours

- [ ] **DB-003** - Add database triggers (optional)
  - Auto-update timestamps
  - Immutability enforcement for blockchain_blocks
  - **Owner:** Backend Dev 2
  - **Priority:** P2
  - **Estimate:** 2 hours

- [ ] **DB-004** - Create seed data
  - 50+ test anomalies
  - Various types, severities
  - Historical data for testing
  - **Owner:** QA
  - **Priority:** P1
  - **Estimate:** 3 hours

- [ ] **DB-005** - Database backup strategy
  - Daily automated backups
  - Retention: 30 days
  - **Owner:** DevOps
  - **Priority:** P1
  - **Estimate:** 2 hours

- [ ] **DB-006** - Performance testing
  - Query performance with 10k+ anomalies
  - Optimize slow queries (>100ms)
  - **Owner:** QA
  - **Priority:** P1
  - **Estimate:** 4 hours

### Day 20: REST Endpoints

- [ ] **REST-001** - Create REST API routes
  - File: `anomaly.routes.ts`
  - GET /api/anomalies
  - GET /api/anomalies/:id
  - POST /api/anomalies/:id/review
  - POST /api/anomalies/:id/override
  - **Owner:** Backend Dev 2
  - **Priority:** P1
  - **Estimate:** 3 hours

- [ ] **REST-002** - Add dashboard endpoint
  - GET /api/anomalies/dashboard
  - Return: total count, by severity, by type, recent anomalies
  - **Owner:** Backend Dev 2
  - **Priority:** P1
  - **Estimate:** 2 hours

- [ ] **REST-003** - Add export functionality
  - GET /api/anomalies/export?format=csv|json
  - Filter by date range
  - **Owner:** Backend Dev 2
  - **Priority:** P2
  - **Estimate:** 2 hours

- [ ] **REST-004** - Add audit trail endpoint
  - GET /api/anomalies/:id/audit-trail
  - Return blockchain blocks for this anomaly
  - **Owner:** Backend Dev 2
  - **Priority:** P1
  - **Estimate:** 2 hours

- [ ] **REST-005** - Write API tests
  - Postman collection
  - Test all endpoints
  - **Owner:** QA
  - **Priority:** P1
  - **Estimate:** 3 hours

---

## 📅 Week 5: Dashboard + Testing (Days 21-25)

### Day 21-23: React Dashboard

- [ ] **UI-001** - Set up React project structure
  - Create `/root/ankr-labs-nx/apps/vyomo-dashboard-anomalies/`
  - Install dependencies: React 19, Vite, Tailwind, Shadcn/ui
  - **Owner:** Frontend Dev
  - **Priority:** P0
  - **Estimate:** 2 hours

- [ ] **UI-002** - Create live anomaly feed component
  - Real-time WebSocket subscription
  - List view with filters (type, severity, date)
  - Pagination
  - **Owner:** Frontend Dev
  - **Priority:** P0
  - **Estimate:** 5 hours

- [ ] **UI-003** - Create anomaly detail modal
  - Show full details: value, baseline, deviation, context
  - Show AI decision and reasoning
  - Show blockchain audit trail
  - **Owner:** Frontend Dev
  - **Priority:** P1
  - **Estimate:** 4 hours

- [ ] **UI-004** - Create analytics charts
  - Decision breakdown (pie chart: FIX/KEEP/FLAG)
  - Anomaly timeline (line chart: count over time)
  - Severity distribution (bar chart)
  - Type distribution (bar chart)
  - **Owner:** Frontend Dev
  - **Priority:** P1
  - **Estimate:** 5 hours

- [ ] **UI-005** - Add manual override controls
  - Button: "Override to FIX"
  - Button: "Override to KEEP"
  - Button: "Approve AI Decision"
  - Confirmation dialog
  - **Owner:** Frontend Dev
  - **Priority:** P0
  - **Estimate:** 3 hours

- [ ] **UI-006** - Create blockchain verification UI
  - Show chain integrity status
  - Show block count
  - Button: "Verify Chain"
  - Display verification results
  - **Owner:** Frontend Dev
  - **Priority:** P2
  - **Estimate:** 3 hours

- [ ] **UI-007** - Add filtering and search
  - Filter by: type, severity, date range, underlying
  - Search by: anomaly ID, underlying symbol
  - **Owner:** Frontend Dev
  - **Priority:** P1
  - **Estimate:** 3 hours

- [ ] **UI-008** - Add export button
  - Export filtered results as CSV
  - **Owner:** Frontend Dev
  - **Priority:** P2
  - **Estimate:** 2 hours

- [ ] **UI-009** - Responsive design
  - Mobile-friendly layout
  - Tablet optimization
  - **Owner:** Frontend Dev
  - **Priority:** P2
  - **Estimate:** 3 hours

- [ ] **UI-010** - Dark mode support
  - Toggle button
  - Persist preference
  - **Owner:** Frontend Dev
  - **Priority:** P3
  - **Estimate:** 2 hours

### Day 24-25: End-to-End Testing

- [ ] **TEST-001** - Integration test: Market anomaly flow
  - Trigger market data anomaly
  - Verify detection
  - Verify AI decision
  - Verify action execution
  - Verify blockchain log
  - Verify notification sent
  - **Owner:** QA
  - **Priority:** P0
  - **Estimate:** 4 hours

- [ ] **TEST-002** - Integration test: Algorithm conflict flow
  - Simulate 13 algorithm signals (conflict)
  - Verify conflict detection
  - Verify PAUSE_AUTO_TRADING action
  - Verify notification
  - **Owner:** QA
  - **Priority:** P0
  - **Estimate:** 3 hours

- [ ] **TEST-003** - Integration test: Behavior anomaly flow
  - Simulate revenge trading pattern
  - Verify detection
  - Verify BLOCK_TRADING action
  - Verify cooldown period
  - **Owner:** QA
  - **Priority:** P0
  - **Estimate:** 3 hours

- [ ] **TEST-004** - Performance test: Detection latency
  - Measure time from tick → anomaly flagged
  - Target: <100ms
  - Test with 1000 ticks/second
  - **Owner:** QA
  - **Priority:** P1
  - **Estimate:** 3 hours

- [ ] **TEST-005** - Performance test: AI decision latency
  - Measure AI Proxy call duration
  - Target: <50ms (p95)
  - Test with 100 concurrent requests
  - **Owner:** QA
  - **Priority:** P1
  - **Estimate:** 2 hours

- [ ] **TEST-006** - Performance test: End-to-end latency
  - Full flow: detection → decision → action → notification
  - Target: <500ms
  - **Owner:** QA
  - **Priority:** P1
  - **Estimate:** 2 hours

- [ ] **TEST-007** - Load test: Throughput
  - Simulate 1000 anomalies/minute
  - Verify system handles load
  - Check for memory leaks
  - **Owner:** QA
  - **Priority:** P1
  - **Estimate:** 4 hours

- [ ] **TEST-008** - Security test: Authentication
  - Test JWT validation
  - Test role-based access
  - Attempt unauthorized override
  - **Owner:** QA
  - **Priority:** P1
  - **Estimate:** 3 hours

- [ ] **TEST-009** - Security test: Blockchain tampering
  - Attempt to modify blockchain_blocks table
  - Verify integrity check fails
  - **Owner:** QA
  - **Priority:** P2
  - **Estimate:** 2 hours

- [ ] **TEST-010** - User acceptance testing (UAT)
  - Demo to stakeholders
  - Gather feedback
  - Create punch list for fixes
  - **Owner:** Product Manager + QA
  - **Priority:** P0
  - **Estimate:** 4 hours

---

## 📅 Week 6: Shadow Mode (Days 26-30)

### Shadow Mode Deployment

- [ ] **SHADOW-001** - Deploy to staging environment
  - Set up parallel processing
  - Do NOT enable auto-actions yet
  - **Owner:** DevOps
  - **Priority:** P0
  - **Estimate:** 3 hours

- [ ] **SHADOW-002** - Configure monitoring dashboards
  - Grafana dashboard for anomaly metrics
  - Alert for AI latency >100ms
  - Alert for blockchain integrity issues
  - **Owner:** DevOps
  - **Priority:** P0
  - **Estimate:** 4 hours

- [ ] **SHADOW-003** - Run in parallel for 5 days
  - Log all anomalies
  - Do NOT take actions
  - Collect accuracy metrics
  - **Owner:** Backend Team
  - **Priority:** P0
  - **Estimate:** Ongoing (monitoring)

- [ ] **SHADOW-004** - Daily review meetings
  - Review false positives
  - Review false negatives
  - Tune detection thresholds
  - **Owner:** Product Manager + Dev Team
  - **Priority:** P0
  - **Estimate:** 1 hour/day × 5 days

- [ ] **SHADOW-005** - Analyze AI decision quality
  - Compare AI decisions vs manual review
  - Calculate accuracy: correct decisions / total decisions
  - Target: >95% accuracy
  - **Owner:** QA + Product Manager
  - **Priority:** P0
  - **Estimate:** 8 hours

- [ ] **SHADOW-006** - Tune thresholds based on findings
  - Adjust Z-score thresholds
  - Adjust severity classification rules
  - Re-test after tuning
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 6 hours

---

## 📅 Week 7: Partial Automation (Days 31-35)

### Enable Auto-Actions (MINOR only)

- [ ] **AUTO-001** - Enable FIX_ANOMALY for MINOR severity
  - Update config: `AUTO_FIX_ENABLED=true`
  - Restrict to MINOR severity only
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 1 hour

- [ ] **AUTO-002** - Keep manual confirmation for WARNING/CRITICAL
  - All KEEP and FLAG decisions require approval
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 1 hour

- [ ] **AUTO-003** - Monitor blockchain audit trail
  - Verify all auto-fixes logged
  - Spot-check 10 auto-fixes daily
  - **Owner:** Operations Team
  - **Priority:** P0
  - **Estimate:** 1 hour/day × 5 days

- [ ] **AUTO-004** - Validate AI decision quality
  - Manual review of 50 AI decisions
  - Calculate precision/recall
  - **Owner:** QA
  - **Priority:** P0
  - **Estimate:** 6 hours

- [ ] **AUTO-005** - Create rollback procedure documentation
  - How to disable auto-fix
  - How to rollback a fix manually
  - **Owner:** Backend Dev 1
  - **Priority:** P1
  - **Estimate:** 2 hours

- [ ] **AUTO-006** - Conduct incident response drill
  - Simulate: AI makes wrong decision
  - Test rollback procedure
  - Time the response
  - **Owner:** Operations Team + Dev Team
  - **Priority:** P1
  - **Estimate:** 3 hours

---

## 📅 Week 8: Full Automation (Days 36-40)

### Enable All Auto-Actions

- [ ] **FULL-001** - Enable all auto-actions
  - FIX_ANOMALY: auto-execute
  - KEEP_ANOMALY: auto-execute (mark as real)
  - FLAG_FOR_REVIEW: still requires manual review
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 1 hour

- [ ] **FULL-002** - CRITICAL anomalies still flagged
  - Override: CRITICAL always goes to manual review
  - Even if AI says FIX
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 1 hour

- [ ] **FULL-003** - WARNING anomalies auto-handled
  - FIX or KEEP executed automatically
  - Notification sent to ops team (informational)
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 30 min

- [ ] **FULL-004** - MINOR anomalies silently fixed
  - No notification sent (low noise)
  - Logged to blockchain for audit
  - **Owner:** Backend Dev 1
  - **Priority:** P0
  - **Estimate:** 30 min

- [ ] **FULL-005** - Monitor for 5 days
  - Daily metrics review
  - Check for unexpected issues
  - **Owner:** Operations Team
  - **Priority:** P0
  - **Estimate:** 1 hour/day × 5 days

- [ ] **FULL-006** - Weekly performance report
  - Anomalies detected: X
  - Auto-fixes: Y
  - Flagged for review: Z
  - False positives: N
  - Manual overrides: M
  - **Owner:** Product Manager
  - **Priority:** P1
  - **Estimate:** 2 hours

---

## 📅 Week 9+: Production (Days 41+)

### Production Operations

- [ ] **PROD-001** - Deploy to production
  - Final smoke tests
  - Enable for 10% of users (canary)
  - Monitor for 24 hours
  - **Owner:** DevOps
  - **Priority:** P0
  - **Estimate:** 4 hours

- [ ] **PROD-002** - Gradual rollout
  - Day 1: 10% users
  - Day 2: 25% users
  - Day 3: 50% users
  - Day 4: 100% users
  - **Owner:** Product Manager + DevOps
  - **Priority:** P0
  - **Estimate:** Ongoing

- [ ] **PROD-003** - Set up daily review process
  - Review flagged anomalies (30 min/day)
  - Approve/override decisions
  - **Owner:** Operations Team
  - **Priority:** P0
  - **Estimate:** 30 min/day

- [ ] **PROD-004** - Weekly AI performance report
  - Decision accuracy
  - Latency metrics (p50, p95, p99)
  - False positive rate
  - **Owner:** Product Manager
  - **Priority:** P1
  - **Estimate:** 2 hours/week

- [ ] **PROD-005** - Monthly model retraining (if needed)
  - Collect feedback from manual overrides
  - Re-tune decision prompts
  - A/B test new prompts
  - **Owner:** Backend Dev 1
  - **Priority:** P2
  - **Estimate:** 4 hours/month

- [ ] **PROD-006** - Quarterly performance review
  - ROI analysis
  - Cost savings calculation
  - User satisfaction survey
  - **Owner:** Product Manager
  - **Priority:** P1
  - **Estimate:** 8 hours/quarter

---

## 📊 Progress Tracking

### Week 1 Milestones
- [ ] Market Data Detector functional
- [ ] Algorithm Conflict Detector functional
- [ ] Event Bridge wired up
- [ ] 3 database tables created

### Week 2 Milestones
- [ ] Trading Behavior Detector functional
- [ ] AI Decision Agent integrated
- [ ] Decision prompts tested and validated
- [ ] 3 more database tables created

### Week 3 Milestones
- [ ] All 3 action executors working
- [ ] Blockchain integration complete
- [ ] Notifications sending correctly
- [ ] End-to-end flow tested

### Week 4 Milestones
- [ ] GraphQL API functional
- [ ] All database migrations complete
- [ ] REST endpoints working
- [ ] API tests passing

### Week 5 Milestones
- [ ] Dashboard deployed
- [ ] All performance tests passing
- [ ] UAT completed with stakeholder approval
- [ ] System ready for shadow mode

---

## 🎯 Success Criteria

### Technical Success
- [ ] All 85 tasks completed
- [ ] All tests passing (unit + integration + E2E)
- [ ] Performance targets met:
  - Detection latency <100ms ✅
  - AI decision <50ms ✅
  - E2E latency <500ms ✅
  - False positive rate <5% ✅
- [ ] 100% blockchain integrity ✅
- [ ] Dashboard functional and responsive ✅

### Business Success
- [ ] 80% reduction in manual review time
- [ ] 70% reduction in notification volume
- [ ] >95% AI decision accuracy
- [ ] Zero data loss (all anomalies persisted)
- [ ] Positive user feedback (>80% satisfaction)

### Operational Success
- [ ] Deployment completed on schedule
- [ ] Team trained on dashboard usage
- [ ] Incident response procedures documented
- [ ] Monitoring dashboards active
- [ ] Daily/weekly review processes established

---

## 📞 Team Assignments

### Backend Dev 1 (Primary: Detection + AI)
- Market Data Detector
- AI Decision Agent
- Prompts
- Event Bridge
- Blockchain Logger
- GraphQL API

### Backend Dev 2 (Primary: Behavior + Actions)
- Algorithm Conflict Engine
- Trading Behavior Detector
- Action Executors
- Notification Manager
- REST API
- Database optimization

### Frontend Dev
- React Dashboard
- Real-time feed component
- Analytics charts
- Manual override UI
- Blockchain verification UI

### QA Engineer
- All unit tests
- Integration tests
- Performance tests
- Security tests
- UAT coordination

### DevOps
- Environment setup
- Database migrations
- Deployment (staging + production)
- Monitoring dashboards
- Incident response

### Product Manager
- Requirements clarification
- UAT coordination
- Daily shadow mode reviews
- Weekly performance reports
- Stakeholder communication

---

## 🔔 Reminders

### Daily
- [ ] Stand-up meeting (15 min)
- [ ] Code reviews for all commits
- [ ] Run test suite before pushing

### Weekly
- [ ] Team sync (1 hour)
- [ ] Progress update to stakeholders
- [ ] Performance metrics review

### Before Each Phase
- [ ] Review phase checklist
- [ ] Confirm all dependencies ready
- [ ] Stakeholder approval if needed

---

## 📚 Documentation Links

- **Project Report:** https://ankr.in/project/documents/VYOMO-ANOMALY-DETECTION-PROJECT-REPORT_2026-02-13.md
- **Implementation Plan:** `/root/.claude/plans/humble-forging-minsky.md`
- **API Documentation:** (To be created)
- **User Guide:** (To be created)
- **Operations Runbook:** (To be created)

---

**श्री गणेशाय नमः | जय गुरुजी** 🙏

**TODO List Created:** 2026-02-13
**Status:** 📋 Ready for Implementation
**Next Review:** Daily standup

**Total Tasks:** 85
**Target Completion:** Week of March 20, 2026
**Let's build something amazing! 🚀**
