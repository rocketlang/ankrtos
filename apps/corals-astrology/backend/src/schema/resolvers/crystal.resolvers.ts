// =====================================================
// CRYSTAL & UPAYA THERAPY RESOLVERS
// Gemstones, Chakras, Remedies
// =====================================================

import { Context } from '../context';
import {
  NAVARATNA_GEMS,
  HEALING_CRYSTALS,
  CHAKRAS,
  PLANETARY_UPAYAS,
  recommendGemstoneBySituation,
  getChakraByIssue,
  calculateGemstoneCompatibility,
} from '../../lib/crystal-therapy-engine';

export const crystalResolvers = {
  Query: {
    // Get Navaratna gem information
    navratnaGemInfo: async (_: any, { gemName }: any) => {
      const gem = NAVARATNA_GEMS[gemName];
      if (!gem) throw new Error('Gem not found');
      return gem;
    },

    // Get all Navaratna gems
    allNavratnaGems: async () => {
      return Object.values(NAVARATNA_GEMS);
    },

    // Get healing crystal information
    healingCrystalInfo: async (_: any, { crystalName }: any) => {
      const crystal = HEALING_CRYSTALS[crystalName];
      if (!crystal) throw new Error('Crystal not found');
      return crystal;
    },

    // Get all healing crystals
    allHealingCrystals: async () => {
      return Object.values(HEALING_CRYSTALS);
    },

    // Get chakra information
    chakraInfo: async (_: any, { chakraName }: any) => {
      const chakra = CHAKRAS[chakraName];
      if (!chakra) throw new Error('Chakra not found');
      return chakra;
    },

    // Get all chakras
    allChakras: async () => {
      return Object.values(CHAKRAS);
    },

    // Get planetary upaya (remedies)
    planetaryUpaya: async (_: any, { planet }: any) => {
      const upaya = PLANETARY_UPAYAS[planet];
      if (!upaya) throw new Error('Planet not found');
      return upaya;
    },

    // Get all planetary upayas
    allPlanetaryUpayas: async () => {
      return Object.values(PLANETARY_UPAYAS);
    },

    // Get gemstone recommendations by situation
    gemstoneRecommendations: async (_: any, { situation }: any) => {
      const gems = recommendGemstoneBySituation(situation);
      return gems.map(name => NAVARATNA_GEMS[name] || HEALING_CRYSTALS[name]).filter(Boolean);
    },

    // Get user's gemstone recommendations
    myGemstoneRecommendations: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      return context.prisma.gemstoneRecommendation.findMany({
        where: { userId: context.userId },
        orderBy: { createdAt: 'desc' },
      });
    },

    // Get user's crystal healing sessions
    myCrystalSessions: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      return context.prisma.crystalHealingSession.findMany({
        where: { userId: context.userId },
        orderBy: { sessionDate: 'desc' },
      });
    },

    // Get user's upaya remedy plans
    myUpayaPlans: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      return context.prisma.upayaRemedyPlan.findMany({
        where: { userId: context.userId },
        orderBy: { createdAt: 'desc' },
      });
    },

    // Get user's gemstone collection
    myGemstoneCollection: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      return context.prisma.gemstoneCollection.findMany({
        where: { userId: context.userId },
        orderBy: { purchaseDate: 'desc' },
      });
    },

    // Get user's chakra assessments
    myChakraAssessments: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      return context.prisma.chakraAssessment.findMany({
        where: { userId: context.userId },
        orderBy: { assessmentDate: 'desc' },
      });
    },

    // Get user's yantra recommendations
    myYantraRecommendations: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      return context.prisma.yantraRecommendation.findMany({
        where: { userId: context.userId },
        orderBy: { createdAt: 'desc' },
      });
    },

    // Check gemstone compatibility
    checkGemstoneCompatibility: async (_: any, { gem1, gem2 }: any) => {
      return calculateGemstoneCompatibility(gem1, gem2);
    },
  },

  Mutation: {
    // Create gemstone recommendation
    createGemstoneRecommendation: async (
      _: any,
      {
        chartType,
        primaryGem,
        primaryPlanet,
        primaryPurpose,
        minimumCarats,
        recommendedCarats,
      }: any,
      context: Context
    ) => {
      if (!context.userId) throw new Error('Authentication required');

      const gemInfo = NAVARATNA_GEMS[primaryGem];
      if (!gemInfo) throw new Error('Invalid gemstone');

      const recommendation = await context.prisma.gemstoneRecommendation.create({
        data: {
          userId: context.userId,
          chartType,
          analysisDate: new Date(),
          primaryGem,
          primaryPlanet,
          primaryPurpose,
          fingerToWear: gemInfo.finger,
          handToWear: gemInfo.hand,
          metalToUse: gemInfo.metal[0],
          dayToWear: gemInfo.dayToWear,
          timeToWear: gemInfo.timeToWear,
          nakshatra: gemInfo.nakshatra[0],
          minimumCarats: minimumCarats || gemInfo.minimumCarats,
          recommendedCarats: recommendedCarats || gemInfo.recommendedCarats,
          qualityGrade: 'Premium',
          estimatedCost: recommendedCarats * 50000, // Example calculation
          purificationMethod: gemInfo.purificationMethod,
          purificationMantra: gemInfo.energizationMantra,
          purificationDuration: 30,
          energizationMantra: gemInfo.energizationMantra,
          energizationCount: gemInfo.energizationCount,
          energizationDeity: gemInfo.energizationDeity,
          substituteGems: gemInfo.substitutes,
          avoidIf: gemInfo.avoidIf,
          sideEffects: gemInfo.sideEffects,
          trialPeriod: gemInfo.trialPeriod,
          chakraAssociation: gemInfo.chakra,
          colorTherapy: gemInfo.color,
          expectedBenefits: gemInfo.benefits,
          timeToShowResults: 30,
        },
      });

      return recommendation;
    },

    // Record crystal healing session
    recordCrystalSession: async (
      _: any,
      { sessionType, duration, crystalsUsed, intention }: any,
      context: Context
    ) => {
      if (!context.userId) throw new Error('Authentication required');

      const session = await context.prisma.crystalHealingSession.create({
        data: {
          userId: context.userId,
          sessionDate: new Date(),
          sessionType,
          duration,
          crystalsUsed,
          rootChakra: 'balanced',
          sacralChakra: 'balanced',
          solarPlexus: 'balanced',
          heartChakra: 'balanced',
          throatChakra: 'balanced',
          thirdEye: 'balanced',
          crownChakra: 'balanced',
          intention,
          experiencedBenefits: [],
        },
      });

      return session;
    },

    // Create upaya remedy plan
    createUpayaPlan: async (
      _: any,
      { issue, affectedPlanet, severity }: any,
      context: Context
    ) => {
      if (!context.userId) throw new Error('Authentication required');

      const upaya = PLANETARY_UPAYAS[affectedPlanet];
      if (!upaya) throw new Error('Invalid planet');

      const plan = await context.prisma.upayaRemedyPlan.create({
        data: {
          userId: context.userId,
          issue,
          affectedPlanet,
          affectedHouse: 1, // TODO: Get from chart
          severity,
          gemstoneRemedy: { gem: upaya.gemstone, planet: upaya.planet },
          mantraToChant: upaya.mantra,
          mantraCount: upaya.mantraCount,
          mantraDuration: 40,
          mantraTime: 'Morning',
          mantraBenefits: ['Peace of mind', 'Problem resolution'],
          yantraType: upaya.yantra,
          yantraPlacement: `${upaya.direction} direction`,
          yantraActivation: 'Energize on appropriate day',
          charityItem: upaya.charity,
          charityDay: upaya.fastingDay,
          charityBeneficiary: 'Temple or poor people',
          fastingDay: upaya.fastingDay,
          fastingType: 'Partial',
          fastingDuration: 12,
          deityToWorship: upaya.deity,
          worshipDay: upaya.fastingDay,
          worshipOffering: ['Flowers', 'Incense'],
          favorableColors: [upaya.color],
          avoidColors: [],
          metalToWear: upaya.metal,
          lifestyleChanges: ['Morning meditation', 'Positive thinking'],
          startDate: new Date(),
          progress: 'active',
        },
      });

      return plan;
    },

    // Add gemstone to collection
    addGemstoneToCollection: async (
      _: any,
      {
        gemName,
        gemType,
        caratWeight,
        purchaseDate,
        purchaseCost,
        setIn,
      }: any,
      context: Context
    ) => {
      if (!context.userId) throw new Error('Authentication required');

      const gem = await context.prisma.gemstoneCollection.create({
        data: {
          userId: context.userId,
          gemName,
          gemType,
          planet: 'Sun', // TODO: Map from gem
          caratWeight,
          color: 'Red', // TODO: Get from gem info
          clarity: 'Eye clean',
          cut: 'Oval',
          origin: 'Unknown',
          purchaseDate,
          purchaseCost,
          setIn,
          purified: false,
          energized: false,
          currentlyWearing: false,
          observedBenefits: [],
          sideEffects: [],
          photos: [],
        },
      });

      return gem;
    },

    // Create chakra assessment
    createChakraAssessment: async (
      _: any,
      { assessmentType, chakraData }: any,
      context: Context
    ) => {
      if (!context.userId) throw new Error('Authentication required');

      const assessment = await context.prisma.chakraAssessment.create({
        data: {
          userId: context.userId,
          assessmentDate: new Date(),
          assessmentType,
          chakras: chakraData,
          rootStatus: 'balanced',
          rootPercentage: 70,
          rootIssues: [],
          rootCrystals: ['Red Jasper', 'Black Tourmaline'],
          rootMantras: ['LAM'],
          sacralStatus: 'balanced',
          sacralPercentage: 75,
          sacralIssues: [],
          sacralCrystals: ['Carnelian'],
          sacralMantras: ['VAM'],
          solarStatus: 'balanced',
          solarPercentage: 80,
          solarIssues: [],
          solarCrystals: ['Citrine'],
          solarMantras: ['RAM'],
          heartStatus: 'balanced',
          heartPercentage: 85,
          heartIssues: [],
          heartCrystals: ['Rose Quartz'],
          heartMantras: ['YAM'],
          throatStatus: 'balanced',
          throatPercentage: 70,
          throatIssues: [],
          throatCrystals: ['Blue Lace Agate'],
          throatMantras: ['HAM'],
          thirdEyeStatus: 'balanced',
          thirdEyePercentage: 75,
          thirdEyeIssues: [],
          thirdEyeCrystals: ['Amethyst'],
          thirdEyeMantras: ['OM'],
          crownStatus: 'balanced',
          crownPercentage: 80,
          crownIssues: [],
          crownCrystals: ['Clear Quartz'],
          crownMantras: ['AUM'],
          overallBalance: 75,
          recommendations: ['Practice daily meditation', 'Use recommended crystals'],
        },
      });

      return assessment;
    },

    // Create yantra recommendation
    createYantraRecommendation: async (
      _: any,
      { yantraName, yantraType, purpose, associatedPlanet }: any,
      context: Context
    ) => {
      if (!context.userId) throw new Error('Authentication required');

      const upaya = associatedPlanet ? PLANETARY_UPAYAS[associatedPlanet] : null;

      const yantra = await context.prisma.yantraRecommendation.create({
        data: {
          userId: context.userId,
          yantraName,
          yantraType,
          purpose,
          associatedPlanet,
          associatedDeity: upaya?.deity || 'Universal',
          material: 'Copper',
          size: '3x3 inches',
          mantraEngraved: upaya?.mantra || 'Om',
          direction: upaya?.direction || 'East',
          location: 'Puja room',
          height: 'Eye level',
          energizationRitual: 'Full moon energization',
          energizationMantra: upaya?.mantra || 'Om',
          dailyWorship: true,
          worshipTime: 'Morning',
          offerings: ['Flowers', 'Incense', 'Light'],
          expectedBenefits: ['Prosperity', 'Peace', 'Success'],
          cleaningFrequency: 'Weekly',
          cleaningMethod: 'Wipe with clean cloth',
          reEnergization: 'Monthly on full moon',
          experiencedBenefits: [],
        },
      });

      return yantra;
    },

    // Update remedy plan progress
    updateUpayaProgress: async (
      _: any,
      { planId, observedBenefits, effectiveness }: any,
      context: Context
    ) => {
      if (!context.userId) throw new Error('Authentication required');

      const plan = await context.prisma.upayaRemedyPlan.update({
        where: { id: planId },
        data: {
          progress: 'completed',
          effectivenessRating: effectiveness,
        },
      });

      return plan;
    },
  },
};
