/**
 * RBAC Guard — permission checking utilities
 */

import type { AuthContext, UserRole } from './types';
import { ROLE_PERMISSIONS } from './types';

/**
 * Check if auth context has a specific permission.
 * Permissions follow the pattern: `query:domain`, `mutation:domain:action`, `subscription:*`
 */
export function hasPermission(authContext: AuthContext, permission: string): boolean {
  if (!authContext.isAuthenticated || !authContext.user) return false;

  for (const role of authContext.user.roles) {
    const perms = ROLE_PERMISSIONS[role];
    if (!perms) continue;

    for (const perm of perms) {
      if (perm === '*') return true;
      if (perm === permission) return true;
      // Wildcard match: `mutation:container:*` matches `mutation:container:gateIn`
      if (perm.endsWith(':*') && permission.startsWith(perm.slice(0, -1))) return true;
    }
  }
  return false;
}

/**
 * Throw if not authenticated
 */
export function requireAuth(authContext: AuthContext): void {
  if (!authContext.isAuthenticated) {
    throw new Error('Authentication required');
  }
}

/**
 * Throw if user doesn't have at least one of the specified roles
 */
export function requireRole(authContext: AuthContext, ...roles: UserRole[]): void {
  requireAuth(authContext);
  const userRoles = authContext.user!.roles;
  if (!userRoles.some(r => roles.includes(r))) {
    throw new Error(`Required role: ${roles.join(' or ')}`);
  }
}

/**
 * Throw if user doesn't have access to the specified facility.
 * Admins have access to all facilities.
 */
export function requireFacilityAccess(authContext: AuthContext, facilityId: string): void {
  requireAuth(authContext);
  const user = authContext.user!;
  if (user.roles.includes('admin')) return;
  if (!user.facilityIds.includes(facilityId)) {
    throw new Error('Access denied: no permission for this facility');
  }
}
