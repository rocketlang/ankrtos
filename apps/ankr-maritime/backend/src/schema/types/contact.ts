import { builder } from '../builder.js';
import { prisma } from '../context.js';

builder.prismaObject('Contact', {
  fields: (t) => ({
    id: t.exposeID('id'),
    companyId: t.exposeString('companyId'),
    firstName: t.exposeString('firstName'),
    lastName: t.exposeString('lastName'),
    email: t.exposeString('email', { nullable: true }),
    phone: t.exposeString('phone', { nullable: true }),
    mobile: t.exposeString('mobile', { nullable: true }),
    role: t.exposeString('role', { nullable: true }),
    designation: t.exposeString('designation', { nullable: true }),
    isPrimary: t.exposeBoolean('isPrimary'),
    notes: t.exposeString('notes', { nullable: true }),
    company: t.relation('company'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.queryField('contacts', (t) =>
  t.prismaField({
    type: ['Contact'],
    args: { companyId: t.arg.string({ required: false }) },
    resolve: (query, _root, args, ctx) =>
      prisma.contact.findMany({
        ...query,
        where: args.companyId ? { companyId: args.companyId } : {},
        orderBy: { isPrimary: 'desc' },
      }),
  }),
);

builder.queryField('contact', (t) =>
  t.prismaField({
    type: 'Contact',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args) =>
      prisma.contact.findUnique({ ...query, where: { id: args.id } }),
  }),
);

builder.mutationField('createContact', (t) =>
  t.prismaField({
    type: 'Contact',
    args: {
      companyId: t.arg.string({ required: true }),
      firstName: t.arg.string({ required: true }),
      lastName: t.arg.string({ required: true }),
      email: t.arg.string({ required: false }),
      phone: t.arg.string({ required: false }),
      mobile: t.arg.string({ required: false }),
      role: t.arg.string({ required: false }),
      designation: t.arg.string({ required: false }),
      isPrimary: t.arg.boolean({ required: false }),
      notes: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.contact.create({
        ...query,
        data: {
          companyId: args.companyId,
          firstName: args.firstName,
          lastName: args.lastName,
          email: args.email,
          phone: args.phone,
          mobile: args.mobile,
          role: args.role,
          designation: args.designation,
          isPrimary: args.isPrimary ?? false,
          notes: args.notes,
        },
      }),
  }),
);

builder.mutationField('deleteContact', (t) =>
  t.prismaField({
    type: 'Contact',
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args) =>
      prisma.contact.delete({ ...query, where: { id: args.id } }),
  }),
);
