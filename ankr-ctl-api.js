#!/usr/bin/env bun
/**
 * ANKR-CTL Web API
 * Backend service for the ANKR-CTL web dashboard
 * Provides REST API endpoints to manage services visually
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { authenticateUser, verifyToken, extractToken, requireAuth } from './ankr-auth.js';

const PORT = process.env.PORT || 4500;
const JWT_SECRET = process.env.ANKR_JWT_SECRET || 'ankr-secret-key-change-in-production';

// Simple HTTP server
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // Public routes (no auth required)

    // Login endpoint
    if (path === '/api/auth/login' && req.method === 'POST') {
      try {
        const body = await req.json();
        const result = authenticateUser(body.username, body.password);

        if (result.success) {
          return new Response(JSON.stringify(result), {
            headers: {
              ...headers,
              'Set-Cookie': `ankr_token=${result.token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
            }
          });
        } else {
          return new Response(JSON.stringify(result), {
            status: 401,
            headers
          });
        }
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Login failed'
        }), { status: 500, headers });
      }
    }

    // Logout endpoint
    if (path === '/api/auth/logout' && req.method === 'POST') {
      return new Response(JSON.stringify({ success: true }), {
        headers: {
          ...headers,
          'Set-Cookie': 'ankr_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
        }
      });
    }

    // Verify token endpoint
    if (path === '/api/auth/verify' && req.method === 'GET') {
      const token = extractToken(req);
      if (!token) {
        return new Response(JSON.stringify({ valid: false }), {
          status: 401,
          headers
        });
      }
      const result = verifyToken(token);
      if (!result.valid) {
        return new Response(JSON.stringify(result), {
          status: 401,
          headers
        });
      }
      return new Response(JSON.stringify(result), {
        status: 200,
        headers
      });
    }

    // Nginx auth_request endpoint (returns 200/401/403)
    if (path === '/api/auth/check' && req.method === 'GET') {
      const token = extractToken(req);
      if (!token) {
        return new Response('Unauthorized', { status: 401 });
      }

      const result = verifyToken(token);
      if (!result.valid) {
        return new Response('Unauthorized', { status: 401 });
      }

      // Check permissions for the requested path
      const originalUri = req.headers.get('x-original-uri') || '/';
      const { hasPermission } = await import('./ankr-auth.js');

      if (!hasPermission(result.user, originalUri)) {
        return new Response('Forbidden', { status: 403 });
      }

      return new Response('OK', { status: 200 });
    }

    // Serve login page
    if (path === '/login') {
      try {
        const html = readFileSync('/root/ankr-login.html', 'utf-8');
        return new Response(html, {
          headers: { 'Content-Type': 'text/html' }
        });
      } catch (error) {
        return new Response('Login page not found', { status: 404 });
      }
    }

    // Health endpoint (public)
    if (path === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'ankr-ctl-api',
        version: '2.0.0',
        port: PORT,
        auth: 'enabled'
      }), { headers });
    }

    // Protected routes - require authentication
    const auth = requireAuth(req);
    if (!auth.authenticated) {
      return auth.response;
    }

    // Get all services status
    if (path === '/api/services' && req.method === 'GET') {
      try {
        const status = await executeAnkrCtl('status');
        const parsed = parseAnkrCtlStatus(status);
        return new Response(JSON.stringify(parsed), { headers });
      } catch (error) {
        return new Response(JSON.stringify({
          error: error.message
        }), { status: 500, headers });
      }
    }

    // Start service
    if (path === '/api/service/start' && req.method === 'POST') {
      try {
        const body = await req.json();
        const result = await executeAnkrCtl('start', body.service);
        return new Response(JSON.stringify({
          success: true,
          message: `Started ${body.service}`,
          output: result
        }), { headers });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          message: error.message
        }), { status: 500, headers });
      }
    }

    // Stop service
    if (path === '/api/service/stop' && req.method === 'POST') {
      try {
        const body = await req.json();
        const result = await executeAnkrCtl('stop', body.service);
        return new Response(JSON.stringify({
          success: true,
          message: `Stopped ${body.service}`,
          output: result
        }), { headers });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          message: error.message
        }), { status: 500, headers });
      }
    }

    // Restart service
    if (path === '/api/service/restart' && req.method === 'POST') {
      try {
        const body = await req.json();
        const result = await executeAnkrCtl('restart', body.service);
        return new Response(JSON.stringify({
          success: true,
          message: `Restarted ${body.service}`,
          output: result
        }), { headers });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          message: error.message
        }), { status: 500, headers });
      }
    }

    // Health check all services
    if (path === '/api/health-check' && req.method === 'GET') {
      try {
        const result = await executeAnkrCtl('health');
        return new Response(JSON.stringify({
          success: true,
          output: result
        }), { headers });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          message: error.message
        }), { status: 500, headers });
      }
    }

    // Get port allocations
    if (path === '/api/ports' && req.method === 'GET') {
      try {
        const ports = JSON.parse(readFileSync('/root/.ankr/config/ports.json', 'utf-8'));
        return new Response(JSON.stringify(ports), { headers });
      } catch (error) {
        return new Response(JSON.stringify({
          error: error.message
        }), { status: 500, headers });
      }
    }

    // Get services config
    if (path === '/api/config' && req.method === 'GET') {
      try {
        const config = JSON.parse(readFileSync('/root/.ankr/config/services.json', 'utf-8'));
        return new Response(JSON.stringify(config), { headers });
      } catch (error) {
        return new Response(JSON.stringify({
          error: error.message
        }), { status: 500, headers });
      }
    }

    // Log search endpoint
    if (path === '/api/logs/search' && req.method === 'GET') {
      try {
        const params = url.searchParams;
        const service = params.get('service') || '';
        const level = params.get('level') || '';
        const since = params.get('since') || '24h';
        const grep = params.get('grep') || '';
        const limit = params.get('limit') || '50';

        const args = ['logs', 'search'];
        if (service) args.push('--service', service);
        if (level) args.push('--level', level);
        if (since) args.push('--since', since);
        if (grep) args.push('--grep', grep);
        args.push('--limit', limit);
        args.push('--compact');

        const output = await executeAnkrCtlWithArgs(args);
        const logs = parseAnkrCtlLogs(output);

        return new Response(JSON.stringify({ logs }), { headers });
      } catch (error) {
        return new Response(JSON.stringify({
          error: error.message,
          logs: []
        }), { status: 500, headers });
      }
    }

    // Log stats endpoint
    if (path === '/api/logs/stats' && req.method === 'GET') {
      try {
        const output = await executeAnkrCtlWithArgs(['logs', 'stats']);
        const stats = parseAnkrCtlStats(output);

        return new Response(JSON.stringify(stats), { headers });
      } catch (error) {
        return new Response(JSON.stringify({
          error: error.message,
          total: 0,
          byLevel: {},
          byService: {},
          correlationIds: 0
        }), { status: 500, headers });
      }
    }

    // Protected: Serve dashboard v2 HTML
    if (path === '/dashboard/v2' || path === '/v2' || path === '/' || path === '/dashboard') {
      try {
        const html = readFileSync('/root/ankr-ctl-dashboard-v2.html', 'utf-8');
        return new Response(html, {
          headers: { 'Content-Type': 'text/html' }
        });
      } catch (error) {
        return new Response('Dashboard not found', { status: 404 });
      }
    }

    return new Response('Not Found', { status: 404, headers });
  }
});

console.log(`🚀 ANKR-CTL API running on http://localhost:${PORT}`);
console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
console.log(`❤️  Health: http://localhost:${PORT}/health`);

/**
 * Execute ankr-ctl command with arguments array
 */
