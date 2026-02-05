import { builder } from './builder.js';

// Root query type — must have at least one field (defined before types)
builder.queryType({
  fields: (t) => ({
    health: t.string({ resolve: () => 'ankr-maritime OK' }),
  }),
});

// Root mutation type — placeholder (defined before types)
builder.mutationType({
  fields: (t) => ({
    _ping: t.string({ resolve: () => 'pong' }),
  }),
});

// Root subscription type — Required for subscriptionField definitions
builder.subscriptionType({});

// Register all types (side-effect imports) - AFTER root types are defined
import './types/index.js';

// Register subscriptions for real-time features
// TEMPORARILY DISABLED - can re-enable if needed
// import './subscriptions.js';

export const schema = builder.toSchema();
