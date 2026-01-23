# Fr8X Package Discovery

**Date:** 2026-01-23
**Total Packages:** 89
**Total Size:** 1840.3 KB

---

## 📊 Summary by Category

| Category | Count | Percentage |
|----------|-------|------------|
| Backend | 72 | 80.9% |
| Frontend | 0 | 0.0% |
| Shared | 17 | 19.1% |
| Security | 0 | 0.0% |

---

## 🎯 Reusability Assessment

| Level | Count | Percentage |
|-------|-------|------------|
| High | 35 | 39.3% |
| Medium | 54 | 60.7% |

**Zero-Dependency Packages:** 36 (40.4%)

---

## 📦 Package List


### 1. @fr8x/services-address.service

- **Category:** backend
- **Size:** 20.7 KB
- **Exports:** 12 (searchAddress, reverseGeocode, lookupPincode, calculateDistance, isWithinIndia...)
- **Dependencies:** nanoid
- **Reusability:** medium - 12 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/address.service.ts`


### 2. @fr8x/services-admin.service

- **Category:** backend
- **Size:** 15.9 KB
- **Exports:** 13 (AdminUser, AdminRole, Tenant, TenantPlan, TenantSettings...)
- **Dependencies:** @ankr/iam
- **Reusability:** medium - 13 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/admin.service.ts`


### 3. @fr8x/services-advanced-analytics.service

- **Category:** backend
- **Size:** 34.6 KB
- **Exports:** 7 (DemandForecast, CarrierScore, RouteRecommendation, PricePrediction, AnalyticsInsight...)
- **Dependencies:** None
- **Reusability:** high - 7 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/advanced-analytics.service.ts`


### 4. @fr8x/services-agent-orchestrator.service

- **Category:** backend
- **Size:** 17.1 KB
- **Exports:** 14 (AgentProvider, TaskComplexity, TaskType, AgentConfig, TaskClassification...)
- **Dependencies:** @prisma/client
- **Reusability:** medium - 14 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/agent-orchestrator.service.ts`


### 5. @fr8x/services-analytics.service

- **Category:** backend
- **Size:** 16.2 KB
- **Exports:** 11 (DashboardMetrics, OverviewMetrics, LoadBoardMetrics, LaneMetric, FleetMetrics...)
- **Dependencies:** None
- **Reusability:** high - 11 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/analytics.service.ts`


### 6. @fr8x/services-audit.service

- **Category:** backend
- **Size:** 21.7 KB
- **Exports:** 11 (AuditEventType, AuditSeverity, AuditCategory, AuditLogInput, AuditLog...)
- **Dependencies:** nanoid
- **Reusability:** medium - 11 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/audit.service.ts`


### 7. @fr8x/services-backhaul-optimizer.service

- **Category:** backend
- **Size:** 35.2 KB
- **Exports:** 2 (createBackhaulOptimizerService, BackhaulOptimizerService)
- **Dependencies:** None
- **Reusability:** high - 2 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/backhaul-optimizer.service.ts`


### 8. @fr8x/services-booking.service

- **Category:** backend
- **Size:** 47.4 KB
- **Exports:** 14 (QuoteRequestStatus, BidStatus, BookingType, BookingStatus, CreateQuoteRequestInput...)
- **Dependencies:** None
- **Reusability:** high - 14 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/booking.service.ts`


### 9. @fr8x/services-bot.service

- **Category:** backend
- **Size:** 48.5 KB
- **Exports:** 2 (createBotService, BotService)
- **Dependencies:** @ankr/ai-router
- **Reusability:** medium - 2 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/bot.service.ts`


### 10. @fr8x/services-bulk-operations.service

- **Category:** backend
- **Size:** 19.6 KB
- **Exports:** 15 (BulkOperation, BulkOperationType, BulkOperationStatus, BulkOperationResult, BulkStatusUpdate...)
- **Dependencies:** None
- **Reusability:** high - 15 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/bulk-operations.service.ts`


