export const typeDefs = `#graphql
  scalar DateTime
  scalar JSON

  # ==================== USER ====================

  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String
    phone: String
    avatar: String
    role: UserRole!

    # Birth Details
    birthDate: DateTime
    birthTime: String
    birthPlace: String
    birthLat: Float
    birthLng: Float
    timezone: String

    # Calculated
    sunSign: ZodiacSign
    moonSign: ZodiacSign
    ascendant: ZodiacSign

    # Subscription
    isPremium: Boolean!
    premiumUntil: DateTime

    # Relations
    birthChart: BirthChart
    kundli: Kundli

    createdAt: DateTime!
  }

  enum UserRole {
    USER
    ASTROLOGER
    ADMIN
  }

  enum ZodiacSign {
    ARIES
    TAURUS
    GEMINI
    CANCER
    LEO
    VIRGO
    LIBRA
    SCORPIO
    SAGITTARIUS
    CAPRICORN
    AQUARIUS
    PISCES
  }

  # ==================== AUTHENTICATION ====================

  type AuthPayload {
    token: String!
    user: User!
  }

  input SignUpInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String
    phone: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  # ==================== KUNDLI (VEDIC BIRTH CHART) ====================

  type Kundli {
    id: ID!
    userId: String!

    # Birth Details
    birthDate: DateTime!
    birthTime: String!
    birthPlace: String!
    birthLat: Float!
    birthLng: Float!
    timezone: String!

    # Ayanamsa
    ayanamsa: String!

    # Charts
    rashiChart: JSON!
    d1: JSON!
    d9: JSON!
    d10: JSON!

    # Planetary Details
    planets: JSON!

    # Nakshatra
    birthNakshatra: String!
    birthPada: Int!
    moonNakshatra: String!
    moonPada: Int!

    # Lagna
    lagna: ZodiacSign!
    lagnaLord: Planet!

    # Yogas & Doshas
    yogas: JSON!
    mangalDosha: Boolean!
    kalSarpaDosha: Boolean!

    # House Lords
    houseLords: JSON!

    # Dasha
    currentDasha: String
    dashas: JSON!

    # Panchang at Birth
    tithi: String!
    yoga: String!
    karana: String!

    # Analysis
    analysis: String
    predictions: String

    generatedAt: DateTime!
  }

  enum Planet {
    SUN
    MOON
    MERCURY
    VENUS
    MARS
    JUPITER
    SATURN
    URANUS
    NEPTUNE
    PLUTO
    RAHU
    KETU
  }

  input GenerateKundliInput {
    birthDate: DateTime!
    birthTime: String!
    birthPlace: String!
    birthLat: Float!
    birthLng: Float!
    timezone: String
    ayanamsa: String
  }

  # ==================== HOROSCOPE ====================

  type Horoscope {
    id: ID!
    zodiacSign: ZodiacSign!
    period: Period!
    date: DateTime!

    overview: String!
    love: String
    career: String
    finance: String
    health: String
    lucky: JSON

    loveRating: Int
    careerRating: Int
    financeRating: Int
    healthRating: Int

    isAiGenerated: Boolean!
    createdAt: DateTime!
  }

  enum Period {
    DAILY
    WEEKLY
    MONTHLY
    YEARLY
  }

  # ==================== PANCHANG ====================

  type Panchang {
    id: ID!
    date: DateTime!

    tithi: String!
    nakshatra: String!
    yoga: String!
    karana: String!
    weekDay: String!

    sunrise: String!
    sunset: String!
    moonSign: ZodiacSign!

    rahuKaal: JSON
    shubhMuhurat: JSON

    festivals: [String!]!
    dailyAdvice: String
  }

  # ==================== MATCHMAKING ====================

  type MatchMaking {
    id: ID!

    user1Name: String!
    user2Name: String!

    # Ashtakoot Scores
    varna: Int!
    vashya: Int!
    tara: Int!
    yoni: Int!
    graha: Int!
    gana: Int!
    bhakoot: Int!
    nadi: Int!
    totalScore: Int!

    # Mangal Dosha
    user1MangalDosha: Boolean!
    user2MangalDosha: Boolean!
    mangalDoshaMatch: Boolean!

    rating: String!
    recommendation: String!
    strengths: [String!]!
    challenges: [String!]!
    remedies: [String!]!

    createdAt: DateTime!
  }

  input MatchMakingInput {
    user1Name: String!
    user1Birth: DateTime!
    user1Time: String!
    user1Place: String!

    user2Name: String!
    user2Birth: DateTime!
    user2Time: String!
    user2Place: String!
  }

  # ==================== PREDICTIONS ====================

  type Prediction {
    id: ID!
    userId: String!
    type: PredictionType!
    category: String!

    startDate: DateTime!
    endDate: DateTime!

    basedOn: [String!]!
    title: String!
    prediction: String!
    confidence: Int!
    impact: ImpactLevel!

    isAiEnhanced: Boolean!
    createdAt: DateTime!
  }

  enum PredictionType {
    DAILY
    WEEKLY
    MONTHLY
    YEARLY
    LIFE_EVENT
    DASHA_BASED
    TRANSIT_BASED
  }

  enum ImpactLevel {
    VERY_POSITIVE
    POSITIVE
    NEUTRAL
    NEGATIVE
    VERY_NEGATIVE
  }

  # ==================== CONSULTATIONS ====================

  type Astrologer {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    displayName: String!
    avatar: String
    bio: String

    specializations: [String!]!
    languages: [String!]!
    experience: Int!

    rating: Float!
    reviewCount: Int!

    isAvailable: Boolean!
    hourlyRate: Int!
    isVerified: Boolean!
  }

  type Consultation {
    id: ID!
    user: User!
    astrologer: Astrologer!

    scheduledAt: DateTime!
    duration: Int!
    status: ConsultationStatus!

    meetingLink: String
    amount: Int!

    createdAt: DateTime!
  }

  enum ConsultationStatus {
    PENDING
    CONFIRMED
    IN_PROGRESS
    COMPLETED
    CANCELLED
  }

  # ==================== RTC CHAT ====================

  type ChatRoom {
    id: ID!
    consultationId: String!
    userId: String!
    astrologerId: String!
    isActive: Boolean!
    messages: [ChatMessage!]!
    startedAt: DateTime!
  }

  type ChatMessage {
    id: ID!
    roomId: String!
    senderId: String!
    senderType: String!
    type: MessageType!
    content: String!
    fileUrl: String
    isRead: Boolean!
    createdAt: DateTime!
  }

  enum MessageType {
    TEXT
    IMAGE
    FILE
    AUDIO
    VIDEO
    CHART
    SYSTEM
  }

  input SendMessageInput {
    roomId: String!
    type: MessageType!
    content: String!
    fileUrl: String
  }

  # ==================== QUERIES ====================

  type Query {
    # Auth
    me: User

    # Horoscopes
    dailyHoroscope(zodiacSign: ZodiacSign!): Horoscope
    weeklyHoroscope(zodiacSign: ZodiacSign!): Horoscope
    monthlyHoroscope(zodiacSign: ZodiacSign!): Horoscope
    yearlyHoroscope(zodiacSign: ZodiacSign!): Horoscope

    # Kundli
    myKundli: Kundli
    getKundli(userId: String!): Kundli

    # Panchang
    todayPanchang(lat: Float!, lng: Float!): Panchang!
    getPanchang(date: DateTime!, lat: Float!, lng: Float!): Panchang!

    # Predictions
    myPredictions(type: PredictionType): [Prediction!]!

    # Astrologers
    astrologers(specialization: String, language: String): [Astrologer!]!
    astrologer(id: ID!): Astrologer

    # Consultations
    myConsultations: [Consultation!]!

    # Chat
    chatRoom(consultationId: String!): ChatRoom
    chatMessages(roomId: String!, limit: Int, offset: Int): [ChatMessage!]!
  }

  # ==================== MUTATIONS ====================

  type Mutation {
    # Auth
    signUp(input: SignUpInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!

    # Profile
    updateProfile(
      firstName: String
      lastName: String
      phone: String
      birthDate: DateTime
      birthTime: String
      birthPlace: String
      birthLat: Float
      birthLng: Float
    ): User!

    # Kundli
    generateKundli(input: GenerateKundliInput!): Kundli!
    regenerateKundli: Kundli!

    # MatchMaking
    calculateMatchMaking(input: MatchMakingInput!): MatchMaking!

    # Consultations
    bookConsultation(
      astrologerId: String!
      scheduledAt: DateTime!
      duration: Int
    ): Consultation!

    cancelConsultation(id: ID!): Consultation!

    # Chat
    sendMessage(input: SendMessageInput!): ChatMessage!
    markMessageAsRead(messageId: String!): ChatMessage!
  }

  # ==================== SUBSCRIPTIONS ====================

  type Subscription {
    # Chat
    messageReceived(roomId: String!): ChatMessage!

    # Consultation
    consultationStatusChanged(consultationId: String!): Consultation!
  }
`;
