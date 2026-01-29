export type UserRole = 'admin' | 'operator' | 'viewer' | 'customs_officer' | 'billing_clerk';

export interface AuthUser {
  sub: string;
  tenantId: string;
  email: string;
  name: string;
  roles: UserRole[];
  facilityIds: string[];
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'],
  operator: [
    'query:*',
    'mutation:container:*', 'mutation:gate:*', 'mutation:rail:*',
    'mutation:yard:*', 'mutation:waterfront:*', 'mutation:equipment:*',
    'mutation:operations:*',
    'subscription:*',
  ],
  viewer: ['query:*', 'subscription:*'],
  customs_officer: [
    'query:*',
    'mutation:customs:*', 'mutation:container:placeHold', 'mutation:container:releaseHold',
    'subscription:*',
  ],
  billing_clerk: ['query:*', 'mutation:billing:*', 'subscription:*'],
};

export function decodeJWT(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return {
      sub: payload.sub,
      tenantId: payload.tenantId ?? 'default',
      email: payload.email ?? '',
      name: payload.name ?? '',
      roles: payload.roles ?? ['viewer'],
      facilityIds: payload.facilityIds ?? [],
    };
  } catch {
    return null;
  }
}

export function hasPermission(roles: UserRole[], permission: string): boolean {
  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role] ?? [];
    for (const p of perms) {
      if (p === '*') return true;
      if (p === permission) return true;
      if (p.endsWith(':*') && permission.startsWith(p.slice(0, -1))) return true;
    }
  }
  return false;
}

export function hasRole(roles: UserRole[], role: UserRole): boolean {
  return roles.includes(role) || roles.includes('admin');
}
