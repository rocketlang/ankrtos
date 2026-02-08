/**
 * GFW EVENTS - Fishing, Port Visits, Loitering
 * Provides historical position data based on vessel activities
 */

import { builder } from '../builder.js';
import { GlobalFishingWatchClient } from '../../services/global-fishing-watch-ais-fixed.js';

// GFW Event Type
const GFWEventType = builder.objectRef<{
  id: string;
  type: 'fishing' | 'port_visit' | 'loitering' | 'encounter';
  start: Date;
  end: Date;
  position: {
    lat: number;
    lon: number;
  };
  vessel: {
    ssvid: string;
    name: string | null;
    flag: string | null;
  };
  port?: {
    name: string;
    id: string;
  } | null;
}>('GFWEvent').implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    type: t.exposeString('type'),
    start: t.expose('start', { type: 'DateTime' }),
    end: t.expose('end', { type: 'DateTime' }),
    position: t.field({
      type: builder.objectRef<{ lat: number; lon: number }>('GFWPosition').implement({
        fields: (t) => ({
          lat: t.exposeFloat('lat'),
          lon: t.exposeFloat('lon'),
        }),
      }),
      resolve: (parent) => parent.position,
    }),
    vessel: t.field({
      type: builder.objectRef<{ ssvid: string; name: string | null; flag: string | null }>('GFWVesselInfo').implement({
        fields: (t) => ({
          ssvid: t.exposeString('ssvid'),
          name: t.exposeString('name', { nullable: true }),
          flag: t.exposeString('flag', { nullable: true }),
        }),
      }),
      resolve: (parent) => parent.vessel,
    }),
    portName: t.string({
      nullable: true,
      resolve: (parent) => parent.port?.name || null,
    }),
  }),
});

// GFW Events Response
const GFWEventsResponse = builder.objectRef<{
  events: Array<{
    id: string;
    type: 'fishing' | 'port_visit' | 'loitering' | 'encounter';
    start: Date;
    end: Date;
    position: { lat: number; lon: number };
    vessel: { ssvid: string; name: string | null; flag: string | null };
    port?: { name: string; id: string } | null;
  }>;
  total: number;
  stats: {
    fishing: number;
    portVisits: number;
    loitering: number;
    encounters: number;
  };
}>('GFWEventsResponse').implement({
  fields: (t) => ({
    events: t.field({
      type: [GFWEventType],
      resolve: (parent) => parent.events,
    }),
    total: t.exposeInt('total'),
    stats: t.field({
      type: builder.objectRef<{
        fishing: number;
        portVisits: number;
        loitering: number;
        encounters: number;
      }>('GFWEventStats').implement({
        fields: (t) => ({
          fishing: t.exposeInt('fishing'),
          portVisits: t.exposeInt('portVisits'),
          loitering: t.exposeInt('loitering'),
          encounters: t.exposeInt('encounters'),
        }),
      }),
      resolve: (parent) => parent.stats,
    }),
  }),
});

/**
 * Get GFW events for a specific region and time period
 */
