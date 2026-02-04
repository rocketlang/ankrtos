/**
 * Master Alert GraphQL Schema
 *
 * GraphQL types, queries, mutations, and subscriptions for master alerts.
 */

import { builder } from '../builder';
import { prisma } from '../../lib/prisma';
import { alertOrchestratorService } from '../../services/alerts/alert-orchestrator.service';
import { notificationDispatcherService } from '../../services/alerts/notification-dispatcher.service';

// Enums
const AlertTypeEnum = builder.enumType('AlertType', {
  values: [
    'ARRIVAL_200NM',
    'DOCUMENT_MISSING',
    'DEADLINE_APPROACHING',
    'CONGESTION_HIGH',
    'DA_COST_HIGH',
    'ETA_CHANGED',
    'PORT_READINESS_RED',
    'ACTION_REQUIRED'
  ] as const
});

const AlertPriorityEnum = builder.enumType('AlertPriority', {
  values: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const
});

const AlertChannelEnum = builder.enumType('AlertChannel', {
  values: ['email', 'sms', 'whatsapp', 'telegram', 'in_app'] as const
});

const AlertStatusEnum = builder.enumType('AlertStatus', {
  values: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'ACKNOWLEDGED', 'FAILED'] as const
});

const ReplyIntentEnum = builder.enumType('ReplyIntent', {
  values: ['READY', 'DELAY', 'QUESTION', 'CONFIRM', 'UNKNOWN'] as const
});

// Object Types
const ParsedReplyType = builder.objectRef<{
  intent: string;
  confidence: number;
  entities: any;
  language?: string;
}>('ParsedReply').implement({
  fields: (t) => ({
    intent: t.field({
      type: ReplyIntentEnum,
      resolve: (parent) => parent.intent as any
    }),
    confidence: t.float({
      resolve: (parent) => parent.confidence
    }),
    entities: t.field({
      type: 'JSON',
      resolve: (parent) => parent.entities
    }),
    language: t.string({
      nullable: true,
      resolve: (parent) => parent.language
    })
  })
});

const MasterAlertType = builder.prismaObject('MasterAlert', {
  fields: (t) => ({
    id: t.exposeID('id'),
    arrivalId: t.exposeString('arrivalId'),
    vesselId: t.exposeString('vesselId'),

    alertType: t.field({
      type: AlertTypeEnum,
      resolve: (alert) => alert.alertType as any
    }),

    title: t.exposeString('title'),
    message: t.exposeString('message'),

    priority: t.field({
      type: AlertPriorityEnum,
      resolve: (alert) => alert.priority as any
    }),

    channels: t.field({
      type: [AlertChannelEnum],
      resolve: (alert) => (alert.channels as any[]) || []
    }),

    recipientEmail: t.string({
      nullable: true,
      resolve: (alert) => alert.recipientEmail
    }),

    recipientPhone: t.string({
      nullable: true,
      resolve: (alert) => alert.recipientPhone
    }),

    sentAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (alert) => alert.sentAt
    }),

    deliveredAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (alert) => alert.deliveredAt
    }),

    readAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (alert) => alert.readAt
    }),

    acknowledgedAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (alert) => alert.acknowledgedAt
    }),

    repliedAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (alert) => alert.repliedAt
    }),

    reply: t.string({
      nullable: true,
      resolve: (alert) => alert.reply
    }),

    replyParsed: t.field({
      type: ParsedReplyType,
      nullable: true,
      resolve: (alert) => alert.replyParsed as any
    }),

    actionTaken: t.string({
      nullable: true,
      resolve: (alert) => alert.actionTaken
    }),

    failedAt: t.field({
      type: 'DateTime',
      nullable: true,
      resolve: (alert) => alert.failedAt
    }),

    failureReason: t.string({
      nullable: true,
      resolve: (alert) => alert.failureReason
    }),

    metadata: t.field({
      type: 'JSON',
      nullable: true,
      resolve: (alert) => alert.metadata
    }),

    createdAt: t.field({
      type: 'DateTime',
      resolve: (alert) => alert.createdAt
    }),

    // Relations
    arrival: t.relation('arrival'),
    vessel: t.relation('vessel'),

    // Computed fields
    deliveryStatus: t.field({
      type: AlertStatusEnum,
      resolve: (alert) => {
        if (alert.failedAt) return 'FAILED';
        if (alert.acknowledgedAt) return 'ACKNOWLEDGED';
        if (alert.readAt) return 'READ';
        if (alert.deliveredAt) return 'DELIVERED';
        if (alert.sentAt) return 'SENT';
        return 'PENDING';
      }
    }),

    isDelivered: t.boolean({
      resolve: (alert) => !!alert.deliveredAt
    }),

    isRead: t.boolean({
      resolve: (alert) => !!alert.readAt
    }),

    hasReply: t.boolean({
      resolve: (alert) => !!alert.repliedAt
    }),

    requiresAction: t.boolean({
      resolve: (alert) => {
        // Requires action if master replied with question or unknown intent
        if (!alert.replyParsed) return false;
        const parsed = alert.replyParsed as any;
        return parsed.intent === 'QUESTION' || parsed.intent === 'UNKNOWN';
      }
    })
  })
});