### 11. @fr8x/services-cache.service

- **Category:** backend
- **Size:** 11.8 KB
- **Exports:** 11 (CacheConfig, CacheEntry, CacheStats, CacheTTL, CacheService...)
- **Dependencies:** ioredis
- **Reusability:** medium - 11 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/cache.service.ts`


### 12. @fr8x/services-carbon-tracking.service

- **Category:** backend
- **Size:** 26.5 KB
- **Exports:** 10 (EmissionFactors, CarbonEmission, EmissionBreakdown, CarbonReport, ReductionOpportunity...)
- **Dependencies:** None
- **Reusability:** high - 10 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/carbon-tracking.service.ts`


### 13. @fr8x/services-carrier.service

- **Category:** backend
- **Size:** 20.6 KB
- **Exports:** 7 (RegisterCarrierInput, UpdateCarrierInput, ValidationError, CarrierServiceResult, TrustScoreBreakdown...)
- **Dependencies:** nanoid
- **Reusability:** medium - 7 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/carrier.service.ts`


### 14. @fr8x/services-compliance.service

- **Category:** backend
- **Size:** 24.3 KB
- **Exports:** 14 (FREIGHT_GST_RATES, FREIGHT_HSN_CODES, EWAY_BILL_THRESHOLD, STATE_CODES, GSTVerificationResult...)
- **Dependencies:** None
- **Reusability:** high - 14 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/compliance.service.ts`


### 15. @fr8x/services-crm-integration.service

- **Category:** backend
- **Size:** 16.9 KB
- **Exports:** 12 (Lead, LeadSource, LeadStatus, LeadActivity, Contact...)
- **Dependencies:** @ankr/crm-core
- **Reusability:** medium - 12 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/crm-integration.service.ts`


### 16. @fr8x/services-dev-tools.service

- **Category:** backend
- **Size:** 27.2 KB
- **Exports:** 14 (RBACTestUser, RBACTestCase, RBACTestResult, RBACSummary, MockDataConfig...)
- **Dependencies:** react, vitest
- **Reusability:** medium - 14 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/dev-tools.service.ts`


### 17. @fr8x/services-dispute.service

- **Category:** backend
- **Size:** 19.0 KB
- **Exports:** 18 (Dispute, DisputeType, DisputeStatus, DisputePriority, DisputeCategory...)
- **Dependencies:** None
- **Reusability:** high - 18 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/dispute.service.ts`


### 18. @fr8x/services-dms.service

- **Category:** backend
- **Size:** 17.2 KB
- **Exports:** 14 (DocumentCategory, DocumentStatus, StorageProvider, DocumentMetadata, Document...)
- **Dependencies:** @prisma/client
- **Reusability:** medium - 14 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/dms.service.ts`


### 19. @fr8x/services-docscan.service

- **Category:** backend
- **Size:** 23.2 KB
- **Exports:** 6 (DocScanType, OCRResult, ValidationResult, ExternalVerificationResult, docScanService...)
- **Dependencies:** @ankr/ai-router
- **Reusability:** medium - 6 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/docscan.service.ts`


### 20. @fr8x/services-document-generation.service

- **Category:** backend
- **Size:** 37.7 KB
- **Exports:** 8 (TEMPLATE_CONFIG, DocumentMetadata, EwayBillData, EinvoiceData, LorryReceiptData...)
- **Dependencies:** None
- **Reusability:** high - 8 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/document-generation.service.ts`


### 21. @fr8x/services-driver.service

- **Category:** backend
- **Size:** 19.3 KB
- **Exports:** 8 (RegisterDriverInput, UpdateDriverInput, DriverLocationUpdate, DriverServiceResult, DriverVerificationResult...)
- **Dependencies:** nanoid
- **Reusability:** medium - 8 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/driver.service.ts`


### 22. @fr8x/services-dynamic-pricing.service

- **Category:** backend
- **Size:** 19.6 KB
- **Exports:** 7 (RateResult, SurgeInfo, RateTrend, PricingConfig, DynamicPricingService...)
- **Dependencies:** crypto
- **Reusability:** medium - 7 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/dynamic-pricing.service.ts`


