
# ANKR Interact Package Discovery Report
**Generated:** 2026-01-23T17:53:59.396Z
**Total Extractable Packages:** 109

## Summary

- ✅ **High Reusability:** 104 packages
- 🟡 **Medium Reusability:** 5 packages
- 📦 **Total Size:** 1131.9 KB

## By Category

- **Backend Services:** 26
- **Frontend Components:** 75
- **Shared Utilities:** 4
- **Configuration:** 4

---

## High Priority Packages (Publish First)


### @ankr/admin
- **Description:** Admin API Routes
- **Category:** backend
- **Exports:** registerAdminRoutes
- **Dependencies:** 1 (fastify)
- **Size:** 12.5 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/server/admin-routes.ts`


### @ankr/advanced-ai
- **Description:** Advanced AI Service
- **Category:** backend
- **Exports:** MultimodalContent, MultimodalContentData, ContentMetadata, ImageAnalysis, DetectedObject, VideoAnalysis, KeyFrame, StudentPrediction, RiskPrediction, RiskFactor, PerformanceForecast, Intervention, CareerSuggestion, GeneratedContent, PracticeProblem, Worksheet, WorksheetSection, AdvancedAIService, getAdvancedAIService, registerAdvancedAIRoutes
- **Dependencies:** 0 ()
- **Size:** 26.8 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/src/server/advanced-ai-service.ts`


### @ankr/ai
- **Description:** ANKR Interact - Real AI Service
- **Category:** backend
- **Exports:** QuizQuestion, Flashcard, MindMapNode, default
- **Dependencies:** 2 (lru-cache, ${documentName})
- **Size:** 11.9 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/server/ai-service.ts`


### @ankr/ai-tutor
- **Description:** AI Tutor Service
- **Category:** backend
- **Exports:** AITutorService, getTutorService, registerAITutorRoutes
- **Dependencies:** 0 ()
- **Size:** 12.3 KB
- **Reason:** Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/src/server/ai-tutor-service.ts`


### @ankr/analytics
- **Description:** Analytics Service - Track tier conversions, usage, and metrics
- **Category:** backend
- **Exports:** AnalyticsEvent, AnalyticsService, analyticsService
- **Dependencies:** 0 ()
- **Size:** 6.0 KB
- **Reason:** Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/src/server/analytics-service.ts`


### @ankr/assessment
- **Description:** Assessment Service
- **Category:** backend
- **Exports:** Question, Quiz, QuizSubmission, QuestionResult, QuizAnalytics, AssessmentService, getAssessmentService, registerAssessmentRoutes
- **Dependencies:** 0 ()
- **Size:** 20.8 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/src/server/assessment-service.ts`


### @ankr/backlinks
- **Description:** ANKR Interact - Backlinks Service
- **Category:** backend
- **Exports:** extractWikilinks
- **Dependencies:** 2 (fs, path)
- **Size:** 6.7 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/server/backlinks-service.ts`


### @ankr/chunk-upload
- **Description:** Chunked Upload Routes - Handle large file uploads in chunks
- **Category:** backend
- **Exports:** registerChunkUploadRoutes
- **Dependencies:** 6 (fastify, fs, path...)
- **Size:** 7.0 KB
- **Reason:** Well documented, Generic implementation, Type-safe
- **Path:** `/src/server/chunk-upload-routes.ts`


### @ankr/classroom
- **Description:** Classroom Management Service
- **Category:** backend
- **Exports:** Classroom, ClassSchedule, ClassroomSettings, Student, Assignment, AssignmentRubric, AssignmentSubmission, Attendance, AttendanceRecord, ProgressReport, ParentNotification, ClassroomService, getClassroomService, registerClassroomRoutes
- **Dependencies:** 0 ()
- **Size:** 27.6 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/src/server/classroom-service.ts`


### @ankr/gamification
- **Description:** Gamification Service
- **Category:** backend
- **Exports:** UserProgress, Badge, Achievement, LeaderboardEntry, LeaderboardScope, XPGain, GamificationService, getGamificationService, registerGamificationRoutes
- **Dependencies:** 0 ()
- **Size:** 18.9 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/src/server/gamification-service.ts`


### @ankr/import
- **Description:** Document Import Routes - Universal import system for ANKR LMS
- **Category:** backend
- **Exports:** registerImportRoutes
- **Dependencies:** 6 (fastify, fs, path...)
- **Size:** 6.9 KB
- **Reason:** Well documented, Generic implementation, Type-safe
- **Path:** `/src/server/import-routes.ts`


### @ankr/live-session
- **Description:** Live Session Service
- **Category:** backend
- **Exports:** LiveSession, SessionSettings, Participant, BreakoutRoom, Poll, PollResults, WhiteboardState, WhiteboardElement, Recording, WebRTCSignal, ChatMessage, LiveSessionService, getLiveSessionService, registerLiveSessionRoutes
- **Dependencies:** 0 ()
- **Size:** 29.2 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/src/server/live-session-service.ts`


