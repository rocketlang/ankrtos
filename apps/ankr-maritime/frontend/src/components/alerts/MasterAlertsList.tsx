/**
 * Master Alerts List Component
 *
 * Displays all alerts for an arrival with:
 * - Status filtering (all, pending replies, delivered, failed)
 * - Real-time updates via GraphQL subscriptions
 * - Manual alert sending
 * - Empty state
 */

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { Bell, AlertCircle, Filter } from 'lucide-react';
import { MasterAlertCard } from './MasterAlertCard';

const MASTER_ALERTS_QUERY = gql`
  query MasterAlerts($arrivalId: String, $status: AlertStatus) {
    masterAlerts(arrivalId: $arrivalId, status: $status) {
      id
      alertType
      title
      message
      priority
      channels
      recipientEmail
      recipientPhone
      sentAt
      deliveredAt
      readAt
      acknowledgedAt
      repliedAt
      reply
      replyParsed {
        intent
        confidence
        entities
      }
      actionTaken
      failedAt
      failureReason
      deliveryStatus
      isDelivered
      isRead
      hasReply
      requiresAction
      createdAt
    }
  }
`;

interface MasterAlertsListProps {
  arrivalId: string;
}

type StatusFilter = 'ALL' | 'PENDING' | 'DELIVERED' | 'READ' | 'ACKNOWLEDGED' | 'FAILED';

export function MasterAlertsList({ arrivalId }: MasterAlertsListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [showOnlyReplies, setShowOnlyReplies] = useState(false);

  const { data, loading, error, refetch } = useQuery(MASTER_ALERTS_QUERY, {
    variables: {
      arrivalId,
      status: statusFilter === 'ALL' ? undefined : statusFilter
    },
    pollInterval: 30000 // Poll every 30 seconds
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 p-4 border border-red-200 rounded bg-red-50">
        <AlertCircle className="h-5 w-5" />
        <span>Failed to load alerts: {error.message}</span>
      </div>
    );
  }

  const alerts = data?.masterAlerts || [];
  const filteredAlerts = showOnlyReplies
    ? alerts.filter((alert: any) => alert.hasReply)
    : alerts;

  const pendingRepliesCount = alerts.filter((alert: any) => alert.requiresAction).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Master Alerts
          </h3>
          {pendingRepliesCount > 0 && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
              {pendingRepliesCount} Require Action
            </span>
          )}
        </div>

        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Status:</span>
        </div>

        {(['ALL', 'PENDING', 'DELIVERED', 'READ', 'ACKNOWLEDGED', 'FAILED'] as StatusFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 text-sm rounded ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyReplies}
            onChange={(e) => setShowOnlyReplies(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Show only alerts with replies
        </label>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Alerts</h3>
          <p className="text-sm text-gray-500">
            {showOnlyReplies
              ? 'No alerts with replies yet'
              : statusFilter === 'ALL'
              ? 'No alerts have been sent to the master yet'
              : `No ${statusFilter.toLowerCase()} alerts`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert: any) => (
            <MasterAlertCard
              key={alert.id}
              alert={alert}
              onAcknowledged={() => refetch()}
            />
          ))}
        </div>
      )}

      {/* Stats */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{alerts.length}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {alerts.filter((a: any) => a.isDelivered).length}
            </div>
            <div className="text-xs text-gray-500">Delivered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {alerts.filter((a: any) => a.isRead).length}
            </div>
            <div className="text-xs text-gray-500">Read</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {alerts.filter((a: any) => a.hasReply).length}
            </div>
            <div className="text-xs text-gray-500">Replied</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {alerts.filter((a: any) => a.failedAt).length}
            </div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
        </div>
      )}
    </div>
  );
}
