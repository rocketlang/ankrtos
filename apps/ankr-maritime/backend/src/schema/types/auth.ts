import bcrypt from 'bcryptjs';
import { builder } from '../builder.js';
import { sessionManager } from '../../services/session-manager.js';
import { mfaService } from '../../services/mfa-service.js';
import { passwordPolicy } from '../../services/password-policy.js';

// Organization type
builder.prismaObject('Organization', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    domain: t.exposeString('domain', { nullable: true }),
    settings: t.expose('settings', { type: 'JSON', nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    users: t.relation('users'),
  }),
});

// User type (no password hash exposed)
builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    email: t.exposeString('email'),
    name: t.exposeString('name'),
    role: t.exposeString('role'),
    organizationId: t.exposeString('organizationId'),
    isActive: t.exposeBoolean('isActive'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    organization: t.relation('organization'),
  }),
});

// Auth payload
const AuthPayload = builder.objectRef<{
  token: string;
  user: { id: string; email: string; name: string; role: string; organizationId: string };
}>('AuthPayload');

builder.objectType(AuthPayload, {
  fields: (t) => ({
    token: t.exposeString('token'),
    user: t.field({
      type: 'User',
      resolve: (parent, _args, ctx) =>
        ctx.prisma.user.findUniqueOrThrow({ where: { id: parent.user.id } }),
    }),
  }),
});

// Login mutation
builder.mutationField('login', (t) =>
  t.field({
    type: AuthPayload,
    args: {
      email: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: args.email },
      });
      if (!user || !user.isActive) {
        throw new Error('Invalid email or password');
      }

      const valid = await bcrypt.compare(args.password, user.passwordHash);
      if (!valid) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Create Redis session
      const sessionId = await sessionManager.createSession(
        user.id,
        user.organizationId,
        user.role,
        user.email,
        {
          ipAddress: ctx.request?.ip,
          userAgent: ctx.request?.headers['user-agent'],
        }
      );

      const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        sessionId, // Include session ID in JWT
      };

      const token = ctx.signJwt(payload);

      return { token, user: payload };
    },
  }),
);

// Me query
builder.queryField('me', (t) =>
  t.prismaField({
    type: 'User',
    nullable: true,
    resolve: (query, _root, _args, ctx) => {
      if (!ctx.user) return null;
      return ctx.prisma.user.findUnique({ ...query, where: { id: ctx.user.id } });
    },
  }),
);

// Session type
const SessionInfo = builder.objectRef<{
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: number;
  lastActivity: number;
}>('SessionInfo');

builder.objectType(SessionInfo, {
  fields: (t) => ({
    sessionId: t.exposeString('sessionId'),
    ipAddress: t.exposeString('ipAddress', { nullable: true }),
    userAgent: t.exposeString('userAgent', { nullable: true }),
    createdAt: t.field({
      type: 'DateTime',
      resolve: (parent) => new Date(parent.createdAt),
    }),
    lastActivity: t.field({
      type: 'DateTime',
      resolve: (parent) => new Date(parent.lastActivity),
    }),
  }),
});

// Logout mutation
builder.mutationField('logout', (t) =>
  t.field({
    type: 'Boolean',
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user?.sessionId) {
        return false;
      }

      await sessionManager.deleteSession(ctx.user.sessionId);
      return true;
    },
  }),
);

// Logout all devices mutation
builder.mutationField('logoutAllDevices', (t) =>
  t.field({
    type: 'Int',
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      const count = await sessionManager.deleteAllUserSessions(ctx.user.id);
      return count;
    },
  }),
);

// Get active sessions query
builder.queryField('mySessions', (t) =>
  t.field({
    type: [SessionInfo],
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        return [];
      }

      const sessions = await sessionManager.getUserSessions(ctx.user.id);
      return sessions.map(s => ({
        sessionId: s.sessionId,
        ipAddress: s.data.ipAddress,
        userAgent: s.data.userAgent,
        createdAt: s.data.createdAt,
        lastActivity: s.data.lastActivity,
      }));
    },
  }),
);

// Revoke specific session mutation
builder.mutationField('revokeSession', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      sessionId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      // Verify session belongs to user
      const sessions = await sessionManager.getUserSessions(ctx.user.id);
      const sessionExists = sessions.some(s => s.sessionId === args.sessionId);

      if (!sessionExists) {
        throw new Error('Session not found or unauthorized');
      }

      await sessionManager.deleteSession(args.sessionId);
      return true;
    },
  }),
);

// Session statistics (admin only)
builder.queryField('sessionStats', (t) =>
  t.field({
    type: builder.objectRef<{
      totalSessions: number;
      totalUsers: number;
      avgSessionsPerUser: number;
    }>('SessionStats').implement({
      fields: (t) => ({
        totalSessions: t.exposeInt('totalSessions'),
        totalUsers: t.exposeInt('totalUsers'),
        avgSessionsPerUser: t.exposeFloat('avgSessionsPerUser'),
      }),
    }),
    resolve: async (_root, _args, ctx) => {
      // Check if user is admin
      if (!ctx.user || ctx.user.role !== 'company_admin') {
        throw new Error('Unauthorized - admin only');
      }

      return await sessionManager.getStats();
    },
  }),
);