builder.queryField('gfwEvents', (t) =>
  t.field({
    type: GFWEventsResponse,
    description: 'Get GFW fishing, port visit, and loitering events with positions',
    args: {
      minLat: t.arg.float({ required: true }),
      maxLat: t.arg.float({ required: true }),
      minLng: t.arg.float({ required: true }),
      maxLng: t.arg.float({ required: true }),
      startDate: t.arg.string({ required: true }), // YYYY-MM-DD
      endDate: t.arg.string({ required: true }), // YYYY-MM-DD
      eventTypes: t.arg.stringList({
        required: false,
        defaultValue: ['fishing', 'port_visit', 'loitering']
      }),
      limit: t.arg.int({ required: false, defaultValue: 500 }),
    },
    resolve: async (_root, args) => {
      const { minLat, maxLat, minLng, maxLng, startDate, endDate, eventTypes, limit } = args;
      const client = new GlobalFishingWatchClient();

      console.log(`[GFW Events] Fetching ${eventTypes.join(', ')} events from ${startDate} to ${endDate}`);

      const allEvents: any[] = [];
      const stats = {
        fishing: 0,
        portVisits: 0,
        loitering: 0,
        encounters: 0,
      };

      // Fetch events for each type
      const datasetMap: Record<string, string> = {
        'fishing': 'public-global-fishing-events:latest',
        'port_visit': 'public-global-port-visits-c2-events:latest',
        'loitering': 'public-global-loitering-events:latest',
        'encounter': 'public-global-encounters-events:latest',
      };

      for (const eventType of eventTypes) {
        const dataset = datasetMap[eventType];
        if (!dataset) continue;

        try {
          let events: any[] = [];

          // Fetch events based on type
          if (eventType === 'fishing') {
            events = await client.getFishingEvents({
              startDate: new Date(startDate),
              endDate: new Date(endDate),
              limit: Math.floor(limit / eventTypes.length),
            });
          } else if (eventType === 'port_visit') {
            events = await client.getPortVisits({
              startDate: new Date(startDate),
              endDate: new Date(endDate),
              limit: Math.floor(limit / eventTypes.length),
            });
          } else if (eventType === 'loitering') {
            events = await client.getLoiteringEvents({
              startDate: new Date(startDate),
              endDate: new Date(endDate),
              limit: Math.floor(limit / eventTypes.length),
            });
          }

          console.log(`[GFW Events] ${eventType}: ${events.length} raw events fetched`);

          // Filter by bounding box
          const filteredEvents = events.filter(event => {
            if (!event.position) return false;
            const lat = event.position.lat;
            const lon = event.position.lon;
            return lat >= minLat && lat <= maxLat && lon >= minLng && lon <= maxLng;
          });

          allEvents.push(...filteredEvents);

          // Update stats
          if (eventType === 'fishing') stats.fishing = filteredEvents.length;
          else if (eventType === 'port_visit') stats.portVisits = filteredEvents.length;
          else if (eventType === 'loitering') stats.loitering = filteredEvents.length;
          else if (eventType === 'encounter') stats.encounters = filteredEvents.length;

          console.log(`[GFW Events] ${eventType}: ${filteredEvents.length} events in region (${minLat},${minLng} to ${maxLat},${maxLng})`);
        } catch (error) {
          console.error(`[GFW Events] Error fetching ${eventType}:`, error);
        }
      }

      console.log(`[GFW Events] Total: ${allEvents.length} events`);

      return {
        events: allEvents.slice(0, limit),
        total: allEvents.length,
        stats,
      };
    },
  })
);

/**
 * Get fishing activity zones (heatmap data)
 */
builder.queryField('gfwFishingZones', (t) =>
  t.field({
    type: GFWEventsResponse,
    description: 'Get fishing activity zones for heatmap visualization',
    args: {
      minLat: t.arg.float({ required: true }),
      maxLat: t.arg.float({ required: true }),
      minLng: t.arg.float({ required: true }),
      maxLng: t.arg.float({ required: true }),
      daysBack: t.arg.int({ required: false, defaultValue: 30 }),
      limit: t.arg.int({ required: false, defaultValue: 1000 }),
    },
    resolve: async (_root, args) => {
      const { minLat, maxLat, minLng, maxLng, daysBack, limit } = args;
      const client = new GlobalFishingWatchClient();

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      console.log(`[GFW Fishing Zones] Fetching last ${daysBack} days of fishing activity`);

      const events = await client.getFishingEvents({
        startDate,
        endDate,
        limit,
      });

      // Filter by bounding box
      const filteredEvents = events.filter(event => {
        const lat = event.position.lat;
        const lon = event.position.lon;
        return lat >= minLat && lat <= maxLat && lon >= minLng && lon <= maxLng;
      });

      console.log(`[GFW Fishing Zones] ${filteredEvents.length} fishing events in region`);

      return {
        events: filteredEvents,
        total: filteredEvents.length,
        stats: {
          fishing: filteredEvents.length,
          portVisits: 0,
          loitering: 0,
          encounters: 0,
        },
      };
    },
  })
);
