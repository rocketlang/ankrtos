/**
 * Event Bridge — ICDEventBus → Mercurius PubSub
 *
 * Subscribes to domain events from the ICDEventBus and publishes
 * them to the Mercurius PubSub for GraphQL WebSocket delivery.
 */

import type { ICDEvent } from '../../core/event-bus';
import { getEventBus } from '../../core/event-bus';
import { SUBSCRIPTION_TOPICS } from './pubsub';

/** Fastify instance with mercurius graphql + pubsub decorated */
interface MercuriusApp {
  graphql: {
    pubsub: {
      publish(opts: { topic: string; payload: Record<string, unknown> }): void;
    };
  };
}

interface EventMapping {
  /** ICDEventBus pattern (exact or wildcard) */
  pattern: string;
  /** Mercurius PubSub topic */
  topic: string;
  /** GraphQL subscription field name (camelCase) */
  field: string;
}

const EVENT_MAPPINGS: EventMapping[] = [
  // Container status changes
  { pattern: 'container.status_changed', topic: SUBSCRIPTION_TOPICS.CONTAINER_STATUS_CHANGED, field: 'containerStatusChanged' },
  { pattern: 'container.gated_in', topic: SUBSCRIPTION_TOPICS.CONTAINER_STATUS_CHANGED, field: 'containerStatusChanged' },
  { pattern: 'container.grounded', topic: SUBSCRIPTION_TOPICS.CONTAINER_STATUS_CHANGED, field: 'containerStatusChanged' },
  { pattern: 'container.picked', topic: SUBSCRIPTION_TOPICS.CONTAINER_STATUS_CHANGED, field: 'containerStatusChanged' },
  { pattern: 'container.gated_out', topic: SUBSCRIPTION_TOPICS.CONTAINER_STATUS_CHANGED, field: 'containerStatusChanged' },
  { pattern: 'container.hold_placed', topic: SUBSCRIPTION_TOPICS.CONTAINER_STATUS_CHANGED, field: 'containerStatusChanged' },
  { pattern: 'container.hold_released', topic: SUBSCRIPTION_TOPICS.CONTAINER_STATUS_CHANGED, field: 'containerStatusChanged' },
  { pattern: 'container.departed', topic: SUBSCRIPTION_TOPICS.CONTAINER_STATUS_CHANGED, field: 'containerStatusChanged' },

  // Container moves
  { pattern: 'container.moved', topic: SUBSCRIPTION_TOPICS.CONTAINER_MOVED, field: 'containerMoved' },
  { pattern: 'container.restacked', topic: SUBSCRIPTION_TOPICS.CONTAINER_MOVED, field: 'containerMoved' },
  { pattern: 'container.transferred', topic: SUBSCRIPTION_TOPICS.CONTAINER_MOVED, field: 'containerMoved' },

  // Gate transactions
  { pattern: 'gate.gatein_started', topic: SUBSCRIPTION_TOPICS.GATE_TRANSACTION_UPDATED, field: 'gateTransactionUpdated' },
  { pattern: 'gate.gatein_completed', topic: SUBSCRIPTION_TOPICS.GATE_TRANSACTION_UPDATED, field: 'gateTransactionUpdated' },
  { pattern: 'gate.gateout_started', topic: SUBSCRIPTION_TOPICS.GATE_TRANSACTION_UPDATED, field: 'gateTransactionUpdated' },
  { pattern: 'gate.gateout_completed', topic: SUBSCRIPTION_TOPICS.GATE_TRANSACTION_UPDATED, field: 'gateTransactionUpdated' },
  { pattern: 'gate.transaction_cancelled', topic: SUBSCRIPTION_TOPICS.GATE_TRANSACTION_UPDATED, field: 'gateTransactionUpdated' },

  // Rail rake status
  { pattern: 'rail.rake_status_changed', topic: SUBSCRIPTION_TOPICS.RAKE_STATUS_CHANGED, field: 'rakeStatusChanged' },
  { pattern: 'rail.rake_arrived', topic: SUBSCRIPTION_TOPICS.RAKE_STATUS_CHANGED, field: 'rakeStatusChanged' },
  { pattern: 'rail.rake_departed', topic: SUBSCRIPTION_TOPICS.RAKE_STATUS_CHANGED, field: 'rakeStatusChanged' },
  { pattern: 'rail.rake_positioned', topic: SUBSCRIPTION_TOPICS.RAKE_STATUS_CHANGED, field: 'rakeStatusChanged' },

  // Vessel status
  { pattern: 'vessel.alongside', topic: SUBSCRIPTION_TOPICS.VESSEL_STATUS_CHANGED, field: 'vesselStatusChanged' },
  { pattern: 'vessel.berthing', topic: SUBSCRIPTION_TOPICS.VESSEL_STATUS_CHANGED, field: 'vesselStatusChanged' },
  { pattern: 'vessel.unberthing', topic: SUBSCRIPTION_TOPICS.VESSEL_STATUS_CHANGED, field: 'vesselStatusChanged' },
  { pattern: 'vessel.departed', topic: SUBSCRIPTION_TOPICS.VESSEL_STATUS_CHANGED, field: 'vesselStatusChanged' },
  { pattern: 'vessel.discharge_started', topic: SUBSCRIPTION_TOPICS.VESSEL_STATUS_CHANGED, field: 'vesselStatusChanged' },
  { pattern: 'vessel.discharge_completed', topic: SUBSCRIPTION_TOPICS.VESSEL_STATUS_CHANGED, field: 'vesselStatusChanged' },
  { pattern: 'vessel.loading_started', topic: SUBSCRIPTION_TOPICS.VESSEL_STATUS_CHANGED, field: 'vesselStatusChanged' },
  { pattern: 'vessel.loading_completed', topic: SUBSCRIPTION_TOPICS.VESSEL_STATUS_CHANGED, field: 'vesselStatusChanged' },

  // Equipment alerts
  { pattern: 'equipment.breakdown', topic: SUBSCRIPTION_TOPICS.EQUIPMENT_ALERT, field: 'equipmentAlert' },
  { pattern: 'equipment.maintenance_due', topic: SUBSCRIPTION_TOPICS.EQUIPMENT_ALERT, field: 'equipmentAlert' },
  { pattern: 'equipment.fuel_low', topic: SUBSCRIPTION_TOPICS.EQUIPMENT_ALERT, field: 'equipmentAlert' },
  { pattern: 'equipment.battery_low', topic: SUBSCRIPTION_TOPICS.EQUIPMENT_ALERT, field: 'equipmentAlert' },
  { pattern: 'equipment.geo_fence_alert', topic: SUBSCRIPTION_TOPICS.EQUIPMENT_ALERT, field: 'equipmentAlert' },

  // Yard capacity
  { pattern: 'yard.capacity_warning', topic: SUBSCRIPTION_TOPICS.YARD_CAPACITY_ALERT, field: 'yardCapacityAlert' },
  { pattern: 'yard.capacity_critical', topic: SUBSCRIPTION_TOPICS.YARD_CAPACITY_ALERT, field: 'yardCapacityAlert' },
  { pattern: 'yard.congestion_alert', topic: SUBSCRIPTION_TOPICS.YARD_CAPACITY_ALERT, field: 'yardCapacityAlert' },

  // Reefer alarms
  { pattern: 'container.reefer_temp_alert', topic: SUBSCRIPTION_TOPICS.REEFER_ALARM, field: 'reeferAlarm' },

  // Sensor alerts (IoT)
  { pattern: 'system.alert_triggered', topic: SUBSCRIPTION_TOPICS.SENSOR_ALERT, field: 'sensorAlert' },

  // Operations completed
  { pattern: 'yard.work_order_completed', topic: SUBSCRIPTION_TOPICS.OPERATION_COMPLETED, field: 'operationCompleted' },
  { pattern: 'container.stuffing_completed', topic: SUBSCRIPTION_TOPICS.OPERATION_COMPLETED, field: 'operationCompleted' },
  { pattern: 'container.destuffing_completed', topic: SUBSCRIPTION_TOPICS.OPERATION_COMPLETED, field: 'operationCompleted' },

  // Document issued
  { pattern: 'customs.out_of_charge', topic: SUBSCRIPTION_TOPICS.DOCUMENT_ISSUED, field: 'documentIssued' },
  { pattern: 'customs.let_export', topic: SUBSCRIPTION_TOPICS.DOCUMENT_ISSUED, field: 'documentIssued' },
  { pattern: 'customs.eos_generated', topic: SUBSCRIPTION_TOPICS.DOCUMENT_ISSUED, field: 'documentIssued' },
  { pattern: 'rail.manifest_submitted', topic: SUBSCRIPTION_TOPICS.DOCUMENT_ISSUED, field: 'documentIssued' },
];

/**
 * Initialize the event bridge — subscribes to ICDEventBus and publishes to Mercurius PubSub.
 * Returns a cleanup function to unsubscribe all handlers.
 */
export function initEventBridge(app: MercuriusApp): () => void {
  const eventBus = getEventBus();
  const unsubscribes: Array<() => void> = [];

  for (const mapping of EVENT_MAPPINGS) {
    const unsub = eventBus.subscribe(mapping.pattern, (event: ICDEvent) => {
      try {
        app.graphql.pubsub.publish({
          topic: `${mapping.topic}:${event.facilityId ?? 'global'}`,
          payload: {
            [mapping.field]: event.payload,
          },
        });
      } catch {
        // Swallow publish errors — subscription clients may have disconnected
      }
    }, { async: true });

    unsubscribes.push(unsub);
  }

  return () => {
    for (const unsub of unsubscribes) {
      unsub();
    }
  };
}
