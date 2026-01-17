/**
 * GraphQL Schema Definition
 *
 * Uses SDL (Schema Definition Language) approach
 */

export const schema = `#graphql
  scalar DateTime
  scalar JSON
  scalar Decimal

  # Enums
  enum KycStatus {
    PENDING
    IN_PROGRESS
    VERIFIED
    REJECTED
    EXPIRED
  }

  enum CustomerStatus {
    PROSPECT
    ACTIVE
    DORMANT
    CHURNED
    BLOCKED
    DECEASED
  }

  enum BfcModule {
    LOAN
    DEPOSIT
    PAYMENT
    CARD
    INVESTMENT
    INSURANCE
    FOREX
    SUPPORT
    KYC
    ONBOARDING
  }

  enum Channel {
    BRANCH
    DIGITAL
    MOBILE_APP
    ATM
    CALL_CENTER
    WHATSAPP
    EMAIL
    CHATBOT
    FIELD_AGENT
  }

  enum ProductType {
    SAVINGS
    CURRENT
    SALARY
    FD
    RD
    HOME_LOAN
    PERSONAL_LOAN
    CAR_LOAN
    EDUCATION_LOAN
    BUSINESS_LOAN
    GOLD_LOAN
    OVERDRAFT
    CREDIT_CARD
    DEBIT_CARD
    MUTUAL_FUND
    INSURANCE
    DEMAT
  }

  enum OfferStatus {
    GENERATED
    QUEUED
    SHOWN
    CLICKED
    CONVERTED
    REJECTED
    EXPIRED
  }

  enum LoanType {
    HOME
    PERSONAL
    CAR
    EDUCATION
    BUSINESS
    GOLD
    LAP
    OVERDRAFT
  }

  enum CreditApplicationStatus {
    DRAFT
    SUBMITTED
    PROCESSING
    APPROVED
    REJECTED
    DISBURSED
    CANCELLED
  }

  # Types
  type Customer {
    id: ID!
    externalId: String!
    cif: String

    firstName: String!
    lastName: String!
    displayName: String
    email: String
    phone: String!
    altPhone: String

    pan: String
    dateOfBirth: DateTime
    gender: String

    address: JSON

    kycStatus: KycStatus!
    riskScore: Float!
    trustScore: Float!
    creditScore: Int
    segment: String
    lifetimeValue: Float!

    relationshipManagerId: String
    branchCode: String
    onboardingChannel: String

    status: CustomerStatus!
    churnProbability: Float!
    churnRiskLevel: String

    preferredLanguage: String!
    dndEnabled: Boolean!

    createdAt: DateTime!
    updatedAt: DateTime!
    lastActivityAt: DateTime

    # Relations
    episodes(limit: Int): [CustomerEpisode!]!
    products: [CustomerProduct!]!
    offers(status: OfferStatus): [CustomerOffer!]!
  }

  type CustomerEpisode {
    id: ID!
    customerId: String!

    state: String!
    context: JSON
    action: String!
    outcome: String!
    success: Boolean!

    module: BfcModule!
    subModule: String
    channel: Channel!
    deviceType: String
    sessionId: String
    aiInsight: String

    metadata: JSON
    createdAt: DateTime!
  }

  type CustomerProduct {
    id: ID!
    customerId: String!
    productType: ProductType!
    productCode: String!
    accountNumber: String
    externalId: String!
    status: String!
    openedAt: DateTime!
    closedAt: DateTime
    balance: Decimal!
    sanctionedLimit: Decimal
    outstandingAmount: Decimal
    interestRate: Float
    emiAmount: Decimal
    nextDueDate: DateTime
    overdueAmount: Decimal
    dpd: Int
    lastSyncAt: DateTime
    metadata: JSON
  }

  type CustomerOffer {
    id: ID!
    customerId: String!
    offerType: ProductType!
    offerCode: String!
    title: String!
    description: String!
    terms: JSON
    confidence: Float!
    relevanceScore: Float
    propensityScore: Float
    status: OfferStatus!
    validFrom: DateTime!
    expiresAt: DateTime
    shownAt: DateTime
    clickedAt: DateTime
    convertedAt: DateTime
    createdAt: DateTime!
  }

  type Customer360 {
    customer: Customer!
    productSummary: ProductSummary!
    recentEpisodes: [CustomerEpisode!]!
    activeOffers: [CustomerOffer!]!
    nextBestActions: [NextBestAction!]!
    lifeEvents: [LifeEvent!]!
    churnAnalysis: ChurnAnalysis
  }

  type ProductSummary {
    savingsCount: Int!
    loanCount: Int!
    cardCount: Int!
    investmentCount: Int!
    totalBalance: Decimal!
    totalOutstanding: Decimal!
  }

  type NextBestAction {
    action: String!
    confidence: Float!
    reason: String!
    offerCode: String
    priority: Int!
  }

  type LifeEvent {
    eventType: String!
    confidence: Float!
    detectedAt: DateTime!
    isConfirmed: Boolean!
  }

  type ChurnAnalysis {
    probability: Float!
    riskLevel: String!
    factors: [ChurnFactor!]!
    lastCalculatedAt: DateTime!
  }

  type ChurnFactor {
    factor: String!
    weight: Float!
    description: String!
  }

  type CreditDecision {
    applicationId: String!
    customerId: String!
    approved: Boolean!
    decisionAt: DateTime!
    approvedAmount: Decimal
    approvedTenure: Int
    interestRate: Float
    processingFee: Decimal
    emi: Decimal
    riskScore: Float!
    creditScore: Int
    dti: Float!
    foir: Float!
    positiveFactors: [DecisionFactor!]!
    negativeFactors: [DecisionFactor!]!
    warnings: [DecisionFactor!]!
    aiConfidence: Float!
    aiExplanation: String!
    modelVersion: String!
    decisionPath: String!
  }

  type DecisionFactor {
    factor: String!
    weight: Float!
    value: String!
    impact: String!
    description: String!
  }

  type EligibilityCheck {
    customerId: String!
    loanType: LoanType!
    eligible: Boolean!
    maxEligibleAmount: Decimal!
    minAmount: Decimal!
    suggestedTenure: [Int!]!
    indicativeRate: Float!
    ineligibilityReasons: [String!]
    conditions: [String!]
    checkedAt: DateTime!
    validUntil: DateTime!
  }

  # Inputs
  input CustomerInput {
    externalId: String!
    firstName: String!
    lastName: String!
    email: String
    phone: String!
    pan: String
    dateOfBirth: DateTime
    gender: String
  }

  input CustomerUpdateInput {
    firstName: String
    lastName: String
    email: String
    phone: String
    pan: String
    dateOfBirth: DateTime
    gender: String
  }

  input EpisodeInput {
    customerId: String!
    state: String!
    action: String!
    outcome: String!
    success: Boolean!
    module: BfcModule!
    channel: Channel
    context: JSON
    metadata: JSON
  }

  input CreditApplicationInput {
    customerId: String!
    loanType: LoanType!
    requestedAmount: Decimal!
    requestedTenureMonths: Int!
    purpose: String!
    annualIncome: Decimal!
    incomeType: String!
    employerName: String
    yearsInCurrentJob: Float
    existingEmi: Decimal
    existingLoans: JSON
    collateral: JSON
  }

  input OfferInput {
    customerId: String!
    offerType: ProductType!
    title: String!
    description: String!
    terms: JSON
    expiresAt: DateTime
  }

  input PaginationInput {
    page: Int
    limit: Int
    cursor: String
  }

  # Query
  type Query {
    # Customer queries
    customer(id: ID!): Customer
    customerByPhone(phone: String!): Customer
    customerByPan(pan: String!): Customer
    customers(pagination: PaginationInput, segment: String): CustomerConnection!
    customer360(id: ID!): Customer360

    # Episode queries
    customerEpisodes(customerId: ID!, limit: Int, module: BfcModule): [CustomerEpisode!]!
    similarEpisodes(state: String!, module: BfcModule!, limit: Int): [CustomerEpisode!]!

    # Product queries
    customerProducts(customerId: ID!): [CustomerProduct!]!

    # Offer queries
    customerOffers(customerId: ID!, status: OfferStatus): [CustomerOffer!]!
    eligibleProducts(customerId: ID!): [ProductType!]!

    # Credit queries
    eligibilityCheck(customerId: ID!, loanType: LoanType!): EligibilityCheck!

    # Analytics
    segmentAnalytics(segment: String!): SegmentAnalytics!
  }

  type CustomerConnection {
    items: [Customer!]!
    total: Int!
    hasMore: Boolean!
    nextCursor: String
  }

  type SegmentAnalytics {
    segment: String!
    customerCount: Int!
    avgRiskScore: Float!
    avgLifetimeValue: Float!
    churnRate: Float!
    topProducts: [ProductType!]!
  }

  # Mutation
  type Mutation {
    # Customer mutations
    createCustomer(input: CustomerInput!): Customer!
    updateCustomer(id: ID!, input: CustomerUpdateInput!): Customer!

    # Episode mutations
    recordEpisode(input: EpisodeInput!): CustomerEpisode!

    # Credit mutations
    submitCreditApplication(input: CreditApplicationInput!): CreditDecision!

    # Offer mutations
    createOffer(input: OfferInput!): CustomerOffer!
    updateOfferStatus(id: ID!, status: OfferStatus!): CustomerOffer!

    # KYC mutations
    initiateKyc(customerId: ID!): KycResult!
    verifyDocument(customerId: ID!, documentType: String!, documentNumber: String!): KycResult!
  }

  type KycResult {
    success: Boolean!
    message: String!
    status: KycStatus!
    verificationId: String
    nextSteps: [String!]
  }

  # Subscription
  type Subscription {
    customerRiskUpdated(customerId: ID!): Customer!
    newOfferGenerated(customerId: ID!): CustomerOffer!
    creditDecisionMade(applicationId: ID!): CreditDecision!
  }
`;