### 23. @fr8x/services-eon-memory.service

- **Category:** backend
- **Size:** 19.7 KB
- **Exports:** 12 (LogisticsDocType, LogisticsMetadata, LogisticsDocument, SearchOptions, SearchResult...)
- **Dependencies:** @prisma/client
- **Reusability:** medium - 12 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/eon-memory.service.ts`


### 24. @fr8x/services-erp-integration.service

- **Category:** backend
- **Size:** 30.6 KB
- **Exports:** 12 (ERPConfig, ERPProvider, ERPCredentials, ERPSettings, FieldMapping...)
- **Dependencies:** crypto
- **Reusability:** medium - 12 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/erp-integration.service.ts`


### 25. @fr8x/services-export.service

- **Category:** backend
- **Size:** 24.0 KB
- **Exports:** 9 (ExportFormat, ReportType, ExportRequest, ExportFilters, ExportOptions...)
- **Dependencies:** nanoid
- **Reusability:** medium - 9 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/export.service.ts`


### 26. @fr8x/services-flow.service

- **Category:** backend
- **Size:** 12.8 KB
- **Exports:** 7 (FlowState, StageHistoryEntry, TransitionResult, EntityFlowSummary, FlowService...)
- **Dependencies:** None
- **Reusability:** high - 7 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/flow.service.ts`


### 27. @fr8x/services-fraud-detection.service

- **Category:** backend
- **Size:** 15.2 KB
- **Exports:** 12 (FraudCheckInput, FraudCheckResult, FraudFlag, FraudFlagType, BehaviorEvent...)
- **Dependencies:** @prisma/client
- **Reusability:** medium - 12 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/fraud-detection.service.ts`


### 28. @fr8x/services-gamification.service

- **Category:** backend
- **Size:** 29.4 KB
- **Exports:** 12 (Mission, UserMission, MissionCategory, Achievement, AchievementCategory...)
- **Dependencies:** @ankr/wire
- **Reusability:** medium - 12 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/gamification.service.ts`


### 29. @fr8x/services-geocoding.service

- **Category:** backend
- **Size:** 15.5 KB
- **Exports:** 9 (initGeocodingService, GeocodingResult, PincodeResult, DistanceResult, isWithinIndia...)
- **Dependencies:** None
- **Reusability:** high - 9 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/geocoding.service.ts`


### 30. @fr8x/services-gps-tracking.service

- **Category:** backend
- **Size:** 32.8 KB
- **Exports:** 18 (DriverLocation, Geofence, GeofenceAlert, BehaviorScore, BehaviorEventType...)
- **Dependencies:** events
- **Reusability:** medium - 18 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/gps-tracking.service.ts`


### 31. @fr8x/services-hrms-integration.service

- **Category:** backend
- **Size:** 18.4 KB
- **Exports:** 18 (Employee, EmployeeType, EmployeeStatus, Address, EmergencyContact...)
- **Dependencies:** @ankr/hrms
- **Reusability:** medium - 18 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/hrms-integration.service.ts`


### 32. @fr8x/services-i18n.service

- **Category:** backend
- **Size:** 22.4 KB
- **Exports:** 11 (SupportedLocale, LocaleConfig, NumberFormatConfig, Translation, TranslationCategory...)
- **Dependencies:** None
- **Reusability:** high - 11 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/i18n.service.ts`


### 33. @fr8x/services-index

