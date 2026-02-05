// =====================================================
// AUTHENTICATION RESOLVERS
// User registration, login, and session management
// =====================================================

import { Context } from '../context';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const authResolvers = {
  Query: {
    me: async (_: any, __: any, context: Context) => {
      if (!context.userId) return null;

      return context.prisma.user.findUnique({
        where: { id: context.userId },
        include: {
          birthChart: true,
          baziCharts: { take: 1, orderBy: { createdAt: 'desc' } },
          numerologyCharts: { take: 1, orderBy: { createdAt: 'desc' } },
          vimshottariDashas: { take: 1, orderBy: { calculatedAt: 'desc' } },
        },
      });
    },
  },

  Mutation: {
    signUp: async (_: any, { input }: any, context: Context) => {
      const { email, password, firstName, lastName, phone } = input;

      // Check if user exists
      const existingUser = await context.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await context.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: 'USER',
          isActive: true,
        },
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return {
        token,
        user,
      };
    },

    login: async (_: any, { input }: any, context: Context) => {
      const { email, password } = input;

      // Find user
      const user = await context.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      await context.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '30d' }
      });

      return {
        token,
        user,
      };
    },

    updateProfile: async (_: any, args: any, context: Context) => {
      if (!context.userId) {
        throw new Error('Authentication required');
      }

      const updateData: any = {};

      if (args.firstName) updateData.firstName = args.firstName;
      if (args.lastName) updateData.lastName = args.lastName;
      if (args.phone) updateData.phone = args.phone;
      if (args.birthDate) updateData.birthDate = args.birthDate;
      if (args.birthTime) updateData.birthTime = args.birthTime;
      if (args.birthPlace) updateData.birthPlace = args.birthPlace;
      if (args.birthLat) updateData.birthLat = args.birthLat;
      if (args.birthLng) updateData.birthLng = args.birthLng;
      if (args.timezone) updateData.timezone = args.timezone;

      const user = await context.prisma.user.update({
        where: { id: context.userId },
        data: updateData,
      });

      return user;
    },
  },
};
