import { builder } from '../builder.js';

builder.prismaObject('DocumentTemplate', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    category: t.exposeString('category'),
    subCategory: t.exposeString('subCategory', { nullable: true }),
    description: t.exposeString('description', { nullable: true }),
    content: t.exposeString('content'),
    placeholders: t.exposeString('placeholders', { nullable: true }),
    isDefault: t.exposeBoolean('isDefault'),
    organizationId: t.exposeString('organizationId', { nullable: true }),
    version: t.exposeInt('version'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('documentTemplates', (t) =>
  t.prismaField({
    type: ['DocumentTemplate'],
    args: {
      category: t.arg.string(),
      search: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {};
      if (args.category) where.category = args.category;
      if (args.search) {
        where.OR = [
          { name: { contains: args.search, mode: 'insensitive' } },
          { description: { contains: args.search, mode: 'insensitive' } },
        ];
      }
      return ctx.prisma.documentTemplate.findMany({
        ...query,
        where,
        orderBy: { name: 'asc' },
      });
    },
  }),
);

builder.queryField('documentTemplateById', (t) =>
  t.prismaField({
    type: 'DocumentTemplate',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.documentTemplate.findUnique({ ...query, where: { id: args.id } }),
  }),
);

builder.queryField('templateCategories', (t) =>
  t.field({
    type: ['String'],
    resolve: async (_root, _args, ctx) => {
      const templates = await ctx.prisma.documentTemplate.findMany({
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      });
      return templates.map((t) => t.category);
    },
  }),
);

// === Mutations ===

builder.mutationField('createDocumentTemplate', (t) =>
  t.prismaField({
    type: 'DocumentTemplate',
    args: {
      name: t.arg.string({ required: true }),
      category: t.arg.string({ required: true }),
      content: t.arg.string({ required: true }),
      subCategory: t.arg.string(),
      description: t.arg.string(),
      placeholders: t.arg.string(),
      isDefault: t.arg.boolean(),
      organizationId: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.documentTemplate.create({
        ...query,
        data: {
          name: args.name,
          category: args.category,
          content: args.content,
          subCategory: args.subCategory ?? undefined,
          description: args.description ?? undefined,
          placeholders: args.placeholders ?? undefined,
          isDefault: args.isDefault ?? false,
          organizationId: args.organizationId ?? undefined,
        },
      }),
  }),
);

builder.mutationField('updateDocumentTemplate', (t) =>
  t.prismaField({
    type: 'DocumentTemplate',
    args: {
      id: t.arg.string({ required: true }),
      name: t.arg.string(),
      content: t.arg.string(),
      description: t.arg.string(),
      placeholders: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const existing = await ctx.prisma.documentTemplate.findUnique({ where: { id: args.id } });
      if (!existing) throw new Error('Template not found');
      return ctx.prisma.documentTemplate.update({
        ...query,
        where: { id: args.id },
        data: {
          ...(args.name && { name: args.name }),
          ...(args.content && { content: args.content }),
          ...(args.description && { description: args.description }),
          ...(args.placeholders && { placeholders: args.placeholders }),
          version: existing.version + 1,
        },
      });
    },
  }),
);

builder.mutationField('deleteDocumentTemplate', (t) =>
  t.prismaField({
    type: 'DocumentTemplate',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.documentTemplate.delete({ ...query, where: { id: args.id } }),
  }),
);

builder.mutationField('renderTemplate', (t) =>
  t.field({
    type: 'String',
    args: {
      id: t.arg.string({ required: true }),
      variables: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const template = await ctx.prisma.documentTemplate.findUnique({ where: { id: args.id } });
      if (!template) throw new Error('Template not found');

      let rendered = template.content;
      try {
        const vars = JSON.parse(args.variables) as Record<string, string>;
        for (const [key, value] of Object.entries(vars)) {
          rendered = rendered.replaceAll(`{{${key}}}`, value);
        }
      } catch {
        throw new Error('Invalid JSON variables string');
      }
      return rendered;
    },
  }),
);
