import bcrypt from 'bcryptjs';
import { builder } from '../builder.js';

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

      const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
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
