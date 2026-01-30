import { builder } from './builder.js';

// Register all types (side-effect imports)
import './types/index.js';

// Root query type — must have at least one field
builder.queryType({
  fields: (t) => ({
    health: t.string({ resolve: () => 'ankr-maritime OK' }),
  }),
});

// Root mutation type — placeholder
builder.mutationType({
  fields: (t) => ({
    _ping: t.string({ resolve: () => 'pong' }),
  }),
});

export const schema = builder.toSchema();
