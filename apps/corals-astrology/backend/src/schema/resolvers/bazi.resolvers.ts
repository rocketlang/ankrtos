// Chinese BaZi resolvers stub
import { Context } from '../context';

export const baziResolvers = {
  Query: {
    myBaziChart: async (_: any, __: any, context: Context) => {
      if (!context.userId) throw new Error('Authentication required');
      return context.prisma.baZiChart.findFirst({
        where: { userId: context.userId },
        orderBy: { createdAt: 'desc' },
      });
    },
  },
  Mutation: {},
};