- **Category:** backend
- **Size:** 3.4 KB
- **Exports:** 18 (CarrierService, createCarrierService, type RegisterCarrierInput, type UpdateCarrierInput, type CarrierServiceResult...)
- **Dependencies:** None
- **Reusability:** high - 18 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/index.ts`


### 34. @fr8x/services-insurance.service

- **Category:** backend
- **Size:** 21.8 KB
- **Exports:** 22 (InsuranceQuoteRequest, CargoType, TransportMode, PackagingType, SpecialHandling...)
- **Dependencies:** crypto
- **Reusability:** medium - 22 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/insurance.service.ts`


### 35. @fr8x/services-lead-scraper.service

- **Category:** backend
- **Size:** 20.3 KB
- **Exports:** 8 (ScrapedLead, LeadScraperConfig, LeadStats, SiteConfig, INDIAN_LOAD_BOARDS...)
- **Dependencies:** None
- **Reusability:** high - 8 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/lead-scraper.service.ts`


### 36. @fr8x/services-marketplace.service

- **Category:** backend
- **Size:** 15.6 KB
- **Exports:** 9 (CarrierRating, CarrierProfile, Badge, BadgeType, VerificationStatus...)
- **Dependencies:** None
- **Reusability:** high - 9 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/marketplace.service.ts`


### 37. @fr8x/services-messaging.service

- **Category:** backend
- **Size:** 14.9 KB
- **Exports:** 13 (Message, MessageType, MessageStatus, Attachment, MessageMetadata...)
- **Dependencies:** None
- **Reusability:** high - 13 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/messaging.service.ts`


### 38. @fr8x/services-milestone.service

- **Category:** backend
- **Size:** 13.1 KB
- **Exports:** 7 (MilestoneState, MilestoneTimeline, MilestoneTimelineEntry, MilestoneAlert, MilestoneService...)
- **Dependencies:** None
- **Reusability:** high - 7 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/milestone.service.ts`


### 39. @fr8x/services-ml-optimizer.service

- **Category:** backend
- **Size:** 32.3 KB
- **Exports:** 6 (CarrierPreferences, MLScoreAdjustment, DemandPrediction, DynamicWeights, createMLOptimizerService...)
- **Dependencies:** None
- **Reusability:** high - 6 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/ml-optimizer.service.ts`


### 40. @fr8x/services-multi-tenant.service

- **Category:** backend
- **Size:** 20.9 KB
- **Exports:** 13 (TenantConfig, TenantPlan, TenantFeatures, TenantLimits, TenantBranding...)
- **Dependencies:** fastify
- **Reusability:** medium - 13 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/multi-tenant.service.ts`


### 41. @fr8x/services-notification.service

- **Category:** backend
- **Size:** 31.0 KB
- **Exports:** 15 (ALERT_TOPICS, NOTIFY_TOPICS, TEMPLATES, NotificationRecipient, NotificationChannel...)
- **Dependencies:** @ankr/wire, @ankr/alerts, @ankr/oauth, pg
- **Reusability:** medium - 15 exports, documented, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/notification.service.ts`


### 42. @fr8x/services-ocean-tracking.service

- **Category:** backend
- **Size:** 22.8 KB
- **Exports:** 14 (ContainerTrackRequest, CarrierCode, ContainerStatus, ContainerStatusType, ContainerEvent...)
- **Dependencies:** events
- **Reusability:** medium - 14 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/ocean-tracking.service.ts`


### 43. @fr8x/services-ocr.service

- **Category:** backend
- **Size:** 17.5 KB
- **Exports:** 12 (DocumentType, SupportedLanguage, OCREngine, OCRConfig, PreprocessOptions...)
- **Dependencies:** @prisma/client
- **Reusability:** medium - 12 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/ocr.service.ts`


### 44. @fr8x/services-offline-sync.service

- **Category:** backend
- **Size:** 32.9 KB
- **Exports:** 19 (SyncState, SyncRequest, SyncResponse, SyncChanges, ShipmentChange...)
- **Dependencies:** crypto
- **Reusability:** medium - 19 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/offline-sync.service.ts`


### 45. @fr8x/services-organization.service