### @ankr/monitoring
- **Description:** Monitoring & Scale Service
- **Category:** backend
- **Exports:** PerformanceMetric, ErrorLog, HealthCheck, ComplianceRecord, SecurityEvent, ABTest, ABVariant, ABMetric, MonitoringService, getMonitoringService, registerMonitoringRoutes
- **Dependencies:** 0 ()
- **Size:** 20.7 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/src/server/monitoring-service.ts`


### @ankr/offline
- **Description:** Offline Service
- **Category:** backend
- **Exports:** OfflineContent, SyncQueue, BandwidthProfile, PWAManifest, PWAIcon, PWAScreenshot, CacheStrategy, OfflineService, getOfflineService, registerOfflineRoutes
- **Dependencies:** 0 ()
- **Size:** 17.0 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/src/server/offline-service.ts`


### @ankr/payment
- **Description:** Payment API Routes for ANKR LMS
- **Category:** backend
- **Exports:** registerPaymentRoutes
- **Dependencies:** 1 (fastify)
- **Size:** 10.2 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/server/payment-routes.ts`


### @ankr/pdf
- **Description:** PDF Service - Comprehensive PDF processing
- **Category:** backend
- **Exports:** PDFService, getPDFService, registerPDFRoutes
- **Dependencies:** 2 (pdfjs-dist, pdf-lib)
- **Size:** 28.4 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/server/pdf-service.ts`


### @ankr/peer-learning
- **Description:** Peer Learning Service
- **Category:** backend
- **Exports:** StudyGroup, GroupMember, StudySession, SharedResource, ResourceComment, PeerTutorProfile, TimeSlot, TutoringRequest, TutoringSession, SessionRating, Forum, ForumThread, ForumReply, PeerAssessment, AssessmentCriteria, PeerLearningService, getPeerLearningService, registerPeerLearningRoutes
- **Dependencies:** 0 ()
- **Size:** 31.9 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/src/server/peer-learning-service.ts`


### @ankr/qa
- **Description:** Q&A Routes - Ask questions about uploaded documents
- **Category:** backend
- **Exports:** registerQARoutes
- **Dependencies:** 1 (fastify)
- **Size:** 6.1 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/server/qa-routes.ts`


### @ankr/razorpay
- **Description:** Razorpay Payment Service for ANKR LMS
- **Category:** backend
- **Exports:** PaymentOrderOptions, SubscriptionOptions, verifyPaymentSignature, verifyWebhookSignature, isRazorpayConfigured
- **Dependencies:** 2 (razorpay, crypto)
- **Size:** 6.3 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/server/razorpay-service.ts`


### @ankr/stripe
- **Description:** Stripe Payment Integration
- **Category:** backend
- **Exports:** StripeService, stripeService
- **Dependencies:** 1 (stripe)
- **Size:** 9.8 KB
- **Reason:** Well documented, Generic implementation, Few dependencies
- **Path:** `/src/server/stripe-service.ts`


### @ankr/team-projects
- **Description:** Team Projects Service
- **Category:** backend
- **Exports:** Project, ProjectRubric, Team, TeamMember, Task, TaskComment, KanbanBoard, SharedDocument, DocumentVersion, DocumentEdit, ProjectSubmission, PeerReview, FileAttachment, TeamProjectsService, getTeamProjectsService, registerTeamProjectsRoutes
- **Dependencies:** 0 ()
- **Size:** 29.6 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/src/server/team-projects-service.ts`


### @ankr/tier
- **Description:** Tier Service - Manage user tiers and feature access
- **Category:** backend
- **Exports:** UserTier, FeatureCheckResult, TierService, tierService
- **Dependencies:** 0 ()
- **Size:** 5.2 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/src/server/tier-service.ts`


### @ankr/translation
- **Description:** Translation Service - Format-Preserving Document Translation
- **Category:** backend
- **Exports:** TranslationOptions, TranslationResult, TranslationService, getTranslationService, registerTranslationRoutes
- **Dependencies:** 0 ()
- **Size:** 26.5 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/src/server/translation-service.ts`


### @ankr/vectorize
- **Description:** Vectorization Service - Convert documents to embeddings for semantic search
- **Category:** backend
- **Exports:** VectorizeOptions, VectorSearchOptions, SearchResult, VectorizeService, getVectorizeService
- **Dependencies:** 0 ()
- **Size:** 7.3 KB
- **Reason:** Multiple exports, Well documented, Type-safe, No external dependencies, Few dependencies
- **Path:** `/src/server/vectorize-service.ts`


### @ankr/voice
- **Description:** Voice AI Service - Speech-to-Text and Text-to-Speech
- **Category:** backend
- **Exports:** VoiceAIService, getVoiceAIService, registerVoiceRoutes
- **Dependencies:** 0 ()
- **Size:** 5.5 KB
- **Reason:** Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/src/server/voice-service.ts`


### @ankr-ui/wikilinkautocomplete
- **Description:** Wiki Link Autocomplete - Suggest pages as you type [[
- **Category:** frontend
- **Exports:** WikiLinkAutocomplete, useWikiLinkAutocomplete
- **Dependencies:** 1 (react)
- **Size:** 6.4 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/WikiLinkAutocomplete.tsx`


### @ankr-ui/voicerecorder
- **Description:** VoiceRecorder Component - Speech-to-Text Dictation
- **Category:** frontend
- **Exports:** VoiceRecorder
- **Dependencies:** 2 (react, lucide-react)
- **Size:** 5.2 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/VoiceRecorder.tsx`


### @ankr-ui/voicefeatures
- **Description:** Voice Features Component - STT search and TTS read aloud
- **Category:** frontend
- **Exports:** VoiceSearchButton, ReadAloudButton, VoiceFeatures
- **Dependencies:** 1 (react)
- **Size:** 4.0 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/VoiceFeatures.tsx`


