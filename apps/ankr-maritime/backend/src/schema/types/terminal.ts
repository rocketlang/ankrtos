import { builder } from '../builder.js';
import { prisma } from '../context.js';

builder.prismaObject('Terminal', {
  fields: (t) => ({
    id: t.exposeID('id'),
    portId: t.exposeString('portId'),
    name: t.exposeString('name'),
    operator: t.exposeString('operator', { nullable: true }),
    berthCount: t.exposeInt('berthCount'),
    cargoTypes: t.exposeStringList('cargoTypes'),
    maxDraft: t.exposeFloat('maxDraft', { nullable: true }),
    maxLOA: t.exposeFloat('maxLOA', { nullable: true }),
    maxBeam: t.exposeFloat('maxBeam', { nullable: true }),
    workingHours: t.exposeString('workingHours', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    port: t.relation('port'),
    berths: t.relation('berths'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

builder.prismaObject('Berth', {
  fields: (t) => ({
    id: t.exposeID('id'),
    terminalId: t.exposeString('terminalId'),
    name: t.exposeString('name'),
    length: t.exposeFloat('length', { nullable: true }),
    depth: t.exposeFloat('depth', { nullable: true }),
    cargoTypes: t.exposeStringList('cargoTypes'),
    craneSpecs: t.exposeString('craneSpecs', { nullable: true }),
    status: t.exposeString('status'),
    terminal: t.relation('terminal'),
  }),
});

// Duplicate - PortTariff is defined in port-tariff.ts
/* builder.prismaObject('PortTariff', {
  fields: (t) => ({
    id: t.exposeID('id'),
    portId: t.exposeString('portId'),
    vesselType: t.exposeString('vesselType', { nullable: true }),
    sizeRangeMin: t.exposeFloat('sizeRangeMin', { nullable: true }),
    sizeRangeMax: t.exposeFloat('sizeRangeMax', { nullable: true }),
    chargeType: t.exposeString('chargeType'),
    amount: t.exposeFloat('amount'),
    currency: t.exposeString('currency'),
    unit: t.exposeString('unit'),
    effectiveFrom: t.expose('effectiveFrom', { type: 'DateTime' }),
    effectiveTo: t.expose('effectiveTo', { type: 'DateTime', nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    port: t.relation('port'),
  }),
}); */

builder.prismaObject('PortHoliday', {
  fields: (t) => ({
    id: t.exposeID('id'),
    portId: t.exposeString('portId'),
    date: t.expose('date', { type: 'DateTime' }),
    name: t.exposeString('name'),
    affectsLaytime: t.exposeBoolean('affectsLaytime'),
    country: t.exposeString('country', { nullable: true }),
    recurring: t.exposeBoolean('recurring'),
    port: t.relation('port'),
  }),
});

builder.prismaObject('CanalTransit', {
  fields: (t) => ({
    id: t.exposeID('id'),
    canal: t.exposeString('canal'),
    vesselType: t.exposeString('vesselType', { nullable: true }),
    sizeRangeMin: t.exposeFloat('sizeRangeMin', { nullable: true }),
    sizeRangeMax: t.exposeFloat('sizeRangeMax', { nullable: true }),
    baseCost: t.exposeFloat('baseCost'),
    currency: t.exposeString('currency'),
    calculationRule: t.exposeString('calculationRule', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
  }),
});

// === Queries ===

builder.queryField('terminals', (t) =>
  t.prismaField({
    type: ['Terminal'],
    args: { portId: t.arg.string({ required: false }) },
    resolve: (query, _root, args) =>
      prisma.terminal.findMany({
        ...query,
        where: args.portId ? { portId: args.portId } : {},
        orderBy: { name: 'asc' },
      }),
  }),
);

// Duplicate - portTariffs query is defined in port-tariff.ts
/* builder.queryField('portTariffs', (t) =>
  t.prismaField({
    type: ['PortTariff'],
    args: {
      portId: t.arg.string({ required: true }),
      vesselType: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.portTariff.findMany({
        ...query,
        where: {
          portId: args.portId,
          ...(args.vesselType ? { OR: [{ vesselType: args.vesselType }, { vesselType: null }] } : {}),
        },
        orderBy: { chargeType: 'asc' },
      }),
  }),
); */

builder.queryField('portHolidays', (t) =>
  t.prismaField({
    type: ['PortHoliday'],
    args: { portId: t.arg.string({ required: true }) },
    resolve: (query, _root, args) =>
      prisma.portHoliday.findMany({
        ...query,
        where: { portId: args.portId },
        orderBy: { date: 'asc' },
      }),
  }),
);

builder.queryField('canalTransits', (t) =>
  t.prismaField({
    type: ['CanalTransit'],
    args: { canal: t.arg.string({ required: false }) },
    resolve: (query, _root, args) =>
      prisma.canalTransit.findMany({
        ...query,
        where: args.canal ? { canal: args.canal } : {},
        orderBy: { canal: 'asc' },
      }),
  }),
);

// === Mutations ===

builder.mutationField('createTerminal', (t) =>
  t.prismaField({
    type: 'Terminal',
    args: {
      portId: t.arg.string({ required: true }),
      name: t.arg.string({ required: true }),
      operator: t.arg.string({ required: false }),
      berthCount: t.arg.int({ required: false }),
      cargoTypes: t.arg.stringList({ required: false }),
      maxDraft: t.arg.float({ required: false }),
      maxLOA: t.arg.float({ required: false }),
      maxBeam: t.arg.float({ required: false }),
      workingHours: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.terminal.create({
        ...query,
        data: {
          portId: args.portId,
          name: args.name,
          operator: args.operator,
          berthCount: args.berthCount ?? 0,
          cargoTypes: args.cargoTypes ?? [],
          maxDraft: args.maxDraft,
          maxLOA: args.maxLOA,
          maxBeam: args.maxBeam,
          workingHours: args.workingHours,
        },
      }),
  }),
);

builder.mutationField('createPortTariff', (t) =>
  t.prismaField({
    type: 'PortTariff',
    args: {
      portId: t.arg.string({ required: true }),
      chargeType: t.arg.string({ required: true }),
      amount: t.arg.float({ required: true }),
      currency: t.arg.string({ required: false }),
      unit: t.arg.string({ required: false }),
      vesselType: t.arg.string({ required: false }),
      sizeRangeMin: t.arg.float({ required: false }),
      sizeRangeMax: t.arg.float({ required: false }),
      notes: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.portTariff.create({
        ...query,
        data: {
          portId: args.portId,
          chargeType: args.chargeType,
          amount: args.amount,
          currency: args.currency ?? 'USD',
          unit: args.unit ?? 'per_grt',
          vesselType: args.vesselType,
          sizeRangeMin: args.sizeRangeMin,
          sizeRangeMax: args.sizeRangeMax,
          notes: args.notes,
        },
      }),
  }),
);
