import { builder } from '../builder.js';
import { prisma } from '../context.js';

builder.prismaObject('TimeCharter', {
  fields: (t) => ({
    id: t.exposeID('id'),
    reference: t.exposeString('reference'),
    direction: t.exposeString('direction'),
    charterId: t.exposeString('charterId', { nullable: true }),
    vesselId: t.exposeString('vesselId'),
    chartererId: t.exposeString('chartererId', { nullable: true }),
    hireRate: t.exposeFloat('hireRate'),
    currency: t.exposeString('currency'),
    deliveryDate: t.expose('deliveryDate', { type: 'DateTime', nullable: true }),
    deliveryPort: t.exposeString('deliveryPort', { nullable: true }),
    redeliveryDate: t.expose('redeliveryDate', { type: 'DateTime', nullable: true }),
    redeliveryPort: t.exposeString('redeliveryPort', { nullable: true }),
    minDuration: t.exposeInt('minDuration', { nullable: true }),
    maxDuration: t.exposeInt('maxDuration', { nullable: true }),
    redeliveryNotice: t.exposeInt('redeliveryNotice', { nullable: true }),
    balSpeed: t.exposeFloat('balSpeed', { nullable: true }),
    ladenSpeed: t.exposeFloat('ladenSpeed', { nullable: true }),
    balConsumption: t.exposeFloat('balConsumption', { nullable: true }),
    ladenConsumption: t.exposeFloat('ladenConsumption', { nullable: true }),
    bunkerDeliveryFO: t.exposeFloat('bunkerDeliveryFO', { nullable: true }),
    bunkerDeliveryDO: t.exposeFloat('bunkerDeliveryDO', { nullable: true }),
    bunkerPriceAtDel: t.exposeFloat('bunkerPriceAtDel', { nullable: true }),
    status: t.exposeString('status'),
    notes: t.exposeString('notes', { nullable: true }),
    charter: t.relation('charter', { nullable: true }),
    vessel: t.relation('vessel'),
    hirePayments: t.relation('hirePayments'),
    offHires: t.relation('offHires'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('HirePayment', {
  fields: (t) => ({
    id: t.exposeID('id'),
    timeCharterId: t.exposeString('timeCharterId'),
    periodFrom: t.expose('periodFrom', { type: 'DateTime' }),
    periodTo: t.expose('periodTo', { type: 'DateTime' }),
    hireRate: t.exposeFloat('hireRate'),
    totalDays: t.exposeFloat('totalDays'),
    grossAmount: t.exposeFloat('grossAmount'),
    deductions: t.exposeFloat('deductions'),
    netAmount: t.exposeFloat('netAmount'),
    currency: t.exposeString('currency'),
    status: t.exposeString('status'),
    dueDate: t.expose('dueDate', { type: 'DateTime', nullable: true }),
    paidDate: t.expose('paidDate', { type: 'DateTime', nullable: true }),
    reference: t.exposeString('reference', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    timeCharter: t.relation('timeCharter'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('OffHire', {
  fields: (t) => ({
    id: t.exposeID('id'),
    timeCharterId: t.exposeString('timeCharterId'),
    offHireFrom: t.expose('offHireFrom', { type: 'DateTime' }),
    offHireTo: t.expose('offHireTo', { type: 'DateTime', nullable: true }),
    reason: t.exposeString('reason'),
    clause: t.exposeString('clause', { nullable: true }),
    totalHours: t.exposeFloat('totalHours', { nullable: true }),
    hireRate: t.exposeFloat('hireRate', { nullable: true }),
    deductionAmount: t.exposeFloat('deductionAmount', { nullable: true }),
    currency: t.exposeString('currency'),
    status: t.exposeString('status'),
    notes: t.exposeString('notes', { nullable: true }),
    timeCharter: t.relation('timeCharter'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// === Queries ===

builder.queryField('timeCharters', (t) =>
  t.prismaField({
    type: ['TimeCharter'],
    args: {
      direction: t.arg.string({ required: false }),
      status: t.arg.string({ required: false }),
      vesselId: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args, ctx) =>
      prisma.timeCharter.findMany({
        ...query,
        where: {
          ...ctx.orgFilter(),
          ...(args.direction ? { direction: args.direction } : {}),
          ...(args.status ? { status: args.status } : {}),
          ...(args.vesselId ? { vesselId: args.vesselId } : {}),
        },
        orderBy: { createdAt: 'desc' },
      }),
  }),
);

builder.queryField('timeCharter', (t) =>
  t.prismaField({
    type: 'TimeCharter',
    nullable: true,
    args: { id: t.arg.string({ required: true }) },
    resolve: (query, _root, args) =>
      prisma.timeCharter.findUnique({ ...query, where: { id: args.id } }),
  }),
);

builder.queryField('hirePayments', (t) =>
  t.prismaField({
    type: ['HirePayment'],
    args: {
      timeCharterId: t.arg.string({ required: true }),
      status: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.hirePayment.findMany({
        ...query,
        where: {
          timeCharterId: args.timeCharterId,
          ...(args.status ? { status: args.status } : {}),
        },
        orderBy: { periodFrom: 'desc' },
      }),
  }),
);

builder.queryField('offHires', (t) =>
  t.prismaField({
    type: ['OffHire'],
    args: { timeCharterId: t.arg.string({ required: true }) },
    resolve: (query, _root, args) =>
      prisma.offHire.findMany({
        ...query,
        where: { timeCharterId: args.timeCharterId },
        orderBy: { offHireFrom: 'desc' },
      }),
  }),
);

// === Mutations ===

builder.mutationField('createTimeCharter', (t) =>
  t.prismaField({
    type: 'TimeCharter',
    args: {
      direction: t.arg.string({ required: true }),
      vesselId: t.arg.string({ required: true }),
      hireRate: t.arg.float({ required: true }),
      currency: t.arg.string({ required: false }),
      charterId: t.arg.string({ required: false }),
      chartererId: t.arg.string({ required: false }),
      deliveryDate: t.arg.string({ required: false }),
      deliveryPort: t.arg.string({ required: false }),
      redeliveryDate: t.arg.string({ required: false }),
      redeliveryPort: t.arg.string({ required: false }),
      minDuration: t.arg.int({ required: false }),
      maxDuration: t.arg.int({ required: false }),
      redeliveryNotice: t.arg.int({ required: false }),
      balSpeed: t.arg.float({ required: false }),
      ladenSpeed: t.arg.float({ required: false }),
      balConsumption: t.arg.float({ required: false }),
      ladenConsumption: t.arg.float({ required: false }),
      notes: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args, ctx) => {
      const count = await prisma.timeCharter.count();
      const prefix = args.direction === 'tc_in' ? 'TCI' : 'TCO';
      const reference = `${prefix}-${String(count + 1).padStart(4, '0')}`;
      return prisma.timeCharter.create({
        ...query,
        data: {
          reference,
          direction: args.direction,
          vesselId: args.vesselId,
          hireRate: args.hireRate,
          currency: args.currency ?? 'USD',
          charterId: args.charterId,
          chartererId: args.chartererId,
          deliveryDate: args.deliveryDate ? new Date(args.deliveryDate) : null,
          deliveryPort: args.deliveryPort,
          redeliveryDate: args.redeliveryDate ? new Date(args.redeliveryDate) : null,
          redeliveryPort: args.redeliveryPort,
          minDuration: args.minDuration,
          maxDuration: args.maxDuration,
          redeliveryNotice: args.redeliveryNotice,
          balSpeed: args.balSpeed,
          ladenSpeed: args.ladenSpeed,
          balConsumption: args.balConsumption,
          ladenConsumption: args.ladenConsumption,
          notes: args.notes,
          organizationId: ctx.orgId(),
        },
      });
    },
  }),
);

builder.mutationField('createHirePayment', (t) =>
  t.prismaField({
    type: 'HirePayment',
    args: {
      timeCharterId: t.arg.string({ required: true }),
      periodFrom: t.arg.string({ required: true }),
      periodTo: t.arg.string({ required: true }),
      deductions: t.arg.float({ required: false }),
      notes: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args) => {
      const tc = await prisma.timeCharter.findUniqueOrThrow({ where: { id: args.timeCharterId } });
      const from = new Date(args.periodFrom);
      const to = new Date(args.periodTo);
      const totalDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
      const grossAmount = totalDays * tc.hireRate;
      const deductions = args.deductions ?? 0;
      const netAmount = grossAmount - deductions;
      const dueDate = new Date(from);
      dueDate.setDate(dueDate.getDate() - 3); // 3 days before period starts
      return prisma.hirePayment.create({
        ...query,
        data: {
          timeCharterId: args.timeCharterId,
          periodFrom: from,
          periodTo: to,
          hireRate: tc.hireRate,
          totalDays,
          grossAmount,
          deductions,
          netAmount,
          currency: tc.currency,
          dueDate,
          notes: args.notes,
        },
      });
    },
  }),
);

builder.mutationField('createOffHire', (t) =>
  t.prismaField({
    type: 'OffHire',
    args: {
      timeCharterId: t.arg.string({ required: true }),
      offHireFrom: t.arg.string({ required: true }),
      offHireTo: t.arg.string({ required: false }),
      reason: t.arg.string({ required: true }),
      clause: t.arg.string({ required: false }),
      notes: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args) => {
      const tc = await prisma.timeCharter.findUniqueOrThrow({ where: { id: args.timeCharterId } });
      const from = new Date(args.offHireFrom);
      const to = args.offHireTo ? new Date(args.offHireTo) : null;
      const totalHours = to ? (to.getTime() - from.getTime()) / (1000 * 60 * 60) : null;
      const deductionAmount = totalHours ? (totalHours / 24) * tc.hireRate : null;
      return prisma.offHire.create({
        ...query,
        data: {
          timeCharterId: args.timeCharterId,
          offHireFrom: from,
          offHireTo: to,
          reason: args.reason,
          clause: args.clause,
          totalHours,
          hireRate: tc.hireRate,
          deductionAmount,
          currency: tc.currency,
          notes: args.notes,
        },
      });
    },
  }),
);