### @ankr-ui/viewersettings
- **Description:** ViewerSettings Component - Font, size, and theme customization
- **Category:** frontend
- **Exports:** FontFamily, FontSize, Theme, ViewerSettingsProps, ViewerSettings
- **Dependencies:** 1 (react)
- **Size:** 6.9 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/ViewerSettings.tsx`


### @ankr-ui/upgradeprompt
- **Description:** Upgrade Prompt - Modal shown when user hits tier limits or restricted features
- **Category:** frontend
- **Exports:** UpgradePromptProps, UpgradePrompt, UpgradeBannerProps, UpgradeBanner, UsageLimitWarningProps, UsageLimitWarning
- **Dependencies:** 1 (react)
- **Size:** 12.5 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/UpgradePrompt.tsx`


### @ankr-ui/uilanguageselector
- **Description:** UI Language Selector
- **Category:** frontend
- **Exports:** UILanguageSelector, UILanguageSelectorCompact
- **Dependencies:** 1 (react)
- **Size:** 4.4 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/UILanguageSelector.tsx`


### @ankr-ui/translatedialog
- **Description:** Translation Dialog
- **Category:** frontend
- **Exports:** TranslateDialog, TranslateButton
- **Dependencies:** 2 (react, lucide-react)
- **Size:** 14.3 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/TranslateDialog.tsx`


### @ankr-ui/translatebutton
- **Description:** TranslateButton Component - AI-powered document translation
- **Category:** frontend
- **Exports:** TranslateButton
- **Dependencies:** 1 (react)
- **Size:** 11.4 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/TranslateButton.tsx`


### @ankr-ui/tierbadge
- **Description:** Tier Badge - Display user's current tier with usage stats
- **Category:** frontend
- **Exports:** TierBadgeProps, TierBadge, TierUsageStatsProps, TierUsageStats, TierComparisonProps, TierComparison
- **Dependencies:** 1 (react)
- **Size:** 7.4 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/TierBadge.tsx`


### @ankr-ui/templatepicker
- **Description:** Template Picker - UI for selecting and applying document templates
- **Category:** frontend
- **Exports:** TemplatePicker
- **Dependencies:** 1 (react)
- **Size:** 5.6 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/TemplatePicker.tsx`


### @ankr-ui/tagautocomplete
- **Description:** Tag Autocomplete - Suggest tags as you type #
- **Category:** frontend
- **Exports:** TagAutocomplete, useTagAutocomplete
- **Dependencies:** 1 (react)
- **Size:** 7.9 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/TagAutocomplete.tsx`


### @ankr-ui/swayambutton
- **Description:** SwayamButton - Voice-First AI Assistant
- **Category:** frontend
- **Exports:** SwayamButton
- **Dependencies:** 2 (react, lucide-react)
- **Size:** 10.5 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/SwayamButton.tsx`


### @ankr-ui/readaloud
- **Description:** ReadAloud Component - Text-to-Speech for Documents
- **Category:** frontend
- **Exports:** ReadAloud
- **Dependencies:** 2 (react, lucide-react)
- **Size:** 7.0 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/ReadAloud.tsx`


### @ankr-ui/rtlprovider
- **Description:** RTL Provider - Automatically handles RTL layout for Urdu, Sindhi, Kashmiri
- **Category:** frontend
- **Exports:** RTLProvider
- **Dependencies:** 1 (react)
- **Size:** 3.1 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/RTLProvider.tsx`


### @ankr-ui/quizmode
- **Description:** Interactive Quiz Mode - NotebookLLM-style
- **Category:** frontend
- **Exports:** QuizMode
- **Dependencies:** 1 (react)
- **Size:** 9.2 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/QuizMode.tsx`


### @ankr-ui/publishstatuspanel
- **Description:** PublishStatusPanel Component - Sidebar showing all published documents
- **Category:** frontend
- **Exports:** PublishStatusPanel
- **Dependencies:** 1 (react)
- **Size:** 7.9 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/PublishStatusPanel.tsx`


### @ankr-ui/publishbutton
- **Description:** PublishButton Component - Shows publish status and triggers publish dialog
- **Category:** frontend
- **Exports:** PublishButton
- **Dependencies:** 1 (react)
- **Size:** 7.0 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/PublishButton.tsx`


### @ankr-ui/publishanalytics
- **Description:** PublishAnalytics Component - Dashboard showing publishing statistics
- **Category:** frontend
- **Exports:** PublishAnalytics
- **Dependencies:** 1 (react)
- **Size:** 10.3 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/PublishAnalytics.tsx`


### @ankr-ui/pricingpage
- **Description:** Pricing Page - Display tier options and feature comparison
- **Category:** frontend
- **Exports:** PricingPage
- **Dependencies:** 1 (react)
- **Size:** 12.3 KB
- **Reason:** Well documented, Generic implementation, Few dependencies
- **Path:** `/src/client/components/PricingPage.tsx`


### @ankr-ui/mindmapview
- **Description:** Mind Map View - Visual knowledge structure
- **Category:** frontend
- **Exports:** MindMapView
- **Dependencies:** 2 (react, d3)
- **Size:** 4.7 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/MindMapView.tsx`


