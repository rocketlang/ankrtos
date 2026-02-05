/**
 * VesselArrival GraphQL Type
 * Minimal implementation to satisfy Prisma relations
 */

import { builder } from '../builder.js';

// Minimal VesselArrival type (stub)
builder.prismaObject('VesselArrival', {
  fields: (t) => ({
    id: t.exposeID('id'),
    vesselId: t.exposeString('vesselId'),
    portId: t.exposeString('portId'),
    status: t.exposeString('status'),
    triggeredAt: t.expose('triggeredAt', { type: 'DateTime' }),
  }),
});
