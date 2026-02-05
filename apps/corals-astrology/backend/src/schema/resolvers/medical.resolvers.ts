// Medical Astrology resolvers stub
import { Context } from '../context';

export const medicalResolvers = {
  Query: {
    myMedicalChart: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');
      return context.prisma.medicalAstroChart.findFirst({
        where: { userId: context.userId },
        orderBy: { createdAt: 'desc' },
      });
    },
  },
  Mutation: {},
};