### @ankr-ui/languageselector
- **Description:** LanguageSelector Component - Multi-language support
- **Category:** frontend
- **Exports:** LanguageSelector
- **Dependencies:** 1 (react)
- **Size:** 7.8 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/LanguageSelector.tsx`


### @ankr-ui/graphviewcontrols
- **Description:** Graph View Controls - Filter and configure the knowledge graph
- **Category:** frontend
- **Exports:** GraphFilters, GraphViewControls
- **Dependencies:** 1 (react)
- **Size:** 8.9 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/GraphViewControls.tsx`


### @ankr-ui/graphview
- **Description:** GraphView - D3.js force-directed graph visualization
- **Category:** frontend
- **Exports:** GraphView
- **Dependencies:** 2 (react, d3)
- **Size:** 11.8 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/GraphView.tsx`


### @ankr-ui/fontloader
- **Description:** FontLoader Component - Dynamically loads Google Fonts for all Indian scripts
- **Category:** frontend
- **Exports:** FontLoader
- **Dependencies:** 1 (react)
- **Size:** 0.5 KB
- **Reason:** Well documented, Generic implementation, Few dependencies
- **Path:** `/src/client/components/FontLoader.tsx`


### @ankr-ui/flashcardsmode
- **Description:** Flashcards Mode - Spaced Repetition Learning
- **Category:** frontend
- **Exports:** FlashcardsMode
- **Dependencies:** 1 (react)
- **Size:** 6.1 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/FlashcardsMode.tsx`


### @ankr-ui/fileimportdialog
- **Description:** File Import Dialog - Universal file import (PDFs, Word, Text, Images, etc.)
- **Category:** frontend
- **Exports:** FileImportDialog
- **Dependencies:** 1 (react)
- **Size:** 7.1 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/FileImportDialog.tsx`


### @ankr-ui/fileexplorer
- **Description:** File Explorer - Browse local filesystem and import documents
- **Category:** frontend
- **Exports:** FileExplorer
- **Dependencies:** 1 (react)
- **Size:** 9.9 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/FileExplorer.tsx`


### @ankr-ui/documentview
- **Description:** Document View - Integrated Page and Canvas modes
- **Category:** frontend
- **Exports:** DocumentView
- **Dependencies:** 1 (react)
- **Size:** 3.2 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/DocumentView.tsx`


### @ankr-ui/databaseview
- **Description:** Database View - Notion-style database views for documents
- **Category:** frontend
- **Exports:** DatabaseView
- **Dependencies:** 1 (react)
- **Size:** 13.3 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/DatabaseView.tsx`


### @ankr-ui/createpagedialog
- **Description:** Create Page Dialog - Create a new page when clicking a broken wiki link
- **Category:** frontend
- **Exports:** CreatePageDialog
- **Dependencies:** 1 (react)
- **Size:** 5.3 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/CreatePageDialog.tsx`


### @ankr-ui/collaborationpanel
- **Description:** Collaboration Panel - Affine-style real-time collaboration
- **Category:** frontend
- **Exports:** CollaborationPanel
- **Dependencies:** 1 (react)
- **Size:** 16.3 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/CollaborationPanel.tsx`


### @ankr-ui/collaborationexample
- **Description:** Collaboration Example - Real-time multi-user canvas collaboration
- **Category:** frontend
- **Exports:** BasicCollaborationExample, AuthenticatedCollaborationExample, ReadOnlyCollaborationExample, ToggleableCollaborationExample, TeamWorkspaceExample, ServerIntegrationExample, CollaborationMonitoringExample, CollaborationExamples
- **Dependencies:** 4 (react, http, express...)
- **Size:** 10.7 KB
- **Reason:** Multiple exports, Well documented, Generic implementation
- **Path:** `/src/client/components/CollaborationExample.tsx`


### @ankr-ui/blockcanvasexample
- **Description:** Block Canvas Example - Demo of block-to-canvas drag & drop
- **Category:** frontend
- **Exports:** BlockCanvasWithEditor, BlockCanvasMock, FullDocumentView, useProgrammaticBlockAdd, CustomBlockCanvas
- **Dependencies:** 1 (react)
- **Size:** 5.8 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/BlockCanvasExample.tsx`


### @ankr-ui/bidirectionallinks
- **Description:** Bidirectional Links - Obsidian-style document linking
- **Category:** frontend
- **Exports:** BidirectionalLinks, renderWikiLinks
- **Dependencies:** 1 (react)
- **Size:** 9.4 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/BidirectionalLinks.tsx`


### @ankr-ui/batchpublishdialog
- **Description:** BatchPublishDialog Component - Publish multiple documents at once
- **Category:** frontend
- **Exports:** BatchPublishDialog
- **Dependencies:** 1 (react)
- **Size:** 9.2 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/BatchPublishDialog.tsx`


### @ankr-ui/backlinkspanel
- **Description:** Backlinks Panel - Shows which documents link to the current document
- **Category:** frontend
- **Exports:** BacklinksPanel
- **Dependencies:** 1 (react)
- **Size:** 6.3 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/BacklinksPanel.tsx`


