import { Context } from './context';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateKundli } from '../lib/vedic-engine';
import { generateLalKitabKundli } from '../lib/lal-kitab-engine';
import aiReadingService from '../lib/ai-reading-service';

export const resolvers = {
  Query: {
    // ==================== AUTH ====================
    me: async (_: any, __: any, context: Context) => {
      if (!context.userId) return null;
      return context.prisma.user.findUnique({
        where: { id: context.userId },
      });
    },

    // ==================== HOROSCOPES ====================
    dailyHoroscope: async (_: any, { zodiacSign }: any, context: Context) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let horoscope = await context.prisma.horoscope.findFirst({
        where: {
          zodiacSign,
          period: 'DAILY',
          date: today,
        },
      });

      // Generate if not exists
      if (!horoscope) {
        const aiHoroscope = await aiReadingService.generateAIHoroscope(
          zodiacSign,
          'daily',
          today
        );

        horoscope = await context.prisma.horoscope.create({
          data: {
            zodiacSign,
            period: 'DAILY',
            date: today,
            overview: aiHoroscope.overview,
            love: aiHoroscope.love,
            career: aiHoroscope.career,
            finance: aiHoroscope.finance,
            health: aiHoroscope.health,
            lucky: aiHoroscope.lucky,
            loveRating: aiHoroscope.ratings.love,
            careerRating: aiHoroscope.ratings.career,
            financeRating: aiHoroscope.ratings.finance,
            healthRating: aiHoroscope.ratings.health,
            isAiGenerated: true,
            isPublished: true,
            publishedAt: new Date(),
          },
        });
      }

      return horoscope;
    },

    weeklyHoroscope: async (_: any, { zodiacSign }: any, context: Context) => {
      // Similar logic for weekly
      return null; // Placeholder
    },

    monthlyHoroscope: async (_: any, { zodiacSign }: any, context: Context) => {
      // Similar logic for monthly
      return null; // Placeholder
    },

    yearlyHoroscope: async (_: any, { zodiacSign }: any, context: Context) => {
      // Similar logic for yearly
      return null; // Placeholder
    },

    // ==================== KUNDLI ====================
    myKundli: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      return context.prisma.kundli.findUnique({
        where: { userId: context.userId },
      });
    },

    getKundli: async (_: any, { userId }: any, context: Context) => {
      return context.prisma.kundli.findUnique({
        where: { userId },
      });
    },

    // ==================== PANCHANG ====================
    todayPanchang: async (_: any, { lat, lng }: any, context: Context) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if exists
      let panchang = await context.prisma.panchang.findUnique({
        where: { date: today },
      });

      if (!panchang) {
        // Generate panchang (placeholder - needs full implementation)
        panchang = await context.prisma.panchang.create({
          data: {
            date: today,
            latitude: lat,
            longitude: lng,
            timezone: 'Asia/Kolkata',
            tithi: 'Pratipada',
            tithiStart: '06:00',
            tithiEnd: '06:30',
            nakshatra: 'Ashwini',
            nakshatraLord: 'KETU',
            nakshatraStart: '00:00',
            nakshatraEnd: '23:59',
            yoga: 'Vishkumbha',
            yogaStart: '00:00',
            yogaEnd: '23:59',
            karana: 'Bava',
            karanaStart: '06:00',
            karanaEnd: '18:00',
            weekDay: 'Tuesday',
            weekDayLord: 'MARS',
            sunrise: '06:30',
            sunset: '18:30',
            moonrise: '19:00',
            moonset: '07:00',
            moonSign: 'ARIES',
            rahuKaal: { start: '15:00', end: '16:30' },
            festivals: [],
            fastingDays: [],
            paksha: 'Shukla',
            ritu: 'Vasanta',
          },
        });
      }

      return panchang;
    },

    getPanchang: async (_: any, { date, lat, lng }: any, context: Context) => {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      return context.prisma.panchang.findUnique({
        where: { date: targetDate },
      });
    },

    // ==================== ASTROLOGERS ====================
    astrologers: async (
      _: any,
      { specialization, language }: any,
      context: Context
    ) => {
      return context.prisma.astrologer.findMany({
        where: {
          isActive: true,
          ...(specialization && { specializations: { has: specialization } }),
          ...(language && { languages: { has: language } }),
        },
        orderBy: { rating: 'desc' },
      });
    },

    astrologer: async (_: any, { id }: any, context: Context) => {
      return context.prisma.astrologer.findUnique({
        where: { id },
      });
    },

    // ==================== PREDICTIONS ====================
    myPredictions: async (_: any, { type }: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      return context.prisma.prediction.findMany({
        where: {
          userId: context.userId,
          ...(type && { type }),
        },
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Mutation: {
    // ==================== AUTH ====================
    signUp: async (_: any, { input }: any, context: Context) => {
      const { email, password, firstName, lastName, phone } = input;

      // Check if user exists
      const existingUser = await context.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await context.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: 'USER',
        },
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return { token, user };
    },

    login: async (_: any, { input }: any, context: Context) => {
      const { email, password } = input;

      // Find user
      const user = await context.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await context.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return { token, user };
    },

    // ==================== PROFILE ====================
    updateProfile: async (_: any, args: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      return context.prisma.user.update({
        where: { id: context.userId },
        data: {
          ...(args.firstName && { firstName: args.firstName }),
          ...(args.lastName && { lastName: args.lastName }),
          ...(args.phone && { phone: args.phone }),
          ...(args.birthDate && { birthDate: new Date(args.birthDate) }),
          ...(args.birthTime && { birthTime: args.birthTime }),
          ...(args.birthPlace && { birthPlace: args.birthPlace }),
          ...(args.birthLat && { birthLat: args.birthLat }),
          ...(args.birthLng && { birthLng: args.birthLng }),
        },
      });
    },

    // ==================== KUNDLI ====================
    generateKundli: async (_: any, { input }: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      // Generate Kundli using Vedic engine
      const kundliData = await generateKundli({
        birthDate: new Date(input.birthDate),
        birthTime: input.birthTime,
        birthPlace: input.birthPlace,
        birthLat: input.birthLat,
        birthLng: input.birthLng,
        timezone: input.timezone || 'Asia/Kolkata',
        ayanamsa: input.ayanamsa || 'LAHIRI',
      });

      // Save to database
      const kundli = await context.prisma.kundli.upsert({
        where: { userId: context.userId },
        create: {
          userId: context.userId,
          birthDate: new Date(input.birthDate),
          birthTime: input.birthTime,
          birthPlace: input.birthPlace,
          birthLat: input.birthLat,
          birthLng: input.birthLng,
          timezone: input.timezone || 'Asia/Kolkata',
          ayanamsa: input.ayanamsa || 'LAHIRI',
          rashiChart: kundliData.planets,
          d1: kundliData.charts.d1,
          d9: kundliData.charts.d9,
          d10: kundliData.charts.d10,
          planets: kundliData.planets,
          birthNakshatra: kundliData.nakshatras.birth,
          birthPada: kundliData.nakshatras.birthPada,
          moonNakshatra: kundliData.nakshatras.moon,
          moonPada: kundliData.nakshatras.moonPada,
          lagna: kundliData.ascendant.sign,
          lagnaLord: kundliData.ascendant.lord,
          yogas: kundliData.yogas,
          mangalDosha: kundliData.doshas.mangalDosha,
          kalSarpaDosha: kundliData.doshas.kalSarpaDosha,
          houseLords: kundliData.houseLords,
          currentDasha: kundliData.currentDasha,
          dashas: kundliData.dashas,
          tithi: 'Pratipada', // Placeholder
          yoga: 'Vishkumbha', // Placeholder
          karana: 'Bava', // Placeholder
        },
        update: {
          birthDate: new Date(input.birthDate),
          birthTime: input.birthTime,
          birthPlace: input.birthPlace,
          birthLat: input.birthLat,
          birthLng: input.birthLng,
          rashiChart: kundliData.planets,
          planets: kundliData.planets,
          yogas: kundliData.yogas,
          dashas: kundliData.dashas,
        },
      });

      return kundli;
    },

    regenerateKundli: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');

      const user = await context.prisma.user.findUnique({
        where: { id: context.userId },
      });

      if (!user?.birthDate || !user.birthTime || !user.birthLat || !user.birthLng) {
        throw new Error('Birth details not found. Please update your profile first.');
      }

      // Use generateKundli mutation
      return null; // Placeholder
    },
  },
};
