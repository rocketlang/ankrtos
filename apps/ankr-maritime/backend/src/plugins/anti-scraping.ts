/**
 * Anti-Scraping Plugin for Fastify
 * Protects the application from automated scraping and bots
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

// Rate limiting store (in-memory)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const authAttempts = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
  for (const [key, value] of authAttempts.entries()) {
    if (value.resetTime < now) {
      authAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Bot detection
function isBot(userAgent: string): boolean {
  const suspiciousUA = userAgent.toLowerCase();
  const botPatterns = [
    'bot', 'crawl', 'spider', 'scrape', 'slurp', 'parser',
    'curl', 'wget', 'python', 'java', 'scrapy', 'selenium',
    'phantomjs', 'headless', 'automated', 'test', 'postman'
  ];
  return botPatterns.some(pattern => suspiciousUA.includes(pattern));
}

// Check rate limit
function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

// Check auth rate limit
function checkAuthRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = authAttempts.get(ip);

  if (!entry || entry.resetTime < now) {
    authAttempts.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

const antiScrapingPlugin: FastifyPluginAsync = async (fastify) => {
  // Security headers hook
  fastify.addHook('onRequest', async (request, reply) => {
    // Set security headers
    reply.headers({
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'",
    });

    // Prevent caching of API responses
    if (request.url.includes('/graphql') || request.url.includes('/api')) {
      reply.headers({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
      });
    }
  });

  // Bot detection hook
  fastify.addHook('onRequest', async (request, reply) => {
    const userAgent = request.headers['user-agent'] || '';
    const ip = request.ip;

    // Skip for health checks
    if (request.url === '/health') {
      return;
    }

    // Detect bots
    if (isBot(userAgent)) {
      fastify.log.warn(`⚠️  Bot detected: ${userAgent} from IP: ${ip}`);
      reply.code(403).send({
        error: 'Forbidden',
        message: 'Automated access is not permitted. Please use the official API with proper authentication.',
      });
      return;
    }
  });

  // Rate limiting hook
  fastify.addHook('onRequest', async (request, reply) => {
    const ip = request.ip;

    // Skip for health checks
    if (request.url === '/health') {
      return;
    }

    // Auth endpoints - stricter rate limiting
    if (request.url.includes('/graphql') && request.body &&
        typeof request.body === 'object' && 'query' in request.body) {
      const query = (request.body as any).query || '';
      if (query.includes('mutation') && (query.includes('login') || query.includes('register'))) {
        if (!checkAuthRateLimit(ip, 5, 15 * 60 * 1000)) {
          reply.code(429).send({
            error: 'Too Many Login Attempts',
            message: 'Too many login attempts. Please try again after 15 minutes.',
          });
          return;
        }
      }
    }

    // General API rate limiting - 100 requests per 15 minutes
    if (!checkRateLimit(ip, 100, 15 * 60 * 1000)) {
      reply.code(429).send({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please slow down and try again later.',
      });
      return;
    }
  });

  // GraphQL complexity limiter
  fastify.addHook('preHandler', async (request, reply) => {
    if (request.url === '/graphql' && request.body &&
        typeof request.body === 'object' && 'query' in request.body) {
      const query = (request.body as any).query as string;
      const complexity = (query.match(/{/g) || []).length;

      if (complexity > 20) {
        reply.code(400).send({
          error: 'Query Too Complex',
          message: 'Your GraphQL query exceeds the maximum complexity limit.',
        });
        return;
      }
    }
  });

  // Honeypot route
  fastify.get('/wp-admin', async (request, reply) => {
    const ip = request.ip;
    fastify.log.warn(`🍯 Honeypot triggered by IP: ${ip}, User-Agent: ${request.headers['user-agent']}`);

    // Return fake data to waste bot's time
    reply.send({
      message: 'WordPress admin panel',
      data: Array(100).fill({ id: Math.random(), value: 'fake data' }),
    });
  });

  // Another honeypot
  fastify.get('/admin.php', async (request, reply) => {
    const ip = request.ip;
    fastify.log.warn(`🍯 Honeypot triggered by IP: ${ip}, User-Agent: ${request.headers['user-agent']}`);
    reply.send({ success: true, admin: 'fake' });
  });

  fastify.log.info('🛡️  Anti-scraping protection enabled');
};

export default fp(antiScrapingPlugin, {
  name: 'anti-scraping',
  fastify: '5.x',
});