- **Category:** backend
- **Size:** 13.1 KB
- **Exports:** 6 (CreateOrganizationInput, UpdateOrganizationInput, ValidationErrors, OrganizationServiceResult, OrganizationService...)
- **Dependencies:** nanoid
- **Reusability:** medium - 6 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/organization.service.ts`


### 46. @fr8x/services-pod.service

- **Category:** backend
- **Size:** 16.2 KB
- **Exports:** 21 (ProofOfDelivery, RecipientInfo, RecipientRelationship, PODPhoto, PhotoType...)
- **Dependencies:** None
- **Reusability:** high - 21 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/pod.service.ts`


### 47. @fr8x/services-predictive-pricing.service

- **Category:** backend
- **Size:** 28.5 KB
- **Exports:** 9 (PricingFactors, PricePrediction, PriceFactorBreakdown, MarketComparison, TrendAnalysis...)
- **Dependencies:** None
- **Reusability:** high - 9 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/predictive-pricing.service.ts`


### 48. @fr8x/services-push-notification.service

- **Category:** backend
- **Size:** 22.8 KB
- **Exports:** 12 (PushToken, DeviceMetadata, PushNotification, NotificationTemplate, NotificationCategory...)
- **Dependencies:** crypto, @ankr/wire
- **Reusability:** medium - 12 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/push-notification.service.ts`


### 49. @fr8x/services-rag.service

- **Category:** backend
- **Size:** 12.5 KB
- **Exports:** 8 (RAGDocument, IndexedDocument, SearchResult, RAGResult, RAGConfig...)
- **Dependencies:** @prisma/client
- **Reusability:** medium - 8 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/rag.service.ts`


### 50. @fr8x/services-rate-limiter.service

- **Category:** backend
- **Size:** 12.8 KB
- **Exports:** 8 (RateLimitConfig, RateLimitResult, SlidingWindowConfig, TokenBucketConfig, DynamicPricingConfig...)
- **Dependencies:** ioredis
- **Reusability:** medium - 8 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/rate-limiter.service.ts`


### 51. @fr8x/services-rate.service

- **Category:** backend
- **Size:** 22.5 KB
- **Exports:** 10 (ROAD_VEHICLE_RATES, AIR_FREIGHT_RATES, OCEAN_FREIGHT_RATES, RAIL_FREIGHT_RATES, TransportMode...)
- **Dependencies:** None
- **Reusability:** high - 10 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/rate.service.ts`


### 52. @fr8x/services-razorpay.service

- **Category:** backend
- **Size:** 31.1 KB
- **Exports:** 3 (CheckoutType, createRazorpayService, RazorpayService)
- **Dependencies:** razorpay, crypto
- **Reusability:** medium - 3 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/razorpay.service.ts`


### 53. @fr8x/services-realtime-analytics.service

- **Category:** backend
- **Size:** 25.9 KB
- **Exports:** 25 (DashboardMetrics, OverviewMetrics, ShipmentMetrics, FleetMetrics, FinancialMetrics...)
- **Dependencies:** None
- **Reusability:** high - 25 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/realtime-analytics.service.ts`


### 54. @fr8x/services-resource-pool.service

- **Category:** backend
- **Size:** 26.5 KB
- **Exports:** 10 (ResourceType, ResourcePoolStatus, OpportunityStatus, ResourceCapabilities, PreferredRoutes...)
- **Dependencies:** None
- **Reusability:** high - 10 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/resource-pool.service.ts`


### 55. @fr8x/services-route-optimizer.service

- **Category:** backend
- **Size:** 34.2 KB
- **Exports:** 10 (Coordinates, Location, RouteStop, OptimizedRoute, RouteConstraints...)
- **Dependencies:** None
- **Reusability:** high - 10 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/route-optimizer.service.ts`


### 56. @fr8x/services-search.service

- **Category:** backend
- **Size:** 20.7 KB
- **Exports:** 11 (SearchableEntity, SearchInput, SearchFilters, SearchResult, SearchHighlight...)
- **Dependencies:** nanoid
- **Reusability:** medium - 11 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/search.service.ts`


