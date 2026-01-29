/**
 * Auth types — JWT, RBAC roles, and permission model
 */

export type UserRole = 'admin' | 'operator' | 'viewer' | 'customs_officer' | 'billing_clerk';

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  roles: UserRole[];
  facilityIds: string[];
}

export interface AuthConfig {
  enabled: boolean;
  jwtSecret: string;
  jwtIssuer?: string;
  jwtAudience?: string;
  expiresIn?: string;
}

export interface AuthContext {
  user?: AuthUser;
  tenantId: string;
  isAuthenticated: boolean;
}

/** RBAC permission map — `*` means full access, `domain:*` means all ops in domain */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'],
  operator: [
    'query:*',
    'mutation:container:*',
    'mutation:gate:*',
    'mutation:rail:*',
    'mutation:yard:*',
    'mutation:waterfront:*',
    'mutation:equipment:*',
    'mutation:operations:*',
    'mutation:hardware:*',
    'mutation:iot:*',
    'subscription:*',
  ],
  viewer: [
    'query:*',
    'subscription:*',
  ],
  customs_officer: [
    'query:*',
    'mutation:customs:*',
    'mutation:container:placeHold',
    'mutation:container:releaseHold',
    'subscription:*',
  ],
  billing_clerk: [
    'query:*',
    'mutation:billing:*',
    'subscription:*',
  ],
};