// Queries
builder.queryFields((t) => ({
  masterAlerts: t.prismaField({
    type: [MasterAlertType],
    args: {
      arrivalId: t.arg.string({ required: false }),
      status: t.arg({ type: AlertStatusEnum, required: false })
    },
    resolve: async (query, root, args) => {
      const where: any = {};

      if (args.arrivalId) {
        where.arrivalId = args.arrivalId;
      }

      if (args.status) {
        // Filter by computed status
        switch (args.status) {
          case 'FAILED':
            where.failedAt = { not: null };
            break;
          case 'ACKNOWLEDGED':
            where.acknowledgedAt = { not: null };
            break;
          case 'READ':
            where.readAt = { not: null };
            where.acknowledgedAt = null;
            break;
          case 'DELIVERED':
            where.deliveredAt = { not: null };
            where.readAt = null;
            break;
          case 'SENT':
            where.sentAt = { not: null };
            where.deliveredAt = null;
            break;
          case 'PENDING':
            where.sentAt = null;
            break;
        }
      }

      return prisma.masterAlert.findMany({
        ...query,
        where,
        orderBy: {
          createdAt: 'desc'
        }
      });
    }
  }),

  masterAlert: t.prismaField({
    type: MasterAlertType,
    nullable: true,
    args: {
      id: t.arg.string({ required: true })
    },
    resolve: async (query, root, args) => {
      return prisma.masterAlert.findUnique({
        ...query,
        where: { id: args.id }
      });
    }
  }),

  pendingMasterReplies: t.prismaField({
    type: [MasterAlertType],
    args: {
      organizationId: t.arg.string({ required: false })
    },
    resolve: async (query, root, args) => {
      // Find alerts that have replies requiring action
      const alerts = await prisma.masterAlert.findMany({
        ...query,
        where: {
          repliedAt: { not: null },
          actionTaken: null,
          // TODO: Add organization filter when available
        },
        orderBy: {
          repliedAt: 'desc'
        },
        take: 50
      });

      // Filter to only those requiring action
      return alerts.filter(alert => {
        if (!alert.replyParsed) return true;
        const parsed = alert.replyParsed as any;
        return parsed.intent === 'QUESTION' || parsed.intent === 'UNKNOWN';
      });
    }
  })
}));

