/**
 * Subscription Resolvers — 11 GraphQL subscription fields with facilityId filtering
 */

import { SUBSCRIPTION_TOPICS } from './pubsub';

/**
 * Create a subscription resolver that subscribes to a topic scoped by facilityId.
 * The event bridge publishes to `TOPIC:facilityId`, so we subscribe to that key.
 */
function makeSubscription(topic: string, field: string) {
  return {
    subscribe: async (
      _root: unknown,
      args: { facilityId: string },
      { pubsub }: { pubsub: { subscribe: (topic: string) => AsyncIterable<Record<string, unknown>> } },
    ) => {
      return pubsub.subscribe(`${topic}:${args.facilityId}`);
    },
    resolve: (payload: Record<string, unknown>) => {
      return payload[field];
    },
  };
}

export const subscriptionResolvers: Record<string, ReturnType<typeof makeSubscription>> = {
  containerStatusChanged: makeSubscription(
    SUBSCRIPTION_TOPICS.CONTAINER_STATUS_CHANGED,
    'containerStatusChanged',
  ),
  containerMoved: makeSubscription(
    SUBSCRIPTION_TOPICS.CONTAINER_MOVED,
    'containerMoved',
  ),
  gateTransactionUpdated: makeSubscription(
    SUBSCRIPTION_TOPICS.GATE_TRANSACTION_UPDATED,
    'gateTransactionUpdated',
  ),
  rakeStatusChanged: makeSubscription(
    SUBSCRIPTION_TOPICS.RAKE_STATUS_CHANGED,
    'rakeStatusChanged',
  ),
  vesselStatusChanged: makeSubscription(
    SUBSCRIPTION_TOPICS.VESSEL_STATUS_CHANGED,
    'vesselStatusChanged',
  ),
  equipmentAlert: makeSubscription(
    SUBSCRIPTION_TOPICS.EQUIPMENT_ALERT,
    'equipmentAlert',
  ),
  yardCapacityAlert: makeSubscription(
    SUBSCRIPTION_TOPICS.YARD_CAPACITY_ALERT,
    'yardCapacityAlert',
  ),
  reeferAlarm: makeSubscription(
    SUBSCRIPTION_TOPICS.REEFER_ALARM,
    'reeferAlarm',
  ),
  sensorAlert: makeSubscription(
    SUBSCRIPTION_TOPICS.SENSOR_ALERT,
    'sensorAlert',
  ),
  operationCompleted: makeSubscription(
    SUBSCRIPTION_TOPICS.OPERATION_COMPLETED,
    'operationCompleted',
  ),
  documentIssued: makeSubscription(
    SUBSCRIPTION_TOPICS.DOCUMENT_ISSUED,
    'documentIssued',
  ),
};