function executeAnkrCtlWithArgs(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('/root/ankr-ctl', args);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Command failed with code ${code}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * Execute ankr-ctl command
 */
function executeAnkrCtl(command, service = '') {
  return new Promise((resolve, reject) => {
    const args = service ? [command, service] : [command];
    const proc = spawn('/root/ankr-ctl', args);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Command failed with code ${code}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * Parse ankr-ctl status output
 */
function parseAnkrCtlStatus(output) {
  const lines = output.split('\n');
  const running = [];
  const stopped = [];

  // Simple parsing - in production, use proper parsing
  for (const line of lines) {
    if (line.includes('RUNNING')) {
      // Extract service data from table row
      const parts = line.split('│').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 8) {
        running.push({
          name: parts[0],
          type: parts[1],
          port: parts[2],
          status: parts[3],
          pid: parts[4],
          cpu: parts[5],
          memory: parts[6],
          uptime: parts[7]
        });
      }
    } else if (line.includes('STOPPED')) {
      const parts = line.split('│').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 3) {
        stopped.push({
          name: parts[0],
          type: parts[1],
          port: parts[2],
          status: 'STOPPED'
        });
      }
    }
  }

  return { running, stopped, services: [...running, ...stopped] };
}

/**
 * Parse ankr-ctl logs output
 */
function parseAnkrCtlLogs(output) {
  const lines = output.split('\n');
  const logs = [];

  for (const line of lines) {
    if (!line.trim() || line.includes('Found') || line.includes('log entries')) continue;

    // Strip ANSI codes
    const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');

    // Parse log line format: timestamp LEVEL message
    const match = cleanLine.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(\w+)\s+(.+)/);
    if (match) {
      logs.push({
        timestamp: match[1],
        level: match[2].toLowerCase(),
        message: match[3].trim(),
        metadata: {}
      });
    }
  }

  return logs;
}

/**
 * Parse ankr-ctl logs stats output
 */
function parseAnkrCtlStats(output) {
  const stats = {
    total: 0,
    byLevel: {},
    byService: {},
    correlationIds: 0
  };

  const lines = output.split('\n');

  for (const line of lines) {
    // Parse "Total Entries: 5"
    if (line.includes('Total Entries:')) {
      stats.total = parseInt(line.split(':')[1]) || 0;
    }

    // Parse "ERROR: 1", "WARN: 2", etc.
    const levelMatch = line.match(/(ERROR|WARN|INFO|HTTP|VERBOSE|DEBUG):\s*(\d+)/);
    if (levelMatch) {
      stats.byLevel[levelMatch[1].toLowerCase()] = parseInt(levelMatch[2]);
    }

    // Parse "ankr-ctl: 5"
    if (line.includes(':') && !line.includes('║') && !line.includes('Total') && !line.includes('Range') && !line.includes('Level') && !line.includes('Service') && !line.includes('Correlation')) {
      const parts = line.split(':');
      if (parts.length === 2 && !parts[0].includes('/')) {
        const serviceName = parts[0].trim();
        const count = parseInt(parts[1].trim());
        if (!isNaN(count) && serviceName.length > 0 && serviceName.length < 50) {
          stats.byService[serviceName] = count;
        }
      }
    }

    // Parse "Correlation IDs: 2"
    if (line.includes('Correlation IDs:')) {
      stats.correlationIds = parseInt(line.split(':')[1]) || 0;
    }
  }

  return stats;
}
