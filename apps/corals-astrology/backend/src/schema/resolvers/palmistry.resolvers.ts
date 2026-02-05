// =====================================================
// PALMISTRY (CHIROMANCY) RESOLVERS
// Complete Palm Reading GraphQL API
// =====================================================

import { Context } from '../context';
import palmistryEngine, {
  HAND_SHAPES,
  MOUNT_INTERPRETATIONS,
  FINGER_MEANINGS,
  MINOR_LINES,
  generatePalmReading
} from '../../lib/palmistry-engine';

export const palmistryResolvers = {
  Query: {
    // ==================== QUERY: HAND SHAPE INFO ====================
    handShapeInfo: async (_: any, { shapeType }: { shapeType: string }) => {
      const shape = HAND_SHAPES[shapeType];
      if (!shape) throw new Error('Invalid hand shape type');
      return shape;
    },

    allHandShapes: async () => {
      console.log('allHandShapes called');
      console.log('HAND_SHAPES:', HAND_SHAPES);
      const shapes = Object.values(HAND_SHAPES);
      console.log('Shapes array:', shapes);
      console.log('Shapes length:', shapes.length);
      return shapes;
    },

    // ==================== QUERY: MOUNT INFO ====================
    mountInfo: async (_: any, { mountName }: { mountName: string }) => {
      const mount = MOUNT_INTERPRETATIONS[mountName];
      if (!mount) throw new Error('Invalid mount name');
      return mount;
    },

    allMounts: async () => {
      return Object.entries(MOUNT_INTERPRETATIONS).map(([name, data]) => ({
        name,
        ...data
      }));
    },

    // ==================== QUERY: FINGER INFO ====================
    fingerInfo: async (_: any, { fingerName }: { fingerName: string }) => {
      const finger = FINGER_MEANINGS[fingerName];
      if (!finger) throw new Error('Invalid finger name');
      return finger;
    },

    allFingers: async () => {
      return Object.entries(FINGER_MEANINGS).map(([name, data]) => ({
        name,
        ...data
      }));
    },

    // ==================== QUERY: MINOR LINE INFO ====================
    minorLineInfo: async (_: any, { lineName }: { lineName: string }) => {
      const line = MINOR_LINES[lineName];
      if (!line) throw new Error('Invalid line name');
      return line;
    },

    allMinorLines: async () => {
      return Object.values(MINOR_LINES);
    },

    // ==================== QUERY: MY PALM READINGS ====================
    myPalmReadings: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Not authenticated');

      return context.prisma.palmReading.findMany({
        where: { userId: context.userId },
        include: {
          lineAnalyses: true,
          mountAnalyses: true,
          fingerAnalyses: true,
          markings: true,
          remedies: true,
          imageUpload: true
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    palmReading: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.userId) throw new Error('Not authenticated');

      const reading = await context.prisma.palmReading.findUnique({
        where: { id },
        include: {
          lineAnalyses: true,
          mountAnalyses: true,
          fingerAnalyses: true,
          markings: true,
          remedies: true,
          imageUpload: true
        }
      });

      if (!reading || reading.userId !== context.userId) {
        throw new Error('Reading not found');
      }

      return reading;
    },

    // ==================== QUERY: HAND LINE ANALYSES ====================
    myHandLineAnalyses: async (_: any, { lineName }: { lineName?: string }, context: Context) => {
      if (!context.userId) throw new Error('Not authenticated');

      return context.prisma.handLineAnalysis.findMany({
        where: {
          userId: context.userId,
          ...(lineName && { lineName })
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    // ==================== QUERY: MOUNT ANALYSES ====================
    myMountAnalyses: async (_: any, { mountName }: { mountName?: string }, context: Context) => {
      if (!context.userId) throw new Error('Not authenticated');

      return context.prisma.mountAnalysis.findMany({
        where: {
          userId: context.userId,
          ...(mountName && { mountName })
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    // ==================== QUERY: FINGER ANALYSES ====================
    myFingerAnalyses: async (_: any, { fingerName }: { fingerName?: string }, context: Context) => {
      if (!context.userId) throw new Error('Not authenticated');

      return context.prisma.fingerAnalysis.findMany({
        where: {
          userId: context.userId,
          ...(fingerName && { fingerName })
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    // ==================== QUERY: PALM MARKINGS ====================
    myPalmMarkings: async (_: any, { markingType }: { markingType?: string }, context: Context) => {
      if (!context.userId) throw new Error('Not authenticated');

      return context.prisma.palmMarking.findMany({
        where: {
          userId: context.userId,
          ...(markingType && { markingType })
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    // ==================== QUERY: PALM COMPATIBILITY ====================
    myPalmCompatibility: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Not authenticated');

      return context.prisma.palmCompatibility.findMany({
        where: { userId: context.userId },
        orderBy: { createdAt: 'desc' }
      });
    },

    // ==================== QUERY: PALM REMEDIES ====================
    myPalmRemedies: async (_: any, { area }: { area?: string }, context: Context) => {
      if (!context.userId) throw new Error('Not authenticated');

      return context.prisma.palmRemedy.findMany({
        where: {
          userId: context.userId,
          ...(area && { area })
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    activePalmRemedies: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Not authenticated');

      return context.prisma.palmRemedy.findMany({
        where: {
          userId: context.userId,
          completed: false
        },
        orderBy: { started: 'desc' }
      });
    },

    // ==================== QUERY: PALM IMAGE UPLOADS ====================
    myPalmImages: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Not authenticated');

      return context.prisma.palmImageUpload.findMany({
        where: { userId: context.userId },
        include: { palmReading: true },
        orderBy: { createdAt: 'desc' }
      });
    }
  },

  Mutation: {
    // ==================== MUTATION: GENERATE PALM READING ====================
    generatePalmReading: async (
      _: any,
      {
        handShapeType,
        dominantHand,
        lineData,
        mountData,
        fingerData,
        minorLines
      }: {
        handShapeType: 'earth' | 'air' | 'water' | 'fire';
        dominantHand: 'left' | 'right';
        lineData: any;
        mountData: Record<string, string>;
        fingerData: Record<string, any>;
        minorLines?: any;
      },
      context: Context
    ) => {
      if (!context.userId) throw new Error('Not authenticated');

      // Generate palm reading using engine
      const reading = generatePalmReading(
        handShapeType,
        dominantHand,
        lineData,
        mountData,
        fingerData,
        minorLines
      );

      // Save to database
      const saved = await context.prisma.palmReading.create({
        data: {
          userId: context.userId,
          dominantHand: reading.dominantHand,
          handShape: reading.handShape.type,
          handElement: reading.handShape.element,
          handCharacteristics: reading.handShape.characteristics,
          handPersonality: reading.handShape.personality,
          handCareerSuggestions: reading.handShape.career,
          handRelationships: reading.handShape.relationships,

          // Major lines as JSON
          heartLine: reading.heartLine as any,
          headLine: reading.headLine as any,
          lifeLine: reading.lifeLine as any,
          fateLine: reading.fateLine as any,

          // Mounts as JSON
          mountOfJupiter: reading.mountOfJupiter as any,
          mountOfSaturn: reading.mountOfSaturn as any,
          mountOfApollo: reading.mountOfApollo as any,
          mountOfMercury: reading.mountOfMercury as any,
          mountOfMars: reading.mountOfMars as any,
          mountOfVenus: reading.mountOfVenus as any,
          mountOfMoon: reading.mountOfMoon as any,

          // Fingers as JSON
          thumbAnalysis: reading.thumbAnalysis as any,
          jupiterFinger: reading.jupiterFinger as any,
          saturnFinger: reading.saturnFinger as any,
          apolloFinger: reading.apolloFinger as any,
          mercuryFinger: reading.mercuryFinger as any,

          // Minor lines
          hasSunLine: minorLines?.sunLine || false,
          hasMercuryLine: minorLines?.mercuryLine || false,
          hasIntuitionLine: minorLines?.intuitionLine || false,
          marriageLineCount: minorLines?.marriageLineCount || 0,
          travelLineCount: minorLines?.travelLineCount || 0,

          // Overall analysis
          overallPersonality: reading.overallPersonality,
          strengths: reading.strengths,
          weaknesses: reading.weaknesses,
          careerSuggestions: reading.careerSuggestions,
          healthIndications: reading.healthIndications,
          relationshipAnalysis: reading.relationshipAnalysis,
          wealthPotential: reading.wealthPotential,
          lifeExpectancy: reading.lifeExpectancy,

          // Planetary
          planetaryInfluences: reading.planetaryInfluences as any,
          dominantPlanet: reading.dominantPlanet,
          weakestPlanet: reading.weakestPlanet,
          overallBalance: reading.overallBalance,

          // Remedies
          remedies: reading.remedies as any
        },
        include: {
          lineAnalyses: true,
          mountAnalyses: true,
          fingerAnalyses: true,
          markings: true,
          remedies: true
        }
      });

      return saved;
    },

    // ==================== MUTATION: CREATE HAND LINE ANALYSIS ====================
    createHandLineAnalysis: async (
      _: any,
      {
        palmReadingId,
        lineName,
        quality,
        length,
        direction
      }: {
        palmReadingId?: string;
        lineName: string;
        quality: string;
        length: string;
        direction?: string;
      },
      context: Context
    ) => {
      if (!context.userId) throw new Error('Not authenticated');

      // Get interpretation from engine
      const lineType = ['heart', 'head', 'life', 'fate'].includes(lineName) ? 'major' : 'minor';

      return context.prisma.handLineAnalysis.create({
        data: {
          userId: context.userId,
          palmReadingId,
          lineName,
          lineType,
          quality,
          length,
          direction,
          meaning: 'Line analysis generated',
          positiveTraits: [],
          negativeTraits: [],
          lifeAreas: [],
          criticalPeriods: [],
          opportunities: [],
          challenges: [],
          remedies: [],
          gemstones: [],
          mantras: []
        }
      });
    },

    // ==================== MUTATION: CREATE MOUNT ANALYSIS ====================
    createMountAnalysis: async (
      _: any,
      {
        palmReadingId,
        mountName,
        development,
        size
      }: {
        palmReadingId?: string;
        mountName: string;
        development: string;
        size: number;
      },
      context: Context
    ) => {
      if (!context.userId) throw new Error('Not authenticated');

      const mountInfo = MOUNT_INTERPRETATIONS[mountName];
      if (!mountInfo) throw new Error('Invalid mount name');

      const devData = mountInfo[development] || mountInfo.wellDeveloped;

      return context.prisma.mountAnalysis.create({
        data: {
          userId: context.userId,
          palmReadingId,
          mountName,
          planet: mountInfo.planet,
          location: mountInfo.location,
          development,
          size,
          firmness: 'normal',
          meaning: devData.meaning,
          characteristics: devData.characteristics || [],
          career: devData.career || [],
          weaknesses: devData.weaknesses || [],
          planetaryStrength: size * 10,
          planetaryImpact: devData.meaning,
          remedies: [],
          gemstone: '',
          mantra: '',
          color: '',
          favorableDay: ''
        }
      });
    },

    // ==================== MUTATION: CREATE FINGER ANALYSIS ====================
    createFingerAnalysis: async (
      _: any,
      {
        palmReadingId,
        fingerName,
        length,
        flexibility
      }: {
        palmReadingId?: string;
        fingerName: string;
        length: string;
        flexibility?: string;
      },
      context: Context
    ) => {
      if (!context.userId) throw new Error('Not authenticated');

      const fingerInfo = FINGER_MEANINGS[fingerName];
      if (!fingerInfo) throw new Error('Invalid finger name');

      const lengthData = fingerInfo[length] || fingerInfo.long;

      return context.prisma.fingerAnalysis.create({
        data: {
          userId: context.userId,
          palmReadingId,
          fingerName,
          planet: fingerInfo.planet,
          length,
          relativeLength: length,
          flexibility: flexibility || 'normal',
          topPhalange: 'Mental/spiritual realm',
          topLength: 'medium',
          middlePhalange: 'Practical realm',
          middleLength: 'medium',
          bottomPhalange: 'Material realm',
          bottomLength: 'medium',
          meaning: lengthData.meaning,
          traits: lengthData.traits,
          strengths: [],
          weaknesses: [],
          careerIndications: [],
          personalityImpact: lengthData.meaning
        }
      });
    },

    // ==================== MUTATION: CREATE PALM MARKING ====================
    createPalmMarking: async (
      _: any,
      {
        palmReadingId,
        markingType,
        location,
        onLine,
        onMount,
        isPositive
      }: {
        palmReadingId?: string;
        markingType: string;
        location: string;
        onLine?: string;
        onMount?: string;
        isPositive: boolean;
      },
      context: Context
    ) => {
      if (!context.userId) throw new Error('Not authenticated');

      return context.prisma.palmMarking.create({
        data: {
          userId: context.userId,
          palmReadingId,
          markingType,
          location,
          onLine,
          onMount,
          meaning: `${markingType} marking on ${location}`,
          isPositive,
          significance: 'medium'
        }
      });
    },

    // ==================== MUTATION: CALCULATE PALM COMPATIBILITY ====================
    calculatePalmCompatibility: async (
      _: any,
      {
        partnerHandShape,
        partnerDominantPlanet
      }: {
        partnerHandShape: string;
        partnerDominantPlanet: string;
      },
      context: Context
    ) => {
      if (!context.userId) throw new Error('Not authenticated');

      // Get user's palm reading
      const userReading = await context.prisma.palmReading.findFirst({
        where: { userId: context.userId },
        orderBy: { createdAt: 'desc' }
      });

      if (!userReading) throw new Error('No palm reading found');

      // Calculate compatibility
      const elementCompatibility = calculateElementCompatibility(
        userReading.handShape,
        partnerHandShape
      );

      const planetaryHarmony = calculatePlanetaryHarmony(
        userReading.dominantPlanet,
        partnerDominantPlanet
      );

      const overallScore = Math.round((elementCompatibility + planetaryHarmony) / 2);

      return context.prisma.palmCompatibility.create({
        data: {
          userId: context.userId,
          userHandShape: userReading.handShape,
          userDominantPlanet: userReading.dominantPlanet,
          partnerHandShape,
          partnerDominantPlanet,
          overallScore,
          elementCompatibility: `${elementCompatibility}% compatible`,
          planetaryHarmony,
          emotionalCompatibility: elementCompatibility,
          mentalCompatibility: planetaryHarmony,
          physicalCompatibility: overallScore,
          spiritualCompatibility: overallScore,
          relationshipStrengths: ['Compatible elements', 'Harmonious planets'],
          relationshipChallenges: ['Work on communication'],
          compatibilityAnalysis: `Overall compatibility: ${overallScore}%`,
          recommendations: ['Focus on strengths', 'Work on challenges'],
          areasToWorkOn: ['Communication', 'Understanding']
        }
      });
    },

    // ==================== MUTATION: START PALM REMEDY ====================
    startPalmRemedy: async (
      _: any,
      {
        palmReadingId,
        issue,
        area,
        remedyType,
        gemstone,
        mantra,
        lifestyleChanges
      }: {
        palmReadingId?: string;
        issue: string;
        area: string;
        remedyType: string;
        gemstone?: string;
        mantra?: string;
        lifestyleChanges?: string[];
      },
      context: Context
    ) => {
      if (!context.userId) throw new Error('Not authenticated');

      return context.prisma.palmRemedy.create({
        data: {
          userId: context.userId,
          palmReadingId,
          issue,
          area,
          severity: 'moderate',
          remedyType,
          gemstone,
          mantra,
          lifestyleChanges: lifestyleChanges || [],
          colors: [],
          directions: [],
          started: new Date(),
          completed: false,
          progress: 0
        }
      });
    },

    // ==================== MUTATION: UPDATE REMEDY PROGRESS ====================
    updatePalmRemedyProgress: async (
      _: any,
      {
        id,
        progress,
        notes
      }: {
        id: string;
        progress: number;
        notes?: string;
      },
      context: Context
    ) => {
      if (!context.userId) throw new Error('Not authenticated');

      const remedy = await context.prisma.palmRemedy.findUnique({
        where: { id }
      });

      if (!remedy || remedy.userId !== context.userId) {
        throw new Error('Remedy not found');
      }

      return context.prisma.palmRemedy.update({
        where: { id },
        data: {
          progress,
          notes,
          completed: progress >= 100
        }
      });
    },

    // ==================== MUTATION: UPLOAD PALM IMAGE ====================
    uploadPalmImage: async (
      _: any,
      {
        imageUrl,
        hand,
        imageFormat
      }: {
        imageUrl: string;
        hand: string;
        imageFormat: string;
      },
      context: Context
    ) => {
      if (!context.userId) throw new Error('Not authenticated');

      return context.prisma.palmImageUpload.create({
        data: {
          userId: context.userId,
          imageUrl,
          hand,
          imageFormat,
          fileSize: 0,
          analyzed: false,
          handVisible: true,
          linesVisible: true
        }
      });
    }
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function calculateElementCompatibility(shape1: string, shape2: string): number {
  const compatibility: Record<string, Record<string, number>> = {
    earth: { earth: 90, water: 70, air: 40, fire: 50 },
    air: { air: 90, fire: 80, water: 50, earth: 40 },
    water: { water: 90, earth: 70, fire: 40, air: 50 },
    fire: { fire: 90, air: 80, earth: 50, water: 40 }
  };

  return compatibility[shape1]?.[shape2] || 50;
}

function calculatePlanetaryHarmony(planet1: string, planet2: string): number {
  const harmony: Record<string, string[]> = {
    Sun: ['Moon', 'Mars', 'Jupiter'],
    Moon: ['Sun', 'Mercury', 'Venus'],
    Mars: ['Sun', 'Moon', 'Jupiter'],
    Mercury: ['Sun', 'Venus'],
    Jupiter: ['Sun', 'Moon', 'Mars'],
    Venus: ['Mercury', 'Saturn'],
    Saturn: ['Venus', 'Mercury']
  };

  if (harmony[planet1]?.includes(planet2)) return 80;
  if (planet1 === planet2) return 90;
  return 50;
}

export default palmistryResolvers;
