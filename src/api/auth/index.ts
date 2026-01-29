export type { AuthUser, AuthConfig, AuthContext, UserRole } from './types';
export { ROLE_PERMISSIONS } from './types';
export { verifyJWT, signJWT } from './jwt';
export type { JWTPayload } from './jwt';
export { default as authPlugin } from './plugin';
export { hasPermission, requireAuth, requireRole, requireFacilityAccess } from './guard';
