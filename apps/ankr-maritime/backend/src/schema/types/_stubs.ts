/**
 * GraphQL Type Stubs
 * Minimal implementations to satisfy Prisma relations
 * These can be expanded later with full implementations
 */

import { builder } from '../builder.js';

// PortCongestion stub
builder.prismaObject('PortCongestion', {
  fields: (t) => ({
    id: t.exposeID('id'),
    portId: t.exposeString('portId'),
    status: t.exposeString('status'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

// Add more stubs here only for models that exist in Prisma schema