// MFA Setup Result
const MFASetupResult = builder.objectRef<{
  secret: string;
  qrCode: string;
  backupCodes: string[];
}>('MFASetupResult');

builder.objectType(MFASetupResult, {
  fields: (t) => ({
    secret: t.exposeString('secret'),
    qrCode: t.exposeString('qrCode'),
    backupCodes: t.stringList({
      resolve: (parent) => parent.backupCodes,
    }),
  }),
});

// Setup TOTP MFA
builder.mutationField('setupTOTP', (t) =>
  t.field({
    type: MFASetupResult,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      const result = await mfaService.setupTOTP(ctx.user.id, ctx.user.email);
      return result;
    },
  }),
);

// Verify and enable TOTP
builder.mutationField('verifyAndEnableTOTP', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      token: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      const success = await mfaService.verifyAndEnableTOTP(ctx.user.id, args.token);
      if (!success) {
        throw new Error('Invalid TOTP token');
      }

      return true;
    },
  }),
);

// Setup SMS MFA
builder.mutationField('setupSMS', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      phoneNumber: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      await mfaService.setupSMS(ctx.user.id, args.phoneNumber);
      return true;
    },
  }),
);

// Verify and enable SMS
builder.mutationField('verifyAndEnableSMS', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      code: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      const result = await mfaService.verifyAndEnableSMS(ctx.user.id, args.code);
      if (!result.success) {
        if (result.lockedUntil) {
          throw new Error(`Account locked until ${result.lockedUntil.toISOString()}`);
        }
        throw new Error(`Invalid code. ${result.remainingAttempts} attempts remaining`);
      }

      return true;
    },
  }),
);

// Disable MFA
builder.mutationField('disableMFA', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      password: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      await mfaService.disableMFA(ctx.user.id, args.password);
      return true;
    },
  }),
);

// Regenerate backup codes
builder.mutationField('regenerateBackupCodes', (t) =>
  t.field({
    type: ['String'],
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      const codes = await mfaService.regenerateBackupCodes(ctx.user.id);
      return codes;
    },
  }),
);

// Check if MFA is required for role
builder.queryField('isMFARequired', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      role: t.arg.string({ required: true }),
    },
    resolve: (_root, args) => {
      return mfaService.isMFARequired(args.role);
    },
  }),
);

// Password Validation Result
const PasswordValidationResult = builder.objectRef<{
  valid: boolean;
  errors: string[];
}>('PasswordValidationResult');

builder.objectType(PasswordValidationResult, {
  fields: (t) => ({
    valid: t.exposeBoolean('valid'),
    errors: t.stringList({
      resolve: (parent) => parent.errors,
    }),
  }),
});

// Validate password against policy
builder.queryField('validatePassword', (t) =>
  t.field({
    type: PasswordValidationResult,
    args: {
      password: t.arg.string({ required: true }),
      username: t.arg.string({ required: false }),
      email: t.arg.string({ required: false }),
    },
    resolve: async (_root, args) => {
      const result = await passwordPolicy.validatePassword(
        args.password,
        args.username,
        args.email
      );
      return result;
    },
  }),
);

// Change password
builder.mutationField('changePassword', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      currentPassword: t.arg.string({ required: true }),
      newPassword: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      // Verify current password
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { passwordHash: true, email: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const valid = await bcrypt.compare(args.currentPassword, user.passwordHash);
      if (!valid) {
        throw new Error('Current password is incorrect');
      }

      // Set new password (validates and checks history)
      await passwordPolicy.setPassword(
        ctx.user.id,
        args.newPassword,
        ctx.user.email,
        ctx.user.email
      );

      return true;
    },
  }),
);

// Check if password is expired
builder.queryField('isPasswordExpired', (t) =>
  t.field({
    type: 'Boolean',
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        return false;
      }

      return await passwordPolicy.isPasswordExpired(ctx.user.id);
    },
  }),
);

// Check if account is locked
builder.queryField('isAccountLocked', (t) =>
  t.field({
    type: 'Boolean',
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        return false;
      }

      return await passwordPolicy.isAccountLocked(ctx.user.id);
    },
  }),
);

// Admin: Reset failed login attempts
builder.mutationField('resetFailedLoginAttempts', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      userId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      // Check if user is admin
      if (!ctx.user || ctx.user.role !== 'company_admin') {
        throw new Error('Unauthorized - admin only');
      }

      await passwordPolicy.resetFailedAttempts(args.userId);
      return true;
    },
  }),
);
