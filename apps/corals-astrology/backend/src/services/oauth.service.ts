import { PrismaClient } from '@prisma/client';
import { Google, Facebook } from 'arctic';
import jwt from 'jsonwebtoken';

interface OAuthConfig {
  googleClientId?: string;
  googleClientSecret?: string;
  googleRedirectUri?: string;
  facebookClientId?: string;
  facebookClientSecret?: string;
  facebookRedirectUri?: string;
  jwtSecret: string;
  jwtExpiresIn?: string;
}

export class OAuthService {
  private prisma: PrismaClient;
  private config: OAuthConfig;
  private google?: Google;
  private facebook?: Facebook;

  constructor(prisma: PrismaClient, config: OAuthConfig) {
    this.prisma = prisma;
    this.config = config;

    // Initialize Google OAuth
    if (config.googleClientId && config.googleClientSecret && config.googleRedirectUri) {
      this.google = new Google(
        config.googleClientId,
        config.googleClientSecret,
        config.googleRedirectUri
      );
      console.log('✅ Google OAuth enabled');
    }

    // Initialize Facebook OAuth
    if (config.facebookClientId && config.facebookClientSecret && config.facebookRedirectUri) {
      this.facebook = new Facebook(
        config.facebookClientId,
        config.facebookClientSecret,
        config.facebookRedirectUri
      );
      console.log('✅ Facebook OAuth enabled');
    }
  }

  async getGoogleAuthUrl(state: string): Promise<string | null> {
    if (!this.google) {
      return null;
    }

    const url = await this.google.createAuthorizationURL(state, {
      scopes: ['openid', 'profile', 'email']
    });

    return url.toString();
  }

  async getFacebookAuthUrl(state: string): Promise<string | null> {
    if (!this.facebook) {
      return null;
    }

    const url = await this.facebook.createAuthorizationURL(state, {
      scopes: ['email', 'public_profile']
    });

    return url.toString();
  }

  async handleGoogleCallback(code: string): Promise<{ user: any; token: string }> {
    if (!this.google) {
      throw new Error('Google OAuth not configured');
    }

    // Exchange code for tokens
    const tokens = await this.google.validateAuthorizationCode(code);

    // Fetch user info from Google
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`
      }
    });

    const googleUser = await response.json();

    // Find or create user
    return await this.findOrCreateOAuthUser('google', {
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      avatar: googleUser.picture
    });
  }

  async handleFacebookCallback(code: string): Promise<{ user: any; token: string }> {
    if (!this.facebook) {
      throw new Error('Facebook OAuth not configured');
    }

    // Exchange code for tokens
    const tokens = await this.facebook.validateAuthorizationCode(code);

    // Fetch user info from Facebook
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${tokens.accessToken()}`
    );

    const fbUser = await response.json();

    // Find or create user
    return await this.findOrCreateOAuthUser('facebook', {
      id: fbUser.id,
      email: fbUser.email,
      name: fbUser.name,
      avatar: fbUser.picture?.data?.url
    });
  }

  private async findOrCreateOAuthUser(
    provider: string,
    oauthUser: { id: string; email: string; name?: string; avatar?: string }
  ): Promise<{ user: any; token: string }> {
    let user;

    // Try to find by provider and providerId
    user = await this.prisma.user.findFirst({
      where: {
        provider,
        providerId: oauthUser.id
      }
    });

    // If not found, try by email
    if (!user && oauthUser.email) {
      user = await this.prisma.user.findUnique({
        where: { email: oauthUser.email }
      });

      // Update existing user with OAuth info
      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            provider,
            providerId: oauthUser.id,
            emailVerified: true,
            avatar: oauthUser.avatar || user.avatar,
            lastLoginAt: new Date()
          }
        });
      }
    }

    // Create new user if not found
    if (!user) {
      const names = oauthUser.name?.split(' ') || [];
      const firstName = names[0] || 'User';
      const lastName = names.slice(1).join(' ') || undefined;

      user = await this.prisma.user.create({
        data: {
          email: oauthUser.email,
          provider,
          providerId: oauthUser.id,
          firstName,
          lastName,
          avatar: oauthUser.avatar,
          emailVerified: true,
          role: 'USER',
          isActive: true
        }
      });
    } else {
      // Update last login
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      this.config.jwtSecret,
      { expiresIn: this.config.jwtExpiresIn || '7d' }
    );

    return { user, token };
  }
}