### @ankr-ui/adminpanel
- **Description:** AdminPanel Component - Quick tier management for testing
- **Category:** frontend
- **Exports:** AdminPanel
- **Dependencies:** 1 (react)
- **Size:** 4.9 KB
- **Reason:** Well documented, Generic implementation, Few dependencies
- **Path:** `/src/client/components/AdminPanel.tsx`


### @ankr-ui/accessibilitypanel
- **Description:** AccessibilityPanel - Comprehensive accessibility controls
- **Category:** frontend
- **Exports:** AccessibilityPanel
- **Dependencies:** 2 (react, lucide-react)
- **Size:** 19.1 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/AccessibilityPanel.tsx`


### @ankr-ui/aifeaturespanel
- **Description:** AI Features Panel - Central hub for all AI-powered features
- **Category:** frontend
- **Exports:** AIFeaturesPanel
- **Dependencies:** 1 (react)
- **Size:** 11.5 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/AIFeaturesPanel.tsx`


### @ankr-ui/aidocumentassistant
- **Description:** AI Document Assistant - NotebookLLM-style AI features
- **Category:** frontend
- **Exports:** AIDocumentAssistant
- **Dependencies:** 1 (react)
- **Size:** 19.9 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/AIDocumentAssistant.tsx`


### @ankr-ui/admin/aiadminpanel
- **Description:** AI Admin Panel - Manage AI features, EON integration, LLM routing
- **Category:** frontend
- **Exports:** AIAdminPanel
- **Dependencies:** 1 (react)
- **Size:** 22.6 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/admin/AIAdminPanel.tsx`


### @ankr-ui/canvas/index
- **Description:** Canvas Components - Export all canvas-related components
- **Category:** frontend
- **Exports:** 
- **Dependencies:** 0 ()
- **Size:** 2.0 KB
- **Reason:** Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/src/client/components/Canvas/index.ts`


### @ankr-ui/canvas/splitcanvasview
- **Description:** Split Canvas View - Page and Canvas side-by-side
- **Category:** frontend
- **Exports:** SplitCanvasView
- **Dependencies:** 3 (react, @excalidraw/excalidraw, lucide-react)
- **Size:** 10.6 KB
- **Reason:** Well documented, Generic implementation, Type-safe
- **Path:** `/src/client/components/Canvas/SplitCanvasView.tsx`


### @ankr-ui/canvas/presentationmode
- **Description:** Presentation Mode - Full-screen frame navigation
- **Category:** frontend
- **Exports:** PresentationMode, usePresentationMode
- **Dependencies:** 3 (react, lucide-react, @excalidraw/excalidraw)
- **Size:** 11.7 KB
- **Reason:** Well documented, Generic implementation, Type-safe
- **Path:** `/src/client/components/Canvas/PresentationMode.tsx`


### @ankr-ui/canvas/presenceindicators
- **Description:** PresenceIndicators - Show who's currently viewing/editing the canvas
- **Category:** frontend
- **Exports:** PresenceIndicatorsProps, PresenceIndicators, PresencePanelProps, PresencePanel, MiniPresenceProps, MiniPresence
- **Dependencies:** 2 (react, lucide-react)
- **Size:** 11.4 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/Canvas/PresenceIndicators.tsx`


### @ankr-ui/canvas/offlinemode
- **Description:** Offline Mode Components
- **Category:** frontend
- **Exports:** OfflineStatusBarProps, OfflineStatusBar, OfflineModeBannerProps, OfflineModeBanner, ConnectionIndicatorProps, ConnectionIndicator, SyncProgressProps, SyncProgress, ExportImportDialogProps, ExportImportDialog
- **Dependencies:** 2 (react, lucide-react)
- **Size:** 13.0 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/Canvas/OfflineMode.tsx`


### @ankr-ui/canvas/modetoggle
- **Description:** Mode Toggle - Switch between Page and Canvas modes
- **Category:** frontend
- **Exports:** ViewMode, ModeToggle, CompactModeToggle, ModeInfoBanner
- **Dependencies:** 2 (react, lucide-react)
- **Size:** 4.3 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/Canvas/ModeToggle.tsx`