### 57. @fr8x/services-shipment.service

- **Category:** backend
- **Size:** 41.0 KB
- **Exports:** 6 (CreateShipmentInput, AssignCarrierInput, UpdateLocationInput, ShipmentServiceResult, ShipmentService...)
- **Dependencies:** nanoid
- **Reusability:** medium - 6 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/shipment.service.ts`


### 58. @fr8x/services-subscription.service

- **Category:** backend
- **Size:** 17.0 KB
- **Exports:** 8 (SeatLimits, PlanLimits, DeviceType, DeviceInfo, ConfirmationRequest...)
- **Dependencies:** None
- **Reusability:** high - 8 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/subscription.service.ts`


### 59. @fr8x/services-swayam-bot.service

- **Category:** backend
- **Size:** 22.1 KB
- **Exports:** 13 (BotPersona, Language, InteractionMode, BotContext, BotMessage...)
- **Dependencies:** None
- **Reusability:** high - 13 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/swayam-bot.service.ts`


### 60. @fr8x/services-tms-utils.service

- **Category:** backend
- **Size:** 16.0 KB
- **Exports:** 18 (ORDER_STATUS, TRIP_STATUS, VEHICLE_STATUS, DRIVER_STATUS, OrderStatus...)
- **Dependencies:** @prisma/client
- **Reusability:** medium - 18 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/tms-utils.service.ts`


### 61. @fr8x/services-token.service

- **Category:** backend
- **Size:** 11.6 KB
- **Exports:** 8 (TokenPayload, AccessTokenPayload, RefreshTokenPayload, TokenPair, TokenConfig...)
- **Dependencies:** jsonwebtoken, crypto
- **Reusability:** medium - 8 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/token.service.ts`


### 62. @fr8x/services-user.service

- **Category:** backend
- **Size:** 45.1 KB
- **Exports:** 15 (UserRole, PermissionAction, PermissionResource, Permission, RoleDefinition...)
- **Dependencies:** bcrypt, jsonwebtoken
- **Reusability:** medium - 15 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/user.service.ts`


### 63. @fr8x/services-vehicle.service

- **Category:** backend
- **Size:** 22.2 KB
- **Exports:** 8 (RegisterVehicleInput, UpdateVehicleInput, VehicleLocationUpdate, VehicleServiceResult, VehicleComplianceStatus...)
- **Dependencies:** nanoid
- **Reusability:** medium - 8 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/vehicle.service.ts`


### 64. @fr8x/services-voice.service

- **Category:** backend
- **Size:** 17.2 KB
- **Exports:** 10 (SupportedLanguage, VoiceConfig, STTResult, TTSResult, VoiceCommand...)
- **Dependencies:** @prisma/client
- **Reusability:** medium - 10 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/voice.service.ts`


### 65. @fr8x/services-wallet.service

- **Category:** backend
- **Size:** 29.6 KB
- **Exports:** 2 (createWalletService, WalletService)
- **Dependencies:** None
- **Reusability:** high - 2 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/wallet.service.ts`


### 66. @fr8x/services-webhook.service

- **Category:** backend
- **Size:** 16.4 KB
- **Exports:** 10 (WebhookEventType, WebhookSource, WebhookPayload, WebhookLog, WebhookConfig...)
- **Dependencies:** nanoid, crypto
- **Reusability:** medium - 10 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/webhook.service.ts`


### 67. @fr8x/services-whatsapp-messaging.service

- **Category:** backend
- **Size:** 13.0 KB
- **Exports:** 11 (MessageChannel, MessageStatus, MessageDirection, MessageOptions, MessageResult...)
- **Dependencies:** @prisma/client
- **Reusability:** medium - 11 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/whatsapp-messaging.service.ts`


### 68. @fr8x/services-wizard.service

- **Category:** backend
- **Size:** 47.7 KB
- **Exports:** 8 (WizardStepDef, CreateWizardTemplateInput, StartWizardInput, SubmitStepInput, StepProgress...)
- **Dependencies:** crypto
- **Reusability:** medium - 8 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/wizard.service.ts`


