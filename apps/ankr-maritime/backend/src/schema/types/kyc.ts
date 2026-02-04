import { builder } from '../builder.js';
import { prisma } from '../context.js';

builder.prismaObject('KYCRecord', {
  fields: (t) => ({
    id: t.exposeID('id'),
    companyId: t.exposeString('companyId'),
    status: t.exposeString('status'),
    riskScore: t.exposeInt('riskScore', { nullable: true }),
    uboName: t.exposeString('uboName', { nullable: true }),
    uboNationality: t.exposeString('uboNationality', { nullable: true }),
    uboPepCheck: t.exposeBoolean('uboPepCheck'),
    sanctionsCheck: t.exposeBoolean('sanctionsCheck'),
    sanctionsResult: t.exposeString('sanctionsResult', { nullable: true }),
    sanctionsDate: t.expose('sanctionsDate', { type: 'DateTime', nullable: true }),
    taxId: t.exposeString('taxId', { nullable: true }),
    maritimeLicense: t.exposeString('maritimeLicense', { nullable: true }),
    reviewer: t.exposeString('reviewer', { nullable: true }),
    reviewNotes: t.exposeString('reviewNotes', { nullable: true }),
    lastChecked: t.expose('lastChecked', { type: 'DateTime', nullable: true }),
    nextReview: t.expose('nextReview', { type: 'DateTime', nullable: true }),
    company: t.relation('company'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.queryField('kycRecords', (t) =>
  t.prismaField({
    type: ['KYCRecord'],
    args: {
      companyId: t.arg.string({ required: false }),
      status: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args, ctx) =>
      prisma.kYCRecord.findMany({
        ...query,
        where: {
          ...ctx.orgFilter(),
          ...(args.companyId ? { companyId: args.companyId } : {}),
          ...(args.status ? { status: args.status } : {}),
        },
        orderBy: { createdAt: 'desc' },
      }),
  }),
);

builder.queryField('kycRecord', (t) =>
  t.prismaField({
    type: 'KYCRecord',
    nullable: true,
    args: { companyId: t.arg.string({ required: true }) },
    resolve: (query, _root, args) =>
      prisma.kYCRecord.findFirst({
        ...query,
        where: { companyId: args.companyId },
        orderBy: { createdAt: 'desc' },
      }),
  }),
);

builder.mutationField('createKYCRecord', (t) =>
  t.prismaField({
    type: 'KYCRecord',
    args: {
      companyId: t.arg.string({ required: true }),
      uboName: t.arg.string({ required: false }),
      uboNationality: t.arg.string({ required: false }),
      taxId: t.arg.string({ required: false }),
      maritimeLicense: t.arg.string({ required: false }),
      reviewNotes: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args, ctx) =>
      prisma.kYCRecord.create({
        ...query,
        data: {
          companyId: args.companyId,
          uboName: args.uboName,
          uboNationality: args.uboNationality,
          taxId: args.taxId,
          maritimeLicense: args.maritimeLicense,
          reviewNotes: args.reviewNotes,
          organizationId: ctx.orgId(),
        },
      }),
  }),
);

builder.mutationField('updateKYCStatus', (t) =>
  t.prismaField({
    type: 'KYCRecord',
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg.string({ required: true }),
      riskScore: t.arg.int({ required: false }),
      sanctionsResult: t.arg.string({ required: false }),
      reviewer: t.arg.string({ required: false }),
      reviewNotes: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.kYCRecord.update({
        ...query,
        where: { id: args.id },
        data: {
          status: args.status,
          riskScore: args.riskScore,
          sanctionsResult: args.sanctionsResult,
          sanctionsCheck: args.sanctionsResult ? true : undefined,
          sanctionsDate: args.sanctionsResult ? new Date() : undefined,
          reviewer: args.reviewer,
          reviewNotes: args.reviewNotes,
          lastChecked: new Date(),
        },
      }),
  }),
);
