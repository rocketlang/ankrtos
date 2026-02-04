/**
 * PubSub Service for Real-Time Updates
 *
 * Manages event publishing for GraphQL subscriptions.
 * Uses in-memory pub/sub for development, can be upgraded to Redis for production.
 */

import { EventEmitter } from 'events';

// Event types
export enum PubSubEvent {
  ARRIVAL_INTELLIGENCE_UPDATED = 'ARRIVAL_INTELLIGENCE_UPDATED',
  NEW_ARRIVAL_DETECTED = 'NEW_ARRIVAL_DETECTED',
  DOCUMENT_STATUS_CHANGED = 'DOCUMENT_STATUS_CHANGED',
  ETA_CHANGED = 'ETA_CHANGED',
  CONGESTION_STATUS_CHANGED = 'CONGESTION_STATUS_CHANGED'
}

class PubSubService {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100); // Support many subscribers
  }

  /**
   * Publish an event
   */
  publish(event: PubSubEvent, payload: any): void {
    console.log(`[PubSub] Publishing ${event}:`, payload?.arrivalId || 'global');
    this.emitter.emit(event, payload);
  }

  /**
   * Subscribe to an event
   * Returns an async iterator for GraphQL subscriptions
   */
  subscribe(event: PubSubEvent, filter?: (payload: any) => boolean): AsyncIterableIterator<any> {
    const eventEmitter = this.emitter;

    return {
      [Symbol.asyncIterator]() {
        const queue: any[] = [];
        let resolve: ((value: IteratorResult<any>) => void) | null = null;
        let isComplete = false;

        const listener = (payload: any) => {
          if (filter && !filter(payload)) {
            return; // Skip if filter doesn't match
          }

          if (resolve) {
            resolve({ value: payload, done: false });
            resolve = null;
          } else {
            queue.push(payload);
          }
        };

        eventEmitter.on(event, listener);

        return {
          async next(): Promise<IteratorResult<any>> {
            if (queue.length > 0) {
              const value = queue.shift();
              return { value, done: false };
            }

            if (isComplete) {
              return { value: undefined, done: true };
            }

            return new Promise((res) => {
              resolve = res;
            });
          },

          async return(): Promise<IteratorResult<any>> {
            isComplete = true;
            eventEmitter.off(event, listener);
            return { value: undefined, done: true };
          },

          async throw(error: any): Promise<IteratorResult<any>> {
            isComplete = true;
            eventEmitter.off(event, listener);
            throw error;
          }
        };
      }
    };
  }

  /**
   * Publish arrival intelligence update
   */
  publishArrivalUpdate(arrivalId: string, intelligence: any): void {
    this.publish(PubSubEvent.ARRIVAL_INTELLIGENCE_UPDATED, {
      arrivalId,
      intelligence
    });
  }

  /**
   * Publish new arrival detected
   */
  publishNewArrival(arrival: any): void {
    this.publish(PubSubEvent.NEW_ARRIVAL_DETECTED, arrival);
  }

  /**
   * Publish document status change
   */
  publishDocumentStatusChange(arrivalId: string, documentType: string, status: string): void {
    this.publish(PubSubEvent.DOCUMENT_STATUS_CHANGED, {
      arrivalId,
      documentType,
      status,
      timestamp: new Date()
    });
  }

  /**
   * Publish ETA change
   */
  publishETAChange(arrivalId: string, eta: any): void {
    this.publish(PubSubEvent.ETA_CHANGED, {
      arrivalId,
      eta,
      timestamp: new Date()
    });
  }

  /**
   * Publish congestion status change
   */
  publishCongestionChange(arrivalId: string, status: string): void {
    this.publish(PubSubEvent.CONGESTION_STATUS_CHANGED, {
      arrivalId,
      status,
      timestamp: new Date()
    });
  }
}

// Export singleton instance
export const pubsub = new PubSubService();
