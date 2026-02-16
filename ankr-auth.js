#!/usr/bin/env bun
/**
 * ANKR Authentication Module
 * JWT-based authentication for dashboard and viewer services
 */

import { createHash, randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const CONFIG_DIR = '/root/.ankr/config';
const USERS_FILE = `${CONFIG_DIR}/users.json`;
const JWT_SECRET = process.env.ANKR_JWT_SECRET || 'ankr-secret-key-change-in-production';
const JWT_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

// Simple JWT implementation using Bun's crypto
function createJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + JWT_EXPIRY;

  const jwtPayload = { ...payload, iat: now, exp };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url');

  const signature = createHash('sha256')
    .update(`${encodedHeader}.${encodedPayload}.${JWT_SECRET}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJWT(token) {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');

    // Verify signature
    const expectedSignature = createHash('sha256')
      .update(`${encodedHeader}.${encodedPayload}.${JWT_SECRET}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }

    // Decode payload
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Hash password using SHA-256
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

// Load users from file
function loadUsers() {
  if (!existsSync(USERS_FILE)) {
    // Create default admin user
    const defaultUsers = {
      admin: {
        username: 'admin',
        password: hashPassword('ankr@admin123'),
        role: 'admin',
        name: 'ANKR Administrator',
        permissions: ['*'], // Admin has access to all services
        created: new Date().toISOString()
      }
    };
    writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
    return defaultUsers;
  }
  return JSON.parse(readFileSync(USERS_FILE, 'utf-8'));
}

// Authenticate user
export function authenticateUser(username, password) {
  const users = loadUsers();
  const user = users[username];

  if (!user) {
    return { success: false, message: 'Invalid username or password' };
  }

  const hashedPassword = hashPassword(password);
  if (user.password !== hashedPassword) {
    return { success: false, message: 'Invalid username or password' };
  }

  // Generate JWT token with permissions
  const token = createJWT({
    username: user.username,
    role: user.role,
    name: user.name,
    permissions: user.permissions || ['*'] // Include permissions in JWT
  });

  return {
    success: true,
    token,
    user: {
      username: user.username,
      name: user.name,
      role: user.role,
      permissions: user.permissions || ['*']
    }
  };
}

// Verify JWT token
export function verifyToken(token) {
  const result = verifyJWT(token);
  if (result.valid) {
    return { valid: true, user: result.payload };
  }
  return result;
}

// Extract token from request headers or cookies
export function extractToken(req) {
  // Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookie
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});

    if (cookies.ankr_token) {
      return cookies.ankr_token;
    }
  }

  return null;
}

// Authentication middleware
export function requireAuth(req) {
  const token = extractToken(req);

  if (!token) {
    return {
      authenticated: false,
      response: new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }

  const verification = verifyToken(token);

  if (!verification.valid) {
    return {
      authenticated: false,
      response: new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }

  return {
    authenticated: true,
    user: verification.user
  };
}

// Add new user (admin only)
export function addUser(username, password, name, role = 'viewer') {
  const users = loadUsers();

  if (users[username]) {
    return { success: false, message: 'User already exists' };
  }

  users[username] = {
    username,
    password: hashPassword(password),
    role,
    name,
    created: new Date().toISOString()
  };

  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  return { success: true, message: 'User created successfully' };
}

// Change password
export function changePassword(username, oldPassword, newPassword) {
  const users = loadUsers();
  const user = users[username];

  if (!user) {
    return { success: false, message: 'User not found' };
  }

  const hashedOldPassword = hashPassword(oldPassword);
  if (user.password !== hashedOldPassword) {
    return { success: false, message: 'Invalid old password' };
  }

  user.password = hashPassword(newPassword);
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  return { success: true, message: 'Password changed successfully' };
}

// List all users (admin only)
export function listUsers() {
  const users = loadUsers();
  return Object.values(users).map(user => ({
    username: user.username,
    name: user.name,
    role: user.role,
    created: user.created
  }));
}

// Delete user (admin only)
export function deleteUser(username) {
  if (username === 'admin') {
    return { success: false, message: 'Cannot delete admin user' };
  }

  const users = loadUsers();

  if (!users[username]) {
    return { success: false, message: 'User not found' };
  }

  delete users[username];
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  return { success: true, message: 'User deleted successfully' };
}

// Check if user has permission to access a path
export function hasPermission(user, path) {
  // Admin has access to everything
  if (user.role === 'admin' || (user.permissions && user.permissions.includes('*'))) {
    return true;
  }

  // If no permissions defined, deny access
  if (!user.permissions || user.permissions.length === 0) {
    return false;
  }

  // Extract service/route from path
  // Examples: /pratham/, /interact/, /admin/, /view/, /api/ncert/
  const routeMatch = path.match(/^\/([^\/]+)/);
  if (!routeMatch) {
    return false;
  }

  const route = routeMatch[1];

  // Check if user has permission for this route
  return user.permissions.includes(route) || user.permissions.includes(`/${route}/`);
}

// Create service-specific user
export function createServiceUser(username, password, name, services) {
  const users = loadUsers();

  if (users[username]) {
    return { success: false, message: 'User already exists' };
  }

  users[username] = {
    username,
    password: hashPassword(password),
    role: 'user',
    name,
    permissions: services, // Array of allowed services/routes
    created: new Date().toISOString()
  };

  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  return { success: true, message: 'Service user created successfully' };
}
