// =====================================================
// MAIN RESOLVER INDEX
// Combines all system resolvers
// =====================================================

import { authResolvers } from './auth.resolvers';
import { vedicResolvers } from './vedic.resolvers';
import { lalKitabResolvers } from './lal-kitab.resolvers';
import { kpResolvers } from './kp.resolvers';
import { baziResolvers } from './bazi.resolvers';
import { medicalResolvers } from './medical.resolvers';
import { numerologyResolvers } from './numerology.resolvers';
import { crystalResolvers } from './crystal.resolvers';
import { dashaResolvers } from './dasha.resolvers';
import { palmistryResolvers } from './palmistry.resolvers';
import { userResolvers } from './user.resolvers';
import { astrologerResolvers } from './astrologer.resolvers';

// Merge all resolvers
export const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...vedicResolvers.Query,
    ...lalKitabResolvers.Query,
    ...kpResolvers.Query,
    ...baziResolvers.Query,
    ...medicalResolvers.Query,
    ...numerologyResolvers.Query,
    ...crystalResolvers.Query,
    ...dashaResolvers.Query,
    ...palmistryResolvers.Query,
    ...userResolvers.Query,
    ...astrologerResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...vedicResolvers.Mutation,
    ...lalKitabResolvers.Mutation,
    ...kpResolvers.Mutation,
    ...baziResolvers.Mutation,
    ...medicalResolvers.Mutation,
    ...numerologyResolvers.Mutation,
    ...crystalResolvers.Mutation,
    ...dashaResolvers.Mutation,
    ...palmistryResolvers.Mutation,
    ...userResolvers.Mutation,
    ...astrologerResolvers.Mutation,
  },

  Subscription: {
    ...vedicResolvers.Subscription,
  },

  // Custom scalar resolvers
  DateTime: {
    __parseValue(value: any) {
      return new Date(value);
    },
    __serialize(value: any) {
      return value.toISOString();
    },
    __parseLiteral(ast: any) {
      return new Date(ast.value);
    },
  },

  JSON: {
    __parseValue(value: any) {
      return value;
    },
    __serialize(value: any) {
      return value;
    },
    __parseLiteral(ast: any) {
      return ast.value;
    },
  },
};
