/**
 * Auto-Matching GraphQL Schema
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { builder } from '../builder';
import { autoMatchingService } from '../../services/ai/auto-matching.service';

// Input Types
const MatchingFiltersInput = builder.inputType('MatchingFilters', {
  fields: (t) => ({
    vesselTypes: t.stringList(),
    dwtMin: t.float(),
    dwtMax: t.float(),
    builtAfter: t.int(),
    geared: t.boolean(),
    maxDistance: t.float(),
  }),
});

const MatchingRequestInput = builder.inputType('MatchingRequest', {
  fields: (t) => ({
    cargoEnquiryId: t.string({ required: true }),
    filters: t.field({ type: MatchingFiltersInput }),
    maxResults: t.int(),
  }),
});

// Object Types
const MatchType = builder.objectType('Match', {
  fields: (t) => ({
    matchId: t.exposeString('matchId'),
    vesselName: t.exposeString('vesselName'),
    overallScore: t.exposeFloat('overallScore'),
    estimatedTCE: t.exposeFloat('estimatedTCE'),
    status: t.exposeString('status'),
  }),
});

// Queries
builder.queryField('getMatches', (t) =>
  t.field({
    type: [MatchType],
    args: { cargoEnquiryId: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) throw new Error('Unauthorized');
      return autoMatchingService.getMatches(args.cargoEnquiryId, ctx.user.organizationId);
    },
  })
);
