# Phase 4.6: Real-Time Event Streaming Implementation Guide

## Overview

This guide explains how to implement real-time timeline event subscriptions using GraphQL WebSockets.

## Architecture

```
Timeline Event → Event Publisher → Prisma DB
                                       ↓
                                   PubSub (Redis)
                                       ↓
                              GraphQL Subscription
                                       ↓
                              WebSocket Connection
                                       ↓
                                Frontend Hook
                                       ↓
                                   UI Update
```

## Backend Implementation

### 1. Install Dependencies

```bash
npm install ioredis graphql-redis-subscriptions
```

### 2. Create PubSub Instance

Create `backend/src/lib/pubsub.ts`:

```typescript
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    return Math.min(times * 50, 2000);
  }
};

export const pubsub = new RedisPubSub({
  publisher: new Redis(redisOptions),
  subscriber: new Redis(redisOptions)
});

// Event channels
export const TIMELINE_EVENT_CREATED = 'TIMELINE_EVENT_CREATED';
export const CRITICAL_EVENT_OCCURRED = 'CRITICAL_EVENT_OCCURRED';
```

### 3. Update Event Publisher to Publish to PubSub

Modify `backend/src/services/timeline/event-publisher.service.ts`:

```typescript
import { pubsub, TIMELINE_EVENT_CREATED, CRITICAL_EVENT_OCCURRED } from '../../lib/pubsub.js';

export class EventPublisherService {
  async publishEvent(params: PublishEventParams) {
    // ... existing code ...

    const event = await prisma.arrivalTimelineEvent.create({
      data: { /* ... */ }
    });

    // Publish to PubSub for real-time subscriptions
    await pubsub.publish(TIMELINE_EVENT_CREATED, {
      timelineEventCreated: event,
      arrivalId: event.arrivalId
    });

    // If critical, also publish to critical channel
    if (event.impact === 'CRITICAL') {
      await pubsub.publish(CRITICAL_EVENT_OCCURRED, {
        criticalEventOccurred: event,
        arrivalId: event.arrivalId
      });
    }

    return event;
  }
}
```

### 4. Update GraphQL Subscriptions

Modify `backend/src/schema/types/arrival-timeline.ts`:

```typescript
import { pubsub, TIMELINE_EVENT_CREATED, CRITICAL_EVENT_OCCURRED } from '../../lib/pubsub.js';

builder.subscriptionFields((t) => ({
  timelineEventCreated: t.field({
    type: ArrivalTimelineEventType,
    args: {
      arrivalId: t.arg.string({ required: true })
    },
    subscribe: (root, args) => {
      return pubsub.asyncIterator(TIMELINE_EVENT_CREATED);
    },
    resolve: (payload, args) => {
      // Filter by arrivalId
      if (payload.arrivalId === args.arrivalId) {
        return payload.timelineEventCreated;
      }
      return null;
    }
  }),

  criticalEventOccurred: t.field({
    type: ArrivalTimelineEventType,
    args: {
      arrivalId: t.arg.string({ required: true })
    },
    subscribe: (root, args) => {
      return pubsub.asyncIterator(CRITICAL_EVENT_OCCURRED);
    },
    resolve: (payload, args) => {
      // Filter by arrivalId
      if (payload.arrivalId === args.arrivalId) {
        return payload.criticalEventOccurred;
      }
      return null;
    }
  })
}));
```

### 5. Configure Mercurius for WebSockets

Modify `backend/src/main.ts`:

```typescript
await app.register(mercurius, {
  schema,
  context: buildContext,
  graphiql: true,
  subscription: {
    verifyClient: (info, next) => {
      // Optional: Add authentication here
      next(true);
    },
    context: async (connection, request) => {
      // Build context for subscriptions
      return buildContext(request);
    }
  },
  path: '/graphql',
});
```

## Frontend Implementation

### 1. Configure Apollo Client for Subscriptions

Update `frontend/src/lib/apollo-client.ts`:

```typescript
import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpLink = new HttpLink({
  uri: 'http://localhost:4051/graphql',
  credentials: 'include'
});

const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:4051/graphql',
  connectionParams: () => ({
    // Add auth token if needed
    authorization: localStorage.getItem('token')
  })
}));

// Split based on operation type
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache()
});
```

### 2. Use Subscription Hook in Components

Update `frontend/src/components/timeline/ArrivalTimeline.tsx`:

