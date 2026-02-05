import { builder } from '../builder.js';
import { cpClauseRecommenderService } from '../../services/chartering/cp-clause-recommender.service.js';

// Types
const RecommendedClausePrecedent = builder.objectRef<{
  documentId: string;
  title: string;
  excerpt: string;
}>('RecommendedClausePrecedent');

RecommendedClausePrecedent.implement({
  fields: (t) => ({
    documentId: t.exposeID('documentId'),
    title: t.exposeString('title'),
    excerpt: t.exposeString('excerpt'),
  }),
});

const RecommendedClause = builder.objectRef<{
  clauseType: string;
  title: string;
  text: string;
  reasoning: string;
  confidence: number;
  precedents: any[];
  tags: string[];
}>('RecommendedClause');

RecommendedClause.implement({
  fields: (t) => ({
    clauseType: t.exposeString('clauseType'),
    title: t.exposeString('title'),
    text: t.exposeString('text'),
    reasoning: t.exposeString('reasoning'),
    confidence: t.exposeFloat('confidence'),
    precedents: t.field({
      type: [RecommendedClausePrecedent],
      resolve: (parent) => parent.precedents,
    }),
    tags: t.exposeStringList('tags'),
  }),
});

const ClauseRecommendationResult = builder.objectRef<{
  recommendations: any[];
  totalRecommendations: number;
  queryContext: string;
  timestamp: Date;
}>('ClauseRecommendationResult');

ClauseRecommendationResult.implement({
  fields: (t) => ({
    recommendations: t.field({
      type: [RecommendedClause],
      resolve: (parent) => parent.recommendations,
    }),
    totalRecommendations: t.exposeInt('totalRecommendations'),
    queryContext: t.exposeString('queryContext'),
    timestamp: t.field({
      type: 'DateTime',
      resolve: (parent) => parent.timestamp,
    }),
  }),
});

// Queries
builder.queryField('recommendCPClauses', (t) =>
  t.field({
    type: ClauseRecommendationResult,
    args: {
      cargoType: t.arg.string({ required: true }),
      cargoQuantity: t.arg.float(),
      loadPort: t.arg.string({ required: true }),
      dischargePort: t.arg.string({ required: true }),
      vesselType: t.arg.string(),
      vesselDwt: t.arg.float(),
      laycanStart: t.arg({ type: 'DateTime' }),
      laycanEnd: t.arg({ type: 'DateTime' }),
      additionalRequirements: t.arg.string(),
    },
    resolve: async (_root, args, ctx) => {
      const user = ctx.request.user;
      if (!user) throw new Error('Not authenticated');

      const result = await cpClauseRecommenderService.recommendClauses(
        {
          cargoType: args.cargoType,
          cargoQuantity: args.cargoQuantity || undefined,
          loadPort: args.loadPort,
          dischargePort: args.dischargePort,
          vesselType: args.vesselType || undefined,
          vesselDwt: args.vesselDwt || undefined,
          laycanStart: args.laycanStart || undefined,
          laycanEnd: args.laycanEnd || undefined,
          additionalRequirements: args.additionalRequirements || undefined,
        },
        user.organizationId
      );

      return result;
    },
  })
);

builder.queryField('getCPClauseByType', (t) =>
  t.field({
    type: RecommendedClause,
    nullable: true,
    args: {
      clauseType: t.arg.string({ required: true }),
      cargoType: t.arg.string({ required: true }),
      loadPort: t.arg.string({ required: true }),
      dischargePort: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = ctx.request.user;
      if (!user) throw new Error('Not authenticated');

      const clause = await cpClauseRecommenderService.getClauseByType(
        args.clauseType,
        {
          cargoType: args.cargoType,
          loadPort: args.loadPort,
          dischargePort: args.dischargePort,
        },
        user.organizationId
      );

      return clause;
    },
  })
);