### 69. @fr8x/services-workflow-actions.service

- **Category:** backend
- **Size:** 23.6 KB
- **Exports:** 2 (createWorkflowActionsService, WorkflowActionsService)
- **Dependencies:** None
- **Reusability:** high - 2 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/workflow-actions.service.ts`


### 70. @fr8x/services-workflow-engine.service

- **Category:** backend
- **Size:** 40.0 KB
- **Exports:** 8 (WORKFLOW_TEMPLATES, WorkflowStep, StepResult, ExecutionContext, CreateWorkflowInput...)
- **Dependencies:** None
- **Reusability:** high - 8 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/services/workflow-engine.service.ts`


### 71. @fr8x/utils-errors

- **Category:** shared
- **Size:** 4.3 KB
- **Exports:** 5 (ErrorCodes, ErrorCode, ErrorDetails, Fr8XServiceError, Errors)
- **Dependencies:** None
- **Reusability:** high - 5 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/utils/errors.ts`


### 72. @fr8x/middleware-permission.guard

- **Category:** backend
- **Size:** 18.0 KB
- **Exports:** 16 (PermissionContext, PermissionOptions, FlowCanvasGuardOptions, AuthenticatedRequest, requirePermission...)
- **Dependencies:** fastify
- **Reusability:** medium - 16 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/middleware/permission.guard.ts`


### 73. @fr8x/middleware-rate-limit.middleware

- **Category:** backend
- **Size:** 11.3 KB
- **Exports:** 14 (RateLimitOptions, TieredRateLimitConfig, getClientIP, keyByIP, keyByUserOrIP...)
- **Dependencies:** fastify
- **Reusability:** medium - 14 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/middleware/rate-limit.middleware.ts`


### 74. @fr8x/lib-apm

- **Category:** shared
- **Size:** 17.5 KB
- **Exports:** 20 (TraceContext, SpanAttributes, SpanEvent, SpanData, SpanLink...)
- **Dependencies:** crypto
- **Reusability:** medium - 20 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/lib/apm.ts`


### 75. @fr8x/lib-archival

- **Category:** shared
- **Size:** 17.9 KB
- **Exports:** 8 (RetentionPolicy, ArchivalResult, ArchivalError, ArchivalProgress, RestorationResult...)
- **Dependencies:** None
- **Reusability:** high - 8 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/lib/archival.ts`


### 76. @fr8x/lib-auth-directive

- **Category:** shared
- **Size:** 14.0 KB
- **Exports:** 14 (Role, AuthContext, AuthDirectiveConfig, applyAuthDirective, authTypeDefs...)
- **Dependencies:** graphql, @graphql-tools/utils
- **Reusability:** medium - 14 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/lib/auth-directive.ts`


### 77. @fr8x/lib-database

- **Category:** shared
- **Size:** 14.1 KB
- **Exports:** 13 (DatabaseConfig, ConnectionConfig, PoolConfig, TimeoutConfig, RetryConfig...)
- **Dependencies:** None
- **Reusability:** high - 13 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/lib/database.ts`


### 78. @fr8x/lib-dataloaders

- **Category:** shared
- **Size:** 9.6 KB
- **Exports:** 5 (DataLoaders, createDataLoaders, primeLoaders, clearEntityFromLoaders, clearAllLoaders)
- **Dependencies:** dataloader
- **Reusability:** medium - 5 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/lib/dataloaders.ts`


### 79. @fr8x/lib-graphql-cache

