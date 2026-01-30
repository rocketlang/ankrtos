import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import ScopeAuthPlugin from '@pothos/plugin-scope-auth';
import ValidationPlugin from '@pothos/plugin-validation';
import type PrismaTypes from '@pothos/plugin-prisma/generated';
import type { GraphQLContext } from './context.js';
import { prisma } from './context.js';

export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  PrismaTypes: PrismaTypes;
  Scalars: {
    DateTime: { Input: Date; Output: Date };
    JSON: { Input: unknown; Output: unknown };
  };
  AuthScopes: {
    authenticated: boolean;
    role: string;
  };
}>({
  plugins: [PrismaPlugin, ScopeAuthPlugin, ValidationPlugin],
  prisma: { client: prisma },
  authScopes: async (context) => ({
    authenticated: !!context.user,
    role: context.user?.role ?? 'guest',
  }),
});

// Register custom scalars
builder.scalarType('DateTime', {
  serialize: (value) => value.toISOString(),
  parseValue: (value) => new Date(value as string),
});

builder.scalarType('JSON', {
  serialize: (value) => value,
  parseValue: (value) => value,
});