### @ankr-ui/canvas/livecursors
- **Description:** LiveCursors - Real-time cursor tracking component
- **Category:** frontend
- **Exports:** LiveCursorsProps, LiveCursors, SelectionHighlightsProps, SelectionHighlights, useLocalCursor, useCursorAnimation
- **Dependencies:** 1 (react)
- **Size:** 6.6 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/Canvas/LiveCursors.tsx`


### @ankr-ui/canvas/integratedcanvasview
- **Description:** Integrated Canvas View - Complete canvas experience with all features
- **Category:** frontend
- **Exports:** IntegratedCanvasView
- **Dependencies:** 3 (react, @excalidraw/excalidraw, lucide-react)
- **Size:** 16.0 KB
- **Reason:** Well documented, Generic implementation, Type-safe
- **Path:** `/src/client/components/Canvas/IntegratedCanvasView.tsx`


### @ankr-ui/canvas/framenavigator
- **Description:** Frame Navigator - Sidebar for managing canvas frames
- **Category:** frontend
- **Exports:** FrameNavigator, FrameSelector
- **Dependencies:** 3 (react, lucide-react, @excalidraw/excalidraw)
- **Size:** 12.3 KB
- **Reason:** Well documented, Generic implementation, Type-safe
- **Path:** `/src/client/components/Canvas/FrameNavigator.tsx`


### @ankr-ui/canvas/canvasview
- **Description:** Canvas View - Excalidraw integration for canvas mode
- **Category:** frontend
- **Exports:** CanvasView, CanvasToolbar
- **Dependencies:** 3 (react, @excalidraw/excalidraw, lucide-react)
- **Size:** 8.0 KB
- **Reason:** Well documented, Generic implementation, Type-safe
- **Path:** `/src/client/components/Canvas/CanvasView.tsx`


### @ankr-ui/canvas/canvastoblock
- **Description:** Canvas to Block - Embed canvas elements back in page
- **Category:** frontend
- **Exports:** CanvasElementRef, EmbeddedCanvasElement, CanvasElementPicker, useCanvasToBlock
- **Dependencies:** 3 (react, lucide-react, @excalidraw/excalidraw)
- **Size:** 11.2 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe
- **Path:** `/src/client/components/Canvas/CanvasToBlock.tsx`


### @ankr-ui/canvas/canvastemplates
- **Description:** Canvas Templates - Pre-built layouts for common use cases
- **Category:** frontend
- **Exports:** CanvasTemplatesDialog, TemplateButton
- **Dependencies:** 3 (react, lucide-react, @excalidraw/excalidraw)
- **Size:** 20.5 KB
- **Reason:** Well documented, Generic implementation, Type-safe
- **Path:** `/src/client/components/Canvas/CanvasTemplates.tsx`


### @ankr-ui/canvas/canvasexportdialog
- **Description:** Canvas Export Dialog - Export canvas to PNG/SVG/PDF
- **Category:** frontend
- **Exports:** CanvasExportDialog, ExportButton
- **Dependencies:** 3 (react, lucide-react, @excalidraw/excalidraw)
- **Size:** 12.5 KB
- **Reason:** Well documented, Generic implementation, Type-safe
- **Path:** `/src/client/components/Canvas/CanvasExportDialog.tsx`


### @ankr-ui/canvas/canvascomments
- **Description:** Canvas Comments System
- **Category:** frontend
- **Exports:** CanvasComment, CanvasCommentsProps, CanvasComments
- **Dependencies:** 2 (react, lucide-react)
- **Size:** 17.7 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/Canvas/CanvasComments.tsx`


### @ankr-ui/canvas/blocktocanvas
- **Description:** Block to Canvas - Drag blocks from page editor to canvas
- **Category:** frontend
- **Exports:** BlockData, blockToCanvasElement, DraggableBlock, CanvasDropZone, BlockPalette
- **Dependencies:** 3 (react, lucide-react, @excalidraw/excalidraw)
- **Size:** 12.7 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe
- **Path:** `/src/client/components/Canvas/BlockToCanvas.tsx`


### @ankr-ui/blockeditor/toolbar
- **Description:** Toolbar - Formatting toolbar for BlockEditor
- **Category:** frontend
- **Exports:** Toolbar
- **Dependencies:** 1 (@tiptap/react)
- **Size:** 10.7 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/BlockEditor/Toolbar.tsx`


### @ankr-ui/blockeditor/bubblemenu
- **Description:** BubbleMenu - Simplified version without tiptap imports for now
- **Category:** frontend
- **Exports:** BubbleMenu
- **Dependencies:** 0 ()
- **Size:** 0.3 KB
- **Reason:** Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/src/client/components/BlockEditor/BubbleMenu.tsx`


### @ankr-ui/blockeditor/blockeditor
- **Description:** BlockEditor - Notion-style block editor built with TipTap
- **Category:** frontend
- **Exports:** BlockEditor
- **Dependencies:** 14 (@tiptap/react, @tiptap/starter-kit, @tiptap/extension-table...)
- **Size:** 7.1 KB
- **Reason:** Well documented, Generic implementation, Type-safe
- **Path:** `/src/client/components/BlockEditor/BlockEditor.tsx`


### @ankr-ui/blockeditor/extensions/toggle
- **Description:** Toggle Extension - Collapsible toggle/details blocks
- **Category:** frontend
- **Exports:** ToggleOptions, Toggle
- **Dependencies:** 1 (@tiptap/core)
- **Size:** 4.5 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/BlockEditor/extensions/toggle.ts`


### @ankr-ui/blockeditor/extensions/timeline
- **Description:** Timeline Extension - Chronological event timeline with milestones
- **Category:** frontend
- **Exports:** TimelineOptions, Timeline
- **Dependencies:** 1 (@tiptap/core)
- **Size:** 10.4 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/BlockEditor/extensions/timeline.ts`


### @ankr-ui/blockeditor/extensions/mermaid
- **Description:** Mermaid Extension - Render Mermaid diagrams
- **Category:** frontend
- **Exports:** MermaidOptions, Mermaid
- **Dependencies:** 2 (@tiptap/core, @tiptap/react)
- **Size:** 2.0 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/BlockEditor/extensions/mermaid.ts`


### @ankr-ui/blockeditor/extensions/math
- **Description:** Math Extension - Render KaTeX math equations
- **Category:** frontend
- **Exports:** MathOptions, MathBlock, MathInline
- **Dependencies:** 2 (@tiptap/core, @tiptap/react)
- **Size:** 2.9 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/BlockEditor/extensions/math.ts`


