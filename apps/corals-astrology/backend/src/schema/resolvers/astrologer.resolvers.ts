// Astrologer resolvers stub
import { Context } from '../context';

export const astrologerResolvers = {
  Query: {
    astrologers: async (_: any, __: any, context: Context) => {
      return context.prisma.astrologer.findMany({
        where: { isActive: true },
      });
    },
  },
  Mutation: {},
};
