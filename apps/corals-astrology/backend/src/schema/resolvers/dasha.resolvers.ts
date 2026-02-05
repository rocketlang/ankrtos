// =====================================================
// DASHA (PLANETARY PERIODS) RESOLVERS
// Vimshottari, Yogini, Jaimini, Ashtottari
// =====================================================

import { Context } from '../context';
import {
  calculateNakshatra,
  calculateMahaDashas,
  calculateAntarDashas,
  calculatePratyantarDashas,
  getCurrentDashas,
  calculateCharaDashas,
  formatDashaPeriod,
  interpretDasha,
  DASHA_EFFECTS,
  VIMSHOTTARI_SEQUENCE,
  YOGINI_SEQUENCE,
  NAKSHATRA_YOGINI,
} from '../../lib/dasha-engine';

export const dashaResolvers = {
  Query: {
    // Get user's Vimshottari Dasha
    myVimshottariDasha: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      return context.prisma.vimshottariDasha.findFirst({
        where: { userId: context.userId },
        orderBy: { calculatedAt: 'desc' },
        include: {
          mahaDashaPredictions: {
            where: {
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
            },
            take: 1,
          },
        },
      });
    },

    // Get current running dashas
    myCurrentDashas: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      const vimshottari = await context.prisma.vimshottariDasha.findFirst({
        where: { userId: context.userId },
        orderBy: { calculatedAt: 'desc' },
      });

      if (!vimshottari) {
        throw new Error('Vimshottari Dasha not calculated. Please generate your birth chart first.');
      }

      const current = getCurrentDashas(
        vimshottari.birthDate,
        vimshottari.moonLongitude,
        new Date()
      );

      return {
        mahaDasha: current.mahaDasha,
        antarDasha: current.antarDasha,
        pratyantarDasha: current.pratyantarDasha,
        vimshottariId: vimshottari.id,
      };
    },

    // Get all Mahadasha periods
    myMahaDashas: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      const vimshottari = await context.prisma.vimshottariDasha.findFirst({
        where: { userId: context.userId },
        orderBy: { calculatedAt: 'desc' },
      });

      if (!vimshottari) {
        return [];
      }

      return vimshottari.mahaDashas;
    },

    // Get Mahadasha predictions
    myMahaDashaPredictions: async (_: any, { planet }: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      const where: any = { userId: context.userId };
      if (planet) where.planet = planet;

      return context.prisma.mahaDashaPrediction.findMany({
        where,
        orderBy: { startDate: 'asc' },
      });
    },

    // Get Antardasha predictions for current Mahadasha
    myAntarDashaPredictions: async (_: any, { mahaDashaPlanet }: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      const where: any = { userId: context.userId };
      if (mahaDashaPlanet) where.mahaDashaPlanet = mahaDashaPlanet;

      return context.prisma.antarDashaPrediction.findMany({
        where,
        orderBy: { startDate: 'asc' },
      });
    },

    // Get Yogini Dasha
    myYoginiDasha: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      return context.prisma.yoginiDasha.findFirst({
        where: { userId: context.userId },
        orderBy: { calculatedAt: 'desc' },
      });
    },

    // Get Jaimini Chara Dasha
    myCharaDasha: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      return context.prisma.jaiminiCharaDasha.findFirst({
        where: { userId: context.userId },
        orderBy: { calculatedAt: 'desc' },
      });
    },

    // Get dasha compatibility with another user
    dashaCompatibility: async (_: any, { user2Id }: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      return context.prisma.dashaCompatibility.findFirst({
        where: {
          OR: [
            { user1Id: context.userId, user2Id },
            { user1Id: user2Id, user2Id: context.userId },
          ],
        },
        orderBy: { calculatedAt: 'desc' },
      });
    },

    // Get event timing analysis
    myDashaTimings: async (_: any, { eventType }: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      const where: any = { userId: context.userId };
      if (eventType) where.eventType = eventType;

      return context.prisma.dashaTiming.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    },

    // Get dasha remedy tracking
    myDashaRemedies: async (_: any, { dashaPlanet }: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      const where: any = { userId: context.userId };
      if (dashaPlanet) where.dashaPlanet = dashaPlanet;

      return context.prisma.dashaRemedyTracking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    },

    // Get upcoming dasha transitions
    upcomingDashaTransitions: async (_: any, { days = 90 }: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      return context.prisma.dashaTransit.findMany({
        where: {
          userId: context.userId,
          transitionDate: {
            gte: now,
            lte: futureDate,
          },
        },
        orderBy: { transitionDate: 'asc' },
      });
    },
  },

  Mutation: {
    // Calculate Vimshottari Dasha
    calculateVimshottariDasha: async (_: any, { birthDate, moonLongitude }: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      // Calculate nakshatra and dashas
      const nakshatra = calculateNakshatra(moonLongitude);
      const mahaDashas = calculateMahaDashas(birthDate, moonLongitude);
      const current = getCurrentDashas(birthDate, moonLongitude, new Date());

      // Create Vimshottari Dasha record
      const vimshottari = await context.prisma.vimshottariDasha.create({
        data: {
          userId: context.userId,
          birthDate,
          moonLongitude,
          birthNakshatra: nakshatra.nakshatra,
          birthNakshatraName: nakshatra.nakshatraName,
          birthPada: nakshatra.pada,
          birthDashaLord: nakshatra.dashaLord,
          completedPortion: nakshatra.completedPortion,
          balanceDashaYears: mahaDashas[0].durationYears,
          balanceDashaDays: mahaDashas[0].durationDays,
          mahaDashas: mahaDashas,
          currentMahaDasha: current.mahaDasha?.planet,
          currentMahaDashaStart: current.mahaDasha?.startDate,
          currentMahaDashaEnd: current.mahaDasha?.endDate,
          currentAntarDasha: current.antarDasha?.planet,
          currentAntarDashaStart: current.antarDasha?.startDate,
          currentAntarDashaEnd: current.antarDasha?.endDate,
          currentPratyantarDasha: current.pratyantarDasha?.planet,
          currentPratyantarDashaStart: current.pratyantarDasha?.startDate,
          currentPratyantarDashaEnd: current.pratyantarDasha?.endDate,
        },
      });

      // Create Mahadasha predictions
      for (const mahaDasha of mahaDashas) {
        const dashaEffect = DASHA_EFFECTS[mahaDasha.planet];

        await context.prisma.mahaDashaPrediction.create({
          data: {
            userId: context.userId,
            vimshottariId: vimshottari.id,
            planet: mahaDasha.planet,
            startDate: mahaDasha.startDate,
            endDate: mahaDasha.endDate,
            durationYears: mahaDasha.durationYears,
            durationDays: mahaDasha.durationDays,
            planetStrength: 70, // TODO: Calculate from chart
            planetHouse: 1, // TODO: Get from chart
            planetSign: 'ARIES', // TODO: Get from chart
            planetDignity: 'Own Sign', // TODO: Calculate
            isFavorable: true, // TODO: Calculate based on strength
            overallRating: 7, // TODO: Calculate
            positiveEffects: dashaEffect.positiveEffects,
            negativeEffects: dashaEffect.negativeEffects,
            lifeAreas: dashaEffect.lifeAreas,
            gemstone: dashaEffect.planet === 'Sun' ? 'Ruby' : 'Pearl', // TODO: Map properly
            mantra: `Om ${mahaDasha.planet}aya Namaha`,
            mantraCount: 108,
            deity: dashaEffect.planet,
            fastingDay: mahaDasha.planet === 'Sun' ? 'Sunday' : 'Monday',
            charityItems: ['Rice', 'Clothes'],
            otherRemedies: dashaEffect.remedies,
            detailedPrediction: interpretDasha(mahaDasha.planet),
            keyEvents: ['Career advancement', 'Personal growth'],
            actualEvents: [],
          },
        });
      }

      return vimshottari;
    },

    // Calculate event timing
    analyzeEventTiming: async (_: any, { eventType, eventDescription }: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      const vimshottari = await context.prisma.vimshottariDasha.findFirst({
        where: { userId: context.userId },
        orderBy: { calculatedAt: 'desc' },
      });

      if (!vimshottari) {
        throw new Error('Please calculate your Vimshottari Dasha first');
      }

      const current = getCurrentDashas(
        vimshottari.birthDate,
        vimshottari.moonLongitude,
        new Date()
      );

      // Analyze if current dasha supports this event
      const currentPlanet = current.mahaDasha?.planet || '';
      const dashaEffect = DASHA_EFFECTS[currentPlanet];
      const currentSupport = dashaEffect?.positiveEffects.some(effect =>
        effect.toLowerCase().includes(eventType.toLowerCase())
      ) || false;

      // Create timing analysis
      const timing = await context.prisma.dashaTiming.create({
        data: {
          userId: context.userId,
          eventType,
          questionDate: new Date(),
          currentDashaSupport: currentSupport,
          favorableRating: currentSupport ? 8 : 4,
          bestPeriodStart: new Date(), // TODO: Calculate
          bestPeriodEnd: new Date(), // TODO: Calculate
          recommendation: currentSupport
            ? `Current ${currentPlanet} Mahadasha is favorable for ${eventType}. Proceed with confidence.`
            : `Current ${currentPlanet} Mahadasha is not ideal for ${eventType}. Consider waiting for a better period.`,
        },
      });

      return timing;
    },

    // Start dasha remedy tracking
    startDashaRemedy: async (_: any, { dashaPlanet, gemstone, mantra }: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      const vimshottari = await context.prisma.vimshottariDasha.findFirst({
        where: { userId: context.userId },
        orderBy: { calculatedAt: 'desc' },
      });

      if (!vimshottari) {
        throw new Error('Please calculate your Vimshottari Dasha first');
      }

      const dashaEffect = DASHA_EFFECTS[dashaPlanet];

      const remedy = await context.prisma.dashaRemedyTracking.create({
        data: {
          userId: context.userId,
          dashaPlanet,
          dashaStartDate: new Date(), // TODO: Get from Mahadasha
          dashaEndDate: new Date(), // TODO: Calculate
          gemstone: gemstone || 'Ruby',
          mantra: mantra || `Om ${dashaPlanet}aya Namaha`,
          mantraCount: 108,
          deity: dashaPlanet,
          fastingDay: 'Sunday', // TODO: Map by planet
          charityItems: dashaEffect.remedies,
          specificActions: [],
          startedRemedies: true,
          remedyStartDate: new Date(),
          observedBenefits: [],
          challenges: [],
        },
      });

      return remedy;
    },

    // Update remedy progress
    updateRemedyProgress: async (
      _: any,
      { remedyId, completedMantras, completedFasts, observedBenefits }: any,
      context: Context
    ) => {
      if (!context.userId) throw new Error('Authentication required');

      const remedy = await context.prisma.dashaRemedyTracking.update({
        where: { id: remedyId },
        data: {
          completedMantras: { increment: completedMantras || 0 },
          completedFasts: { increment: completedFasts || 0 },
          observedBenefits: observedBenefits || [],
        },
      });

      return remedy;
    },

    // Calculate dasha compatibility
    calculateDashaCompatibility: async (_: any, { user2Id }: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      // Get both users' current dashas
      const user1Dasha = await context.prisma.vimshottariDasha.findFirst({
        where: { userId: context.userId },
        orderBy: { calculatedAt: 'desc' },
      });

      const user2Dasha = await context.prisma.vimshottariDasha.findFirst({
        where: { userId: user2Id },
        orderBy: { calculatedAt: 'desc' },
      });

      if (!user1Dasha || !user2Dasha) {
        throw new Error('Both users must have calculated dashas');
      }

      // Simple compatibility based on current Mahadashas
      const score = user1Dasha.currentMahaDasha === user2Dasha.currentMahaDasha ? 90 : 60;

      const compatibility = await context.prisma.dashaCompatibility.create({
        data: {
          user1Id: context.userId,
          user2Id,
          user1CurrentMaha: user1Dasha.currentMahaDasha || 'Unknown',
          user1CurrentAntar: user1Dasha.currentAntarDasha || 'Unknown',
          user2CurrentMaha: user2Dasha.currentMahaDasha || 'Unknown',
          user2CurrentAntar: user2Dasha.currentAntarDasha || 'Unknown',
          compatibilityScore: score,
          compatibilityLevel: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Moderate',
          harmonizedAreas: ['Career', 'Family'],
          conflictAreas: [],
          recommendations: ['Good time for joint ventures', 'Marriage timing is favorable'],
        },
      });

      return compatibility;
    },
  },
};
