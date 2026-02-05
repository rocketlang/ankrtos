// =====================================================
// NUMEROLOGY RESOLVERS
// Pythagorean, Chaldean, Vedic, Chinese Systems
// =====================================================

import { Context } from '../context';
import {
  calculateLifePath,
  calculateDestinyNumber,
  calculateSoulUrge,
  calculatePersonalityNumber,
  calculateBirthdayNumber,
  calculateMaturityNumber,
  calculatePersonalYear,
  isNameChange,
  isMasterNumber,
  isKarmicDebtNumber,
} from '../../lib/numerology-engine';

export const numerologyResolvers = {
  Query: {
    // Get user's numerology chart
    myNumerologyChart: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      return context.prisma.numerologyChart.findFirst({
        where: { userId: context.userId },
        orderBy: { createdAt: 'desc' },
      });
    },

    // Get personal year forecast
    myPersonalYearForecast: async (_: any, { year }: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      const where: any = { userId: context.userId };
      if (year) where.year = year;

      return context.prisma.personalYearForecast.findMany({
        where,
        orderBy: { year: 'desc' },
      });
    },

    // Get numerology compatibility
    numerologyCompatibility: async (_: any, { user2Id }: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      return context.prisma.numerologyCompatibility.findFirst({
        where: {
          OR: [
            { user1Id: context.userId, user2Id },
            { user1Id: user2Id, user2Id: context.userId },
          ],
        },
        orderBy: { calculatedAt: 'desc' },
      });
    },

    // Get name change analyses
    myNameChangeAnalyses: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      return context.prisma.nameChangeAnalysis.findMany({
        where: { userId: context.userId },
        orderBy: { createdAt: 'desc' },
      });
    },

    // Get business name numerology
    myBusinessNames: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      return context.prisma.businessNameNumerology.findMany({
        where: { userId: context.userId },
        orderBy: { createdAt: 'desc' },
      });
    },

    // Get phone number numerology
    myPhoneNumbers: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      return context.prisma.phoneNumberNumerology.findMany({
        where: { userId: context.userId },
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Mutation: {
    // Calculate numerology chart
    calculateNumerologyChart: async (
      _: any,
      { fullName, birthDate }: any,
      context: Context
    ) => {
      if (!context.userId) throw new Error('Authentication required');

      const lifePath = calculateLifePath(birthDate);
      const destinyNumber = calculateDestinyNumber(fullName);
      const soulUrge = calculateSoulUrge(fullName);
      const personality = calculatePersonalityNumber(fullName);
      const birthdayNumber = calculateBirthdayNumber(birthDate);
      const maturityNumber = calculateMaturityNumber(lifePath, destinyNumber);

      const chart = await context.prisma.numerologyChart.create({
        data: {
          userId: context.userId,
          fullName,
          birthDate,
          lifePathNumber: lifePath,
          destinyNumber,
          soulUrgeNumber: soulUrge,
          personalityNumber: personality,
          birthdayNumber,
          maturityNumber,
          expressionNumber: destinyNumber,
          heartDesireNumber: soulUrge,
          isMasterNumber11: lifePath === 11 || destinyNumber === 11,
          isMasterNumber22: lifePath === 22 || destinyNumber === 22,
          isMasterNumber33: lifePath === 33 || destinyNumber === 33,
          isKarmicDebt13: false,
          isKarmicDebt14: false,
          isKarmicDebt16: false,
          isKarmicDebt19: false,
          strengths: ['Leadership', 'Creativity'],
          weaknesses: ['Impatience', 'Stubbornness'],
          careerPaths: ['Business', 'Arts'],
          luckyNumbers: [lifePath, destinyNumber],
          luckyColors: ['Blue', 'Green'],
          luckyDays: ['Monday', 'Friday'],
          luckyGems: ['Sapphire', 'Emerald'],
          compatibleNumbers: [2, 6, 9],
          challengingNumbers: [1, 5],
          interpretation: `Life Path ${lifePath} indicates strong leadership qualities.`,
        },
      });

      return chart;
    },

    // Calculate personal year forecast
    calculatePersonalYear: async (
      _: any,
      { year }: any,
      context: Context
    ) => {
      if (!context.userId) throw new Error('Authentication required');

      const user = await context.prisma.user.findUnique({
        where: { id: context.userId },
      });

      if (!user?.birthDate) {
        throw new Error('Birth date required');
      }

      const personalYear = calculatePersonalYear(user.birthDate, year);

      const forecast = await context.prisma.personalYearForecast.create({
        data: {
          userId: context.userId,
          year,
          personalYearNumber: personalYear,
          theme: 'New beginnings and growth',
          opportunities: ['Career advancement', 'New relationships'],
          challenges: ['Patience required', 'Avoid impulsiveness'],
          monthByMonth: {},
          luckyMonths: [1, 5, 9],
          challengingMonths: [4, 8],
          recommendations: ['Focus on personal development'],
          peakPeriods: 'March-May',
        },
      });

      return forecast;
    },

    // Analyze name change
    analyzeNameChange: async (
      _: any,
      { currentName, proposedName }: any,
      context: Context
    ) => {
      if (!context.userId) throw new Error('Authentication required');

      const currentDestiny = calculateDestinyNumber(currentName);
      const proposedDestiny = calculateDestinyNumber(proposedName);

      const analysis = await context.prisma.nameChangeAnalysis.create({
        data: {
          userId: context.userId,
          currentName,
          proposedName,
          currentDestinyNumber: currentDestiny,
          proposedDestinyNumber: proposedDestiny,
          currentSoulUrge: calculateSoulUrge(currentName),
          proposedSoulUrge: calculateSoulUrge(proposedName),
          currentPersonality: calculatePersonalityNumber(currentName),
          proposedPersonality: calculatePersonalityNumber(proposedName),
          energyShift: proposedDestiny - currentDestiny,
          isRecommended: proposedDestiny > currentDestiny,
          positiveChanges: ['More confident vibration'],
          negativeChanges: [],
          overallRecommendation: proposedDestiny > currentDestiny ? 'Highly recommended' : 'Not recommended',
          bestDateToChange: new Date(),
        },
      });

      return analysis;
    },

    // Analyze business name
    analyzeBusinessName: async (
      _: any,
      { businessName, businessType }: any,
      context: Context
    ) => {
      if (!context.userId) throw new Error('Authentication required');

      const destinyNumber = calculateDestinyNumber(businessName);

      const analysis = await context.prisma.businessNameNumerology.create({
        data: {
          userId: context.userId,
          businessName,
          businessType,
          destinyNumber,
          soulUrgeNumber: calculateSoulUrge(businessName),
          personalityNumber: calculatePersonalityNumber(businessName),
          successVibration: destinyNumber >= 5 ? 8 : 6,
          industryAlignment: 'Good',
          brandPotential: 'High',
          luckyColors: ['Blue', 'Green'],
          luckyNumbers: [destinyNumber],
          strengths: ['Strong brand identity'],
          weaknesses: [],
          marketingTips: ['Use blue in branding'],
          launchRecommendation: new Date(),
          alternativeNames: [`${businessName} Pro`, `${businessName} Plus`],
        },
      });

      return analysis;
    },

    // Analyze phone number
    analyzePhoneNumber: async (
      _: any,
      { phoneNumber }: any,
      context: Context
    ) => {
      if (!context.userId) throw new Error('Authentication required');

      // Sum all digits
      const digits = phoneNumber.replace(/\D/g, '');
      let sum = 0;
      for (const digit of digits) {
        sum += parseInt(digit);
      }

      // Reduce to single digit
      while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
        sum = sum.toString().split('').reduce((a, b) => a + parseInt(b), 0);
      }

      const analysis = await context.prisma.phoneNumberNumerology.create({
        data: {
          userId: context.userId,
          phoneNumber,
          numberValue: parseInt(digits),
          reducedNumber: sum,
          energyType: sum % 2 === 0 ? 'Passive' : 'Active',
          suitability: 'Good for communication',
          luckyForUser: sum === 6 || sum === 9,
          recommendation: 'Favorable number for business',
          betterNumbers: [],
        },
      });

      return analysis;
    },

    // Calculate numerology compatibility
    calculateNumerologyCompatibility: async (
      _: any,
      { user2Id }: any,
      context: Context
    ) => {
      if (!context.userId) throw new Error('Authentication required');

      const user1Chart = await context.prisma.numerologyChart.findFirst({
        where: { userId: context.userId },
        orderBy: { createdAt: 'desc' },
      });

      const user2Chart = await context.prisma.numerologyChart.findFirst({
        where: { userId: user2Id },
        orderBy: { createdAt: 'desc' },
      });

      if (!user1Chart || !user2Chart) {
        throw new Error('Both users must have numerology charts');
      }

      // Simple compatibility calculation
      const lifePathDiff = Math.abs(user1Chart.lifePathNumber - user2Chart.lifePathNumber);
      const score = 100 - (lifePathDiff * 10);

      const compatibility = await context.prisma.numerologyCompatibility.create({
        data: {
          user1Id: context.userId,
          user2Id,
          user1LifePath: user1Chart.lifePathNumber,
          user2LifePath: user2Chart.lifePathNumber,
          user1Destiny: user1Chart.destinyNumber,
          user2Destiny: user2Chart.destinyNumber,
          lifePathCompatibility: score,
          destinyCompatibility: 75,
          soulUrgeCompatibility: 80,
          overallCompatibility: score,
          compatibilityLevel: score >= 80 ? 'Excellent' : 'Good',
          strengths: ['Good communication', 'Shared values'],
          challenges: ['Different pace of life'],
          recommendations: ['Focus on understanding', 'Practice patience'],
          harmoniousAreas: ['Spirituality', 'Creativity'],
          conflictAreas: [],
          relationshipPotential: 'High',
        },
      });

      return compatibility;
    },
  },
};