```tsx
import { useTimelineSubscription } from '../../lib/hooks/useTimelineSubscription';
import { useState } from 'react';

export function ArrivalTimeline({ arrivalId }: ArrivalTimelineProps) {
  const [showNewEventToast, setShowNewEventToast] = useState(false);
  const [latestEvent, setLatestEvent] = useState<any>(null);

  const { data, loading, error, refetch } = useQuery(ARRIVAL_TIMELINE_QUERY, {
    variables: { arrivalId, filters }
  });

  // Subscribe to new events
  useTimelineSubscription({
    arrivalId,
    onNewEvent: (event) => {
      console.log('New timeline event:', event);
      setLatestEvent(event);
      setShowNewEventToast(true);

      // Refetch timeline to show new event
      refetch();

      // Auto-hide toast after 5 seconds
      setTimeout(() => setShowNewEventToast(false), 5000);
    },
    onCriticalEvent: (event) => {
      // Show critical event notification
      console.warn('Critical event occurred:', event);
      // Could trigger a more prominent notification here
    }
  });

  return (
    <div>
      {showNewEventToast && latestEvent && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-up">
          <div className="font-medium">New Event</div>
          <div className="text-sm opacity-90">{latestEvent.action}</div>
        </div>
      )}

      {/* ... rest of timeline UI ... */}
    </div>
  );
}
```

## Testing

### 1. Test Event Publishing

```typescript
// In any service, publish a test event
import { eventPublisher } from './services/timeline/event-publisher.service';

await eventPublisher.publishEvent({
  arrivalId: 'arr_123',
  eventType: 'DOCUMENT_SUBMITTED',
  actor: 'MASTER',
  action: 'Document submitted: Crew List',
  metadata: { documentName: 'crew-list.pdf' }
});

// This should:
// 1. Create event in database
// 2. Publish to Redis PubSub
// 3. Trigger GraphQL subscription
// 4. Update frontend in real-time
```

### 2. Test Subscription in GraphiQL

```graphql
subscription {
  timelineEventCreated(arrivalId: "arr_123") {
    id
    timestamp
    eventType
    actor
    action
    impact
  }
}
```

### 3. Monitor Redis PubSub

```bash
redis-cli
> SUBSCRIBE TIMELINE_EVENT_CREATED
> SUBSCRIBE CRITICAL_EVENT_OCCURRED
```

## Performance Considerations

1. **Connection Pooling**: Limit max WebSocket connections per user
2. **Filtering**: Filter events by arrivalId in subscription resolver
3. **Batching**: Batch multiple events if published rapidly
4. **Caching**: Cache subscription context to avoid rebuilding
5. **Cleanup**: Properly close connections on component unmount

## Security

1. **Authentication**: Verify JWT token in WebSocket connection
2. **Authorization**: Check user has access to arrival data
3. **Rate Limiting**: Limit subscription connections per user
4. **Input Validation**: Validate arrivalId parameter

## Monitoring

1. **Connection Count**: Track active WebSocket connections
2. **Event Rate**: Monitor events/second published
3. **Latency**: Measure time from event publish to client receive
4. **Errors**: Log subscription errors and connection failures

## Troubleshooting

### Events not appearing in frontend

1. Check Redis is running: `redis-cli ping`
2. Check WebSocket connection in browser DevTools → Network → WS
3. Verify subscription is active in Apollo DevTools
4. Check backend logs for PubSub publish messages

### WebSocket connection failing

1. Verify Mercurius subscription config is enabled
2. Check CORS allows WebSocket upgrade
3. Ensure Redis connection is healthy
4. Check firewall/proxy allows WebSocket

### High latency

1. Use local Redis instance
2. Optimize subscription resolver
3. Reduce payload size
4. Consider event batching

## Alternative: Polling vs Subscriptions

If WebSocket subscriptions are complex, fallback to polling:

```tsx
const { data, refetch } = useQuery(TIMELINE_QUERY, {
  variables: { arrivalId },
  pollInterval: 30000 // Poll every 30 seconds
});
```

Trade-offs:
- **Polling**: Simpler, works everywhere, higher latency
- **Subscriptions**: Lower latency, real-time, requires WebSocket

## Conclusion

Real-time subscriptions provide the best user experience for timeline updates. Start with polling for MVP, then add subscriptions for production.
