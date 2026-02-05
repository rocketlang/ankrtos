import { builder } from '../builder.js';
import { regulationLookupService } from '../../services/compliance/regulation-lookup.service.js';

// Enums
const RegulationCategory = builder.enumType('RegulationCategory', {
  values: ['SOLAS', 'MARPOL', 'MLC', 'ISM', 'ISPS', 'STCW', 'COLREG', 'general'] as const,
});

// Types
const RegulationSource = builder.objectRef<{
  regulation: string;
  article: string;
  text: string;
  url?: string;
}>('RegulationSource');

RegulationSource.implement({
  fields: (t) => ({
    regulation: t.exposeString('regulation'),
    article: t.exposeString('article'),
    text: t.exposeString('text'),
    url: t.exposeString('url', { nullable: true }),
  }),
});

const RegulationAnswer = builder.objectRef<{
  question: string;
  answer: string;
  category: string;
  sources: any[];
  relatedQuestions: string[];
  confidence: number;
  timestamp: Date;
}>('RegulationAnswer');

RegulationAnswer.implement({
  fields: (t) => ({
    question: t.exposeString('question'),
    answer: t.exposeString('answer'),
    category: t.exposeString('category'),
    sources: t.field({
      type: [RegulationSource],
      resolve: (parent) => parent.sources,
    }),
    relatedQuestions: t.exposeStringList('relatedQuestions'),
    confidence: t.exposeFloat('confidence'),
    timestamp: t.field({
      type: 'DateTime',
      resolve: (parent) => parent.timestamp,
    }),
  }),
});

const RegulationSearchResult = builder.objectRef<{
  id: string;
  regulation: string;
  title: string;
  excerpt: string;
  relevance: number;
}>('RegulationSearchResult');

RegulationSearchResult.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    regulation: t.exposeString('regulation'),
    title: t.exposeString('title'),
    excerpt: t.exposeString('excerpt'),
    relevance: t.exposeFloat('relevance'),
  }),
});

// Queries
builder.queryField('askRegulationQuestion', (t) =>
  t.field({
    type: RegulationAnswer,
    args: {
      question: t.arg.string({ required: true }),
      category: t.arg({ type: RegulationCategory }),
      vesselType: t.arg.string(),
      flagState: t.arg.string(),
    },
    resolve: async (_root, args, ctx) => {
      const user = ctx.request.user;
      if (!user) throw new Error('Not authenticated');

      const answer = await regulationLookupService.answerQuestion(
        {
          question: args.question,
          category: args.category || undefined,
          vesselType: args.vesselType || undefined,
          flagState: args.flagState || undefined,
        },
        user.organizationId
      );

      return answer;
    },
  })
);

builder.queryField('searchRegulations', (t) =>
  t.field({
    type: [RegulationSearchResult],
    args: {
      keyword: t.arg.string({ required: true }),
      category: t.arg({ type: RegulationCategory }),
    },
    resolve: async (_root, args, ctx) => {
      const user = ctx.request.user;
      if (!user) throw new Error('Not authenticated');

      const results = await regulationLookupService.searchRegulations(
        args.keyword,
        args.category || undefined,
        user.organizationId
      );

      return results;
    },
  })
);
