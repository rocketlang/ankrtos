# Vyomo Package Discovery

**Date:** 2026-01-23
**Total Packages:** 41
**Total Size:** 703.0 KB

---

## 📊 Summary by Category

| Category | Count | Percentage |
|----------|-------|------------|
| Backend | 38 | 92.7% |
| Frontend | 0 | 0.0% |
| Mobile | 0 | 0.0% |
| Analytics | 0 | 0.0% |
| Shared | 3 | 7.3% |

---

## 🎯 Reusability Assessment

| Level | Count | Percentage |
|-------|-------|------------|
| High | 36 | 87.8% |
| Medium | 5 | 12.2% |

**Zero-Dependency Packages:** 31 (75.6%)

---

## 💡 Key Features

### Options Analytics
- Greeks calculation (Delta, Gamma, Theta, Vega)
- Option chain analysis
- Strike price optimization
- Premium calculation engines

### Financial Utilities
- Real-time data processing
- Market sentiment analysis
- Portfolio optimization
- Risk assessment tools

---

## 📦 Package List


### 1. @vyomo/services-ai-recommendations.service

- **Category:** backend
- **Size:** 21.2 KB
- **Exports:** 10 (TradeRecommendation, RecommendationFactor, StrategyRecommendation, StrategyStep, PortfolioRecommendation...)
- **Dependencies:** None
- **Reusability:** high - 10 exports, generic implementation, financial utilities, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/ai-recommendations.service.ts`


### 2. @vyomo/services-alert-rules.service

- **Category:** backend
- **Size:** 21.2 KB
- **Exports:** 19 (RuleMetric, RuleOperator, RuleLogic, RuleCondition, AlertRule...)
- **Dependencies:** None
- **Reusability:** high - 19 exports, financial utilities, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/alert-rules.service.ts`


### 3. @vyomo/services-analytics-dashboard.service

- **Category:** backend
- **Size:** 33.1 KB
- **Exports:** 13 (PerformanceMetrics, RiskMetrics, StrategyAnalysis, BehavioralAnalysis, BehavioralPattern...)
- **Dependencies:** None
- **Reusability:** high - 13 exports, generic implementation, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/analytics-dashboard.service.ts`


### 4. @vyomo/services-block-deal.service

- **Category:** backend
- **Size:** 15.1 KB
- **Exports:** 7 (DealType, ParticipantType, BlockDeal, BlockDealAnalysis, BlockDealInput...)
- **Dependencies:** None
- **Reusability:** high - 7 exports, generic implementation, financial utilities, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/block-deal.service.ts`


### 5. @vyomo/services-broker-alerts.service

- **Category:** backend
- **Size:** 15.8 KB
- **Exports:** 7 (BrokerAlert, BrokerAlertType, AlertConfig, NotificationRecord, AlertSummary...)
- **Dependencies:** None
- **Reusability:** high - 7 exports, generic implementation, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/broker-alerts.service.ts`


### 6. @vyomo/services-broker.service

- **Category:** backend
- **Size:** 15.1 KB
- **Exports:** 13 (BrokerType, BrokerCredentials, BrokerConnection, BrokerOrder, OrderResponse...)
- **Dependencies:** None
- **Reusability:** high - 13 exports, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/broker.service.ts`


### 7. @vyomo/services-community.service

- **Category:** backend
- **Size:** 17.7 KB
- **Exports:** 28 (SharedTrade, TradeComment, Strategy, StrategyReview, ExpertProfile...)
- **Dependencies:** None
- **Reusability:** high - 28 exports, financial utilities, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/community.service.ts`


### 8. @vyomo/services-expiry-pinning.service

- **Category:** backend
- **Size:** 12.6 KB
- **Exports:** 5 (StrikePinProbability, ExpiryPinningAnalysis, ExpiryPinningInput, analyzeExpiryPinning, generateMockExpiryPinning)
- **Dependencies:** None
- **Reusability:** high - 5 exports, generic implementation, financial utilities, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/expiry-pinning.service.ts`


### 9. @vyomo/services-fii-dii.service