### @ankr-ui/blockeditor/extensions/kanban
- **Description:** Kanban Board Extension - Task board with columns and draggable cards
- **Category:** frontend
- **Exports:** KanbanOptions, Kanban
- **Dependencies:** 1 (@tiptap/core)
- **Size:** 12.4 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/BlockEditor/extensions/kanban.ts`


### @ankr-ui/blockeditor/extensions/image-gallery
- **Description:** Image Gallery Extension - Multiple images in a grid layout
- **Category:** frontend
- **Exports:** ImageGalleryOptions, ImageGallery
- **Dependencies:** 1 (@tiptap/core)
- **Size:** 7.3 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/BlockEditor/extensions/image-gallery.ts`


### @ankr-ui/blockeditor/extensions/file-attachment
- **Description:** File Attachment Extension - Upload and display files with previews
- **Category:** frontend
- **Exports:** FileAttachmentOptions, FileAttachment
- **Dependencies:** 1 (@tiptap/core)
- **Size:** 6.6 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/BlockEditor/extensions/file-attachment.ts`


### @ankr-ui/blockeditor/extensions/embed
- **Description:** Embed Extension - Embed YouTube, Figma, etc.
- **Category:** frontend
- **Exports:** EmbedOptions, Embed
- **Dependencies:** 1 (@tiptap/core)
- **Size:** 3.9 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/BlockEditor/extensions/embed.ts`


### @ankr-ui/blockeditor/extensions/database
- **Description:** Database Extension - Notion-style database with multiple views
- **Category:** frontend
- **Exports:** DatabaseOptions, Database
- **Dependencies:** 1 (@tiptap/core)
- **Size:** 16.4 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/BlockEditor/extensions/database.ts`


### @ankr-ui/blockeditor/extensions/callout
- **Description:** Callout Extension - Info/Warning/Error/Success callout blocks
- **Category:** frontend
- **Exports:** CalloutOptions, Callout
- **Dependencies:** 1 (@tiptap/core)
- **Size:** 2.5 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/BlockEditor/extensions/callout.ts`


### @ankr-ui/blockeditor/extensions/calendar
- **Description:** Calendar Extension - Date-based event view with month/week/day layouts
- **Category:** frontend
- **Exports:** CalendarOptions, Calendar
- **Dependencies:** 1 (@tiptap/core)
- **Size:** 12.7 KB
- **Reason:** Well documented, Generic implementation, Type-safe, Few dependencies
- **Path:** `/src/client/components/BlockEditor/extensions/calendar.ts`


### @ankr-ui/blockeditor/blocks/mermaidblock
- **Description:** MermaidBlock - React component for rendering Mermaid diagrams
- **Category:** frontend
- **Exports:** MermaidBlock
- **Dependencies:** 3 (@tiptap/react, react, mermaid)
- **Size:** 3.6 KB
- **Reason:** Well documented, Generic implementation, Type-safe
- **Path:** `/src/client/components/BlockEditor/blocks/MermaidBlock.tsx`


### @ankr-ui/blockeditor/blocks/mathblock
- **Description:** MathBlock - React component for rendering KaTeX math equations
- **Category:** frontend
- **Exports:** MathBlockComponent
- **Dependencies:** 3 (@tiptap/react, react, katex)
- **Size:** 3.0 KB
- **Reason:** Well documented, Generic implementation, Type-safe
- **Path:** `/src/client/components/BlockEditor/blocks/MathBlock.tsx`


### @ankr/config-aria-labels
- **Description:** ARIA Labels for Accessibility
- **Category:** config
- **Exports:** AriaLabels, ARIA_LABELS, getAriaLabel, getAriaLabelsForLanguage
- **Dependencies:** 0 ()
- **Size:** 25.2 KB
- **Reason:** Configuration files are highly reusable across projects
- **Path:** `/src/config/aria-labels.ts`


### @ankr/config-features
- **Description:** Feature Flags Configuration
- **Category:** config
- **Exports:** FeatureFlags, DEFAULT_FEATURES, isFeatureEnabled, useFeature, getEnabledFeatures, getFeatureFlags, enableFeatureTemporarily, hasFeatureOverride
- **Dependencies:** 0 ()
- **Size:** 4.7 KB
- **Reason:** Configuration files are highly reusable across projects
- **Path:** `/src/config/features.ts`


### @ankr/config-languages.d
- **Description:** Comprehensive Language Configuration for ANKR Interact
- **Category:** config
- **Exports:** SupportedLanguageCode, LanguageInfo
- **Dependencies:** 0 ()
- **Size:** 1.6 KB
- **Reason:** Configuration files are highly reusable across projects
- **Path:** `/src/config/languages.d.ts`


### @ankr/config-languages
- **Description:** Comprehensive Language Configuration for ANKR Interact
- **Category:** config
- **Exports:** SupportedLanguageCode, LanguageInfo, SUPPORTED_LANGUAGES, getAllLanguageCodes, getLanguageInfo, getRTLLanguages, getLanguagesByRegion, getLanguagesByScript, getGoogleFontsURL, isRTL, getDirection
- **Dependencies:** 0 ()
- **Size:** 6.9 KB
- **Reason:** Configuration files are highly reusable across projects
- **Path:** `/src/config/languages.ts`


