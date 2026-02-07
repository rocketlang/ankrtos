import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { OTPService } from '../services/otp.service';
import { OAuthService } from '../services/oauth.service';
import crypto from 'crypto';

export function createAuthRoutes(prisma: PrismaClient) {
  const router = Router();

  // Initialize services
  const otpService = new OTPService(prisma, {
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioVerifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
    twilioFromNumber: process.env.TWILIO_FROM_NUMBER,
    twilioEnabled: process.env.TWILIO_ENABLED === 'true',
    msg91AuthKey: process.env.MSG91_AUTH_KEY,
    msg91SenderId: process.env.MSG91_SENDER_ID,
    msg91TemplateId: process.env.MSG91_TEMPLATE_ID,
    jwtSecret: process.env.JWT_SECRET || 'corals-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  const oauthService = new OAuthService(prisma, {
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
    facebookClientId: process.env.FACEBOOK_CLIENT_ID,
    facebookClientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    facebookRedirectUri: process.env.FACEBOOK_REDIRECT_URI,
    jwtSecret: process.env.JWT_SECRET || 'corals-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  // ════════════════════════════════════════════════════════════
  // OTP ROUTES
  // ════════════════════════════════════════════════════════════

  // Send OTP to phone or email
  router.post('/otp/send', async (req: Request, res: Response) => {
    try {
      const { identifier, type } = req.body;

      if (!identifier || !type) {
        return res.status(400).json({ error: 'Missing identifier or type' });
      }

      if (type !== 'phone' && type !== 'email') {
        return res.status(400).json({ error: 'Type must be phone or email' });
      }

      const result = await otpService.sendOTP(identifier, type);
      res.json(result);
    } catch (error: any) {
      console.error('OTP send error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Verify OTP
  router.post('/otp/verify', async (req: Request, res: Response) => {
    try {
      const { identifier, otp, type } = req.body;

      if (!identifier || !otp || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (type !== 'phone' && type !== 'email') {
        return res.status(400).json({ error: 'Type must be phone or email' });
      }

      const result = await otpService.verifyOTP(identifier, otp, type);
      res.json(result);
    } catch (error: any) {
      console.error('OTP verify error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // ════════════════════════════════════════════════════════════
  // GOOGLE OAUTH ROUTES
  // ════════════════════════════════════════════════════════════

  // Initiate Google OAuth
  router.get('/google', async (req: Request, res: Response) => {
    const state = crypto.randomBytes(32).toString('hex');
    const authUrl = await oauthService.getGoogleAuthUrl(state);

    if (!authUrl) {
      return res.status(503).json({ error: 'Google OAuth not configured' });
    }

    // Store state in session or cookie for CSRF protection
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000 // 10 minutes
    });

    res.redirect(authUrl);
  });

  // Google OAuth callback
  router.get('/google/callback', async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      const storedState = req.cookies?.oauth_state;

      // CSRF protection
      if (!state || state !== storedState) {
        return res.status(400).json({ error: 'Invalid state parameter' });
      }

      if (!code) {
        return res.status(400).json({ error: 'Missing authorization code' });
      }

      const result = await oauthService.handleGoogleCallback(code as string);

      // Clear state cookie
      res.clearCookie('oauth_state');

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'https://corals-astrology.ankr.digital';
      res.redirect(`${frontendUrl}/auth/callback?token=${result.token}&provider=google`);
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'https://corals-astrology.ankr.digital';
      res.redirect(`${frontendUrl}/login?error=google_oauth_failed`);
    }
  });

  // ════════════════════════════════════════════════════════════
  // FACEBOOK OAUTH ROUTES
  // ════════════════════════════════════════════════════════════

  // Initiate Facebook OAuth
  router.get('/facebook', async (req: Request, res: Response) => {
    const state = crypto.randomBytes(32).toString('hex');
    const authUrl = await oauthService.getFacebookAuthUrl(state);

    if (!authUrl) {
      return res.status(503).json({ error: 'Facebook OAuth not configured' });
    }

    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000
    });

    res.redirect(authUrl);
  });

  // Facebook OAuth callback
  router.get('/facebook/callback', async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      const storedState = req.cookies?.oauth_state;

      if (!state || state !== storedState) {
        return res.status(400).json({ error: 'Invalid state parameter' });
      }

      if (!code) {
        return res.status(400).json({ error: 'Missing authorization code' });
      }

      const result = await oauthService.handleFacebookCallback(code as string);

      res.clearCookie('oauth_state');

      const frontendUrl = process.env.FRONTEND_URL || 'https://corals-astrology.ankr.digital';
      res.redirect(`${frontendUrl}/auth/callback?token=${result.token}&provider=facebook`);
    } catch (error: any) {
      console.error('Facebook OAuth error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'https://corals-astrology.ankr.digital';
      res.redirect(`${frontendUrl}/login?error=facebook_oauth_failed`);
    }
  });

  // ════════════════════════════════════════════════════════════
  // UTILITY ROUTES
  // ════════════════════════════════════════════════════════════

  // Get current user from token
  router.get('/me', async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'corals-secret') as any;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          provider: true,
          emailVerified: true,
          phoneVerified: true,
          isPremium: true,
          createdAt: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error: any) {
      console.error('Get user error:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  return router;
}
