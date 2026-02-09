/**
 * Anti-Scraping Middleware
 * Protects the application from automated scraping and bots
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// Rate limiter for general API requests
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please slow down and try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime! / 1000),
    });
  },
});

// Stricter rate limiter for login/auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  skipSuccessfulRequests: true, // Don't count successful logins
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Account Locked',
      message: 'Too many failed login attempts. Please try again after 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime! / 1000),
    });
  },
});

// Speed limiter - gradually slows down responses
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes without delay
  delayMs: (hits) => hits * 100, // Add 100ms delay per request above delayAfter
  maxDelayMs: 5000, // Maximum delay of 5 seconds
});

// Bot detection middleware
export function botDetection(req: Request, res: Response, next: NextFunction) {
  const userAgent = req.headers['user-agent'] || '';
  const suspiciousUA = userAgent.toLowerCase();

  // List of known bot/scraper user agents
  const botPatterns = [
    'bot', 'crawl', 'spider', 'scrape', 'slurp', 'parser',
    'curl', 'wget', 'python', 'java', 'scrapy', 'selenium',
    'phantomjs', 'headless', 'automated', 'test'
  ];

  // Check if user agent matches bot patterns
  const isBot = botPatterns.some(pattern => suspiciousUA.includes(pattern));

  if (isBot) {
    console.warn(`⚠️  Bot detected: ${userAgent} from IP: ${req.ip}`);

    // Return 403 Forbidden for bots
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Automated access is not permitted. Please use the official API with proper authentication.',
    });
  }

  next();
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent scraping and embedding
  res.setHeader('X-Frame-Options', 'DENY'); // Prevent iframe embedding
  res.setHeader('X-Content-Type-Options', 'nosniff'); // Prevent MIME sniffing
  res.setHeader('X-XSS-Protection', '1; mode=block'); // Enable XSS protection
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); // Limit referrer info
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()'); // Disable APIs

  // Content Security Policy - prevent inline scripts and external resources
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'"
  );

  // Prevent caching of sensitive data
  if (req.path.includes('/graphql') || req.path.includes('/api')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
}

// Request fingerprinting - detect suspicious patterns
export function requestFingerprinting(req: Request, res: Response, next: NextFunction) {
  const suspiciousHeaders = [
    !req.headers['accept'], // No accept header
    !req.headers['accept-language'], // No language
    !req.headers['accept-encoding'], // No encoding
    req.headers['connection'] === 'close', // Suspicious connection type
  ];

  const suspiciousCount = suspiciousHeaders.filter(Boolean).length;

  if (suspiciousCount >= 3) {
    console.warn(`⚠️  Suspicious request pattern detected from IP: ${req.ip}`);

    // Add delay for suspicious requests
    setTimeout(() => next(), 2000); // 2 second delay
    return;
  }

  next();
}

// GraphQL complexity limiter (prevent expensive queries)
export function graphqlComplexityLimit(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/graphql' && req.body?.query) {
    const query = req.body.query as string;

    // Count nested braces as complexity indicator
    const complexity = (query.match(/{/g) || []).length;

    if (complexity > 20) {
      return res.status(400).json({
        error: 'Query Too Complex',
        message: 'Your GraphQL query exceeds the maximum complexity limit.',
      });
    }
  }

  next();
}

// IP whitelist for admin routes (optional)
export function adminIpWhitelist(allowedIPs: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (allowedIPs.length === 0) {
      return next(); // No whitelist configured, allow all
    }

    const clientIP = req.ip || req.socket.remoteAddress || '';

    if (!allowedIPs.includes(clientIP)) {
      console.warn(`⚠️  Unauthorized admin access attempt from IP: ${clientIP}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access is restricted to authorized IP addresses.',
      });
    }

    next();
  };
}

// Honeypot trap (fake endpoint to catch bots)
export function honeypotTrap(req: Request, res: Response) {
  const ip = req.ip || req.socket.remoteAddress;
  console.warn(`🍯 Honeypot triggered by IP: ${ip}, User-Agent: ${req.headers['user-agent']}`);

  // Log to database or ban list
  // TODO: Add IP to temporary ban list

  // Return fake data to waste bot's time
  res.status(200).json({
    message: 'Access granted',
    data: Array(100).fill({ id: Math.random(), value: 'fake data' }),
  });
}

export default {
  apiLimiter,
  authLimiter,
  speedLimiter,
  botDetection,
  securityHeaders,
  requestFingerprinting,
  graphqlComplexityLimit,
  adminIpWhitelist,
  honeypotTrap,
};