- **Category:** backend
- **Size:** 16.4 KB
- **Exports:** 6 (InstitutionalFlow, DivergenceEvent, FIIDIIAnalysis, FIIDIIInput, analyzeFIIDII...)
- **Dependencies:** None
- **Reusability:** high - 6 exports, generic implementation, financial utilities, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/fii-dii.service.ts`


### 10. @vyomo/services-gamification.service

- **Category:** backend
- **Size:** 17.9 KB
- **Exports:** 8 (VYOMO_BADGES, VYOMO_CHALLENGES, VYOMO_TIERS, VYOMO_POINTS, initializeGamification...)
- **Dependencies:** @ankr/gamification
- **Reusability:** high - 8 exports, financial utilities, documented, minimal dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/gamification.service.ts`


### 11. @vyomo/services-gex.service

- **Category:** backend
- **Size:** 11.4 KB
- **Exports:** 5 (GEXLevel, GEXAnalysis, GEXInput, analyzeGEX, generateMockGEXAnalysis)
- **Dependencies:** None
- **Reusability:** high - 5 exports, generic implementation, financial utilities, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/gex.service.ts`


### 12. @vyomo/services-insights.service

- **Category:** backend
- **Size:** 24.4 KB
- **Exports:** 11 (Language, UserLevel, RiskAppetite, InsightContext, MarketInsight...)
- **Dependencies:** None
- **Reusability:** high - 11 exports, financial utilities, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/insights.service.ts`


### 13. @vyomo/services-iv-skew-anomaly.service

- **Category:** backend
- **Size:** 17.5 KB
- **Exports:** 6 (AnomalyType, SkewAnomaly, IVSkewAnalysis, IVSkewInput, analyzeIVSkew...)
- **Dependencies:** None
- **Reusability:** high - 6 exports, generic implementation, financial utilities, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/iv-skew-anomaly.service.ts`


### 14. @vyomo/services-liquidity-void.service

- **Category:** backend
- **Size:** 16.2 KB
- **Exports:** 7 (ZoneType, LiquidityZone, VolumeProfile, LiquidityVoidAnalysis, LiquidityVoidInput...)
- **Dependencies:** None
- **Reusability:** high - 7 exports, generic implementation, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/liquidity-void.service.ts`


### 15. @vyomo/services-lms.service

- **Category:** backend
- **Size:** 27.1 KB
- **Exports:** 37 (CourseLevel, LessonType, ContentFormat, QuizQuestionType, Course...)
- **Dependencies:** None
- **Reusability:** high - 37 exports, financial utilities, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/lms.service.ts`


### 16. @vyomo/services-manipulation.service

- **Category:** backend
- **Size:** 21.9 KB
- **Exports:** 7 (ManipulationPatternType, ManipulationIndicator, ManipulationPattern, ManipulationAnalysis, ManipulationInput...)
- **Dependencies:** None
- **Reusability:** high - 7 exports, generic implementation, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/manipulation.service.ts`


### 17. @vyomo/services-market-data.service

- **Category:** backend
- **Size:** 16.2 KB
- **Exports:** 11 (MarketDataConfig, IndexData, StockData, OptionData, OptionChainData...)
- **Dependencies:** None
- **Reusability:** high - 11 exports, generic implementation, financial utilities, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/market-data.service.ts`


### 18. @vyomo/services-narrative-cycle.service

- **Category:** backend
- **Size:** 20.0 KB
- **Exports:** 9 (KNOWN_NARRATIVES, NarrativePhase, NarrativeTheme, NarrativeSignal, MediaMention...)
- **Dependencies:** None
- **Reusability:** high - 9 exports, generic implementation, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/narrative-cycle.service.ts`


### 19. @vyomo/services-nse-data.service

- **Category:** backend
- **Size:** 13.8 KB
- **Exports:** 10 (NSEOptionChainResponse, NSEOptionData, NSEIndexQuote, NSEFIIDIIData, parseOptionChain...)
- **Dependencies:** https
- **Reusability:** high - 10 exports, generic implementation, financial utilities, documented, minimal dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/nse-data.service.ts`


### 20. @vyomo/services-operator-accumulation.service

- **Category:** backend
- **Size:** 17.5 KB
- **Exports:** 6 (AccumulationSignal, BulkDeal, InsiderTransaction, OperatorAccumulationAnalysis, analyzeOperatorAccumulation...)
- **Dependencies:** None
- **Reusability:** high - 6 exports, generic implementation, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/operator-accumulation.service.ts`


