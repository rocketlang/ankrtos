/**
 * JWT verification and signing — HMAC-SHA256 implementation
 */

import { createHmac } from 'node:crypto';
import type { AuthUser, AuthConfig } from './types';

export interface JWTPayload {
  sub: string;
  tenantId: string;
  email: string;
  name: string;
  roles: string[];
  facilityIds: string[];
  iat: number;
  exp: number;
  iss?: string;
  aud?: string;
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data).toString('base64url');
}

function base64UrlDecode(data: string): string {
  return Buffer.from(data, 'base64url').toString();
}

function hmacSign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

/**
 * Verify a JWT and extract the AuthUser. Returns null if invalid.
 */
export function verifyJWT(token: string, config: AuthConfig): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts as [string, string, string];

    // Verify signature
    const expected = hmacSign(`${header}.${payload}`, config.jwtSecret);
    if (signature !== expected) return null;

    const decoded: JWTPayload = JSON.parse(base64UrlDecode(payload));

    // Verify expiration
    if (decoded.exp && Date.now() / 1000 > decoded.exp) return null;

    // Verify issuer
    if (config.jwtIssuer && decoded.iss !== config.jwtIssuer) return null;

    // Verify audience
    if (config.jwtAudience && decoded.aud !== config.jwtAudience) return null;

    return {
      id: decoded.sub,
      tenantId: decoded.tenantId,
      email: decoded.email,
      name: decoded.name,
      roles: (decoded.roles ?? ['viewer']) as AuthUser['roles'],
      facilityIds: decoded.facilityIds ?? [],
    };
  } catch {
    return null;
  }
}

/**
 * Sign a JWT for a user. Useful for testing and dev token generation.
 */
export function signJWT(user: AuthUser, config: AuthConfig): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    sub: user.id,
    tenantId: user.tenantId,
    email: user.email,
    name: user.name,
    roles: user.roles,
    facilityIds: user.facilityIds,
    iat: now,
    exp: now + 8 * 3600, // 8 hours
    iss: config.jwtIssuer ?? 'ankr-icd',
    aud: config.jwtAudience,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = hmacSign(`${header}.${encodedPayload}`, config.jwtSecret);

  return `${header}.${encodedPayload}.${signature}`;
}
