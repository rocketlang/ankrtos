/**
 * Tariff Workflow & Alerts GraphQL Schema
 * Phase 6: DA Desk & Port Agency
 */

import { builder } from '../builder.js';
import { tariffUpdateWorkflowService } from '../../services/tariff-update-workflow.ts';
import { tariffChangeAlertsService } from '../../services/tariff-change-alerts.js';

// ========================================
// OBJECT TYPES
// ========================================

const TariffUpdateCycle = builder.objectRef<{
  id: string;
  quarter: string;
  year: number;
  scheduledDate: Date;
  status: string;
  portsUpdated: number;
  totalPorts: number;
  stakeholdersNotified: boolean;
  createdAt: Date;
  completedAt?: Date;
}>('TariffUpdateCycle').implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    quarter: t.exposeString('quarter'),
    year: t.exposeInt('year'),
    scheduledDate: t.expose('scheduledDate', { type: 'DateTime' }),
    status: t.exposeString('status'),
    portsUpdated: t.exposeInt('portsUpdated'),
    totalPorts: t.exposeInt('totalPorts'),
    stakeholdersNotified: t.exposeBoolean('stakeholdersNotified'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    completedAt: t.expose('completedAt', { type: 'DateTime', nullable: true }),
  }),
});

const UpdateReminder = builder.objectRef<{
  id: string;
  portId: string;
  portName: string;
  currentTariffDate: Date;
  nextUpdateDue: Date;
  daysUntilDue: number;
  priority: string;
  notificationsSent: number;
  lastNotifiedAt?: Date;
}>('UpdateReminder').implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    portId: t.exposeString('portId'),
    portName: t.exposeString('portName'),
    currentTariffDate: t.expose('currentTariffDate', { type: 'DateTime' }),
    nextUpdateDue: t.expose('nextUpdateDue', { type: 'DateTime' }),
    daysUntilDue: t.exposeInt('daysUntilDue'),
    priority: t.exposeString('priority'),
    notificationsSent: t.exposeInt('notificationsSent'),
    lastNotifiedAt: t.expose('lastNotifiedAt', { type: 'DateTime', nullable: true }),
  }),
});

