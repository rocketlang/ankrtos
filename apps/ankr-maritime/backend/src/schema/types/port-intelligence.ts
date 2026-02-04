import { builder } from '../builder.js';
import { prisma } from '../context.js';

// === Anchorage ===

builder.prismaObject('Anchorage', {
  fields: (t) => ({
    id: t.exposeID('id'),
    portId: t.exposeString('portId'),
    name: t.exposeString('name'),
    latitude: t.exposeFloat('latitude', { nullable: true }),
    longitude: t.exposeFloat('longitude', { nullable: true }),
    depth: t.exposeFloat('depth', { nullable: true }),
    holdingGround: t.exposeString('holdingGround', { nullable: true }),
    maxVessels: t.exposeInt('maxVessels', { nullable: true }),
    shelter: t.exposeString('shelter', { nullable: true }),
    cargoOps: t.exposeBoolean('cargoOps'),
    notes: t.exposeString('notes', { nullable: true }),
    port: t.relation('port'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

builder.queryField('anchorages', (t) =>
  t.prismaField({
    type: ['Anchorage'],
    args: {
      portId: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args) =>
      prisma.anchorage.findMany({
        ...query,
        where: { portId: args.portId },
      }),
  }),
);

builder.mutationField('createAnchorage', (t) =>
  t.prismaField({
    type: 'Anchorage',
    args: {
      portId: t.arg.string({ required: true }),
      name: t.arg.string({ required: true }),
      latitude: t.arg.float({ required: false }),
      longitude: t.arg.float({ required: false }),
      depth: t.arg.float({ required: false }),
      holdingGround: t.arg.string({ required: false }),
      maxVessels: t.arg.int({ required: false }),
      shelter: t.arg.string({ required: false }),
      cargoOps: t.arg.boolean({ required: false }),
      notes: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.anchorage.create({
        ...query,
        data: {
          portId: args.portId,
          name: args.name,
          latitude: args.latitude,
          longitude: args.longitude,
          depth: args.depth,
          holdingGround: args.holdingGround,
          maxVessels: args.maxVessels,
          shelter: args.shelter,
          cargoOps: args.cargoOps ?? false,
          notes: args.notes,
        },
      }),
  }),
);

// === Port Working Hours ===

builder.prismaObject('PortWorkingHours', {
  fields: (t) => ({
    id: t.exposeID('id'),
    portId: t.exposeString('portId'),
    dayOfWeek: t.exposeInt('dayOfWeek'),
    shiftName: t.exposeString('shiftName'),
    startTime: t.exposeString('startTime'),
    endTime: t.exposeString('endTime'),
    cargoTypes: t.exposeStringList('cargoTypes'),
    notes: t.exposeString('notes', { nullable: true }),
    port: t.relation('port'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

builder.queryField('portWorkingHours', (t) =>
  t.prismaField({
    type: ['PortWorkingHours'],
    args: {
      portId: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args) =>
      prisma.portWorkingHours.findMany({
        ...query,
        where: { portId: args.portId },
        orderBy: { dayOfWeek: 'asc' },
      }),
  }),
);

builder.mutationField('setPortWorkingHours', (t) =>
  t.prismaField({
    type: 'PortWorkingHours',
    args: {
      portId: t.arg.string({ required: true }),
      dayOfWeek: t.arg.int({ required: true }),
      shiftName: t.arg.string({ required: true }),
      startTime: t.arg.string({ required: true }),
      endTime: t.arg.string({ required: true }),
      cargoTypes: t.arg.stringList({ required: false }),
      notes: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.portWorkingHours.create({
        ...query,
        data: {
          portId: args.portId,
          dayOfWeek: args.dayOfWeek,
          shiftName: args.shiftName,
          startTime: args.startTime,
          endTime: args.endTime,
          cargoTypes: args.cargoTypes ?? [],
          notes: args.notes,
        },
      }),
  }),
);

// === Port Document Requirements ===

builder.prismaObject('PortDocumentRequirement', {
  fields: (t) => ({
    id: t.exposeID('id'),
    portId: t.exposeString('portId'),
    country: t.exposeString('country'),
    documentName: t.exposeString('documentName'),
    category: t.exposeString('category'),
    required: t.exposeBoolean('required'),
    leadTimeDays: t.exposeInt('leadTimeDays', { nullable: true }),
    notes: t.exposeString('notes', { nullable: true }),
    port: t.relation('port'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

builder.queryField('portDocumentRequirements', (t) =>
  t.prismaField({
    type: ['PortDocumentRequirement'],
    args: {
      portId: t.arg.string({ required: true }),
      category: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.portDocumentRequirement.findMany({
        ...query,
        where: {
          portId: args.portId,
          ...(args.category ? { category: args.category } : {}),
        },
      }),
  }),
);

builder.mutationField('addPortDocumentRequirement', (t) =>
  t.prismaField({
    type: 'PortDocumentRequirement',
    args: {
      portId: t.arg.string({ required: true }),
      country: t.arg.string({ required: true }),
      documentName: t.arg.string({ required: true }),
      category: t.arg.string({ required: false }),
      required: t.arg.boolean({ required: false }),
      leadTimeDays: t.arg.int({ required: false }),
      notes: t.arg.string({ required: false }),
    },
    resolve: (query, _root, args) =>
      prisma.portDocumentRequirement.create({
        ...query,
        data: {
          portId: args.portId,
          country: args.country,
          documentName: args.documentName,
          category: args.category ?? 'arrival',
          required: args.required ?? true,
          leadTimeDays: args.leadTimeDays,
          notes: args.notes,
        },
      }),
  }),
);
