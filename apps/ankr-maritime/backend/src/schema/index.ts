import { builder } from './builder.js';

// Register all types (side-effect imports)
import './types/index.js';

// Register subscriptions for real-time features
// TEMPORARILY DISABLED - causes duplicate Subscription type error
// TODO: Fix import order - subscriptionType() must be called before subscriptionField()
// import './subscriptions.js';

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

// Root subscription type - TEMPORARILY DISABLED
// builder.subscriptionType({}); // Disabled with subscriptions.js

export const schema = builder.toSchema();
