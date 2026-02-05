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

  # ==================== PALMISTRY (CHIROMANCY) ====================

  type HandShape {
    type: String!
    element: String!
    characteristics: [String!]!
    personality: String!
    career: [String!]!
    relationships: String!
  }

  type MajorLine {
    name: String!
    location: String!
    quality: String!
    length: String!
    meaning: String!
    positive: [String!]!
    negative: [String!]!
    remedies: [String!]!
  }

  type Mount {
    name: String!
    planet: String!
    location: String!
    development: String!
    meaning: String!
    characteristics: [String!]!
    career: [String!]!
    weaknesses: [String!]
  }

  type FingerAnalysisType {
    finger: String!
    planet: String!
    length: String!
    flexibility: String!
    phalanges: JSON!
    meaning: String!
    traits: [String!]!
  }

  type MinorLine {
    name: String!
    presence: Boolean!
    quality: String
    meaning: String!
    significance: String!
  }

  type PlanetaryInfluence {
    planet: String!
    strength: Int!
    impact: String!
  }

  type PalmReading {
    id: ID!
    userId: String!
    dominantHand: String!
    handShape: String!
    handElement: String!
    handCharacteristics: [String!]!
    handPersonality: String!
    handCareerSuggestions: [String!]!
    handRelationships: String!

    # Major Lines
    heartLine: JSON!
    headLine: JSON!
    lifeLine: JSON!
    fateLine: JSON

    # Mounts
    mountOfJupiter: JSON!
    mountOfSaturn: JSON!
    mountOfApollo: JSON!
    mountOfMercury: JSON!
    mountOfMars: JSON!
    mountOfVenus: JSON!
    mountOfMoon: JSON!

    # Fingers
    thumbAnalysis: JSON!
    jupiterFinger: JSON!
    saturnFinger: JSON!
    apolloFinger: JSON!
    mercuryFinger: JSON!

    # Minor Lines
    hasSunLine: Boolean!
    sunLineQuality: String
    hasMercuryLine: Boolean!
    mercuryLineQuality: String
    hasIntuitionLine: Boolean!
    marriageLineCount: Int!
    travelLineCount: Int!
    childrenLineCount: Int

    # Overall Analysis
    overallPersonality: String!
    strengths: [String!]!
    weaknesses: [String!]!
    careerSuggestions: [String!]!
    healthIndications: [String!]!
    relationshipAnalysis: String!
    wealthPotential: String!
    lifeExpectancy: String!

    # Planetary
    planetaryInfluences: JSON!
    dominantPlanet: String!
    weakestPlanet: String
    overallBalance: Int!

    # Remedies
    remedies: JSON!

    # Image
    palmImageUrl: String
    palmImageAnalyzed: Boolean!

    # Relations
    lineAnalyses: [HandLineAnalysis!]
    mountAnalyses: [MountAnalysis!]
    fingerAnalyses: [FingerAnalysis!]
    markings: [PalmMarking!]
    imageUpload: PalmImageUpload

    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type HandLineAnalysis {
    id: ID!
    userId: String!
    palmReadingId: String
    lineName: String!
    lineType: String!
    quality: String!
    length: String!
    depth: String
    direction: String
    startPoint: String
    endPoint: String
    breaks: Int!
    branches: Int!
    islands: Int!
    chains: Boolean!
    meaning: String!
    positiveTraits: [String!]!
    negativeTraits: [String!]!
    lifeAreas: [String!]!
    timingMarks: JSON
    criticalPeriods: [String!]!
    opportunities: [String!]!
    challenges: [String!]!
    remedies: [String!]!
    gemstones: [String!]!
    mantras: [String!]!
    createdAt: DateTime!
  }

  type MountAnalysis {
    id: ID!
    userId: String!
    palmReadingId: String
    mountName: String!
    planet: String!
    location: String!
    development: String!
    size: Int!
    firmness: String!
    hasStarMark: Boolean!
    hasCrossMark: Boolean!
    hasTriangleMark: Boolean!
    hasSquareMark: Boolean!
    hasGridMark: Boolean!
    meaning: String!
    characteristics: [String!]!
    career: [String!]!
    weaknesses: [String!]!
    planetaryStrength: Int!
    planetaryImpact: String!
    remedies: [String!]!
    gemstone: String!
    mantra: String!
    color: String!
    favorableDay: String!
    createdAt: DateTime!
  }

  type FingerAnalysis {
    id: ID!
    userId: String!
    palmReadingId: String
    fingerName: String!
    planet: String!
    length: String!
    relativeLength: String!
    flexibility: String!
    shape: String
    tipShape: String
    tipMeaning: String
    topPhalange: String!
    topLength: String!
    middlePhalange: String!
    middleLength: String!
    bottomPhalange: String!
    bottomLength: String!
    hasKnots: Boolean!
    knotsType: String
    nailShape: String
    nailCondition: String
    meaning: String!
    traits: [String!]!
    strengths: [String!]!
    weaknesses: [String!]!
    careerIndications: [String!]!
    personalityImpact: String!
    createdAt: DateTime!
  }

  type PalmMarking {
    id: ID!
    userId: String!
    palmReadingId: String
    markingType: String!
    location: String!
    onLine: String
    onMount: String
    meaning: String!
    isPositive: Boolean!
    significance: String!
    approximateAge: Int
    lifeEvent: String
    createdAt: DateTime!
  }

  type PalmCompatibility {
    id: ID!
    userId: String!
    partnerUserId: String
    partnerHandShape: String!
    partnerDominantPlanet: String!
    userHandShape: String!
    userDominantPlanet: String!
    overallScore: Int!
    elementCompatibility: String!
    planetaryHarmony: Int!
    emotionalCompatibility: Int!
    mentalCompatibility: Int!
    physicalCompatibility: Int!
    spiritualCompatibility: Int!
    relationshipStrengths: [String!]!
    relationshipChallenges: [String!]!
    compatibilityAnalysis: String!
    recommendations: [String!]!
    areasToWorkOn: [String!]!
    createdAt: DateTime!
  }

  type PalmRemedy {
    id: ID!
    userId: String!
    palmReadingId: String
    issue: String!
    area: String!
    severity: String!
    remedyType: String!
    gemstone: String
    carats: Float
    finger: String
    metal: String
    dayToWear: String
    mantra: String
    repetitions: Int
    duration: String
    lifestyleChanges: [String!]!
    charity: String
    fasting: String
    colors: [String!]!
    directions: [String!]!
    started: DateTime
    completed: Boolean!
    progress: Int!
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type PalmImageUpload {
    id: ID!
    userId: String!
    palmReadingId: String
    palmReading: PalmReading
    imageUrl: String!
    hand: String!
    imageFormat: String!
    fileSize: Int!
    analyzed: Boolean!
    analyzedAt: DateTime
    aiModel: String
    detectedLines: JSON
    detectedMounts: JSON
    detectedMarkings: JSON
    imageQuality: String
    handVisible: Boolean!
    linesVisible: Boolean!
    createdAt: DateTime!
  }

  input LineDataInput {
    quality: String!
    length: String!
    direction: String
  }

  input MountDataInput {
    jupiter: String!
    saturn: String!
    apollo: String!
    mercury: String!
    mars: String!
    venus: String!
    moon: String!
  }

  input FingerDataInput {
    thumb: FingerInput!
    jupiter: FingerInput!
    saturn: FingerInput!
    apollo: FingerInput!
    mercury: FingerInput!
  }

  input FingerInput {
    length: String!
    flexibility: String
  }

  input MinorLinesInput {
    sunLine: Boolean
    mercuryLine: Boolean
    intuitionLine: Boolean
    marriageLineCount: Int
    travelLineCount: Int
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

    # Crystal Therapy & Gemstones
    navratnaGemInfo(gemName: String!): JSON
    allNavratnaGems: [JSON!]!
    healingCrystalInfo(crystalName: String!): JSON
    allHealingCrystals: [JSON!]!
    chakraInfo(chakraName: String!): JSON
    allChakras: [JSON!]!
    planetaryUpaya(planet: String!): JSON
    allPlanetaryUpayas: [JSON!]!
    gemstoneRecommendations(situation: String!): [JSON!]!
    myGemstoneRecommendations: [JSON!]!
    myCrystalSessions: [JSON!]!
    myUpayaPlans: [JSON!]!
    myGemstoneCollection: [JSON!]!
    myChakraAssessments: [JSON!]!
    myYantraRecommendations: [JSON!]!
    checkGemstoneCompatibility(gem1: String!, gem2: String!): JSON

    # Dasha Systems
    myVimshottariDasha: JSON
    myCurrentDashas: JSON
    myMahaDashas: [JSON!]!
    myAntarDashas(mahaDashaId: ID!): [JSON!]!
    myYoginiDashas: [JSON!]!
    myJaiminiCharaDashas: [JSON!]!
    myAshtottariDashas: [JSON!]!

    # Numerology
    myNumerologyChart: JSON
    myPersonalYearForecast: JSON
    numerologyCompatibility(partnerId: ID!): JSON
    myNameChangeAnalyses: [JSON!]!

    # Palmistry
    handShapeInfo(shapeType: String!): HandShape
    allHandShapes: [HandShape!]!
    mountInfo(mountName: String!): JSON
    allMounts: [JSON!]!
    fingerInfo(fingerName: String!): JSON
    allFingers: [JSON!]!
    minorLineInfo(lineName: String!): MinorLine
    allMinorLines: [MinorLine!]!
    myPalmReadings: [PalmReading!]!
    palmReading(id: ID!): PalmReading
    myHandLineAnalyses(lineName: String): [HandLineAnalysis!]!
    myMountAnalyses(mountName: String): [MountAnalysis!]!
    myFingerAnalyses(fingerName: String): [FingerAnalysis!]!
    myPalmMarkings(markingType: String): [PalmMarking!]!
    myPalmCompatibility: [PalmCompatibility!]!
    myPalmRemedies(area: String): [PalmRemedy!]!
    activePalmRemedies: [PalmRemedy!]!
    myPalmImages: [PalmImageUpload!]!
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

    # Crystal Therapy & Gemstones
    createGemstoneRecommendation(
      gemName: String!
      planet: String!
      situation: String!
      minimumCarats: Float
      recommendedCarats: Float
    ): JSON!
    recordCrystalSession(
      crystalName: String!
      purpose: String!
      duration: Int!
      experience: String
    ): JSON!
    createUpayaPlan(
      issue: String!
      affectedPlanet: String!
      severity: String!
    ): JSON!
    addGemstoneToCollection(
      gemName: String!
      carats: Float!
      purchaseDate: DateTime!
    ): JSON!
    assessChakras(
      chakraBalances: JSON!
    ): JSON!
    updateUpayaProgress(
      id: ID!
      progress: String!
      notes: String
    ): JSON!

    # Dasha Systems
    calculateVimshottariDasha(
      birthDate: DateTime!
      moonLongitude: Float!
    ): JSON!
    analyzeEventTiming(
      eventDate: DateTime!
      eventType: String!
    ): JSON!
    startDashaRemedy(
      dashaId: ID!
      remedy: String!
    ): JSON!

    # Numerology
    calculateNumerologyChart(
      fullName: String!
      birthDate: DateTime!
    ): JSON!
    calculatePersonalYear(
      birthDate: DateTime!
      year: Int!
    ): JSON!
    analyzeNameChange(
      currentName: String!
      proposedName: String!
    ): JSON!

    # Palmistry
    generatePalmReading(
      handShapeType: String!
      dominantHand: String!
      lineData: JSON!
      mountData: JSON!
      fingerData: JSON!
      minorLines: MinorLinesInput
    ): PalmReading!
    createHandLineAnalysis(
      palmReadingId: ID
      lineName: String!
      quality: String!
      length: String!
      direction: String
    ): HandLineAnalysis!
    createMountAnalysis(
      palmReadingId: ID
      mountName: String!
      development: String!
      size: Int!
    ): MountAnalysis!
    createFingerAnalysis(
      palmReadingId: ID
      fingerName: String!
      length: String!
      flexibility: String
    ): FingerAnalysis!
    createPalmMarking(
      palmReadingId: ID
      markingType: String!
      location: String!
      onLine: String
      onMount: String
      isPositive: Boolean!
    ): PalmMarking!
    calculatePalmCompatibility(
      partnerHandShape: String!
      partnerDominantPlanet: String!
    ): PalmCompatibility!
    startPalmRemedy(
      palmReadingId: ID
      issue: String!
      area: String!
      remedyType: String!
      gemstone: String
      mantra: String
      lifestyleChanges: [String!]
    ): PalmRemedy!
    updatePalmRemedyProgress(
      id: ID!
      progress: Int!
      notes: String
    ): PalmRemedy!
    uploadPalmImage(
      imageUrl: String!
      hand: String!
      imageFormat: String!
    ): PalmImageUpload!
  }

  # ==================== SUBSCRIPTIONS ====================

  type Subscription {
    # Chat
    messageReceived(roomId: String!): ChatMessage!

    # Consultation
    consultationStatusChanged(consultationId: String!): Consultation!
  }
`;