const TariffChangeAlert = builder.objectRef<{
  id: string;
  portId: string;
  portName: string;
  serviceType: string;
  changeType: string;
  oldAmount?: number;
  newAmount: number;
  changePercent: number;
  changeAmount: number;
  currency: string;
  effectiveDate: Date;
  severity: string;
  affectedVoyages: number;
  estimatedImpact: number;
  notificationsSent: number;
  createdAt: Date;
}>('TariffChangeAlert').implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    portId: t.exposeString('portId'),
    portName: t.exposeString('portName'),
    serviceType: t.exposeString('serviceType'),
    changeType: t.exposeString('changeType'),
    oldAmount: t.exposeFloat('oldAmount', { nullable: true }),
    newAmount: t.exposeFloat('newAmount'),
    changePercent: t.exposeFloat('changePercent'),
    changeAmount: t.exposeFloat('changeAmount'),
    currency: t.exposeString('currency'),
    effectiveDate: t.expose('effectiveDate', { type: 'DateTime' }),
    severity: t.exposeString('severity'),
    affectedVoyages: t.exposeInt('affectedVoyages'),
    estimatedImpact: t.exposeFloat('estimatedImpact'),
    notificationsSent: t.exposeInt('notificationsSent'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

const CostTrend = builder.objectRef<{
  data: { date: Date; amount: number }[];
  trend: string;
  averageChange: number;
}>('CostTrend').implement({
  fields: (t) => ({
    data: t.field({
      type: 'JSON',
      resolve: (parent) => parent.data,
    }),
    trend: t.exposeString('trend'),
    averageChange: t.exposeFloat('averageChange'),
  }),
});

// ========================================
// QUERIES
// ========================================

builder.queryFields((t) => ({
  updateCycle: t.field({
    type: TariffUpdateCycle,
    nullable: true,
    args: {
      cycleId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      // In production: fetch from database
      return {
        id: args.cycleId,
        quarter: 'Q1',
        year: 2026,
        scheduledDate: new Date('2026-01-15'),
        status: 'in_progress',
        portsUpdated: 45,
        totalPorts: 100,
        stakeholdersNotified: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      };
    },
  }),

  updateHistory: t.field({
    type: [TariffUpdateCycle],
    args: {
      limit: t.arg.int({ defaultValue: 10 }),
    },
    resolve: async (root, args, ctx) => {
      return await tariffUpdateWorkflowService.getUpdateHistory(
        ctx.user!.organizationId,
        args.limit
      );
    },
  }),

  upcomingReminders: t.field({
    type: [UpdateReminder],
    args: {
      daysAhead: t.arg.int({ defaultValue: 30 }),
    },
    resolve: async (root, args, ctx) => {
      return await tariffUpdateWorkflowService.getUpcomingReminders(
        ctx.user!.organizationId,
        args.daysAhead
      );
    },
  }),

  tariffAlerts: t.field({
    type: [TariffChangeAlert],
    args: {
      portIds: t.arg.stringList(),
      severity: t.arg.stringList(),
      changeType: t.arg.stringList(),
    },
    resolve: async (root, args, ctx) => {
      return await tariffChangeAlertsService.getAlerts(ctx.user!.organizationId, {
        portIds: args.portIds || undefined,
        severity: args.severity || undefined,
        changeType: args.changeType || undefined,
      });
    },
  }),

  portCostTrend: t.field({
    type: CostTrend,
    args: {
      portId: t.arg.string({ required: true }),
      serviceType: t.arg.string({ required: true }),
      months: t.arg.int({ defaultValue: 12 }),
    },
    resolve: async (root, args, ctx) => {
      return await tariffChangeAlertsService.getCostTrend(
        args.portId,
        args.serviceType,
        args.months
      );
    },
  }),
}));

// ========================================
// MUTATIONS
// ========================================

builder.mutationFields((t) => ({
  createUpdateCycle: t.field({
    type: TariffUpdateCycle,
    authScopes: { manager: true },
    args: {
      quarter: t.arg.string({ required: true }),
      year: t.arg.int({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await tariffUpdateWorkflowService.createUpdateCycle(args.quarter, args.year);
    },
  }),

  startUpdateCycle: t.field({
    type: TariffUpdateCycle,
    authScopes: { manager: true },
    args: {
      cycleId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await tariffUpdateWorkflowService.startUpdateCycle(
        args.cycleId,
        ctx.user!.organizationId
      );
    },
  }),

  completeUpdateCycle: t.field({
    type: TariffUpdateCycle,
    authScopes: { manager: true },
    args: {
      cycleId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      return await tariffUpdateWorkflowService.completeUpdateCycle(args.cycleId);
    },
  }),

  subscribeToAlerts: t.field({
    type: 'Boolean',
    args: {
      portIds: t.arg.stringList({ required: true }),
      serviceTypes: t.arg.stringList({ required: true }),
      minChangePercent: t.arg.float({ defaultValue: 5.0 }),
    },
    resolve: async (root, args, ctx) => {
      await tariffChangeAlertsService.subscribe({
        userId: ctx.user!.id,
        portIds: args.portIds,
        serviceTypes: args.serviceTypes,
        minChangePercent: args.minChangePercent,
        notifyOnIncrease: true,
        notifyOnDecrease: true,
        notifyOnNewServices: true,
      });
      return true;
    },
  }),

  unsubscribeFromAlerts: t.field({
    type: 'Boolean',
    args: {
      portId: t.arg.string({ required: true }),
    },
    resolve: async (root, args, ctx) => {
      await tariffChangeAlertsService.unsubscribe(ctx.user!.id, args.portId);
      return true;
    },
  }),
}));