### 21. @vyomo/services-paper-trading.service

- **Category:** backend
- **Size:** 21.0 KB
- **Exports:** 18 (VirtualPortfolio, VirtualPosition, ClosedTrade, TradeOrder, BacktestConfig...)
- **Dependencies:** None
- **Reusability:** high - 18 exports, generic implementation, financial utilities, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/paper-trading.service.ts`


### 22. @vyomo/services-performance.service

- **Category:** backend
- **Size:** 11.8 KB
- **Exports:** 19 (CacheConfig, CacheEntry, PerformanceMetrics, QueryStats, CACHE_CONFIGS...)
- **Dependencies:** None
- **Reusability:** high - 19 exports, generic implementation, financial utilities, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/performance.service.ts`


### 23. @vyomo/services-personalization.service

- **Category:** backend
- **Size:** 25.7 KB
- **Exports:** 19 (RiskProfile, UserProfile, RiskAssessmentQuestion, RiskAssessmentResult, TradeJournalEntry...)
- **Dependencies:** None
- **Reusability:** high - 19 exports, generic implementation, financial utilities, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/personalization.service.ts`


### 24. @vyomo/services-portfolio-optimizer.service

- **Category:** backend
- **Size:** 19.8 KB
- **Exports:** 14 (PortfolioAnalysis, PortfolioSummary, GreeksAnalysis, RiskAnalysis, StressTestResult...)
- **Dependencies:** None
- **Reusability:** high - 14 exports, generic implementation, financial utilities, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/portfolio-optimizer.service.ts`


### 25. @vyomo/services-retail-fomo.service

- **Category:** backend
- **Size:** 15.9 KB
- **Exports:** 5 (FOMOComponent, FOMOHistoricalEvent, RetailFOMOAnalysis, analyzeRetailFOMO, generateMockRetailFOMOAnalysis)
- **Dependencies:** None
- **Reusability:** high - 5 exports, generic implementation, financial utilities, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/retail-fomo.service.ts`


### 26. @vyomo/services-retail-trap.service

- **Category:** backend
- **Size:** 14.4 KB
- **Exports:** 6 (StopClusterZone, TrapDetection, RetailTrapAnalysis, RetailTrapInput, analyzeRetailTraps...)
- **Dependencies:** None
- **Reusability:** high - 6 exports, generic implementation, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/retail-trap.service.ts`


### 27. @vyomo/services-smart-money.service

- **Category:** backend
- **Size:** 14.0 KB
- **Exports:** 6 (TimeSegmentFlow, SmartMoneySignal, SmartMoneyAnalysis, SmartMoneyInput, analyzeSmartMoney...)
- **Dependencies:** None
- **Reusability:** high - 6 exports, generic implementation, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/smart-money.service.ts`


### 28. @vyomo/services-social-sentiment.service

- **Category:** backend
- **Size:** 16.6 KB
- **Exports:** 8 (SentimentLevel, ContrarianSignal, SocialSource, InfluencerMention, SocialSentimentAnalysis...)
- **Dependencies:** None
- **Reusability:** high - 8 exports, generic implementation, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/social-sentiment.service.ts`


### 29. @vyomo/services-telegram-bot.service

- **Category:** backend
- **Size:** 21.4 KB
- **Exports:** 2 (getTelegramStatus, default)
- **Dependencies:** None
- **Reusability:** high - 2 exports, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/telegram-bot.service.ts`


### 30. @vyomo/services-telegram.service

- **Category:** backend
- **Size:** 20.0 KB
- **Exports:** 27 (wire, AlertPriority, AlertCategory, NotificationChannel, VyomoAlert...)
- **Dependencies:** @ankr/wire
- **Reusability:** high - 27 exports, financial utilities, documented, minimal dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/telegram.service.ts`


### 31. @vyomo/services-translation.service

- **Category:** backend
- **Size:** 19.2 KB
- **Exports:** 7 (IndianLanguage, LanguageInfo, INDIAN_LANGUAGES, TRADING_TRANSLATIONS, VyomoTranslator...)
- **Dependencies:** axios
- **Reusability:** medium - 7 exports, documented, minimal dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/translation.service.ts`


### 32. @vyomo/services-voice-alerts.service

- **Category:** backend
- **Size:** 18.9 KB
- **Exports:** 12 (VoiceChannel, VoiceAlertConfig, VoiceAlertSubscription, VoiceAlertResult, createVoiceSubscription...)
- **Dependencies:** crypto, fs, path
- **Reusability:** medium - 12 exports, financial utilities, documented, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/voice-alerts.service.ts`


