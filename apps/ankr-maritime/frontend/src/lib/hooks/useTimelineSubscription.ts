/**
 * Timeline Subscription Hook
 *
 * Custom React hook for subscribing to real-time timeline events.
 * Uses GraphQL subscriptions for live updates.
 */

import { useEffect, useCallback } from 'react';
import { useSubscription, gql } from '@apollo/client';

const TIMELINE_EVENT_SUBSCRIPTION = gql`
  subscription TimelineEventCreated($arrivalId: String!) {
    timelineEventCreated(arrivalId: $arrivalId) {
      id
      timestamp
      eventType
      actor
      action
      impact
      metadata
      timeAgo
    }
  }
`;

const CRITICAL_EVENT_SUBSCRIPTION = gql`
  subscription CriticalEventOccurred($arrivalId: String!) {
    criticalEventOccurred(arrivalId: $arrivalId) {
      id
      timestamp
      eventType
      actor
      action
      impact
      metadata
      timeAgo
    }
  }
`;

interface UseTimelineSubscriptionOptions {
  arrivalId: string;
  onNewEvent?: (event: any) => void;
  onCriticalEvent?: (event: any) => void;
  criticalOnly?: boolean;
}

export function useTimelineSubscription({
  arrivalId,
  onNewEvent,
  onCriticalEvent,
  criticalOnly = false
}: UseTimelineSubscriptionOptions) {
  // Subscribe to all events or critical only
  const subscription = criticalOnly ? CRITICAL_EVENT_SUBSCRIPTION : TIMELINE_EVENT_SUBSCRIPTION;

  const { data, loading, error } = useSubscription(subscription, {
    variables: { arrivalId },
    skip: !arrivalId
  });

  // Handle new event
  useEffect(() => {
    if (!data) return;

    const event = criticalOnly ? data.criticalEventOccurred : data.timelineEventCreated;

    if (event) {
      if (criticalOnly && onCriticalEvent) {
        onCriticalEvent(event);
      } else if (onNewEvent) {
        onNewEvent(event);
      }
    }
  }, [data, criticalOnly, onNewEvent, onCriticalEvent]);

  return {
    latestEvent: data ? (criticalOnly ? data.criticalEventOccurred : data.timelineEventCreated) : null,
    loading,
    error
  };
}

/**
 * Example usage:
 *
 * ```tsx
 * function MyComponent({ arrivalId }) {
 *   const [showToast, setShowToast] = useState(false);
 *   const [latestEvent, setLatestEvent] = useState(null);
 *
 *   useTimelineSubscription({
 *     arrivalId,
 *     onNewEvent: (event) => {
 *       setLatestEvent(event);
 *       setShowToast(true);
 *       // Optionally refetch timeline query
 *       refetch();
 *     },
 *     onCriticalEvent: (event) => {
 *       // Show urgent notification
 *       showNotification({
 *         title: 'Critical Event',
 *         message: event.action,
 *         type: 'error'
 *       });
 *     }
 *   });
 *
 *   return (
 *     <div>
 *       {showToast && latestEvent && (
 *         <Toast
 *           message={latestEvent.action}
 *           onClose={() => setShowToast(false)}
 *         />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