- **Category:** shared
- **Size:** 7.1 KB
- **Exports:** 6 (ResolverCacheConfig, RESOLVER_CACHE_CONFIG, CACHE_INVALIDATION_MAP, generateCacheKey, withCache...)
- **Dependencies:** crypto
- **Reusability:** medium - 6 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/lib/graphql-cache.ts`


### 80. @fr8x/lib-graphql-logger

- **Category:** shared
- **Size:** 2.8 KB
- **Exports:** 5 (graphqlLoggingHooks, createGraphQLLogger, withResolverLogging, withBatchLogging, default)
- **Dependencies:** mercurius
- **Reusability:** medium - 5 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/lib/graphql-logger.ts`


### 81. @fr8x/lib-index

- **Category:** shared
- **Size:** 3.2 KB
- **Exports:** 127 (logger, StructuredLogger, fastifyLoggerPlugin, getLogContext, runWithContext...)
- **Dependencies:** None
- **Reusability:** high - 127 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/lib/index.ts`


### 82. @fr8x/lib-logger

- **Category:** shared
- **Size:** 13.6 KB
- **Exports:** 14 (LogContext, StructuredLog, getLogContext, runWithContext, withContext...)
- **Dependencies:** pino, async_hooks, crypto, fastify, fastify-plugin
- **Reusability:** medium - 14 exports, documented, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/lib/logger.ts`


### 83. @fr8x/lib-migration

- **Category:** shared
- **Size:** 16.6 KB
- **Exports:** 11 (Migration, MigrationOptions, MigrationResult, MigrationError, MigrationProgress...)
- **Dependencies:** None
- **Reusability:** high - 11 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/lib/migration.ts`


### 84. @fr8x/lib-pagination

- **Category:** shared
- **Size:** 8.8 KB
- **Exports:** 17 (CursorPaginationInput, PageInfo, Edge, Connection, CursorPaginationResult...)
- **Dependencies:** nanoid
- **Reusability:** medium - 17 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/lib/pagination.ts`


### 85. @fr8x/lib-pubsub

- **Category:** shared
- **Size:** 0.2 KB
- **Exports:** 2 (pubsub, fr8xPubSub)
- **Dependencies:** None
- **Reusability:** medium - 2 exports, documented, zero dependencies
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/lib/pubsub.ts`


### 86. @fr8x/lib-pulse-integration

- **Category:** shared
- **Size:** 17.0 KB
- **Exports:** 11 (MetricLabels, HistogramBuckets, MetricType, MetricDefinition, SpanContext...)
- **Dependencies:** None
- **Reusability:** high - 11 exports, documented, zero dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/lib/pulse-integration.ts`


### 87. @fr8x/lib-query-complexity

- **Category:** shared
- **Size:** 14.5 KB
- **Exports:** 12 (ComplexityConfig, ComplexityInfo, FieldComplexity, DEFAULT_CONFIG, QueryComplexityCalculator...)
- **Dependencies:** graphql
- **Reusability:** medium - 12 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/lib/query-complexity.ts`


### 88. @fr8x/lib-request-signing

- **Category:** shared
- **Size:** 13.1 KB
- **Exports:** 15 (SigningConfig, SignedRequest, SignatureVerificationResult, WebhookPayload, generateNonce...)
- **Dependencies:** crypto
- **Reusability:** medium - 15 exports, documented, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/backend/src/lib/request-signing.ts`


### 89. @fr8x-ui/utils

- **Category:** shared
- **Size:** 0.2 KB
- **Exports:** 1 (cn)
- **Dependencies:** clsx, tailwind-merge
- **Reusability:** medium - 1 exports, minimal dependencies, typed
- **Path:** `ankr-labs-nx/apps/fr8x/frontend/src/lib/utils.ts`


---

## 💡 Installation

```bash
# Backend services
npm install @fr8x/services-shipment
npm install @fr8x/utils-validator

# Frontend components
npm install @fr8x-ui/button
npm install @fr8x-ui/form

# Shared types
npm install @fr8x/types
```

---

*Generated by ANKR Package Discovery System*