### 33. @vyomo/services-voice.service

- **Category:** backend
- **Size:** 8.7 KB
- **Exports:** 7 (VoiceProvider, VoiceConfig, TTSResult, VyomoVoice, getVoiceService...)
- **Dependencies:** axios, crypto
- **Reusability:** medium - 7 exports, documented, minimal dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/voice.service.ts`


### 34. @vyomo/services-volatility-compression.service

- **Category:** backend
- **Size:** 16.7 KB
- **Exports:** 6 (CompressionIndicator, CompressionAlert, VolatilityCompressionAnalysis, CompressionInput, analyzeVolatilityCompression...)
- **Dependencies:** None
- **Reusability:** high - 6 exports, generic implementation, financial utilities, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/volatility-compression.service.ts`


### 35. @vyomo/services-volatility-regime.service

- **Category:** backend
- **Size:** 16.8 KB
- **Exports:** 7 (VolatilityRegime, RegimeCharacteristics, RegimeTransition, VolatilityRegimeAnalysis, VolatilityRegimeInput...)
- **Dependencies:** None
- **Reusability:** high - 7 exports, generic implementation, financial utilities, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/volatility-regime.service.ts`


### 36. @vyomo/services-vyomo-equity.service

- **Category:** backend
- **Size:** 21.0 KB
- **Exports:** 13 (StockInsight, FundamentalAnalysis, TechnicalAnalysis, ChartPattern, SentimentAnalysis...)
- **Dependencies:** None
- **Reusability:** high - 13 exports, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/vyomo-equity.service.ts`


### 37. @vyomo/services-vyomo-ipo.service

- **Category:** backend
- **Size:** 18.0 KB
- **Exports:** 11 (IPO, IPORating, IPOAnalysis, PeerCompany, GMPData...)
- **Dependencies:** None
- **Reusability:** high - 11 exports, financial utilities, documented, zero dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/vyomo-ipo.service.ts`


### 38. @vyomo/services-whatsapp-bot.service

- **Category:** backend
- **Size:** 28.8 KB
- **Exports:** 2 (getWhatsAppStatus, default)
- **Dependencies:** @whiskeysockets/baileys, pino
- **Reusability:** medium - 2 exports, documented, minimal dependencies, typed
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/services/whatsapp-bot.service.ts`


### 39. @vyomo/utils-logger

- **Category:** shared
- **Size:** 0.5 KB
- **Exports:** 2 (logger, default)
- **Dependencies:** pino
- **Reusability:** medium - 2 exports, financial utilities, documented, minimal dependencies
- **Path:** `ankr-options-standalone/apps/vyomo-api/src/utils/logger.ts`


### 40. @vyomo-ui/apollo

- **Category:** shared
- **Size:** 1.4 KB
- **Exports:** 1 (apolloClient)
- **Dependencies:** @apollo/client, graphql-ws
- **Reusability:** high - 1 exports, generic implementation, financial utilities, documented, minimal dependencies
- **Path:** `ankr-options-standalone/apps/vyomo-web/src/utils/apollo.ts`


### 41. @vyomo-ui/query-client

- **Category:** shared
- **Size:** 0.3 KB
- **Exports:** 1 (queryClient)
- **Dependencies:** @tanstack/react-query
- **Reusability:** high - 1 exports, generic implementation, documented, minimal dependencies
- **Path:** `ankr-options-standalone/apps/vyomo-web/src/utils/query-client.ts`


---

## 💡 Installation

```bash
# Backend services
npm install @vyomo/services-options
npm install @vyomo/calculators-greeks

# Frontend components
npm install @vyomo-ui/option-chain
npm install @vyomo-ui/chart

# Mobile components
npm install @vyomo-mobile/option-card

# Analytics
npm install @vyomo/analyzers-sentiment
npm install @vyomo/analyzers-risk

# Shared types
npm install @vyomo/types-api
```

---

*Generated by ANKR Package Discovery System*
