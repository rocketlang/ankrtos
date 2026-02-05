// Vedic Astrology resolvers stub
import { Context } from '../context';

export const vedicResolvers = {
  Query: {
    myKundli: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');
      return context.prisma.birthChart.findFirst({
        where: { userId: context.userId },
      });
    },
  },
  Mutation: {},
  Subscription: {},
};
