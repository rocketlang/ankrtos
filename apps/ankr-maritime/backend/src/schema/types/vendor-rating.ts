import { builder } from '../builder.js';

builder.prismaObject('VendorRating', {
  fields: (t) => ({
    id: t.exposeID('id'),
    companyId: t.exposeString('companyId'),
    userId: t.exposeString('userId'),
    rating: t.exposeInt('rating'),
    category: t.exposeString('category'),
    comment: t.exposeString('comment', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// Average rating object
const VendorAvgRating = builder.objectRef<{
  companyId: string;
  avgRating: number;
  totalRatings: number;
  categories: { category: string; avg: number; count: number }[];
}>('VendorAvgRating');

VendorAvgRating.implement({
  fields: (t) => ({
    companyId: t.exposeString('companyId'),
    avgRating: t.exposeFloat('avgRating'),
    totalRatings: t.exposeInt('totalRatings'),
    categories: t.field({
      type: [VendorCategoryRating],
      resolve: (parent) => parent.categories,
    }),
  }),
});

const VendorCategoryRating = builder.objectRef<{
  category: string;
  avg: number;
  count: number;
}>('VendorCategoryRating');

VendorCategoryRating.implement({
  fields: (t) => ({
    category: t.exposeString('category'),
    avg: t.exposeFloat('avg'),
    count: t.exposeInt('count'),
  }),
});

builder.queryField('vendorRatings', (t) =>
  t.prismaField({
    type: ['VendorRating'],
    args: { companyId: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.vendorRating.findMany({
        ...query,
        where: { companyId: args.companyId },
        orderBy: { createdAt: 'desc' },
      }),
  }),
);

builder.queryField('vendorAvgRating', (t) =>
  t.field({
    type: VendorAvgRating,
    nullable: true,
    args: { companyId: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const ratings = await ctx.prisma.vendorRating.findMany({
        where: { companyId: args.companyId },
      });
      if (ratings.length === 0) return null;

      const avgRating = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;

      // Group by category
      const catMap = new Map<string, { sum: number; count: number }>();
      for (const r of ratings) {
        const existing = catMap.get(r.category) ?? { sum: 0, count: 0 };
        existing.sum += r.rating;
        existing.count += 1;
        catMap.set(r.category, existing);
      }

      const categories = [...catMap.entries()].map(([category, { sum, count }]) => ({
        category,
        avg: sum / count,
        count,
      }));

      return {
        companyId: args.companyId,
        avgRating: Math.round(avgRating * 10) / 10,
        totalRatings: ratings.length,
        categories,
      };
    },
  }),
);

builder.mutationField('addVendorRating', (t) =>
  t.prismaField({
    type: 'VendorRating',
    args: {
      companyId: t.arg.string({ required: true }),
      rating: t.arg.int({ required: true }),
      category: t.arg.string({ required: true }),
      comment: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      if (!ctx.user) throw new Error('Not authenticated');
      if (args.rating < 1 || args.rating > 5) throw new Error('Rating must be 1-5');
      return ctx.prisma.vendorRating.create({
        ...query,
        data: {
          companyId: args.companyId,
          userId: ctx.user.id,
          rating: args.rating,
          category: args.category,
          comment: args.comment ?? undefined,
        },
      });
    },
  }),
);
