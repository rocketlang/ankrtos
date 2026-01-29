/**
 * Event Bus Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ICDEventBus } from '../core/event-bus';

describe('ICDEventBus', () => {
  let bus: ICDEventBus;

  beforeEach(() => {
    bus = new ICDEventBus({ historyEnabled: false, asyncByDefault: false });
  });

  describe('emit', () => {
    it('should emit an event and return it', () => {
      const event = bus.emit('container.registered', { containerId: '123' }, {
        source: 'test',
        tenantId: 'T1',
      });
      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.type).toBe('container.registered');
      expect(event.payload).toEqual({ containerId: '123' });
      expect(event.source).toBe('test');
      expect(event.tenantId).toBe('T1');
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('should assign a severity based on event type', () => {
      const event = bus.emit('container.registered', {});
      expect(event.severity).toBeDefined();
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers on matching events', () => {
      const handler = vi.fn();
      bus.subscribe('container.registered', handler, { async: false });
      bus.emit('container.registered', { test: true });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].payload).toEqual({ test: true });
    });

    it('should support wildcard patterns', () => {
      const handler = vi.fn();
      bus.subscribe('container.*', handler, { async: false });
      bus.emit('container.registered', { id: '1' });
      bus.emit('container.gate_in', { id: '2' });
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should not notify for non-matching events', () => {
      const handler = vi.fn();
      bus.subscribe('container.registered', handler, { async: false });
      bus.emit('rail.rake_announced', {});
      expect(handler).not.toHaveBeenCalled();
    });

    it('should return an unsubscribe function', () => {
      const handler = vi.fn();
      const unsub = bus.subscribe('container.registered', handler, { async: false });
      bus.emit('container.registered', {});
      expect(handler).toHaveBeenCalledTimes(1);

      unsub();
      bus.emit('container.registered', {});
      expect(handler).toHaveBeenCalledTimes(1); // still 1
    });
  });

  describe('once', () => {
    it('should only fire handler once', () => {
      const handler = vi.fn();
      bus.once('container.registered', handler, { async: false });
      bus.emit('container.registered', { first: true });
      bus.emit('container.registered', { second: true });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].payload).toEqual({ first: true });
    });
  });

  describe('emitBatch', () => {
    it('should emit multiple events and return them all', () => {
      const events = bus.emitBatch([
        { type: 'container.registered', payload: { id: '1' } },
        { type: 'container.gate_in', payload: { id: '2' } },
      ]);
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('container.registered');
      expect(events[1].type).toBe('container.gate_in');
    });
  });

  describe('history', () => {
    it('should record events when history is enabled', () => {
      const busWithHistory = new ICDEventBus({ historyEnabled: true, asyncByDefault: false });
      busWithHistory.emit('container.registered', {});
      busWithHistory.emit('container.gate_in', {});
      const history = busWithHistory.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);
      busWithHistory.dispose();
    });

    it('should filter history by event type', () => {
      const busWithHistory = new ICDEventBus({ historyEnabled: true, asyncByDefault: false });
      busWithHistory.emit('container.registered', {});
      busWithHistory.emit('rail.rake_announced', {});
      busWithHistory.emit('container.gate_in', {});
      const containerEvents = busWithHistory.getHistory({ type: 'container.registered' });
      expect(containerEvents.length).toBe(1);
      busWithHistory.dispose();
    });
  });

  describe('dispose', () => {
    it('should prevent emitting after disposal', () => {
      bus.dispose();
      expect(() => bus.emit('container.registered', {})).toThrow('disposed');
    });
  });
});