### @ankr/shared-config
- **Description:** ANKR Interact - Configuration System
- **Category:** shared
- **Exports:** AppConfig, config, default
- **Dependencies:** 0 ()
- **Size:** 6.3 KB
- **Reason:** Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/src/shared/config.ts`


### @ankr/shared-tiers.d
- **Description:** ANKR Interact - Tier System
- **Category:** shared
- **Exports:** TierLimits, TierFeatures, TierConfig, FeatureGroup
- **Dependencies:** 0 ()
- **Size:** 3.0 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/src/shared/tiers.d.ts`


### @ankr/shared-tiers
- **Description:** ANKR Interact - Tier System
- **Category:** shared
- **Exports:** TierLimits, TierFeatures, TierConfig, TIERS, FeatureGroup, FEATURE_GROUPS, getTierConfig, hasFeature, checkLimit, getAllTiers, getUpgradePath, calculateSavings
- **Dependencies:** 0 ()
- **Size:** 16.4 KB
- **Reason:** Multiple exports, Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
- **Path:** `/src/shared/tiers.ts`


---

## Medium Priority Packages


### @ankr/import-helper
- **Description:** Shared helper functions for document import
- **Exports:** 
- **Path:** `/src/server/import-routes-helper.ts`


### @ankr-ui/aichatpanel
- **Description:** AI Chat Panel - NotebookLLM-style chat interface
- **Exports:** ChatMessage, Citation, AIChatPanel
- **Path:** `/src/client/components/AIChatPanel.tsx`


### @ankr-ui/obsidianfeatures/index
- **Description:** Obsidian Features - All Obsidian-style components
- **Exports:** 
- **Path:** `/src/client/components/ObsidianFeatures/index.tsx`


### @ankr-ui/blockeditor/index
- **Description:** BlockEditor - Export all components
- **Exports:** 
- **Path:** `/src/client/components/BlockEditor/index.tsx`


### @ankr/shared-tiers.js
- **Description:** ANKR Interact - Tier System
- **Exports:** 
- **Path:** `/src/shared/tiers.js`


---

## Recommended Publishing Order

1. **@ankr/admin** - Well documented, Generic implementation, Type-safe, Few dependencies
2. **@ankr/advanced-ai** - Multiple exports, Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
3. **@ankr/ai** - Multiple exports, Well documented, Generic implementation, Type-safe, Few dependencies
4. **@ankr/ai-tutor** - Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
5. **@ankr/analytics** - Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
6. **@ankr/assessment** - Multiple exports, Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
7. **@ankr/backlinks** - Well documented, Generic implementation, Type-safe, Few dependencies
8. **@ankr/chunk-upload** - Well documented, Generic implementation, Type-safe
9. **@ankr/classroom** - Multiple exports, Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies
10. **@ankr/gamification** - Multiple exports, Well documented, Generic implementation, Type-safe, No external dependencies, Few dependencies

---

## Verdaccio Publishing Commands

```bash
# 1. Create package directories
mkdir -p /root/ankr-packages/admin
mkdir -p /root/ankr-packages/advanced-ai
mkdir -p /root/ankr-packages/ai
mkdir -p /root/ankr-packages/ai-tutor
mkdir -p /root/ankr-packages/analytics

# 2. Copy source files
cp /root/ankr-labs-nx/packages/ankr-interact/src/server/admin-routes.ts /root/ankr-packages/admin/
cp /root/ankr-labs-nx/packages/ankr-interact/src/server/advanced-ai-service.ts /root/ankr-packages/advanced-ai/
cp /root/ankr-labs-nx/packages/ankr-interact/src/server/ai-service.ts /root/ankr-packages/ai/
cp /root/ankr-labs-nx/packages/ankr-interact/src/server/ai-tutor-service.ts /root/ankr-packages/ai-tutor/
cp /root/ankr-labs-nx/packages/ankr-interact/src/server/analytics-service.ts /root/ankr-packages/analytics/

# 3. Generate package.json for each
cd /root/ankr-packages/admin && npm init -y
cd /root/ankr-packages/advanced-ai && npm init -y
cd /root/ankr-packages/ai && npm init -y
cd /root/ankr-packages/ai-tutor && npm init -y
cd /root/ankr-packages/analytics && npm init -y

# 4. Publish to Verdaccio
cd /root/ankr-packages/admin && npm publish --registry http://localhost:4873
cd /root/ankr-packages/advanced-ai && npm publish --registry http://localhost:4873
cd /root/ankr-packages/ai && npm publish --registry http://localhost:4873
cd /root/ankr-packages/ai-tutor && npm publish --registry http://localhost:4873
cd /root/ankr-packages/analytics && npm publish --registry http://localhost:4873
```

---

## Next Steps

1. **Review high-priority packages** and validate they're truly reusable
2. **Extract and test** each package independently
3. **Create proper package.json** with correct dependencies
4. **Add README and documentation** for each package
5. **Publish to Verdaccio** in dependency order
6. **Update ankr-interact** to use published packages

---

**Total Packages Identified:** 109
**Ready to Publish:** 104
**Estimated Publishing Time:** 18 hours