// Mutations
builder.mutationFields((t) => ({
  sendManualAlert: t.prismaField({
    type: MasterAlertType,
    args: {
      arrivalId: t.arg.string({ required: true }),
      message: t.arg.string({ required: true }),
      channels: t.arg({ type: [AlertChannelEnum], required: true }),
      priority: t.arg({ type: AlertPriorityEnum, required: false })
    },
    resolve: async (query, root, args, ctx) => {
      // Get arrival info
      const arrival = await prisma.vesselArrival.findUnique({
        where: { id: args.arrivalId },
        include: {
          vessel: true,
          port: true
        }
      });

      if (!arrival) {
        throw new Error('Arrival not found');
      }

      // Find master contact
      const master = await prisma.crewMember.findFirst({
        where: {
          rank: 'master',
          assignments: {
            some: {
              vesselId: arrival.vesselId,
              signOffDate: null
            }
          }
        }
      });

      if (!master) {
        throw new Error('No master found for this vessel');
      }

      // Create alert
      const alert = await prisma.masterAlert.create({
        ...query,
        data: {
          arrivalId: args.arrivalId,
          vesselId: arrival.vesselId,
          alertType: 'ACTION_REQUIRED',
          title: `${arrival.vessel.name} - Agent Message`,
          message: args.message,
          priority: args.priority || 'MEDIUM',
          channels: args.channels as any,
          recipientEmail: master.email || undefined,
          recipientPhone: master.phone || undefined,
          metadata: {
            manualAlert: true,
            sentBy: ctx.user?.id
          }
        }
      });

      // Dispatch alert
      const composedAlert = {
        arrivalId: args.arrivalId,
        vesselId: arrival.vesselId,
        alertType: 'ACTION_REQUIRED' as any,
        title: alert.title,
        message: alert.message,
        priority: alert.priority as any,
        channels: args.channels as any,
        recipientEmail: alert.recipientEmail,
        recipientPhone: alert.recipientPhone,
        metadata: alert.metadata as any
      };

      await notificationDispatcherService.dispatchAlert(alert.id, composedAlert);

      return alert;
    }
  }),

  acknowledgeMasterReply: t.prismaField({
    type: MasterAlertType,
    args: {
      alertId: t.arg.string({ required: true }),
      agentNote: t.arg.string({ required: false })
    },
    resolve: async (query, root, args, ctx) => {
      const alert = await prisma.masterAlert.update({
        ...query,
        where: { id: args.alertId },
        data: {
          acknowledgedAt: new Date(),
          actionTaken: args.agentNote || 'Acknowledged by agent'
        }
      });

      return alert;
    }
  }),

  resendAlert: t.prismaField({
    type: MasterAlertType,
    args: {
      alertId: t.arg.string({ required: true })
    },
    resolve: async (query, root, args) => {
      const alert = await prisma.masterAlert.findUnique({
        where: { id: args.alertId },
        include: {
          arrival: {
            include: {
              vessel: true,
              port: true
            }
          }
        }
      });

      if (!alert || !alert.arrival) {
        throw new Error('Alert not found');
      }

      // Reset delivery timestamps
      await prisma.masterAlert.update({
        where: { id: args.alertId },
        data: {
          sentAt: null,
          deliveredAt: null,
          failedAt: null,
          failureReason: null
        }
      });

      // Re-dispatch
      const composedAlert = {
        arrivalId: alert.arrivalId,
        vesselId: alert.vesselId,
        alertType: alert.alertType as any,
        title: alert.title,
        message: alert.message,
        priority: alert.priority as any,
        channels: alert.channels as any,
        recipientEmail: alert.recipientEmail,
        recipientPhone: alert.recipientPhone,
        metadata: alert.metadata as any
      };

      await notificationDispatcherService.dispatchAlert(alert.id, composedAlert);

      return prisma.masterAlert.findUnique({
        ...query,
        where: { id: args.alertId }
      });
    }
  })
}));

// Subscriptions
builder.subscriptionFields((t) => ({
  masterReplied: t.field({
    type: MasterAlertType,
    args: {
      arrivalId: t.arg.string({ required: false })
    },
    subscribe: (root, args) => {
      // TODO: Implement actual subscription with pubsub
      // For now, return empty async iterator
      return (async function* () {
        // This would be replaced with actual pubsub subscription
        yield null;
      })();
    },
    resolve: (payload) => payload
  }),

  alertDelivered: t.field({
    type: MasterAlertType,
    args: {
      arrivalId: t.arg.string({ required: false })
    },
    subscribe: (root, args) => {
      // TODO: Implement actual subscription with pubsub
      return (async function* () {
        yield null;
      })();
    },
    resolve: (payload) => payload
  })
}));
