export const schema = `
  # ============================================
  # ankrshield Central Intelligence GraphQL API
  # ============================================

  # Platform types
  enum Platform {
    WINDOWS
    MAC
    LINUX
    ANDROID
    IOS
    UNKNOWN
  }

  # Threat status
  enum ThreatStatus {
    PENDING
    APPROVED
    REJECTED
    WATCHING
    FALSE_POSITIVE
  }

  # Threat category
  enum ThreatCategory {
    ADVERTISING
    ANALYTICS
    SOCIAL_MEDIA
    FINGERPRINTING
    MALWARE
    CRYPTOMINING
    UNKNOWN
  }

  # Definition status
  enum DefinitionStatus {
    ACTIVE
    DEPRECATED
    DRAFT
  }

  # ============================================
  # Input Types
  # ============================================

  # Behavioral signature (JSON object)
  input BehavioralSignatureInput {
    thirdPartyCookies: Boolean
    canvasFingerprinting: Boolean
    trackingPixel: Boolean
    crossSiteRequests: Int
    localStorage: Boolean
    fingerprinting: Boolean
    cryptomining: Boolean
  }

  # Threat report submission
  input ThreatReportInput {
    report_id: ID!
    domain: String!
    behavioral_signature: BehavioralSignatureInput!
    confidence: Float!
    client_version: String!
    platform: Platform!
    installation_id: ID!
  }

  # Threat review action
  input ReviewThreatInput {
    domain: String!
    status: ThreatStatus!
    category: ThreatCategory!
    notes: String
  }

  # ============================================
  # Object Types
  # ============================================

  # Threat report (raw)
  type ThreatReport {
    id: ID!
    report_id: ID!
    domain: String!
    behavioral_signature: String!
    confidence: Float!
    client_version: String!
    platform: Platform!
    installation_id: ID!
    timestamp: String!
    processed: Boolean!
  }

  # Aggregated threat intelligence
  type AggregatedThreat {
    id: ID!
    domain: String!
    report_count: Int!
    avg_confidence: Float!
    behavioral_patterns: String!
    first_seen: String!
    last_seen: String!
    status: ThreatStatus!
    category: ThreatCategory!
    reviewed_by: ID
    reviewed_at: String
    notes: String
    auto_approved: Boolean!
    created_at: String!
    updated_at: String!
  }

  # Daily definition update
  type DailyDefinition {
    id: ID!
    version: String!
    release_date: String!
    new_trackers: Int!
    removed_trackers: Int!
    total_trackers: Int!
    tracker_list: String!
    signature_patterns: String!
    ml_model_version: String
    changelog: String!
    download_count: Int!
    status: DefinitionStatus!
    created_at: String!
    published_at: String
  }

  # Field installation stats
  type FieldInstallation {
    id: ID!
    installation_id: ID!
    platform: Platform!
    version: String!
    opt_in_telemetry: Boolean!
    last_definition_version: String
    last_seen: String!
    report_count: Int!
    total_blocked: Int!
    first_seen: String!
  }

  # Statistics
  type CentralStats {
    total_installations: Int!
    active_24h: Int!
    active_7d: Int!
    opt_in_count: Int!
    total_reports: Int!
    reports_today: Int!
    pending_threats: Int!
    approved_threats: Int!
    latest_definition_version: String
  }

  # Submit report response
  type SubmitReportResponse {
    success: Boolean!
    message: String!
    report_id: ID
  }

  # Review response
  type ReviewResponse {
    success: Boolean!
    message: String!
    threat: AggregatedThreat
  }

  # ============================================
  # Queries
  # ============================================

  type Query {
    # Get latest active definition
    latestDefinition: DailyDefinition

    # Get specific definition version
    definition(version: String!): DailyDefinition

    # Get central statistics
    stats: CentralStats!

    # Get pending threats (admin only)
    pendingThreats(limit: Int = 50, offset: Int = 0): [AggregatedThreat!]!

    # Get approved threats
    approvedThreats(limit: Int = 100, offset: Int = 0): [AggregatedThreat!]!

    # Get threat by domain
    threat(domain: String!): AggregatedThreat

    # Get recent reports (admin only)
    recentReports(limit: Int = 100, offset: Int = 0): [ThreatReport!]!

    # Get active installations (admin only)
    activeInstallations(limit: Int = 100, offset: Int = 0): [FieldInstallation!]!

    # Check if installation exists
    installation(installation_id: ID!): FieldInstallation
  }

  # ============================================
  # Mutations
  # ============================================

  type Mutation {
    # Submit threat report (from field installations)
    submitReport(input: ThreatReportInput!): SubmitReportResponse!

    # Review threat (admin only)
    reviewThreat(input: ReviewThreatInput!): ReviewResponse!

    # Increment definition download count
    incrementDownloadCount(version: String!): Boolean!

    # Register or update field installation
    registerInstallation(
      installation_id: ID!
      platform: Platform!
      version: String!
      opt_in_telemetry: Boolean!
    ): FieldInstallation!
  }
`;
