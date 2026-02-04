/**
 * Arrival Intelligence Subscription Hooks
 *
 * React hooks for subscribing to real-time arrival intelligence updates.
 * Uses GraphQL subscriptions over WebSocket.
 */

import React, { useEffect } from 'react';
import { useSubscription, gql } from '@apollo/client';
import { useToast, useMaritimeToasts } from '../../components/Toast';

// GraphQL Subscriptions
const ARRIVAL_INTELLIGENCE_UPDATED = gql`
  subscription ArrivalIntelligenceUpdated($arrivalId: String!) {
    arrivalIntelligenceUpdated(arrivalId: $arrivalId) {
      vessel {
        name
        imo
      }
      port {
        name
      }
      eta {
        mostLikely
        hoursRemaining
      }
      documents {
        complianceScore
        missing
      }
      congestion {
        status
      }
    }
  }
`;

const DOCUMENT_STATUS_CHANGED = gql`
  subscription DocumentStatusChanged($arrivalId: String!) {
    documentStatusChanged(arrivalId: $arrivalId)
  }
`;

const ETA_CHANGED = gql`
  subscription ETAChanged($arrivalId: String!) {
    etaChanged(arrivalId: $arrivalId)
  }
`;

const NEW_ARRIVAL_DETECTED = gql`
  subscription NewArrivalDetected {
    newArrivalDetected {
      arrivalId
      vessel {
        name
        imo
      }
      port {
        name
      }
      distance
      eta
    }
  }
`;

/**
 * Subscribe to arrival intelligence updates
 * Automatically shows toast notifications and triggers refetch
 */
export function useArrivalIntelligenceSubscription(
  arrivalId: string | undefined,
  onUpdate?: () => void
) {
  const maritimeToasts = useMaritimeToasts();

  const { data, loading, error } = useSubscription(ARRIVAL_INTELLIGENCE_UPDATED, {
    variables: { arrivalId },
    skip: !arrivalId,
    onData: ({ data }) => {
      if (data?.data?.arrivalIntelligenceUpdated) {
        const intelligence = data.data.arrivalIntelligenceUpdated;
        maritimeToasts.intelligenceUpdated(intelligence.vessel.name);
        onUpdate?.();
      }
    }
  });

  return { data, loading, error };
}

/**
 * Subscribe to document status changes
 */
export function useDocumentStatusSubscription(
  arrivalId: string | undefined,
  onStatusChange?: (documentType: string, status: string) => void
) {
  const maritimeToasts = useMaritimeToasts();

  const { data } = useSubscription(DOCUMENT_STATUS_CHANGED, {
    variables: { arrivalId },
    skip: !arrivalId,
    onData: ({ data }) => {
      if (data?.data?.documentStatusChanged) {
        const change = data.data.documentStatusChanged;

        // Show toast based on status
        if (change.status === 'SUBMITTED') {
          maritimeToasts.documentUploaded(change.documentType);
        } else if (change.status === 'APPROVED') {
          maritimeToasts.documentApproved(change.documentType);
        }

        onStatusChange?.(change.documentType, change.status);
      }
    }
  });

  return { data };
}

/**
 * Subscribe to ETA changes
 */
export function useETASubscription(
  arrivalId: string | undefined,
  onETAChange?: (eta: any) => void
) {
  const maritimeToasts = useMaritimeToasts();

  const { data } = useSubscription(ETA_CHANGED, {
    variables: { arrivalId },
    skip: !arrivalId,
    onData: ({ data }) => {
      if (data?.data?.etaChanged) {
        const change = data.data.etaChanged;
        const etaDate = new Date(change.eta.mostLikely);
        maritimeToasts.etaChanged(
          'Vessel',
          etaDate.toLocaleString()
        );
        onETAChange?.(change.eta);
      }
    }
  });

  return { data };
}

/**
 * Subscribe to new arrivals (for dashboard)
 */
export function useNewArrivalsSubscription(onNewArrival?: () => void) {
  const maritimeToasts = useMaritimeToasts();

  const { data } = useSubscription(NEW_ARRIVAL_DETECTED, {
    onData: ({ data }) => {
      if (data?.data?.newArrivalDetected) {
        const arrival = data.data.newArrivalDetected;
        maritimeToasts.newArrival(
          arrival.vessel.name,
          arrival.port.name
        );
        onNewArrival?.();
      }
    }
  });

  return { data };
}

/**
 * Live countdown timer hook
 * Updates every minute to show real-time countdown to ETA
 */
export function useLiveCountdown(eta: Date | string | undefined): string {
  const [countdown, setCountdown] = React.useState('');

  React.useEffect(() => {
    if (!eta) return;

    const updateCountdown = () => {
      const now = new Date();
      const etaDate = new Date(eta);
      const diffMs = etaDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        setCountdown('Arrived');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (hours < 1) {
        setCountdown(`${minutes}m`);
      } else if (hours < 24) {
        setCountdown(`${hours}h ${minutes}m`);
      } else {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        setCountdown(`${days}d ${remainingHours}h`);
      }
    };

    // Update immediately
    updateCountdown();

    // Update every minute
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, [eta]);

  return countdown;
}
