// =============================================================================
// ankrICD - API Module Exports
// =============================================================================

export { typeDefs } from './schema/typeDefs';
export { resolvers } from './resolvers';
export {
  buildICDServer,
  startICDServer,
  type ICDServerOptions,
} from './server';

// Auth
export {
  authPlugin,
  verifyJWT,
  signJWT,
  hasPermission,
  requireAuth,
  requireRole,
  requireFacilityAccess,
  ROLE_PERMISSIONS,
  type AuthUser,
  type AuthConfig,
  type AuthContext,
  type UserRole,
  type JWTPayload,
} from './auth';

// Subscriptions
export {
  SUBSCRIPTION_TOPICS,
  subscriptionResolvers,
  initEventBridge,
  type SubscriptionTopic,
} from './subscriptions';
